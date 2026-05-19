// frontend/app/(dashboard)/sessions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, Search, Trash2, PlayCircle, Timer, ArrowLeft, History, Sparkles } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useRouter } from "next/navigation";
import { Tooltip } from "react-tooltip";

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightText = ({ text, query }: { text: string, query: string }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-[#c2956e]/40 dark:bg-[#b0855f]/50 text-[#3d3b33] dark:text-white rounded-[4px] px-[2px] font-semibold">
            {part}
          </span>
        ) : part
      )}
    </>
  );
};

export default function SessionsPage() {
  const router = useRouter();
  const { sessionsFilter, setSessionsFilter, showConfirmDialog } = useUiStore();
  const[sessions, setSessions] = useState<any[]>([]);
  const[loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const[filter, setFilter] = useState<'all' | 'timer' | 'stopwatch'>(sessionsFilter || 'all');
  const[editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleFilterChange = (f: 'all' | 'timer' | 'stopwatch') => {
    setFilter(f);
    setSessionsFilter(f);
  };

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('time_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setSessions(data);
    setLoading(false);
  };

  useEffect(() => {
    const cached = localStorage.getItem('chronoa_cache_sessions');
    if (cached) {
      try { setSessions(JSON.parse(cached)); setLoading(false); } catch(e) {}
    }
    fetchSessions(); 
  },[]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('chronoa_cache_sessions', JSON.stringify(sessions));
    }
  }, [sessions, loading]);

  // Global Escape Key Listener for Back Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
        router.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleDelete = (id: string) => {
    showConfirmDialog({
      title: "Delete Session",
      message: "Delete this time log forever? This cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        setSessions(prev => prev.filter(s => s.id !== id));
        await supabase.from('time_sessions').delete().eq('id', id);
      }
    });
  };

  const handleDeleteAll = () => {
    showConfirmDialog({
      title: "Clear History",
      message: "Are you sure you want to completely wipe your time tracking history? This cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setSessions([]);
        await supabase.from('time_sessions').delete().eq('user_id', user?.id);
      }
    });
  };

  const handleSaveEdit = async (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle } : s));
    setEditingId(null);
    await supabase.from('time_sessions').update({ title: editTitle }).eq('id', id);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const filteredSessions = sessions.filter(s => {
    const titleLower = (s.title || '').toLowerCase();
    const dateTimeLower = formatDateTime(s.created_at).toLowerCase();
    const durationLower = formatDuration(s.duration_seconds).toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch = titleLower.includes(searchLower) || dateTimeLower.includes(searchLower) || durationLower.includes(searchLower);
    const matchesFilter = filter === 'all' || s.session_type === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full h-full bg-[#f7f5f0] dark:bg-[#121212] flex flex-col relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
        
        {/* Fixed Header Layer */}
        <div className="px-4 md:px-8 lg:px-10 pt-4 md:pt-8 lg:pt-10 pb-2 md:pb-4 shrink-0">
          <header className="flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 mb-0">
            
            <div className="flex flex-row items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-4 shrink-0">
                <button onClick={() => router.back()} className="flex items-center justify-center p-2.5 md:p-3 bg-white dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all shadow-sm">
                  <ArrowLeft size={18} />
                </button>
                <div 
                  className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0] cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => document.getElementById('sessions-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <History size={24} className="text-[#c2956e]" />
                  <h1 className="text-2xl md:text-4xl font-serif font-medium tracking-tight">Time Log</h1>
                </div>
              </div>

              {/* Mobile Actions (Hidden on Desktop) */}
              <div className="flex lg:hidden items-center gap-2">
                <button 
                  onClick={handleDeleteAll} 
                  data-tooltip-id="session-tooltip" data-tooltip-content="Clear History"
                  className="w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full lg:w-auto">
              
              {/* Search Bar - Ordered 1 on Mobile, 2 on Desktop */}
              <div className="relative w-full md:w-64 shrink-0 order-1 md:order-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                <input 
                  type="text" placeholder="Search sessions..." value={search} onChange={(e) => setSearch(e.target.value)}
                  spellCheck={false}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-sm text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm transition-all"
                />
              </div>

              {/* Desktop Actions - Hidden on Mobile */}
              <div className="hidden lg:flex items-center gap-2 shrink-0 order-3">
                 <button 
                   onClick={handleDeleteAll} 
                   data-tooltip-id="session-tooltip" data-tooltip-content="Clear History"
                   className="w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>

              {/* Filters - Ordered 2 on Mobile, 1 on Desktop (To the left of Search) */}
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0 justify-start md:shrink-0 order-2 md:order-1">
                <div className="flex bg-[#ebe8e2]/50 dark:bg-[#1a1a1a] p-1.5 rounded-[1.25rem] border border-[#e0ddd5] dark:border-[#333] shadow-inner shrink-0 w-full md:w-auto">
                  {['all', 'timer', 'stopwatch'].map(f => (
                    <button 
                      key={f} onClick={() => handleFilterChange(f as any)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-[#f0f0f0]'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </header>
        </div>

        {/* Scrollable Content Layer */}
        <div id="sessions-scroll-container" className="flex-1 overflow-y-scroll overflow-x-hidden no-scrollbar px-4 md:px-8 lg:px-10 pt-2 md:pt-0 pb-8 md:pb-12 w-full min-h-0">
          
          <div className="max-w-4xl mx-auto w-full flex flex-col space-y-3">
            {loading && sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                <Sparkles className="animate-pulse text-[#c2956e]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">Loading Logs...</span>
              </div>
            ) : filteredSessions.length > 0 ? (
              <>
                {filteredSessions.map(session => (
                  <div key={session.id} className="w-full text-left p-4 rounded-2xl transition-all duration-200 border relative group overflow-hidden bg-[#fdfbf7] dark:bg-[#161616] border-[#f0ede8] dark:border-[#222] md:hover:border-[#c2956e]/20 md:dark:hover:border-[#b0855f]/20 md:hover:shadow-sm flex items-center justify-between gap-3">
                    
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-[36px] h-[36px] rounded-xl flex items-center justify-center shrink-0 border ${session.session_type === 'timer' ? 'bg-orange-50 dark:bg-[#251e18] text-orange-500 border-orange-200 dark:border-[#4a3623]' : 'bg-blue-50 dark:bg-[#1a2333] text-blue-500 border-blue-200 dark:border-[#2c3d5c]'}`}>
                         {session.session_type === 'timer' ? <Timer size={16} /> : <PlayCircle size={16} />}
                      </div>
                      
                      <div className="flex flex-col min-w-0 flex-1">
                         {editingId === session.id ? (
                            <input 
                               autoFocus type="text" value={editTitle} 
                               onChange={(e) => setEditTitle(e.target.value)}
                               onBlur={() => handleSaveEdit(session.id)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleSaveEdit(session.id);
                                 if (e.key === 'Escape') setEditingId(null);
                               }}
                               spellCheck={false}
                               className="w-full bg-transparent border-b border-[#c2956e] dark:border-[#b0855f] outline-none text-[#3d3b33] dark:text-white font-semibold text-[14px] pb-[1px]"
                            />
                         ) : (
                            <span 
                               onClick={() => {setEditingId(session.id); setEditTitle(session.title || '')}} 
                               className="font-semibold text-[14px] text-[#3d3b33] dark:text-[#f0f0f0] truncate cursor-pointer hover:text-[#c2956e] dark:hover:text-[#d1a784] transition-colors"
                               data-tooltip-id="session-tooltip" data-tooltip-content="Click to Edit"
                            >
                               <HighlightText text={session.title || 'Untitled Session'} query={search} />
                            </span>
                         )}
                         <span className="text-[9px] font-bold text-[#b0ad9a] dark:text-[#555] uppercase tracking-widest mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            <HighlightText text={formatDateTime(session.created_at)} query={search} />
                         </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pl-2">
                      <span className="text-xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">
                         <HighlightText text={formatDuration(session.duration_seconds)} query={search} />
                      </span>
                      <button 
                         onClick={() => handleDelete(session.id)} 
                         className="w-8 h-8 flex items-center justify-center rounded-lg text-[#b0ad9a] md:hover:text-red-500 md:hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                         data-tooltip-id="session-tooltip" data-tooltip-content="Delete"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                ))}
                
                {/* Spacer to prevent Global Time Widget overlap on desktop */}
                <div className="hidden md:block h-12 w-full shrink-0 pointer-events-none" />
              </>
            ) : (
              <div className="py-20 text-center text-[#b0ad9a] dark:text-[#555] italic text-xs">
                {search ? "No matching sessions found." : "No sessions recorded."}
              </div>
            )}
          </div>

        </div>

      </div>

      <Tooltip 
        id="session-tooltip" 
        className="max-md:!hidden z-[600] !bg-[#3d3b33] dark:!bg-[#2a2a2a] !text-white !rounded-xl !shadow-xl !font-semibold !text-[11px] !px-3 !py-1.5 !border-none" 
      />
    </div>
  );
}