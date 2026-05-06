// FILE: frontend/app/(dashboard)/notes/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import { Search, Plus, Trash2, BookOpen, FileText, ChevronLeft, RotateCcw, Library, Sparkles, CalendarDays, X, ChevronRight, ArrowLeft } from "lucide-react";
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
  const { notesTab, setNotesTab, setMobileNoteOpen, showConfirmDialog, isEditorFullscreen, setEditorFullscreen } = useUiStore();
  
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
  const [isScrolled, setIsScrolled] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  const desktopCalRef = useRef<HTMLDivElement>(null);

  const prevNotesTab = useRef(notesTab);
  useEffect(() => {
    if (prevNotesTab.current !== notesTab) {
      setSelectedId(null);
      setSearchQuery("");
      setAutoSelectPending(true);
      setShowCalendar(false);
      prevNotesTab.current = notesTab;
    }
  }, [notesTab]);

  useEffect(() => {
    const handleReset = (e: any) => {
      if (e.detail === '/notes') {
        setIsTrashOpen(false);
      }
    };
    window.addEventListener('chronoa-reset-tab', handleReset);
    return () => window.removeEventListener('chronoa-reset-tab', handleReset);
  }, []);

  // Guarantee we reset fullscreen configuration when leaving the Notes page
  useEffect(() => {
    return () => {
       setEditorFullscreen(false);
    };
  }, [setEditorFullscreen]);

  // Support pressing escape to easily get out of Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorFullscreen) {
        setEditorFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorFullscreen, setEditorFullscreen]);

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
    
    let jList = jData || [];

    const emptyJournals = jList.filter(j => {
      if (j.entry_date === todayStr) return false;
      const plain = (j.content || "").replace(/<[^>]+>/g, '').trim();
      return plain === '';
    });

    if (emptyJournals.length > 0) {
      const emptyDates = emptyJournals.map(j => j.entry_date);
      await supabase.from('journal_entries').delete().in('entry_date', emptyDates).eq('user_id', user.id);
      jList = jList.filter(j => !emptyJournals.includes(j));
    }

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
  }, []);

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
    // Reset scroll state when changing notes
    setIsScrolled(false);
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

  const getNextId = (idToDelete: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;
    const idx = filteredItems.findIndex(item => (item.entry_date || item.id) === idToDelete);
    if (idx > -1) {
      if (idx + 1 < filteredItems.length) return filteredItems[idx + 1].entry_date || filteredItems[idx + 1].id;
      if (idx - 1 >= 0) return filteredItems[idx - 1].entry_date || filteredItems[idx - 1].id;
    }
    return null;
  };

  const moveToTrash = async (id: string) => {
    const nextId = getNextId(id);
    const deleted_at = new Date().toISOString();
    
    if (notesTab === 'journal') {
       const journal = journals.find(j => j.entry_date === id);
       setJournals(prev => prev.filter(j => j.entry_date !== id));
       setTrash([{ ...journal, deleted_at, isJournal: true }, ...trash]);
       setSelectedId(nextId);
       if (!nextId) setIsListVisible(true);
       if (navigator.onLine) await supabase.from('journal_entries').update({ deleted_at }).eq('entry_date', id);
    } else {
       const note = notes.find(n => n.id === id);
       setNotes(prev => prev.filter(n => n.id !== id));
       setTrash([{ ...note, deleted_at, isJournal: false }, ...trash]);
       setSelectedId(nextId);
       if (!nextId) setIsListVisible(true);
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
        const nextId = getNextId(id);
        
        setTrash(prev => prev.filter(t => (t.entry_date || t.id) !== id));
        
        if (navigator.onLine) {
           if (item.isJournal) await supabase.from('journal_entries').delete().eq('entry_date', id);
           else await supabase.from('notes').delete().eq('id', id);
        }
        
        setSelectedId(nextId);
        if (!nextId) setIsListVisible(true);
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

  const renderEditorHeader = (isMobile: boolean = false) => (
    <div className="flex flex-row items-center justify-between gap-3 relative group w-full">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isMobile && (
          <button 
            onClick={() => { setSelectedId(null); setIsListVisible(true); }} 
            className="flex items-center justify-center p-2.5 bg-[#f7f5f0] dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {(!isTrashOpen && notesTab === 'journal') || selectedItem?.isJournal ? (
            <div 
              className="space-y-0.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => document.getElementById('notes-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c2956e]">Daily Entry</p>
              <h1 className="text-2xl lg:text-4xl text-[#3d3b33] dark:text-white font-serif leading-tight truncate lg:whitespace-normal">
                {formatDateLabel(selectedItem?.entry_date || "")}
              </h1>
            </div>
          ) : (
            <input 
              value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={updateNoteTitle} disabled={isTrashOpen}
              placeholder="Title..."
              spellCheck={false}
              className="text-2xl lg:text-4xl text-[#3d3b33] dark:text-white font-serif leading-tight bg-transparent outline-none w-full placeholder:text-[#e0ddd5] dark:placeholder:text-[#2a2a2a] transition-all truncate lg:whitespace-normal" 
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isTrashOpen ? (
          <button data-tooltip-id="global-tooltip" data-tooltip-content="Move to Trash" onClick={() => moveToTrash(selectedItem?.entry_date || selectedItem?.id)} className="w-9 h-9 lg:w-10 lg:h-10 text-[#b0ad9a] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all flex items-center justify-center bg-transparent outline-none">
            <Trash2 size={18} />
          </button>
        ) : (
          <>
            <button data-tooltip-id="global-tooltip" data-tooltip-content="Restore" onClick={() => restoreNote(selectedItem)} className="w-9 h-9 lg:w-10 lg:h-10 text-[#7ca982] hover:bg-[#7ca982]/10 rounded-full transition-all flex items-center justify-center bg-transparent outline-none">
              <RotateCcw size={18} />
            </button>
            <button data-tooltip-id="global-tooltip" data-tooltip-content="Delete Permanently" onClick={() => permanentlyDelete(selectedItem)} className="w-9 h-9 lg:w-10 lg:h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all flex items-center justify-center bg-transparent outline-none">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const emptyTitle = notesTab === 'notes' ? "Create a new note" : "Select a journal entry";
  const emptyDesc = notesTab === 'notes' 
    ? "Tap the + icon to capture your thoughts." 
    : "Tap the calendar icon to add an entry for a specific date.";

  return (
    <div className="relative flex h-full w-full bg-[#f7f5f0] dark:bg-[#121212] overflow-hidden">
      
      {/* SIDEBAR LIBRARY VIEW */}
      <aside className={`
        flex-shrink-0 flex flex-col bg-[#f7f5f0] dark:bg-[#121212] z-30 transition-all duration-300 ease-in-out overflow-hidden
        ${isEditorFullscreen ? 'w-0 border-none opacity-0' : 'w-full lg:w-[350px] border-r border-[#e0ddd5] dark:border-[#2a2a2a]'}
        ${isListVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="w-full lg:w-[350px] flex flex-col h-full shrink-0">
          <div className="p-4 md:p-8 lg:px-10 lg:pt-10 lg:pb-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0] cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => document.getElementById('notes-library-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {isTrashOpen && (
                  <button onClick={(e) => { e.stopPropagation(); setIsTrashOpen(false); setSelectedId(null); setAutoSelectPending(true); setShowCalendar(false); }} className="flex items-center justify-center p-2.5 md:p-3 bg-white dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all shadow-sm mr-1">
                    <ArrowLeft size={18} />
                  </button>
                )}
                {!isTrashOpen && <Library size={20} className="text-[#c2956e]" />}
                {isTrashOpen && <Trash2 size={24} className="text-[#c2956e]" />}
                <h1 className="text-2xl md:text-4xl font-serif font-medium tracking-tight">
                  {isTrashOpen ? 'Trash' : 'Library'}
                </h1>
              </div>
              
              <div className="flex items-center gap-2 relative">
                {!isTrashOpen && notesTab === 'notes' && (
                  <>
                    <button 
                      onClick={() => { setIsTrashOpen(true); setSelectedId(null); setAutoSelectPending(true); setShowCalendar(false); }} 
                      data-tooltip-id="global-tooltip" data-tooltip-content="Open Trash"
                      className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full transition-all text-[#888] md:hover:text-red-400 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button onClick={createNote} data-tooltip-id="global-tooltip" data-tooltip-content="New Note" className="hidden lg:flex w-10 h-10 items-center justify-center bg-[#c2956e] text-white dark:bg-[#b0855f] rounded-full md:hover:scale-105 transition-all shadow-lg">
                      <Plus size={18} />
                    </button>
                  </>
                )}
                
                {!isTrashOpen && notesTab === 'journal' && (
                  <>
                    <button 
                      onClick={() => { setIsTrashOpen(true); setSelectedId(null); setAutoSelectPending(true); setShowCalendar(false); }} 
                      data-tooltip-id="global-tooltip" data-tooltip-content="Open Trash"
                      className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full transition-all text-[#888] md:hover:text-red-400 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setShowCalendar(!showCalendar)} data-tooltip-id="global-tooltip" data-tooltip-content="Calendar" className="desktop-cal-toggle hidden lg:flex w-10 h-10 items-center justify-center bg-[#c2956e] text-white dark:bg-[#b0855f] rounded-full md:hover:scale-105 transition-all shadow-lg">
                      {showCalendar ? <X size={16} /> : <CalendarDays size={16} />}
                    </button>
                    {showCalendar && (
                       <div className="hidden lg:block relative">
                          {renderCalendar(false)}
                       </div>
                    )}
                  </>
                )}

                {isTrashOpen && (
                  <button 
                    onClick={emptyTrash} 
                    data-tooltip-id="global-tooltip" data-tooltip-content={`Empty ${notesTab} Trash`}
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white shadow-sm shrink-0 border border-transparent md:border-red-100 dark:border-red-900/30"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                <input 
                  type="text" placeholder={`Search ${isTrashOpen ? 'trash' : 'library'}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  spellCheck={false}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex bg-[#ebe8e2]/50 dark:bg-[#1a1a1a] p-1.5 rounded-[1.25rem] border border-[#e0ddd5] dark:border-[#333] shadow-inner">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => handleTabChange(id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${notesTab === id ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`}>
                      <Icon size={14} /> <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div id="notes-library-scroll-container" className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 md:px-8 lg:px-10 lg:pl-8 space-y-3 scroll-smooth">
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
                        <span className="text-[9px] font-bold text-[#b0ad9a] dark:text-[#555] uppercase tracking-widest shrink-0">{formatDateLabel(item.updated_at || item.entry_date)}</span>
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
        </div>
      </aside>

      {/* MAIN CONTENT VIEW */}
      <main className={`
        flex-1 flex flex-col bg-white dark:bg-[#121212] transition-transform duration-500 ease-in-out z-40
        max-lg:fixed max-lg:inset-0
        lg:static lg:translate-x-0
        ${isListVisible && !isEditorFullscreen ? 'max-lg:translate-x-full' : 'max-lg:translate-x-0'}
      `}>
        {selectedItem ? (
          <div className="flex-1 flex flex-col w-full overflow-hidden relative">
            
            {/* MOBILE FIXED HEADER */}
            <div className={`lg:hidden absolute top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-[calc(0.75rem+max(1rem,env(safe-area-inset-top)))] pb-3 transition-all duration-300 ${
              isScrolled 
                ? 'bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border-b border-[#e0ddd5] dark:border-[#2a2a2a] shadow-sm' 
                : 'bg-white dark:bg-[#121212] border-b border-transparent'
            }`}>
               {renderEditorHeader(true)}
            </div>

            <div 
              id="notes-scroll-container" 
              className="flex-1 overflow-y-auto no-scrollbar w-full relative"
              onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 10)}
            >
              {/* Spacer for absolute header on mobile */}
              <div className="lg:hidden w-full h-[calc(4.5rem+max(1rem,env(safe-area-inset-top)))]" />

              <div className="max-w-[1000px] mx-auto px-5 sm:px-6 lg:px-12 pt-2 lg:pt-10 pb-[calc(1.5rem+72px+env(safe-area-inset-bottom))] lg:pb-10 w-full">
                
                {/* DESKTOP SCROLLING HEADER (Scrolls naturally on laptops) */}
                <div className="hidden lg:block mb-8">
                  {renderEditorHeader(false)}
                </div>

                {/* Editor Content Area */}
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
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-white dark:bg-[#121212]">
            <div className="w-16 h-16 bg-[#f7f5f0] dark:bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-[#e0ddd5] dark:border-[#333] mb-6">
              {notesTab === 'notes' ? (
                 <FileText size={24} strokeWidth={1.5} className="text-[#c2956e] opacity-40" />
              ) : (
                 <BookOpen size={24} strokeWidth={1.5} className="text-[#c2956e] opacity-40" />
              )}
            </div>
            <h2 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]">{emptyTitle}</h2>
            <p className="text-xs text-[#b0ad9a] dark:text-[#555] mt-1">{emptyDesc}</p>
          </div>
        )}
      </main>

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
            className="mobile-cal-toggle relative z-50 w-14 h-14 bg-[#c2956e] text-white rounded-full shadow-xl flex items-center justify-center md:hover:scale-105 active:scale-95 transition-all"
          >
            {notesTab === 'notes' ? <Plus size={24} strokeWidth={2.5} /> : (showCalendar ? <X size={22} /> : <CalendarDays size={22} />)}
          </button>
        </div>
      )}

    </div>
  );
}