"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import { CheckCircle, Calendar, Trash2, RotateCcw } from "lucide-react";

export default function TaskHistory() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all tasks to build the parent-child relationships
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('completed_at', { ascending: false });

    setAllTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ─── LOGIC: Build Breadcrumbs ──────────────────────────────────────────
  const getBreadcrumbPath = (task: Task) => {
    let path = task.title;
    let current = task;

    while (current.parent_id) {
      const parent = allTasks.find(t => t.id === current.parent_id);
      if (parent) {
        path = `${parent.title} > ${path}`;
        current = parent;
      } else {
        break; 
      }
    }
    return path;
  };

  // ─── LOGIC: Restore Task & Ancestors ───────────────────────────────────
  const handleRestore = async (task: Task) => {
    const idsToRestore = [task.id];
    let current = task;

    while (current.parent_id) {
      const parent = allTasks.find(t => t.id === current.parent_id);
      if (parent) {
        idsToRestore.push(parent.id);
        current = parent;
      } else {
        break;
      }
    }

    setAllTasks(prev => prev.map(t => idsToRestore.includes(t.id) ? { ...t, is_completed: false, completed_at: null } : t));

    await supabase
      .from('tasks')
      .update({ is_completed: false, completed_at: null })
      .in('id', idsToRestore);
  };

  // ─── LOGIC: Delete Task ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  // ─── DATA PREPARATION: Only show "Leaf" nodes (Tasks with no children) 
  // We check if a task's ID exists as a parent_id in any other task.
  const isLeafNode = (task: Task) => {
    return !allTasks.some(t => t.parent_id === task.id);
  };

  const completedRoutines = allTasks.filter(t => 
    t.task_type === 'routine' && t.is_completed && isLeafNode(t)
  );
  
  const completedNormals = allTasks.filter(t => 
    t.task_type === 'normal' && t.is_completed && isLeafNode(t)
  );

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) return <div className="animate-pulse h-32 bg-white/50 rounded-2xl border border-[#e0ddd5]"></div>;

  return (
    <div className="space-y-12 animate-fade-up pb-20">
      
      {/* ─── SECTION 1: TODAY'S ROUTINES ─── */}
      <section>
        <div className="flex items-center gap-2 mb-6 text-[#7ca982]">
          <Calendar size={20} />
          <h3 className="text-2xl font-medium italic" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            Today's Routines
          </h3>
        </div>
        <div className="space-y-2">
          {completedRoutines.length > 0 ? completedRoutines.map(task => (
            <div key={task.id} className="bg-white border border-[#e0ddd5] px-5 py-3.5 rounded-[1rem] flex justify-between items-center group hover:border-[#7ca982]/50 transition-all shadow-sm">
              <span className="text-[#3d3b33] font-medium text-[15px]">{getBreadcrumbPath(task)}</span>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#f7f5f0] p-1 rounded-lg border border-[#e0ddd5]">
                <button onClick={() => handleRestore(task)} title="Restore to Focus" className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-[#7ca982] transition-colors">
                  <RotateCcw size={16} strokeWidth={2.5} />
                </button>
                <button onClick={() => handleDelete(task.id)} title="Delete Permanently" className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          )) : (
            <p className="text-sm text-[#b0ad9a] italic px-2">No routines completed yet today.</p>
          )}
        </div>
      </section>

      {/* ─── SECTION 2: NORMAL TASKS ARCHIVE ─── */}
      <section>
        <div className="flex items-center gap-2 mb-6 text-[#c2956e]">
          <CheckCircle size={20} />
          <h3 className="text-2xl font-medium italic" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            Completed Tasks
          </h3>
        </div>
        <div className="space-y-2">
          {completedNormals.length > 0 ? completedNormals.map(task => (
            <div key={task.id} className="bg-white border border-[#e0ddd5] px-5 py-3.5 rounded-[1rem] flex justify-between items-center group hover:border-[#c2956e]/50 transition-all shadow-sm">
              <div className="flex flex-col">
                <span className="text-[#3d3b33] font-medium text-[15px]">{getBreadcrumbPath(task)}</span>
                <span className="text-[10px] text-[#b0ad9a] font-bold uppercase mt-0.5 tracking-wider">
                  {task.completed_at ? formatTime(task.completed_at) : 'Completed'}
                </span>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#f7f5f0] p-1 rounded-lg border border-[#e0ddd5]">
                <button onClick={() => handleRestore(task)} title="Restore to Focus" className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-[#c2956e] transition-colors">
                  <RotateCcw size={16} strokeWidth={2.5} />
                </button>
                <button onClick={() => handleDelete(task.id)} title="Delete Permanently" className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          )) : (
            <p className="text-sm text-[#b0ad9a] italic px-2">Archive is empty.</p>
          )}
        </div>
      </section>

    </div>
  );
}