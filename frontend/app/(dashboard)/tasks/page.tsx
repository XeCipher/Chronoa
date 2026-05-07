// frontend/app/(dashboard)/tasks/page.tsx
"use client";

import { useState, useEffect } from "react";
import TaskSection from "@/components/tasks/TaskSection";
import TodayCalendarWidget from "@/components/calendar/TodayCalendarWidget";
import { ListChecks, History, Trash2, ArrowLeft, Search, LayoutGrid, List, SortAsc, SortDesc, CheckSquare } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import { Tooltip } from "react-tooltip";

export default function TasksPage() {
  const { tasksView, setTasksView, archiveLayout, setArchiveLayout, archiveSort, setArchiveSort, showConfirmDialog } = useUiStore();
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEmptyTrash = () => {
    showConfirmDialog({
      title: "Empty Trash",
      message: "Are you sure you want to permanently delete all tasks in the trash? This cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        await supabase.from('tasks').delete().not('deleted_at', 'is', null);
        window.location.reload(); 
      }
    });
  };

  const handleClearHistory = () => {
    showConfirmDialog({
      title: "Clear History",
      message: "Are you sure you want to permanently delete all archived tasks? This cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        await supabase.from('tasks').delete().eq('is_completed', true).is('deleted_at', null);
        window.location.reload(); 
      }
    });
  };

  useEffect(() => {
    setTasksView('focus');
    setIsTrashOpen(false);
  }, [setTasksView]);

  // Reset View Event Listener
  useEffect(() => {
    const handleReset = (e: any) => {
      if (e.detail === '/tasks') {
        setIsTrashOpen(false);
        setTasksView('focus');
      }
    };
    window.addEventListener('chronoa-reset-tab', handleReset);
    return () => window.removeEventListener('chronoa-reset-tab', handleReset);
  }, [setTasksView]);

  const currentViewMode = isTrashOpen ? 'trash' : tasksView;

  // Render Action Buttons
  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      {!isTrashOpen && currentViewMode !== 'archive' && (
        <>
          <button 
            onClick={() => setTasksView('archive')}
            data-tooltip-id="task-tooltip" data-tooltip-content="History"
            className="w-10 h-10 md:w-11 md:h-11 flex shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] transition-all text-[#888] hover:bg-[#f0ede8] dark:hover:bg-[#2a2a2a] md:hover:text-[#c2956e] shadow-sm"
          >
            <History size={18} />
          </button>
          <button 
            onClick={() => setIsTrashOpen(true)}
            data-tooltip-id="task-tooltip" data-tooltip-content="Open Trash"
            className="w-10 h-10 md:w-11 md:h-11 flex shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] transition-all text-[#888] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 shadow-sm border-transparent md:border-[#e0ddd5]"
          >
            <Trash2 size={18} />
          </button>
        </>
      )}

      {isTrashOpen && (
        <button 
          onClick={handleEmptyTrash}
          data-tooltip-id="task-tooltip" data-tooltip-content="Empty Trash"
          className="w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30"
        >
          <Trash2 size={18} />
        </button>
      )}

      {currentViewMode === 'archive' && (
        <button 
          onClick={handleClearHistory}
          data-tooltip-id="task-tooltip" data-tooltip-content="Clear History"
          className="w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full h-full bg-[#f7f5f0] dark:bg-[#121212] flex flex-col relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden">
        
        {/* Fixed Header Layer */}
        <div className="px-4 md:px-8 lg:px-10 pt-4 md:pt-8 lg:pt-10 pb-2 md:pb-4 shrink-0">
          <header className="flex flex-col gap-4 w-full mb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
              
              <div className="flex flex-row items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-4 shrink-0">
                  {(isTrashOpen || currentViewMode === 'archive') && (
                    <button onClick={() => { setIsTrashOpen(false); setTasksView('focus'); }} className="flex items-center justify-center p-2.5 md:p-3 bg-white dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all shadow-sm">
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div 
                    className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0] cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => document.getElementById('tasks-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    {isTrashOpen ? <Trash2 size={24} className="text-[#c2956e]" /> : currentViewMode === 'archive' ? <History size={24} className="text-[#c2956e]" /> : <CheckSquare size={24} className="text-[#c2956e]" />}
                    <h1 className="text-2xl md:text-4xl font-serif font-medium tracking-tight">
                      {isTrashOpen ? 'Trash' : currentViewMode === 'archive' ? 'History' : 'Tasks'}
                    </h1>
                  </div>
                </div>

                {/* Mobile Actions (Hidden on Desktop) */}
                <div className="flex md:hidden items-center gap-2">
                  <ActionButtons />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                  <input 
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search tasks..." 
                    spellCheck={false}
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-sm text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm transition-all" 
                  />
                </div>
                
                {/* Desktop Actions (Hidden on Mobile) */}
                <div className="hidden md:flex items-center gap-2 w-full md:w-auto justify-end">
                  <ActionButtons />
                </div>
              </div>
            </div>

            {/* Second Row for Archive Tools (if active) */}
            {currentViewMode === 'archive' && (
              <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar pb-1 md:pb-0 justify-start md:justify-end">
                 <div className="flex bg-[#ebe8e2]/50 dark:bg-[#1a1a1a] p-1.5 rounded-[1.25rem] border border-[#e0ddd5] dark:border-[#333] shadow-inner shrink-0 w-full md:w-auto">
                   <button onClick={() => setArchiveLayout('nested')} className={`flex-1 md:flex-none flex items-center justify-center p-2.5 rounded-xl transition-all ${archiveLayout === 'nested' ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`} data-tooltip-id="task-tooltip" data-tooltip-content="Nested View"><LayoutGrid size={18} /></button>
                   <button onClick={() => setArchiveLayout('list')} className={`flex-1 md:flex-none flex items-center justify-center p-2.5 rounded-xl transition-all ${archiveLayout === 'list' ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`} data-tooltip-id="task-tooltip" data-tooltip-content="Flat List"><List size={18} /></button>
                 </div>
                 
                 <div className="flex bg-[#ebe8e2]/50 dark:bg-[#1a1a1a] p-1.5 rounded-[1.25rem] border border-[#e0ddd5] dark:border-[#333] shadow-inner shrink-0 w-full md:w-auto">
                   <button onClick={() => setArchiveSort('newest')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${archiveSort === 'newest' ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`}><SortDesc size={14} /> Newest</button>
                   <button onClick={() => setArchiveSort('oldest')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${archiveSort === 'oldest' ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`}><SortAsc size={14} /> Oldest</button>
                 </div>
              </div>
            )}
          </header>
        </div>

        {/* Scrollable Content Layer */}
        <div id="tasks-scroll-container" className="flex-1 overflow-y-scroll overflow-x-hidden no-scrollbar px-4 md:px-8 lg:px-10 pt-2 md:pt-0 pb-8 md:pb-12 w-full min-h-0">
          <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-12 w-full">
            <div className="w-full lg:w-1/2 min-w-0 flex flex-col gap-4 lg:gap-8">
              <TodayCalendarWidget variant="tasks" searchQuery={searchQuery} className="hidden lg:block" />
              <TaskSection type="routine" title={currentViewMode === 'trash' ? 'Routine Trash' : (currentViewMode === 'archive' ? 'Routine History' : "My Routine")} viewMode={currentViewMode} searchQuery={searchQuery} />
            </div>
            <div className="w-full lg:w-1/2 min-w-0">
              <TaskSection type="normal" title={currentViewMode === 'trash' ? 'Task Trash' : (currentViewMode === 'archive' ? 'Task History' : "Tasks & Ideas")} viewMode={currentViewMode} searchQuery={searchQuery} />
            </div>
          </div>
          
          {/* Spacer to prevent Global Time Widget overlap on desktop */}
          <div className="hidden md:block h-32 w-full shrink-0 pointer-events-none" />
        </div>

      </div>

      <Tooltip 
        id="task-tooltip" 
        className="max-md:!hidden z-[600] !bg-[#3d3b33] dark:!bg-[#2a2a2a] !text-white !rounded-xl !shadow-xl !font-semibold !text-[11px] !px-3 !py-1.5 !border-none" 
      />
    </div>
  );
}