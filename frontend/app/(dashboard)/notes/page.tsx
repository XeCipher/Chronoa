// frontend/app/(dashboard)/notes/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import { Search, Plus, Trash, BookOpen, FileText, ChevronLeft, RotateCcw, Trash2, Library, Sparkles } from "lucide-react";

type Tab = 'notes' | 'journal' | 'trash';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'trash', label: 'Trash', icon: Trash }
];

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [notes, setNotes] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [trash, setTrash] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isListVisible, setIsListVisible] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    // 1. Fetch Active Notes
    const { data: nData } = await supabase.from('notes').select('*').is('deleted_at', null).order('updated_at', { ascending: false });
    setNotes(nData || []);

    // 2. Fetch Journals
    const { data: jData } = await supabase.from('journal_entries').select('*').order('entry_date', { ascending: false });
    const todayStr = new Date().toISOString().split('T')[0];
    const jList = jData || [];
    if (!jList.some(j => j.entry_date === todayStr)) {
      jList.unshift({ entry_date: todayStr, content: "<p></p>" });
    }
    setJournals(jList);

    // 3. Fetch Trash & Auto-delete logic
    const { data: tData } = await supabase.from('notes').select('*').not('deleted_at', 'is', null);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const validTrash = (tData || []).filter(note => new Date(note.deleted_at) > thirtyDaysAgo);
    const expiredTrashIds = (tData || []).filter(note => new Date(note.deleted_at) <= thirtyDaysAgo).map(n => n.id);
    
    if (expiredTrashIds.length > 0) {
      await supabase.from('notes').delete().in('id', expiredTrashIds);
    }
    setTrash(validTrash.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()));
    
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedId) {
      const item = activeTab === 'notes' ? notes.find(n => n.id === selectedId) : 
                   activeTab === 'trash' ? trash.find(t => t.id === selectedId) : null;
      if (item) setEditTitle(item.title || "");
    }
  }, [selectedId, activeTab, notes, trash]);

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) setIsListVisible(false);
  };

  const createNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('notes').insert({ user_id: user?.id, title: 'New Note' }).select().single();
    if (data) {
      setNotes([data, ...notes]);
      handleSelectItem(data.id);
    }
  };

  const updateNoteTitle = async () => {
    if (!selectedId || activeTab !== 'notes') return;
    const t = editTitle.trim() || "Untitled";
    setNotes(prev => prev.map(n => n.id === selectedId ? { ...n, title: t } : n));
    await supabase.from('notes').update({ title: t, updated_at: new Date().toISOString() }).eq('id', selectedId);
  };

  const saveContent = async (html: string) => {
    if (!selectedId) return;
    if (activeTab === 'notes') {
      await supabase.from('notes').update({ content: html, updated_at: new Date().toISOString() }).eq('id', selectedId);
    } else if (activeTab === 'journal') {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('journal_entries').upsert({ user_id: user?.id, entry_date: selectedId, content: html, updated_at: new Date().toISOString() }, { onConflict: 'user_id,entry_date' });
    }
  };

  const moveToTrash = async (id: string) => {
    const deleted_at = new Date().toISOString();
    const note = notes.find(n => n.id === id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setTrash([{ ...note, deleted_at }, ...trash]);
    setSelectedId(null);
    setIsListVisible(true);
    await supabase.from('notes').update({ deleted_at }).eq('id', id);
  };

  const restoreNote = async (id: string) => {
    const note = trash.find(n => n.id === id);
    setTrash(prev => prev.filter(n => n.id !== id));
    setNotes([{ ...note, deleted_at: null }, ...notes]);
    setSelectedId(null);
    setIsListVisible(true);
    await supabase.from('notes').update({ deleted_at: null }).eq('id', id);
  };

  const permanentlyDelete = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setTrash(prev => prev.filter(n => n.id !== id));
    setSelectedId(null);
    setIsListVisible(true);
    await supabase.from('notes').delete().eq('id', id);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
  };

  const filteredItems = useMemo(() => {
    let list = activeTab === 'notes' ? notes : activeTab === 'journal' ? journals : trash;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => {
      const title = activeTab === 'journal' ? formatDateLabel(item.entry_date) : item.title;
      const plain = (item.content || "").replace(/<[^>]+>/g, ' ').toLowerCase();
      return title?.toLowerCase().includes(q) || plain.includes(q);
    });
  }, [notes, journals, trash, activeTab, searchQuery]);

  const Snippet = ({ html, query }: { html: string, query: string }) => {
    const plain = (html || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return <span className="text-[#b0ad9a] dark:text-[#555] italic">Start typing...</span>;
    if (!query.trim()) return <span className="opacity-70">{plain.slice(0, 80)}</span>;

    const idx = plain.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span className="opacity-70">{plain.slice(0, 80)}</span>;

    const start = Math.max(0, idx - 20);
    const end = Math.min(plain.length, idx + query.length + 40);
    let snippet = plain.slice(start, end);
    const parts = snippet.split(new RegExp(`(${query})`, 'gi'));

    return (
      <span className="opacity-80">
        {start > 0 && "..."}
        {parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? 
          <span key={i} className="bg-[#c2956e]/30 dark:bg-[#b0855f]/40 text-[#3d3b33] dark:text-white px-0.5 rounded font-medium">{p}</span> : p
        )}
        {end < plain.length && "..."}
      </span>
    );
  };

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    if (activeTab === 'notes') return notes.find(n => n.id === selectedId);
    if (activeTab === 'journal') return journals.find(j => j.entry_date === selectedId);
    return trash.find(t => t.id === selectedId);
  }, [selectedId, activeTab, notes, journals, trash]);

  return (
    <div className="flex h-screen w-full bg-[#f7f5f0] dark:bg-[#121212] overflow-hidden selection:bg-[#c2956e]/20">
      
      {/* SIDEBAR: Personal Library */}
      <aside className={`
        w-full lg:w-[380px] flex-shrink-0 flex flex-col border-r border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#f7f5f0]/50 dark:bg-[#121212]/50 backdrop-blur-sm z-30 transition-transform duration-300 ease-in-out
        ${isListVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 pb-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0]">
              <Library size={20} className="text-[#c2956e]" />
              <h1 className="text-2xl font-serif italic font-medium tracking-tight">Library</h1>
            </div>
            {activeTab === 'notes' && (
              <button onClick={createNote} className="w-8 h-8 flex items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#121212] rounded-full hover:scale-105 transition-all shadow-lg">
                <Plus size={18} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={14} />
              <input 
                type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] transition-all shadow-sm"
              />
            </div>

            <div className="flex bg-[#ebe8e2] dark:bg-[#1a1a1a] p-1 rounded-xl">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActiveTab(id); setSelectedId(null); setSearchQuery(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === id ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-[#c2956e] dark:text-[#d1a784]' : 'text-[#888] hover:text-[#3d3b33]'}`}>
                  <Icon size={14} /> <span className="hidden xl:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
              <Sparkles className="animate-pulse text-[#c2956e]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Opening Vault...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map(item => {
              const id = activeTab === 'journal' ? item.entry_date : item.id;
              const isSelected = selectedId === id;
              const title = activeTab === 'journal' ? (item.entry_date === new Date().toISOString().split('T')[0] ? 'Today' : formatDateLabel(item.entry_date)) : (item.title || 'Untitled');
              const daysLeft = activeTab === 'trash' ? Math.ceil(30 - (Date.now() - new Date(item.deleted_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <button key={id} onClick={() => handleSelectItem(id)} 
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border ${isSelected ? 'bg-white dark:bg-[#1e1e1e] border-[#c2956e]/30 dark:border-[#b0855f]/40 shadow-md' : 'bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-[#1a1a1a]/40'}`}>
                  <div className="flex justify-between items-baseline mb-1.5 gap-3">
                    <span className={`font-semibold text-[14px] truncate ${isSelected ? 'text-[#3d3b33] dark:text-white' : 'text-[#3d3b33] dark:text-[#f0f0f0]'}`}>{title}</span>
                    <span className="text-[9px] font-bold text-[#b0ad9a] uppercase shrink-0">{formatDateLabel(item.updated_at || item.entry_date)}</span>
                  </div>
                  <div className="text-[11px] leading-relaxed line-clamp-2 h-[34px] text-[#888] dark:text-[#a0a0a0]">
                    {activeTab === 'trash' && <span className="text-red-500 font-bold block mb-1 text-[9px] uppercase tracking-tighter">Deletes in {daysLeft} days</span>}
                    <Snippet html={item.content} query={searchQuery} />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-20 text-center text-[#b0ad9a] dark:text-[#555] italic text-xs">No records found</div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT: The Sanctuary Editor */}
      <main className={`
        flex-1 flex flex-col bg-white dark:bg-[#121212] lg:static absolute inset-0 transition-transform duration-500 ease-in-out z-40
        ${isListVisible ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'}
      `}>
        {selectedItem ? (
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            {/* Action Header */}
            <header className="h-16 flex items-center justify-between px-6 lg:px-12 border-b border-[#f0ede8] dark:border-[#1a1a1a] shrink-0">
              <button onClick={() => setIsListVisible(true)} className="lg:hidden flex items-center gap-1.5 text-xs font-bold uppercase text-[#b0ad9a] tracking-widest hover:text-[#c2956e]">
                <ChevronLeft size={16} /> Library
              </button>
              
              <div className="flex items-center gap-2 ml-auto">
                {activeTab === 'notes' && (
                  <button onClick={() => moveToTrash(selectedItem.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                )}
                {activeTab === 'trash' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => restoreNote(selectedItem.id)} className="flex items-center gap-2 px-4 py-2 bg-[#7ca982]/10 text-[#7ca982] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#7ca982] hover:text-white transition-all">
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button onClick={() => permanentlyDelete(selectedItem.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
                      <Trash size={18} />
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* Document Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
              <div className="max-w-[850px] mx-auto px-6 py-12 lg:py-20 lg:px-12 w-full animate-fade-up">
                <div className="mb-12">
                  {activeTab === 'journal' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c2956e]">Daily Entry</p>
                      <h1 className="text-5xl lg:text-6xl text-[#3d3b33] dark:text-white font-serif italic leading-tight">
                        {new Date(selectedItem.entry_date).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h1>
                    </div>
                  ) : (
                    <input 
                      value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={updateNoteTitle} disabled={activeTab === 'trash'}
                      placeholder="Title of your thought..."
                      className="text-5xl lg:text-6xl text-[#3d3b33] dark:text-white font-serif italic leading-tight bg-transparent outline-none w-full placeholder:text-[#e0ddd5] dark:placeholder:text-[#2a2a2a] transition-all" 
                    />
                  )}
                </div>

                <div className="relative min-h-[500px]">
                  <DistractionFreeEditor
                    key={selectedId}
                    initialContent={selectedItem.content || '<p></p>'}
                    isEditable={activeTab !== 'trash'}
                    onSave={saveContent}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-[#fdfbf7] dark:bg-[#0f0f0f]">
            <div className="w-24 h-24 bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] flex items-center justify-center shadow-sm border border-[#e0ddd5] dark:border-[#333] mb-8">
              <FileText size={32} strokeWidth={1} className="text-[#c2956e] opacity-40" />
            </div>
            <h2 className="text-xl font-serif italic text-[#3d3b33] dark:text-[#f0f0f0] mb-2">Awaiting your brilliance</h2>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b0ad9a] dark:text-[#555] max-w-[200px] leading-relaxed">
              Choose an entry or start a new note to begin your sanctuary session.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}