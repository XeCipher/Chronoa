// frontend/app/(dashboard)/tasks/page.tsx
"use client";

import { useState } from "react";
import TaskSection from "@/components/tasks/TaskSection";
import { ListChecks, History, Trash2, ArrowLeft, Search, LayoutGrid, List, SortAsc, SortDesc, CheckSquare } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import { Tooltip } from "react-tooltip";

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

  const currentViewMode = isTrashOpen ? 'trash' : tasksView;

  // Refined uniformity in root div className (p-4 md:p-8 lg:p-10)
  return (
    <div className="w-full min-h-full bg-[#f7f5f0] dark:bg-[#121212] p-4 md:p-8 lg:p-10 relative">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full">
        
        <header className="mb-6 lg:mb-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0] shrink-0">
            {isTrashOpen ? <Trash2 size={24} className="text-[#c2956e]" /> : tasksView === 'focus' ? <CheckSquare size={24} className="text-[#c2956e]" /> : <History size={24} className="text-[#c2956e]" />}
            <h1 className="text-3xl md:text-4xl font-serif font-medium tracking-tight">
              {isTrashOpen ? 'Trash' : tasksView === 'focus' ? 'Daily Focus' : 'Archive'}
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 w-full md:w-64 lg:w-80 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
              <input 
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search tasks..." 
                spellCheck={false}
                className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-[#c2956e] text-sm text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm transition-all" 
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
              {!isTrashOpen ? (
                <>
                  <div className="flex bg-white/50 dark:bg-[#1e1e1e]/50 border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm">
                    <button 
                      onClick={() => handleViewChange('focus')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        tasksView === 'focus' ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'text-[#b0ad9a] dark:text-[#7a7a7a] md:hover:text-[#3d3b33] md:dark:hover:text-white'
                      }`}
                    >
                      <ListChecks size={14} /> Focus
                    </button>
                    <button 
                      onClick={() => handleViewChange('archive')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        tasksView === 'archive' ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'text-[#b0ad9a] dark:text-[#7a7a7a] md:hover:text-[#3d3b33] md:dark:hover:text-white'
                      }`}
                    >
                      <History size={14} /> Archive
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setIsTrashOpen(true)}
                    data-tooltip-id="task-tooltip" data-tooltip-content="Open Trash"
                    className="p-3 text-[#b0ad9a] md:hover:text-red-400 md:hover:bg-red-50 md:dark:hover:bg-red-900/10 rounded-2xl transition-all border border-transparent md:hover:border-red-100 md:dark:hover:border-red-900/30"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsTrashOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm md:hover:border-[#c2956e] transition-all"
                  >
                    <ArrowLeft size={14} /> Back to Tasks
                  </button>
                  <button 
                    onClick={handleEmptyTrash}
                    className="px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest md:hover:bg-red-500 md:hover:text-white transition-all shadow-sm"
                  >
                    Empty Trash
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {currentViewMode === 'archive' && (
          <div className="flex items-center justify-end gap-3 mb-8 w-full overflow-x-auto no-scrollbar shrink-0">
             <div className="flex bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm shrink-0">
               <button onClick={() => setArchiveLayout('nested')} className={`p-2.5 rounded-xl transition-all ${archiveLayout === 'nested' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`} data-tooltip-id="task-tooltip" data-tooltip-content="Nested View"><LayoutGrid size={18} /></button>
               <button onClick={() => setArchiveLayout('list')} className={`p-2.5 rounded-xl transition-all ${archiveLayout === 'list' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`} data-tooltip-id="task-tooltip" data-tooltip-content="Flat List"><List size={18} /></button>
             </div>
             
             <div className="flex bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm shrink-0">
               <button onClick={() => setArchiveSort('newest')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${archiveSort === 'newest' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`}><SortDesc size={14} /> Newest</button>
               <button onClick={() => setArchiveSort('oldest')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${archiveSort === 'oldest' ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#888]'}`}><SortAsc size={14} /> Oldest</button>
             </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 w-full">
          <div className="w-full lg:w-1/2 min-w-0">
            <TaskSection type="routine" title={currentViewMode === 'trash' ? 'Routine Trash' : (currentViewMode === 'archive' ? 'Routine Archive' : "My Routine")} viewMode={currentViewMode} searchQuery={searchQuery} />
          </div>
          <div className="w-full lg:w-1/2 min-w-0">
            <TaskSection type="normal" title={currentViewMode === 'trash' ? 'Task Trash' : (currentViewMode === 'archive' ? 'Task Archive' : "Tasks & Ideas")} viewMode={currentViewMode} searchQuery={searchQuery} />
          </div>
        </div>

        <div className="h-28 lg:h-0 w-full shrink-0 pointer-events-none" />

      </div>

      <Tooltip 
        id="task-tooltip" 
        className="max-md:!hidden z-[600] !bg-[#3d3b33] dark:!bg-[#2a2a2a] !text-white !rounded-xl !shadow-xl !font-semibold !text-[11px] !px-3 !py-1.5 !border-none" 
      />
    </div>
  );
}