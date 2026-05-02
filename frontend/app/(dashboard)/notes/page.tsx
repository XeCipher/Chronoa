// frontend/app/(dashboard)/notes/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import { Search, Plus, Trash, BookOpen, FileText, ChevronLeft, RotateCcw, Trash2, Library, Sparkles, CalendarDays, X, ChevronRight } from "lucide-react";
import { useUiStore } from "@/store/uiStore";

type Tab = 'notes' | 'journal';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] =[
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'journal', label: 'Journal', icon: BookOpen }
];

const getLocalYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const syncOfflineData = async () => {
  if (!navigator.onLine) return;
  const queue = JSON.parse(localStorage.getItem('chronoa_offline_queue') || '[]');
  if (queue.length === 0) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  let remaining = [];
  
  for (const item of queue) {
    try {
      if (item.type === 'notes') {
        const payload: any = { content: item.content, updated_at: item.updated_at };
        if (item.title !== undefined) payload.title = item.title;
        await supabase.from('notes').update(payload).eq('id', item.id);
      } else {
        const { data, error } = await supabase.from('journal_entries')
          .update({ content: item.content, updated_at: item.updated_at })
          .eq('entry_date', item.id)
          .eq('user_id', user.id)
          .select();
        
        if (!error && data && data.length === 0) {
           await supabase.from('journal_entries').insert({
             user_id: user.id,
             entry_date: item.id,
             content: item.content,
             updated_at: item.updated_at
           });
        }
      }
    } catch (e) {
      remaining.push(item);
    }
  }
  localStorage.setItem('chronoa_offline_queue', JSON.stringify(remaining));
};

export default function NotesPage() {
  const { notesTab, setNotesTab, setMobileNoteOpen, showConfirmDialog } = useUiStore();
  
  const [notes, setNotes] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [trash, setTrash] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isListVisible, setIsListVisible] = useState(true);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [autoSelectPending, setAutoSelectPending] = useState(true);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  const desktopCalRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (id: Tab) => {
    setNotesTab(id);
    setSelectedId(null);
    setSearchQuery("");
    setAutoSelectPending(true);
    setShowCalendar(false);
  };

  useEffect(() => {
    const cachedNotes = localStorage.getItem('chronoa_cache_notes');
    const cachedJournals = localStorage.getItem('chronoa_cache_journals');
    const cachedTrash = localStorage.getItem('chronoa_cache_trash');
    
    if (cachedNotes) try { setNotes(JSON.parse(cachedNotes)); setLoading(false); } catch (e) {}
    if (cachedJournals) try { setJournals(JSON.parse(cachedJournals)); setLoading(false); } catch (e) {}
    if (cachedTrash) try { setTrash(JSON.parse(cachedTrash)); } catch (e) {}
  }, []);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: nData } = await supabase.from('notes').select('*').is('deleted_at', null).order('updated_at', { ascending: false });
    const newNotes = nData || [];
    setNotes(newNotes);

    const { data: jData } = await supabase.from('journal_entries').select('*').is('deleted_at', null).order('entry_date', { ascending: false });
    const todayStr = getLocalYYYYMMDD(new Date());
    const jList = jData || [];
    if (!jList.some(j => j.entry_date === todayStr)) {
      jList.unshift({ entry_date: todayStr, content: "<p></p>" });
    }
    setJournals(jList);

    const { data: tData } = await supabase.from('notes').select('*').not('deleted_at', 'is', null);
    const { data: jTrashData } = await supabase.from('journal_entries').select('*').not('deleted_at', 'is', null);
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const validTrashNotes = (tData || []).filter(note => new Date(note.deleted_at) > thirtyDaysAgo).map(n => ({ ...n, isJournal: false }));
    const validTrashJournals = (jTrashData || []).filter(j => new Date(j.deleted_at) > thirtyDaysAgo).map(j => ({ ...j, isJournal: true }));
    
    const combinedTrash = [...validTrashNotes, ...validTrashJournals].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
    
    setTrash(combinedTrash);
    setLoading(false);
    syncOfflineData();
  },[]);

  useEffect(() => { 
    fetchData(); 
    window.addEventListener('online', syncOfflineData);
    const interval = setInterval(syncOfflineData, 15000); 
    return () => {
      window.removeEventListener('online', syncOfflineData);
      clearInterval(interval);
    };
  }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('chronoa_cache_notes', JSON.stringify(notes));
      localStorage.setItem('chronoa_cache_journals', JSON.stringify(journals));
      localStorage.setItem('chronoa_cache_trash', JSON.stringify(trash));
    }
  }, [notes, journals, trash, loading]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.chronoa-calendar-container') || target.closest('.desktop-cal-toggle') || target.closest('.mobile-cal-toggle')) {
        return;
      }
      setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedId) {
      const item = isTrashOpen ? trash.find(t => (t.entry_date || t.id) === selectedId) :
                   notesTab === 'notes' ? notes.find(n => n.id === selectedId) : journals.find(j => j.entry_date === selectedId);
      if (item) setEditTitle(item.title || "");
    }
  }, [selectedId, notesTab, notes, journals, trash, isTrashOpen]);

  useEffect(() => {
    setMobileNoteOpen(!isListVisible);
  }, [isListVisible, setMobileNoteOpen]);

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

  const createJournalForDate = async (dateStr: string) => {
    const todayStr = getLocalYYYYMMDD(new Date());
    if (dateStr > todayStr) return; 
    
    if (journals.some(j => j.entry_date === dateStr)) {
      handleSelectItem(dateStr);
      setShowCalendar(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const newJournal = { entry_date: dateStr, content: "<p></p>" };
    setJournals(prev => [...prev, newJournal].sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()));
    handleSelectItem(dateStr);
    setShowCalendar(false);
    
    if (navigator.onLine) {
        const { data, error } = await supabase.from('journal_entries')
          .update({ content: "<p></p>" })
          .eq('entry_date', dateStr)
          .eq('user_id', user?.id)
          .select();
        
        if (!error && data && data.length === 0) {
           await supabase.from('journal_entries').insert({
             user_id: user?.id,
             entry_date: dateStr,
             content: "<p></p>"
           });
        }
    }
  };

  const updateNoteTitle = async () => {
    if (!selectedId || notesTab !== 'notes' || isTrashOpen) return;
    const t = editTitle.trim() || "Untitled";
    setNotes(prev => prev.map(n => n.id === selectedId ? { ...n, title: t } : n));
    const updatedNow = new Date().toISOString();
    
    const queue = JSON.parse(localStorage.getItem('chronoa_offline_queue') || '[]');
    const itemIndex = queue.findIndex((q: any) => q.id === selectedId && q.type === 'notes');
    const existingContent = notes.find(n => n.id === selectedId)?.content || '';
    
    if (itemIndex >= 0) {
      queue[itemIndex].title = t;
      queue[itemIndex].updated_at = updatedNow;
    } else {
      queue.push({ type: 'notes', id: selectedId, content: existingContent, title: t, updated_at: updatedNow });
    }
    localStorage.setItem('chronoa_offline_queue', JSON.stringify(queue));
    syncOfflineData();
  };

  const saveContent = async (html: string, id: string) => {
    if (!id || isTrashOpen) return;
    const updatedNow = new Date().toISOString();
    
    if (notesTab === 'notes') setNotes(prev => prev.map(n => n.id === id ? { ...n, content: html, updated_at: updatedNow } : n));
    else if (notesTab === 'journal') setJournals(prev => prev.map(j => j.entry_date === id ? { ...j, content: html, updated_at: updatedNow } : j));

    const queue = JSON.parse(localStorage.getItem('chronoa_offline_queue') || '[]');
    const itemIndex = queue.findIndex((q: any) => q.id === id && q.type === notesTab);
    const payload: any = { type: notesTab, id, content: html, updated_at: updatedNow };
    
    if (notesTab === 'notes') {
       const currNote = notes.find(n => n.id === id);
       if (currNote) payload.title = currNote.title;
    }
    
    if (itemIndex >= 0) queue[itemIndex] = payload;
    else queue.push(payload);
    
    localStorage.setItem('chronoa_offline_queue', JSON.stringify(queue));
    syncOfflineData();
  };

  const moveToTrash = async (id: string) => {
    const deleted_at = new Date().toISOString();
    if (notesTab === 'journal') {
       const journal = journals.find(j => j.entry_date === id);
       setJournals(prev => prev.filter(j => j.entry_date !== id));
       setTrash([{ ...journal, deleted_at, isJournal: true }, ...trash]);
       setSelectedId(null);
       setIsListVisible(true);
       if (navigator.onLine) await supabase.from('journal_entries').update({ deleted_at }).eq('entry_date', id);
    } else {
       const note = notes.find(n => n.id === id);
       setNotes(prev => prev.filter(n => n.id !== id));
       setTrash([{ ...note, deleted_at, isJournal: false }, ...trash]);
       setSelectedId(null);
       setIsListVisible(true);
       if (navigator.onLine) await supabase.from('notes').update({ deleted_at }).eq('id', id);
    }
  };

  const restoreNote = async (item: any) => {
    const id = item.entry_date || item.id;
    setTrash(prev => prev.filter(t => (t.entry_date || t.id) !== id));
    
    if (item.isJournal) {
       setJournals([{ ...item, deleted_at: null }, ...journals].sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()));
       if (navigator.onLine) await supabase.from('journal_entries').update({ deleted_at: null }).eq('entry_date', id);
    } else {
       setNotes([{ ...item, deleted_at: null }, ...notes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
       if (navigator.onLine) await supabase.from('notes').update({ deleted_at: null }).eq('id', id);
    }
    setSelectedId(null);
    setIsListVisible(true);
  };

  const permanentlyDelete = (item: any) => {
    showConfirmDialog({
      title: "Permanent Deletion",
      message: "Are you sure you want to delete this permanently? It cannot be recovered.",
      isDestructive: true,
      onConfirm: async () => {
        const id = item.entry_date || item.id;
        setTrash(prev => prev.filter(t => (t.entry_date || t.id) !== id));
        
        if (navigator.onLine) {
           if (item.isJournal) await supabase.from('journal_entries').delete().eq('entry_date', id);
           else await supabase.from('notes').delete().eq('id', id);
        }
        setSelectedId(null);
        setIsListVisible(true);
      }
    });
  };

  const emptyTrash = () => {
    showConfirmDialog({
      title: "Empty Trash",
      message: `Permanently delete all items in your ${notesTab} trash? This cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        if (notesTab === 'journal') {
          setTrash(prev => prev.filter(t => !t.isJournal));
          if (navigator.onLine) await supabase.from('journal_entries').delete().not('deleted_at', 'is', null);
        } else {
          setTrash(prev => prev.filter(t => t.isJournal));
          if (navigator.onLine) await supabase.from('notes').delete().not('deleted_at', 'is', null);
        }
        setSelectedId(null);
        setIsListVisible(true);
      }
    });
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const obj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      return obj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const filteredItems = useMemo(() => {
    let list = isTrashOpen ? trash.filter(t => t.isJournal === (notesTab === 'journal')) : (notesTab === 'notes' ? notes : journals);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => {
      const isJournal = isTrashOpen ? item.isJournal : notesTab === 'journal';
      const title = isJournal ? formatDateLabel(item.entry_date) : item.title;
      const plain = (item.content || "").replace(/<[^>]+>/g, ' ').toLowerCase();
      return title?.toLowerCase().includes(q) || plain.includes(q);
    });
  },[notes, journals, trash, notesTab, searchQuery, isTrashOpen]);

  useEffect(() => {
    if (autoSelectPending && !loading && !isTrashOpen) {
      if (filteredItems.length > 0) {
        if (window.innerWidth >= 1024) {
          const firstItem = filteredItems[0];
          const firstId = firstItem.entry_date || firstItem.id;
          setSelectedId(firstId);
        } else {
          setSelectedId(null);
        }
      }
      setAutoSelectPending(false);
    }
  }, [autoSelectPending, loading, filteredItems, isTrashOpen, notesTab]);

  const Snippet = ({ html, query }: { html: string, query: string }) => {
    const plain = (html || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return <span className="text-[#b0ad9a] dark:text-[#555] opacity-50 italic">No content.</span>;
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
    if (isTrashOpen) return trash.find(t => (t.entry_date || t.id) === selectedId);
    if (notesTab === 'notes') return notes.find(n => n.id === selectedId);
    return journals.find(j => j.entry_date === selectedId);
  },[selectedId, notesTab, notes, journals, trash, isTrashOpen]);

  const renderCalendar = (isMobilePopover = false) => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days =[];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div ref={isMobilePopover ? null : desktopCalRef} className={`chronoa-calendar-container ${isMobilePopover ? 'p-4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl shadow-xl z-50 w-[260px]' : 'absolute top-12 right-0 mt-2 p-4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl shadow-xl z-50 w-[260px] animate-fade-up'}`}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-1 text-[#888] hover:text-[#c2956e]"><ChevronLeft size={16}/></button>
          <span className="text-sm font-bold text-[#3d3b33] dark:text-[#f0f0f0] uppercase tracking-widest">{calMonth.toLocaleString('default', { month: 'short' })} {year}</span>
          <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="p-1 text-[#888] hover:text-[#c2956e]"><ChevronRight size={16}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="text-[9px] font-bold text-[#b0ad9a]">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const dateStr = getLocalYYYYMMDD(d);
            const isFuture = dateStr > getLocalYYYYMMDD(new Date());
            const hasEntry = journals.some(j => j.entry_date === dateStr);
            const isToday = dateStr === getLocalYYYYMMDD(new Date());
            
            return (
              <button 
                key={i} 
                onClick={() => !isFuture && createJournalForDate(dateStr)}
                disabled={isFuture}
                className={`relative flex items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors 
                  ${isFuture ? 'opacity-30 cursor-not-allowed text-[#b0ad9a] dark:text-[#555]' : 'hover:bg-[#c2956e]/10 hover:text-[#c2956e]'}
                  ${isToday ? 'bg-[#c2956e] text-white' : (isFuture ? '' : 'text-[#3d3b33] dark:text-[#e0e0e0]')}
                `}
              >
                {d.getDate()}
                {hasEntry && !isToday && <div className="absolute bottom-1 w-1 h-1 bg-[#c2956e] rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full w-full bg-[#f7f5f0] dark:bg-[#121212] lg:pl-10 overflow-hidden selection:bg-[#c2956e]/20">
      
      <aside className={`
        w-full lg:w-[350px] flex-shrink-0 flex flex-col border-r border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#f7f5f0] dark:bg-[#121212] z-30 transition-transform duration-300 ease-in-out
        ${isListVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 pb-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0]">
              <Library size={20} className="text-[#c2956e]" />
              <h1 className="text-2xl font-serif font-medium tracking-tight">
                {isTrashOpen ? 'Trash' : 'Library'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => { setIsTrashOpen(!isTrashOpen); setSelectedId(null); setAutoSelectPending(true); setShowCalendar(false); }} 
                data-tooltip-id="global-tooltip" data-tooltip-content={isTrashOpen ? "Exit Trash" : "Open Trash"}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isTrashOpen ? 'bg-[#ebe8e2] dark:bg-[#2a2a2a] text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white' : 'text-[#888] md:hover:text-red-400 md:hover:bg-red-50 md:dark:hover:bg-red-900/10'}`}
              >
                {isTrashOpen ? <X size={16} /> : <Trash size={16} />}
              </button>
              
              {!isTrashOpen && notesTab === 'notes' && (
                <button onClick={createNote} data-tooltip-id="global-tooltip" data-tooltip-content="New Note" className="hidden lg:flex w-8 h-8 items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#121212] rounded-full md:hover:scale-105 transition-all shadow-lg">
                  <Plus size={18} />
                </button>
              )}
              
              {!isTrashOpen && notesTab === 'journal' && (
                <>
                  <button onClick={() => setShowCalendar(!showCalendar)} data-tooltip-id="global-tooltip" data-tooltip-content="Calendar" className="desktop-cal-toggle hidden lg:flex w-8 h-8 items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#121212] rounded-full md:hover:scale-105 transition-all shadow-lg">
                    {showCalendar ? <X size={16} /> : <CalendarDays size={16} />}
                  </button>
                  {showCalendar && (
                     <div className="hidden lg:block relative">
                        {renderCalendar(false)}
                     </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={14} />
              <input 
                type="text" placeholder={`Search ${isTrashOpen ? 'trash' : 'library'}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                spellCheck={false}
                className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-9 pr-4 py-2 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex bg-[#ebe8e2] dark:bg-[#1a1a1a] p-1 rounded-xl">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => handleTabChange(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${notesTab === id ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-[#c2956e] dark:text-[#d1a784]' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-[#ccc]'}`}>
                    <Icon size={14} /> <span className="hidden xl:inline">{label}</span>
                  </button>
                ))}
              </div>
              
              {isTrashOpen && (
                <button onClick={emptyTrash} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-red-50 dark:bg-red-900/10 text-red-500 md:hover:bg-red-500 md:hover:text-white shadow-sm border border-red-100 dark:border-red-900/30">
                  <Trash2 size={14} /> Empty {notesTab} Trash
                </button>
              )}
            </div>
          </div>
        </div>

        <div id="notes-library-scroll-container" className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 scroll-smooth">
          {loading && notes.length === 0 && journals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
              <Sparkles className="animate-pulse text-[#c2956e]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Opening Library...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            <>
              {filteredItems.map(item => {
                const isJournal = isTrashOpen ? item.isJournal : notesTab === 'journal';
                const id = item.entry_date || item.id;
                const isSelected = selectedId === id;
                const title = isJournal ? formatDateLabel(item.entry_date) : (item.title || 'Untitled');
                const daysLeft = isTrashOpen ? Math.ceil(30 - (Date.now() - new Date(item.deleted_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                return (
                  <button key={id} onClick={() => handleSelectItem(id)} 
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border relative group overflow-hidden ${
                      isSelected 
                      ? 'bg-white dark:bg-[#1e1e1e] border-[#e0ddd5] dark:border-[#222] lg:border-[#c2956e]/40 lg:dark:border-[#b0855f]/50 shadow-sm lg:shadow-md lg:translate-x-1' 
                      : 'bg-[#fdfbf7] dark:bg-[#161616] border-[#f0ede8] dark:border-[#222] md:hover:border-[#c2956e]/20 md:dark:hover:border-[#b0855f]/20 md:hover:shadow-sm'
                    }`}>
                    {isSelected && <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 bg-[#c2956e]" />}
                    <div className="flex justify-between items-baseline mb-1 gap-3">
                      <span className={`font-semibold text-[14px] truncate ${isSelected ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#3d3b33] dark:text-[#f0f0f0]'}`}>{title}</span>
                      <span className="text-[9px] font-bold text-[#b0ad9a] dark:text-[#555] uppercase shrink-0">{formatDateLabel(item.updated_at || item.entry_date)}</span>
                    </div>
                    <div className="text-[11px] leading-relaxed line-clamp-2 text-[#888] dark:text-[#888]">
                      {isTrashOpen && <span className="text-red-500 font-bold block mb-1 text-[9px] uppercase tracking-tighter">Deletes in {daysLeft} days</span>}
                      <Snippet html={item.content} query={searchQuery} />
                    </div>
                  </button>
                );
              })}
              <div className="h-28 lg:h-0 w-full shrink-0 pointer-events-none" />
            </>
          ) : (
            <div className="py-20 text-center text-[#b0ad9a] dark:text-[#555] italic text-xs">No records found</div>
          )}
        </div>
      </aside>

      <main className={`
        flex-1 flex flex-col bg-white dark:bg-[#121212] lg:static absolute inset-0 transition-transform duration-500 ease-in-out z-40
        ${isListVisible ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'}
      `}>
        {selectedItem ? (
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            <header className="h-14 flex items-center justify-between px-6 lg:px-8 border-b border-[#f0ede8] dark:border-[#1a1a1a] shrink-0">
              <button onClick={() => setIsListVisible(true)} className="lg:hidden flex items-center gap-1.5 text-xs font-bold uppercase text-[#b0ad9a] tracking-widest hover:text-[#c2956e]">
                <ChevronLeft size={16} /> Library
              </button>
              <div className="flex items-center gap-2 ml-auto">
                {!isTrashOpen ? (
                  <button data-tooltip-id="global-tooltip" data-tooltip-content="Move to Trash" onClick={() => moveToTrash(selectedItem.entry_date || selectedItem.id)} className="p-2 text-gray-400 md:hover:text-red-500 md:hover:bg-red-50 md:dark:hover:bg-red-900/10 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => restoreNote(selectedItem)} className="flex items-center gap-2 px-4 py-2 bg-[#7ca982]/10 text-[#7ca982] rounded-xl text-[10px] font-bold uppercase tracking-widest md:hover:bg-[#7ca982] md:hover:text-white transition-all">
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button data-tooltip-id="global-tooltip" data-tooltip-content="Delete Permanently" onClick={() => permanentlyDelete(selectedItem)} className="p-2 text-red-500 md:hover:bg-red-50 md:dark:hover:bg-red-900/10 rounded-xl transition-all">
                      <Trash size={18} />
                    </button>
                  </div>
                )}
              </div>
            </header>
            
            <div id="notes-scroll-container" className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
              <div className="max-w-[1000px] mx-auto px-6 py-8 lg:py-10 lg:px-12 w-full">
                <div className="mb-6">
                  {(!isTrashOpen && notesTab === 'journal') || selectedItem.isJournal ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2956e]">Daily Entry</p>
                      <h1 className="text-4xl lg:text-5xl text-[#3d3b33] dark:text-white font-serif leading-tight">
                        {formatDateLabel(selectedItem.entry_date)}
                      </h1>
                    </div>
                  ) : (
                    <input 
                      value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={updateNoteTitle} disabled={isTrashOpen}
                      placeholder="Title..."
                      spellCheck={false}
                      className="text-4xl lg:text-5xl text-[#3d3b33] dark:text-white font-serif leading-tight bg-transparent outline-none w-full placeholder:text-[#e0ddd5] dark:placeholder:text-[#2a2a2a] transition-all" 
                    />
                  )}
                </div>
                <div className="relative min-h-[500px]">
                  <DistractionFreeEditor
                    key={`${isTrashOpen ? 'trash' : notesTab}-${selectedId}`}
                    initialContent={selectedItem.content || '<p></p>'}
                    isEditable={!isTrashOpen}
                    onSave={(html) => saveContent(html, selectedItem.entry_date || selectedItem.id)}
                    noteType={(!isTrashOpen && notesTab === 'journal') || selectedItem.isJournal ? 'journal' : 'notes'}
                    entryDate={selectedItem.entry_date}
                  />
                </div>
              </div>
              <div className="h-28 lg:h-0 w-full shrink-0 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-white dark:bg-[#121212]">
            <div className="w-16 h-16 bg-[#f7f5f0] dark:bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-[#e0ddd5] dark:border-[#333] mb-6">
              <FileText size={24} strokeWidth={1.5} className="text-[#c2956e] opacity-40" />
            </div>
            <h2 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Select an entry</h2>
            <p className="text-xs text-[#b0ad9a] dark:text-[#555] mt-1">Choose a note or journal to start writing.</p>
          </div>
        )}
      </main>

      {/* Mobile FAB for Notes & Journal */}
      {isListVisible && !isTrashOpen && (
        <div className="lg:hidden fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 z-[100] flex flex-col items-end">
          {showCalendar && notesTab === 'journal' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
              <div className="relative z-50 mb-4 animate-fade-up origin-bottom-right">
                {renderCalendar(true)}
              </div>
            </>
          )}
          <button 
            onClick={() => {
               if (notesTab === 'notes') createNote();
               else setShowCalendar(!showCalendar);
            }}
            className="mobile-cal-toggle relative z-50 w-14 h-14 bg-white/30 dark:bg-black/30 backdrop-blur-lg border-2 border-[#c2956e]/50 dark:border-[#b0855f]/50 text-[#c2956e] dark:text-[#b0855f] rounded-full shadow-lg shadow-black/10 dark:shadow-black/30 flex items-center justify-center md:hover:scale-105 active:scale-95 transition-all"
          >
            {notesTab === 'notes' ? <Plus size={24} strokeWidth={2.5} /> : (showCalendar ? <X size={22} /> : <CalendarDays size={22} />)}
          </button>
        </div>
      )}

    </div>
  );
}