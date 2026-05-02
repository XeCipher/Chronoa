// frontend/app/(dashboard)/tasks/page.tsx
"use client";

import { useState } from "react";
import TaskSection from "@/components/tasks/TaskSection";
import ICloudTodayFeed from "@/components/tasks/ICloudTodayFeed";
import { ListChecks, History, Trash2, ArrowLeft, Search, LayoutGrid, List, SortAsc, SortDesc, Plus } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";

export default function TasksPage() {
  const { tasksView, setTasksView, archiveLayout, setArchiveLayout, archiveSort, setArchiveSort, showConfirmDialog } = useUiStore();
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleViewChange = (v: 'focus' | 'archive') => {
    setTasksView(v);
    setIsTrashOpen(false);
  };

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

  const handleFabClick = () => {
    window.dispatchEvent(new CustomEvent('chronoa-add-task'));
  };

  const currentViewMode = isTrashOpen ? 'trash' : tasksView;

  return (
    <div className="w-full min-h-full bg-[#f7f5f0] dark:bg-[#121212] p-4 md:p-12 lg:p-16 selection:bg-[#c2956e]/30 dark:selection:bg-[#b0855f]/40 relative">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-[#c2956e] dark:text-[#d1a784] tracking-[0.3em] uppercase font-bold">
              {isTrashOpen ? 'Recycle Bin' : 'Sanctuary'}
            </p>
            <h1 className="text-5xl md:text-6xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif italic font-medium leading-none">
              {isTrashOpen ? 'Trash' : tasksView === 'focus' ? 'Daily Focus' : 'Archive'}
            </h1>
          </div>

          <div className="flex items-center gap-4 self-start md:self-end">
            {!isTrashOpen ? (
              <>
                <div className="flex bg-white/50 dark:bg-[#1e1e1e]/50 border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm">
                  <button 
                    onClick={() => handleViewChange('focus')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      tasksView === 'focus' ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'text-[#b0ad9a] dark:text-[#7a7a7a] hover:text-[#3d3b33] dark:hover:text-white'
                    }`}
                  >
                    <ListChecks size={14} /> Focus
                  </button>
                  <button 
                    onClick={() => handleViewChange('archive')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      tasksView === 'archive' ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'text-[#b0ad9a] dark:text-[#7a7a7a] hover:text-[#3d3b33] dark:hover:text-white'
                    }`}
                  >
                    <History size={14} /> Archive
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsTrashOpen(true)}
                  data-tooltip-id="global-tooltip" data-tooltip-content="Open Trash"
                  className="p-3 text-[#b0ad9a] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                  <Trash2 size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsTrashOpen(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm hover:border-[#c2956e] transition-all"
                >
                  <ArrowLeft size={14} /> Back to Tasks
                </button>
                <button 
                  onClick={handleEmptyTrash}
                  className="px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  Empty Trash
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Global Toolbar */}
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-10 animate-fade-up shrink-0">
           <div className="relative flex-1 w-full max-w-xl">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
             <input 
               value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
               placeholder="Search sanctuary..." 
               spellCheck={false}
               className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-[#c2956e] text-sm text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm" 
             />
           </div>

           {currentViewMode === 'archive' && (
             <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
                <div className="flex bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm shrink-0">
                  <button onClick={() => setArchiveLayout('nested')} className={`p-2.5 rounded-xl transition-all ${archiveLayout === 'nested' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`} data-tooltip-id="global-tooltip" data-tooltip-content="Nested View"><LayoutGrid size={18} /></button>
                  <button onClick={() => setArchiveLayout('list')} className={`p-2.5 rounded-xl transition-all ${archiveLayout === 'list' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`} data-tooltip-id="global-tooltip" data-tooltip-content="Flat List"><List size={18} /></button>
                </div>
                
                <div className="flex bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm shrink-0">
                  <button onClick={() => setArchiveSort('newest')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${archiveSort === 'newest' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`}><SortDesc size={14} /> Newest</button>
                  <button onClick={() => setArchiveSort('oldest')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${archiveSort === 'oldest' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`}><SortAsc size={14} /> Oldest</button>
                </div>
             </div>
           )}
        </div>

        {tasksView === 'focus' && !isTrashOpen && <ICloudTodayFeed />}

        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 w-full animate-fade-up">
          <div className="w-full lg:w-1/2 min-w-0">
            <TaskSection type="routine" title={currentViewMode === 'trash' ? 'Routine Trash' : (currentViewMode === 'archive' ? 'Routine Archive' : "My Routine")} viewMode={currentViewMode} searchQuery={searchQuery} />
          </div>
          <div className="w-full lg:w-1/2 min-w-0">
            <TaskSection type="normal" title={currentViewMode === 'trash' ? 'Task Trash' : (currentViewMode === 'archive' ? 'Task Archive' : "Tasks & Ideas")} viewMode={currentViewMode} searchQuery={searchQuery} />
          </div>
        </div>

        {/* Dynamic spacer for mobile FABs to prevent overlaps */}
        <div className="h-28 lg:h-0 w-full shrink-0 pointer-events-none" />

      </div>

      {/* Mobile FAB for adding normal task */}
      {tasksView === 'focus' && !isTrashOpen && (
        <button 
          onClick={handleFabClick}
          className="lg:hidden fixed bottom-[90px] right-6 z-[100] w-14 h-14 bg-white/30 dark:bg-black/30 backdrop-blur-lg border-2 border-[#c2956e]/50 dark:border-[#b0855f]/50 text-[#c2956e] dark:text-[#b0855f] rounded-full shadow-lg shadow-black/10 dark:shadow-black/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}