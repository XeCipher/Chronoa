// frontend/components/tasks/TaskHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import { CheckCircle, Calendar, Trash2, RotateCcw } from "lucide-react";

export default function TaskHistory({ forceTrashView = false }: { forceTrashView?: boolean }) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    let query = supabase.from('tasks').select('*');
    if (forceTrashView) {
      query = query.not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
    } else {
      query = query.eq('is_completed', true).is('deleted_at', null).order('completed_at', { ascending: false });
    }
    
    const { data } = await query;
    setAllTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [forceTrashView]);

  const getBreadcrumbPath = (task: Task) => {
    let path = task.title;
    let current = task;
    const visited = new Set([task.id]);
    while (current.parent_id) {
      const parent = allTasks.find(t => t.id === current.parent_id);
      if (parent && !visited.has(parent.id)) { 
        visited.add(parent.id);
        path = `${parent.title} > ${path}`; 
        current = parent; 
      } else break; 
    }
    return path;
  };

  const handleRestore = async (task: Task) => {
    const idsToRestore = [task.id];
    let current = task;
    const visited = new Set([task.id]); 
    while (current.parent_id) {
      const parent = allTasks.find(t => t.id === current.parent_id);
      if (parent && !visited.has(parent.id)) { 
        visited.add(parent.id);
        idsToRestore.push(parent.id); 
        current = parent; 
      } else break;
    }
    
    if (forceTrashView) {
      setAllTasks(prev => prev.filter(t => !idsToRestore.includes(t.id)));
      await supabase.from('tasks').update({ deleted_at: null }).in('id', idsToRestore);
    } else {
      setAllTasks(prev => prev.map(t => idsToRestore.includes(t.id) ? { ...t, is_completed: false, completed_at: null } : t));
      await supabase.from('tasks').update({ is_completed: false, completed_at: null }).in('id', idsToRestore);
    }
  };

  const handleDelete = async (id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const isLeafNode = (task: Task) => !allTasks.some(t => t.parent_id === task.id);
  const leafNodes = allTasks.filter(t => isLeafNode(t));
  const displayRoutines = leafNodes.filter(t => t.task_type === 'routine');
  const displayNormals = leafNodes.filter(t => t.task_type === 'normal');

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="animate-pulse h-32 bg-white/50 dark:bg-[#1a1a1a]/50 rounded-2xl border border-[#e0ddd5] dark:border-[#333]"></div>;

  return (
    <div className="space-y-12 animate-fade-up pb-32 lg:pb-20">
      <section>
        <div className="flex items-center gap-2 mb-6 text-[#7ca982] dark:text-[#8cbd92]">
          <Calendar size={20} />
          <h3 className="text-2xl font-medium font-serif tracking-tight">
            {forceTrashView ? 'Deleted Routines' : "Today's Routines"}
          </h3>
        </div>
        <div className="space-y-2">
          {displayRoutines.length > 0 ? displayRoutines.map(task => (
            <div key={task.id} className="bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] px-5 py-3.5 rounded-[1rem] flex justify-between items-center group md:hover:border-[#7ca982]/50 md:dark:hover:border-[#6a9a70]/50 transition-all shadow-sm">
              <span className="text-[#3d3b33] dark:text-[#e0e0e0] font-medium text-[15px]">{getBreadcrumbPath(task)}</span>
              <div className="opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#f7f5f0] dark:bg-[#121212] p-1 rounded-lg border border-[#e0ddd5] dark:border-[#444]">
                <button onClick={() => handleRestore(task)} data-tooltip-id="task-tooltip" data-tooltip-content="Restore" className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-md text-gray-400 dark:text-[#888] md:hover:text-[#7ca982] transition-colors"><RotateCcw size={16} strokeWidth={2.5} /></button>
                <button onClick={() => handleDelete(task.id)} data-tooltip-id="task-tooltip" data-tooltip-content="Delete Forever" className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-md text-gray-400 dark:text-[#888] md:hover:text-red-500 transition-colors"><Trash2 size={16} strokeWidth={2} /></button>
              </div>
            </div>
          )) : <p className="text-sm text-[#b0ad9a] dark:text-[#7a7a7a] italic px-2">Clear vault.</p>}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6 text-[#c2956e] dark:text-[#d1a784]">
          <CheckCircle size={20} />
          <h3 className="text-2xl font-medium font-serif tracking-tight">
             {forceTrashView ? 'Deleted Tasks' : 'Completed Tasks'}
          </h3>
        </div>
        <div className="space-y-2">
          {displayNormals.length > 0 ? displayNormals.map(task => (
            <div key={task.id} className="bg-white dark:bg-[#1e1e1e] border border-[#e0ddd5] dark:border-[#333] px-5 py-3.5 rounded-[1rem] flex justify-between items-center group md:hover:border-[#c2956e]/50 md:dark:hover:border-[#b0855f]/50 transition-all shadow-sm">
              <div className="flex flex-col">
                <span className="text-[#3d3b33] dark:text-[#e0e0e0] font-medium text-[15px]">{getBreadcrumbPath(task)}</span>
                <span className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] font-bold uppercase mt-0.5 tracking-wider">
                  {forceTrashView ? (task.deleted_at ? formatTime(task.deleted_at) : 'Deleted') : (task.completed_at ? formatTime(task.completed_at) : 'Completed')}
                </span>
              </div>
              <div className="opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#f7f5f0] dark:bg-[#121212] p-1 rounded-lg border border-[#e0ddd5] dark:border-[#444]">
                <button onClick={() => handleRestore(task)} data-tooltip-id="task-tooltip" data-tooltip-content="Restore" className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-md text-gray-400 dark:text-[#888] md:hover:text-[#c2956e] transition-colors"><RotateCcw size={16} strokeWidth={2.5} /></button>
                <button onClick={() => handleDelete(task.id)} data-tooltip-id="task-tooltip" data-tooltip-content="Delete Forever" className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-md text-gray-400 dark:text-[#888] md:hover:text-red-500 transition-colors"><Trash2 size={16} strokeWidth={2} /></button>
              </div>
            </div>
          )) : <p className="text-sm text-[#b0ad9a] dark:text-[#7a7a7a] italic px-2">Clear vault.</p>}
        </div>
      </section>
    </div>
  );
}