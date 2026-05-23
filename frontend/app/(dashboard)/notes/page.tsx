// frontend/app/(dashboard)/notes/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import React from "react";
import { supabase } from "@/lib/supabase";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import { Search, Plus, Trash2, BookOpen, FileText, ChevronLeft, RotateCcw, Library, Sparkles, CalendarDays, X, ChevronRight, ArrowLeft, Folder, FolderPlus, Edit3, FolderInput } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { usePathname } from "next/navigation";

type Tab = 'notes' | 'journal';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
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
        if (item.folder_id !== undefined) payload.folder_id = item.folder_id;
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
  const pathname = usePathname();
  const { notesTab, setNotesTab, setMobileNoteOpen, showConfirmDialog, isEditorFullscreen, setEditorFullscreen } = useUiStore();
  
  const [notes, setNotes] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [trash, setTrash] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [noteToFocus, setNoteToFocus] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isListVisible, setIsListVisible] = useState(true);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [autoSelectPending, setAutoSelectPending] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);

  const desktopCalRef = useRef<HTMLDivElement>(null);

  const prevNotesTab = useRef(notesTab);
  useEffect(() => {
    if (prevNotesTab.current !== notesTab) {
      setSelectedId(null);
      setNoteToFocus(null);
      setSearchQuery("");
      setAutoSelectPending(true);
      setShowCalendar(false);
      prevNotesTab.current = notesTab;
    }
  }, [notesTab]);

  const prevFolderId = useRef(selectedFolderId);
  useEffect(() => {
    if (prevFolderId.current !== selectedFolderId) {
      setSelectedId(null);
      setNoteToFocus(null);
      setAutoSelectPending(true);
      prevFolderId.current = selectedFolderId;
    }
  }, [selectedFolderId]);

  // Guarantee we reset fullscreen configuration when leaving the Notes page
  useEffect(() => {
    return () => {
       setEditorFullscreen(false);
    };
  }, [setEditorFullscreen]);

  // Reset View Event Listener (Nav tab tapped while already on Notes)
  useEffect(() => {
    const handleReset = (e: any) => {
      if (e.detail === '/notes') {
        setIsTrashOpen(false);
        setSelectedFolderId(null); // Return to library root
        setSelectedId(null);
        setNoteToFocus(null);
        
        // Restore standard layout based on viewport
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setIsListVisible(true);
        } else {
          setAutoSelectPending(true);
        }
        
        setShowCalendar(false);
        setSearchQuery("");
      }
    };
    window.addEventListener('chronoa-reset-tab', handleReset);
    return () => window.removeEventListener('chronoa-reset-tab', handleReset);
  }, []);

  // Global Escape Key Listener for Exiting Fullscreen & Navigating Back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        
        // Always exit fullscreen first if active
        if (isEditorFullscreen) {
          setEditorFullscreen(false);
          return;
        }

        if (isMoveModalOpen) {
          setIsMoveModalOpen(false);
          return;
        }

        // Do not interpret as 'back' if currently interacting with an input or editor
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
          return;
        }

        if (isTrashOpen) {
          setIsTrashOpen(false);
          setSelectedId(null);
          setNoteToFocus(null);
          setAutoSelectPending(true);
          setShowCalendar(false);
          return;
        }

        if (selectedFolderId && isListVisible) {
          const currentFolder = folders.find(f => f.id === selectedFolderId);
          setSelectedFolderId(currentFolder?.parent_id || null);
          return;
        }

        // Handle mobile interface back behavior
        if (!isListVisible) {
          setSelectedId(null);
          setIsListVisible(true);
          setNoteToFocus(null);
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorFullscreen, setEditorFullscreen, isMoveModalOpen, isTrashOpen, isListVisible, selectedFolderId, folders]);

  const handleTabChange = (id: Tab) => {
    setNotesTab(id);
    setSelectedId(null);
    setNoteToFocus(null);
    setSearchQuery("");
    setAutoSelectPending(true);
    setShowCalendar(false);
  };

  useEffect(() => {
    const cachedNotes = localStorage.getItem('chronoa_cache_notes');
    const cachedJournals = localStorage.getItem('chronoa_cache_journals');
    const cachedTrash = localStorage.getItem('chronoa_cache_trash');
    const cachedFolders = localStorage.getItem('chronoa_cache_folders');
    
    if (cachedNotes) try { setNotes(JSON.parse(cachedNotes)); setLoading(false); } catch (e) {}
    if (cachedJournals) try { setJournals(JSON.parse(cachedJournals)); setLoading(false); } catch (e) {}
    if (cachedTrash) try { setTrash(JSON.parse(cachedTrash)); } catch (e) {}
    if (cachedFolders) try { setFolders(JSON.parse(cachedFolders)); } catch (e) {}
  }, []);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [nData, jData, fData, tData, jTrashData] = await Promise.all([
      supabase.from('notes').select('*').is('deleted_at', null).order('updated_at', { ascending: false }),
      supabase.from('journal_entries').select('*').is('deleted_at', null).order('entry_date', { ascending: false }),
      supabase.from('note_folders').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('notes').select('*').not('deleted_at', 'is', null),
      supabase.from('journal_entries').select('*').not('deleted_at', 'is', null)
    ]);

    const newNotes = nData.data || [];
    setNotes(newNotes);
    
    setFolders(fData.data || []);

    const todayStr = getLocalYYYYMMDD(new Date());
    let jList = jData.data || [];

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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const validTrashNotes = (tData.data || []).filter(note => new Date(note.deleted_at) > thirtyDaysAgo).map(n => ({ ...n, isJournal: false }));
    const validTrashJournals = (jTrashData.data || []).filter(j => new Date(j.deleted_at) > thirtyDaysAgo).map(j => ({ ...j, isJournal: true }));
    
    const combinedTrash = [...validTrashNotes, ...validTrashJournals].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
    
    setTrash(combinedTrash);
    setLoading(false);
    syncOfflineData();
  }, []);

  // Triggers an automatic re-fetch whenever the user physically navigates back to the Notes tab
  useEffect(() => {
    if (pathname === '/notes') {
      fetchData();
    }
  }, [pathname, fetchData]);

  useEffect(() => { 
    fetchData(); 
    window.addEventListener('online', syncOfflineData);
    const interval = setInterval(syncOfflineData, 15000); 

    // Listen to real-time events across other devices while app is open
    const channel = supabase.channel('notes_realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, () => {
        fetchData();
      })
      .subscribe();

    // Trigger fetch intelligently on window refocus 
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', syncOfflineData);
      clearInterval(interval);
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('chronoa_cache_notes', JSON.stringify(notes));
      localStorage.setItem('chronoa_cache_journals', JSON.stringify(journals));
      localStorage.setItem('chronoa_cache_trash', JSON.stringify(trash));
      localStorage.setItem('chronoa_cache_folders', JSON.stringify(folders));
    }
  }, [notes, journals, trash, folders, loading]);

  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.chronoa-calendar-container') || target.closest('.desktop-cal-toggle') || target.closest('.mobile-cal-toggle')) {
        return;
      }
      setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

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

  const handleSelectItem = (id: string, autoFocus: boolean = false) => {
    setSelectedId(id);
    if (autoFocus) {
      setNoteToFocus(id);
    } else {
      setNoteToFocus(null);
    }
    if (window.innerWidth < 1024) setIsListVisible(false);
  };

  const createFolder = async () => {
    if (!navigator.onLine) {
       showConfirmDialog({ title: "Offline", message: "You need to be online to create folders.", confirmText: "Dismiss", onConfirm: () => {} });
       return;
    }
    
    showConfirmDialog({
      title: "New Folder",
      message: "Enter a name for your new folder.",
      isPrompt: true,
      promptPlaceholder: "Folder name...",
      confirmText: "Create",
      onConfirm: async (name?: string) => {
        if (!name || !name.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        
        const payload: any = { user_id: user?.id, name: name.trim() };
        if (selectedFolderId) payload.parent_id = selectedFolderId;

        const { data, error } = await supabase.from('note_folders').insert(payload).select().single();
        
        if (error) {
          console.error("Error creating folder:", error);
          showConfirmDialog({ title: "Error", message: `Could not create folder: ${error.message}`, confirmText: "OK", onConfirm: () => {} });
          return;
        }

        if (data) {
          setFolders(prev => [...prev, data]);
        }
      }
    });
  };

  const renameFolder = (folder: any) => {
    showConfirmDialog({
      title: "Rename Folder",
      message: "Enter a new name for this folder.",
      isPrompt: true,
      promptDefaultValue: folder.name,
      promptPlaceholder: "Folder name...",
      confirmText: "Rename",
      onConfirm: async (newName?: string) => {
        if (!newName || !newName.trim() || newName.trim() === folder.name) return;
        const trimmed = newName.trim();
        setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name: trimmed } : f));
        if (navigator.onLine) {
           await supabase.from('note_folders').update({ name: trimmed }).eq('id', folder.id);
        }
      }
    });
  };

  const deleteFolder = async (folderId: string) => {
    if (!navigator.onLine) {
       showConfirmDialog({ title: "Offline", message: "You need to be online to delete folders.", confirmText: "Dismiss", onConfirm: () => {} });
       return;
    }
    showConfirmDialog({
      title: "Delete Folder",
      message: "Are you sure? This folder, along with all subfolders and notes inside it, will be permanently deleted.",
      isDestructive: true,
      onConfirm: async () => {
        // Find all subfolders recursively to ensure we delete the whole tree
        const getDescendants = (id: string, all: any[]): string[] => {
          let desc: string[] = [];
          const children = all.filter(f => f.parent_id === id);
          for (const child of children) {
            desc.push(child.id);
            desc.push(...getDescendants(child.id, all));
          }
          return desc;
        };
        
        const foldersToDelete = [folderId, ...getDescendants(folderId, folders)];
        
        // Find all notes inside these folders
        const notesToDelete = notes.filter(n => n.folder_id && foldersToDelete.includes(n.folder_id)).map(n => n.id);
        
        // Optimistically update UI
        setFolders(prev => prev.filter(f => !foldersToDelete.includes(f.id)));
        setNotes(prev => prev.filter(n => !notesToDelete.includes(n.id)));
        
        // Adjust state if we are currently looking at or inside the deleted folder
        if (selectedFolderId && foldersToDelete.includes(selectedFolderId)) {
           const f = folders.find(x => x.id === folderId);
           setSelectedFolderId(f?.parent_id || null);
        }
        
        // Deselect Note if it was actively deleted
        if (notesToDelete.includes(selectedId as string)) {
           setSelectedId(null);
           setIsListVisible(true);
        }

        // DB deletion (we delete notes first, then folders to avoid FK issues if CASCADE is missing)
        if (notesToDelete.length > 0) {
           await supabase.from('notes').delete().in('id', notesToDelete);
        }
        if (foldersToDelete.length > 0) {
           await supabase.from('note_folders').delete().in('id', foldersToDelete);
        }
        
        fetchData();
      }
    });
  };

  const createNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { user_id: user?.id, title: 'New Note' };
    if (selectedFolderId) payload.folder_id = selectedFolderId;
    
    const { data } = await supabase.from('notes').insert(payload).select().single();
    if (data) {
      setNotes([data, ...notes]);
      handleSelectItem(data.id, true);
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
    handleSelectItem(dateStr, true);
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

  const moveToFolder = async (id: string, folderId: string | null) => {
    if (!id || isTrashOpen || notesTab !== 'notes') return;
    const cleanFolderId = folderId === "" ? null : folderId;
    
    setNotes(prev => prev.map(n => n.id === id ? { ...n, folder_id: cleanFolderId } : n));
    const updatedNow = new Date().toISOString();

    const queue = JSON.parse(localStorage.getItem('chronoa_offline_queue') || '[]');
    const itemIndex = queue.findIndex((q: any) => q.id === id && q.type === 'notes');
    const existingContent = notes.find(n => n.id === id)?.content || '';
    const existingTitle = notes.find(n => n.id === id)?.title || 'Untitled';
    
    if (itemIndex >= 0) {
      queue[itemIndex].folder_id = cleanFolderId;
      queue[itemIndex].updated_at = updatedNow;
    } else {
      queue.push({ type: 'notes', id, content: existingContent, title: existingTitle, folder_id: cleanFolderId, updated_at: updatedNow });
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
       if (currNote) {
         payload.title = currNote.title;
         payload.folder_id = currNote.folder_id;
       }
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
    
    if (!searchQuery.trim()) {
      if (notesTab === 'notes' && !isTrashOpen) {
        list = list.filter(n => n.folder_id === selectedFolderId);
      }
      return list;
    }

    const q = searchQuery.toLowerCase();
    return list.filter(item => {
      const isJournal = isTrashOpen ? item.isJournal : notesTab === 'journal';
      const title = isJournal ? formatDateLabel(item.entry_date) : item.title;
      const plain = (item.content || "").replace(/<[^>]+>/g, ' ').toLowerCase();
      return title?.toLowerCase().includes(q) || plain.includes(q);
    });
  }, [notes, journals, trash, notesTab, searchQuery, isTrashOpen, selectedFolderId]);

  const currentFolders = useMemo(() => {
    if (notesTab !== 'notes' || isTrashOpen || searchQuery.trim()) return [];
    return folders.filter(f => f.parent_id === selectedFolderId).sort((a,b) => a.name.localeCompare(b.name));
  }, [folders, selectedFolderId, notesTab, isTrashOpen, searchQuery]);

  useEffect(() => {
    if (autoSelectPending && !loading && !isTrashOpen) {
      if (filteredItems.length > 0) {
        if (window.innerWidth >= 1024) {
          const firstItem = filteredItems[0];
          const firstId = firstItem.entry_date || firstItem.id;
          setSelectedId(firstId);
          setNoteToFocus(null);
        } else {
          setSelectedId(null);
          setNoteToFocus(null);
        }
      } else {
        setSelectedId(null);
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
  }, [selectedId, notesTab, notes, journals, trash, isTrashOpen]);

  const currentFolder = folders.find(f => f.id === selectedFolderId);

  const getFolderPath = (folderId: string | null) => {
    if (!folderId) return [];
    const path = [];
    let curr = folders.find(f => f.id === folderId);
    while (curr) {
      path.unshift(curr);
      curr = folders.find(f => f.id === curr.parent_id);
    }
    return path;
  };

  const moveModalSubfolders = useMemo(() => {
    return folders.filter(f => f.parent_id === moveTargetFolderId).sort((a,b) => a.name.localeCompare(b.name));
  }, [folders, moveTargetFolderId]);

  const renderCalendar = (isMobilePopover = false) => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
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
    <div className="flex flex-col gap-2 relative w-full no-editor-focus cursor-default">
      <div className="flex flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMobile && (
            <button 
              onPointerDown={(e) => { 
                e.preventDefault(); 
                (document.activeElement as HTMLElement)?.blur(); 
                setSelectedId(null); 
                setIsListVisible(true); 
                setNoteToFocus(null); 
              }}
              className="flex items-center justify-center p-2.5 bg-[#f7f5f0] dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] md:hover:text-[#3d3b33] md:dark:hover:text-[#f0f0f0] transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            {(!isTrashOpen && notesTab === 'journal') || selectedItem?.isJournal ? (
              <div 
                className="space-y-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                onPointerDown={(e) => { e.preventDefault(); document.getElementById('notes-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                onTouchEnd={(e) => {
                  // Force native focus on iOS immediately 
                  if (document.activeElement !== e.currentTarget) {
                    e.currentTarget.focus();
                  }
                }}
                className="select-text text-2xl lg:text-4xl text-[#3d3b33] dark:text-white font-serif leading-tight bg-transparent outline-none w-full placeholder:text-[#e0ddd5] dark:placeholder:text-[#2a2a2a] transition-all truncate lg:whitespace-normal" 
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isTrashOpen && notesTab === 'notes' && !selectedItem?.isJournal && (
             <button 
               data-tooltip-id="global-tooltip" 
               data-tooltip-content="Move Note" 
               onPointerDown={(e) => { e.preventDefault(); (document.activeElement as HTMLElement)?.blur(); setMoveTargetFolderId(selectedItem?.folder_id || null); setIsMoveModalOpen(true); }}
               className="w-9 h-9 lg:w-10 lg:h-10 text-[#b0ad9a] md:hover:text-[#c2956e] md:hover:bg-[#c2956e]/10 md:dark:hover:bg-[#b0855f]/20 rounded-full transition-all flex items-center justify-center bg-transparent outline-none mr-1 cursor-pointer"
             >
               <FolderInput size={18} />
             </button>
          )}

          {!isTrashOpen ? (
            <button 
              data-tooltip-id="global-tooltip" 
              data-tooltip-content="Move to Trash" 
              onPointerDown={(e) => { e.preventDefault(); (document.activeElement as HTMLElement)?.blur(); moveToTrash(selectedItem?.entry_date || selectedItem?.id); }} 
              className="w-9 h-9 lg:w-10 lg:h-10 text-[#b0ad9a] md:hover:text-red-500 md:hover:bg-red-50 md:dark:hover:bg-red-900/20 rounded-full transition-all flex items-center justify-center bg-transparent outline-none cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          ) : (
            <>
              <button 
                data-tooltip-id="global-tooltip" 
                data-tooltip-content="Restore" 
                onPointerDown={(e) => { e.preventDefault(); (document.activeElement as HTMLElement)?.blur(); restoreNote(selectedItem); }} 
                className="w-9 h-9 lg:w-10 lg:h-10 text-[#7ca982] md:hover:bg-[#7ca982]/10 rounded-full transition-all flex items-center justify-center bg-transparent outline-none cursor-pointer"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                data-tooltip-id="global-tooltip" 
                data-tooltip-content="Delete Permanently" 
                onPointerDown={(e) => { e.preventDefault(); (document.activeElement as HTMLElement)?.blur(); permanentlyDelete(selectedItem); }} 
                className="w-9 h-9 lg:w-10 lg:h-10 text-red-500 md:hover:bg-red-50 md:dark:hover:bg-red-900/20 rounded-full transition-all flex items-center justify-center bg-transparent outline-none cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
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
            <div className="flex items-center justify-between gap-3">
              <div 
                className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0] cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                onClick={() => {
                  document.getElementById('notes-library-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                  if (!isTrashOpen) setSelectedFolderId(null);
                }}
              >
                {isTrashOpen && (
                  <button 
                    onPointerDown={(e) => { 
                      e.preventDefault(); e.stopPropagation(); 
                      setIsTrashOpen(false); setSelectedId(null); setNoteToFocus(null); setAutoSelectPending(true); setShowCalendar(false); 
                    }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setIsTrashOpen(false); setSelectedId(null); setNoteToFocus(null); setAutoSelectPending(true); setShowCalendar(false); 
                    }} 
                    className="flex items-center justify-center p-2.5 md:p-3 bg-white dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] md:hover:text-[#3d3b33] md:dark:hover:text-[#f0f0f0] transition-all shadow-sm mr-1 shrink-0 cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                {!isTrashOpen && <Library size={20} className="text-[#c2956e] shrink-0" />}
                {isTrashOpen && <Trash2 size={24} className="text-[#c2956e] shrink-0" />}
                
                <h1 className="text-2xl md:text-4xl font-serif font-medium tracking-tight truncate max-w-[200px] md:max-w-[300px]">
                  {isTrashOpen ? 'Trash' : 'Library'}
                </h1>
              </div>
              
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0 relative">
                {!isTrashOpen && notesTab === 'notes' && (
                  <>
                    <button 
                      onClick={() => { setIsTrashOpen(true); setSelectedId(null); setNoteToFocus(null); setAutoSelectPending(true); setShowCalendar(false); }} 
                      data-tooltip-id="global-tooltip" data-tooltip-content="Open Trash"
                      className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full transition-all text-[#888] md:hover:text-red-400 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] shadow-sm cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button onClick={createNote} data-tooltip-id="global-tooltip" data-tooltip-content="New Note" className="hidden lg:flex w-10 h-10 items-center justify-center bg-[#c2956e] text-white dark:bg-[#b0855f] rounded-full md:hover:scale-105 transition-all shadow-lg shrink-0 cursor-pointer">
                      <Plus size={18} />
                    </button>
                  </>
                )}
                
                {!isTrashOpen && notesTab === 'journal' && (
                  <>
                    <button 
                      onClick={() => { setIsTrashOpen(true); setSelectedId(null); setNoteToFocus(null); setAutoSelectPending(true); setShowCalendar(false); }} 
                      data-tooltip-id="global-tooltip" data-tooltip-content="Open Trash"
                      className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full transition-all text-[#888] md:hover:text-red-400 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] shadow-sm cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setShowCalendar(!showCalendar)} data-tooltip-id="global-tooltip" data-tooltip-content="Calendar" className="desktop-cal-toggle hidden lg:flex w-10 h-10 items-center justify-center bg-[#c2956e] text-white dark:bg-[#b0855f] rounded-full md:hover:scale-105 transition-all shadow-lg cursor-pointer">
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
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white shadow-sm shrink-0 border border-transparent md:border-red-100 dark:border-red-900/30 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
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
                      className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${notesTab === id ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`}>
                      <Icon size={14} /> <span>{label}</span>
                    </button>
                  ))}
                </div>

                {notesTab === 'notes' && !isTrashOpen && selectedFolderId && (
                   <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar pb-1">
                      <button 
                        onClick={() => setSelectedFolderId(currentFolder?.parent_id || null)}
                        className="flex items-center justify-center p-2 bg-white dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all shadow-sm shrink-0 cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#888] whitespace-nowrap bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] px-3 py-2.5 rounded-xl shadow-sm flex-1 min-w-0">
                         <button onClick={() => setSelectedFolderId(null)} className="hover:text-[#c2956e] transition-colors shrink-0 cursor-pointer">Library</button>
                         {getFolderPath(selectedFolderId).map(f => (
                            <React.Fragment key={f.id}>
                              <ChevronRight size={14} className="text-[#b0ad9a] shrink-0" />
                              <button onClick={() => setSelectedFolderId(f.id)} className={`hover:text-[#c2956e] transition-colors truncate max-w-[100px] md:max-w-[150px] shrink-0 cursor-pointer ${selectedFolderId === f.id ? 'text-[#3d3b33] dark:text-white' : ''}`}>
                                {f.name}
                              </button>
                            </React.Fragment>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div id="notes-library-scroll-container" className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 md:px-8 lg:px-10 lg:pl-8 scroll-smooth">
            {loading && notes.length === 0 && journals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                <Sparkles className="animate-pulse text-[#c2956e]" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Opening Library...</span>
              </div>
            ) : (
              <>
                {notesTab === 'notes' && !isTrashOpen && !searchQuery && (
                  <>
                    <div className="flex items-center justify-between mb-2 px-1 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
                        {currentFolder ? 'Subfolders' : 'Folders'}
                      </span>
                      <button onClick={createFolder} className="hidden md:flex text-[#b0ad9a] hover:text-[#c2956e] transition-colors p-1 cursor-pointer" data-tooltip-id="global-tooltip" data-tooltip-content="New Folder">
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    {currentFolders.length > 0 && currentFolders.map(folder => (
                      <div 
                        key={folder.id} 
                        onClick={() => setSelectedFolderId(folder.id)} 
                        className="group flex items-center justify-between p-3.5 mb-2 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] md:hover:border-[#c2956e]/40 shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#c2956e]/10 text-[#c2956e] dark:bg-[#b0855f]/20 dark:text-[#d1a784] flex items-center justify-center shrink-0">
                            <Folder size={18} />
                          </div>
                          <span className="font-semibold text-[14px] text-[#3d3b33] dark:text-[#f0f0f0] truncate">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); renameFolder(folder); }} 
                            className="p-1.5 text-[#b0ad9a] md:hover:text-[#c2956e] transition-colors cursor-pointer"
                            data-tooltip-id="global-tooltip" data-tooltip-content="Rename Folder"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} 
                            className="p-1.5 text-[#b0ad9a] md:hover:text-red-500 transition-colors cursor-pointer"
                            data-tooltip-id="global-tooltip" data-tooltip-content="Delete Folder"
                          >
                            <Trash2 size={15} />
                          </button>
                          <ChevronRight size={16} className="text-[#b0ad9a] ml-0.5 opacity-50 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between mb-2 px-1 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
                        Notes
                      </span>
                    </div>
                  </>
                )}
                
                {filteredItems.length > 0 ? (
                  <div className="space-y-3">
                    {filteredItems.map(item => {
                      const isJournal = isTrashOpen ? item.isJournal : notesTab === 'journal';
                      const id = item.entry_date || item.id;
                      const isSelected = selectedId === id;
                      const title = isJournal ? formatDateLabel(item.entry_date) : (item.title || 'Untitled');
                      const daysLeft = isTrashOpen ? Math.ceil(30 - (Date.now() - new Date(item.deleted_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                      return (
                        <button key={id} onClick={() => handleSelectItem(id)} 
                          className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border relative group overflow-hidden cursor-pointer ${
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
                  </div>
                ) : (
                  <div className="py-20 text-center text-[#b0ad9a] dark:text-[#555] italic text-xs">
                    {searchQuery ? "No records match your search." : (notesTab === 'notes' && !isTrashOpen ? "No notes here." : "No records found.")}
                  </div>
                )}
                
                <div className="h-28 lg:h-0 w-full shrink-0 pointer-events-none" />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEW */}
      <main className={`
        cursor-text
        flex-1 flex flex-col bg-white dark:bg-[#121212] transition-transform duration-500 ease-in-out z-40
        max-lg:fixed max-lg:inset-0
        lg:static lg:translate-x-0
        ${isListVisible && !isEditorFullscreen ? 'max-lg:translate-x-full' : 'max-lg:translate-x-0'}
      `}>
        {selectedItem ? (
          <div className="flex-1 flex flex-col w-full overflow-hidden relative">
            
            {/* MOBILE FIXED HEADER */}
            <div className={`lg:hidden absolute top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-[calc(0.75rem+max(1rem,env(safe-area-inset-top)))] pb-3 ${
              isScrolled 
                ? 'bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border-b border-[#e0ddd5] dark:border-[#2a2a2a] shadow-sm' 
                : 'bg-white dark:bg-[#121212] border-b border-transparent'
            }`}>
               {renderEditorHeader(true)}
            </div>

            <div 
              id="notes-scroll-container" 
              className="flex-1 overflow-y-auto no-scrollbar w-full relative flex flex-col cursor-text"
              onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 10)}
              onClick={(e) => {
                 const target = e.target as HTMLElement;
                 // Prevent dispatching if the user clicks a specific interactive element
                 if (!target.closest('button') && !target.closest('a') && !target.closest('input') && !target.closest('.no-editor-focus')) {
                    window.dispatchEvent(new CustomEvent('focus-editor'));
                 }
              }}
            >
              {/* Spacer for absolute header on mobile */}
              <div className="lg:hidden w-full h-[calc(4.5rem+max(1rem,env(safe-area-inset-top)))] shrink-0 pointer-events-none" />

              <div className="max-w-[1000px] mx-auto px-5 sm:px-6 lg:px-12 pt-2 lg:pt-10 pb-[calc(1.5rem+72px+env(safe-area-inset-bottom))] lg:pb-10 w-full flex-1 flex flex-col">
                
                {/* DESKTOP SCROLLING HEADER (Scrolls naturally on laptops) */}
                <div className="hidden lg:block mb-8 shrink-0">
                  {renderEditorHeader(false)}
                </div>

                {/* Editor Content Area ensures the whole bottom space is the contenteditable target */}
                <div className="relative flex-1 flex flex-col">
                  <DistractionFreeEditor
                    key={`${isTrashOpen ? 'trash' : notesTab}-${selectedId}`}
                    initialContent={selectedItem.content || '<p></p>'}
                    isEditable={!isTrashOpen}
                    onSave={(html) => saveContent(html, selectedItem.entry_date || selectedItem.id)}
                    noteType={(!isTrashOpen && notesTab === 'journal') || selectedItem.isJournal ? 'journal' : 'notes'}
                    entryDate={selectedItem.entry_date}
                    shouldFocusOnMount={noteToFocus === (selectedItem.entry_date || selectedItem.id)}
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

      {/* Move Note Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-fade-up">
             <header className="px-6 py-6 border-b border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-between items-center bg-white dark:bg-[#1e1e1e] shrink-0">
                <h3 className="text-2xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] font-medium tracking-tight">Move Note</h3>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsMoveModalOpen(false); }} 
                  className="p-2 text-[#888] hover:text-[#3d3b33] dark:hover:text-white bg-[#f0ede8] dark:bg-[#252525] hover:bg-[#e0ddd5] dark:hover:bg-[#333] rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
             </header>
             
             <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 space-y-5 bg-[#f7f5f0] dark:bg-[#121212]">
                {/* Breadcrumbs Path Navigation */}
                <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-[#888]">
                   <button 
                     onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setMoveTargetFolderId(null); }} 
                     className={`hover:text-[#c2956e] transition-colors cursor-pointer ${moveTargetFolderId === null ? 'text-[#3d3b33] dark:text-white' : ''}`}
                   >
                     Library
                   </button>
                   {getFolderPath(moveTargetFolderId).map(f => (
                      <React.Fragment key={f.id}>
                        <ChevronRight size={14} className="text-[#b0ad9a]" />
                        <button 
                          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setMoveTargetFolderId(f.id); }} 
                          className={`hover:text-[#c2956e] transition-colors truncate max-w-[120px] cursor-pointer ${moveTargetFolderId === f.id ? 'text-[#3d3b33] dark:text-white' : ''}`}
                        >
                          {f.name}
                        </button>
                      </React.Fragment>
                   ))}
                </div>

                <div className="border border-[#e0ddd5] dark:border-[#333] rounded-2xl bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm">
                   {moveModalSubfolders.length > 0 ? moveModalSubfolders.map(f => (
                     <div 
                       key={f.id} 
                       onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setMoveTargetFolderId(f.id); }} 
                       className="flex items-center gap-3 p-3.5 border-b border-[#e0ddd5] dark:border-[#333] last:border-b-0 hover:bg-[#fdfbf7] dark:hover:bg-[#2a2a2a] cursor-pointer transition-colors group"
                     >
                        <div className="w-8 h-8 rounded-xl bg-[#c2956e]/10 text-[#c2956e] flex items-center justify-center shrink-0">
                          <Folder size={16} />
                        </div>
                        <span className="text-[14px] font-medium text-[#3d3b33] dark:text-white truncate">{f.name}</span>
                        <ChevronRight size={16} className="ml-auto text-[#b0ad9a] opacity-50 group-hover:opacity-100 transition-opacity" />
                     </div>
                   )) : (
                     <div className="p-6 text-center text-xs text-[#b0ad9a] italic">No subfolders here.</div>
                   )}
                </div>
             </div>
             
             <footer className="px-6 py-5 border-t border-[#e0ddd5] dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e] flex justify-end gap-3 shrink-0">
                <button 
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsMoveModalOpen(false); }} 
                  className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-[#888] hover:text-[#3d3b33] dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                   onPointerDown={(e) => { 
                     e.preventDefault(); 
                     e.stopPropagation(); 
                     moveToFolder(selectedId!, moveTargetFolderId); 
                     setIsMoveModalOpen(false); 
                   }} 
                   className="px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white bg-[#c2956e] hover:bg-[#b0855f] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                >
                   Move Here
                </button>
             </footer>
          </div>
        </div>
      )}

      {isListVisible && !isTrashOpen && (
        <div className="lg:hidden fixed bottom-[calc(110px+env(safe-area-inset-bottom))] right-6 z-[100] flex flex-col items-end gap-3">
          {showCalendar && notesTab === 'journal' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
              <div className="relative z-50 mb-1 animate-fade-up origin-bottom-right">
                {renderCalendar(true)}
              </div>
            </>
          )}
          {notesTab === 'notes' && (
             <button 
               onClick={createFolder}
               className="relative z-50 w-12 h-12 bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] text-[#888] rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
             >
               <FolderPlus size={20} />
             </button>
          )}
          <button 
            onClick={() => {
               if (notesTab === 'notes') createNote();
               else setShowCalendar(!showCalendar);
            }}
            className="mobile-cal-toggle relative z-50 w-14 h-14 bg-[#c2956e] text-white rounded-full shadow-xl flex items-center justify-center md:hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {notesTab === 'notes' ? <Plus size={24} strokeWidth={2.5} /> : (showCalendar ? <X size={22} /> : <CalendarDays size={22} />)}
          </button>
        </div>
      )}

    </div>
  );
}