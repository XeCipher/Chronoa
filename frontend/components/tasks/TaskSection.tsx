"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import RecursiveCheckbox from "../ui/RecursiveCheckbox";
import { Plus } from "lucide-react";

export default function TaskSection({ type, title }: { type: 'routine' | 'normal', title: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_type', type)
      .order('position', { ascending: true });
    if (data) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    const channel = supabase.channel(`realtime_${type}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [type]);

  const taskTree = useMemo(() => {
    const map: { [key: string]: Task } = {};
    const roots: Task[] = [];
    tasks.forEach(t => map[t.id] = { ...t, children: [] });
    tasks.forEach(t => {
      if (t.parent_id && map[t.parent_id]) map[t.parent_id].children?.push(map[t.id]);
      else roots.push(map[t.id]);
    });
    return roots;
  }, [tasks]);

  const onAdd = async (parentId: string | null = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newTask: any = {
      user_id: user.id, title: "New Task", task_type: type, parent_id: parentId, position: tasks.length
    };
    await supabase.from('tasks').insert(newTask);
    fetchTasks();
  };

  const onUpdate = async (id: string, updates: Partial<Task>) => {
    let idsToUpdate = [id];

    // If we are changing completion status, find all children recursively
    if (updates.hasOwnProperty('is_completed')) {
      const findChildren = (parentId: string) => {
        tasks.filter(t => t.parent_id === parentId).forEach(child => {
          idsToUpdate.push(child.id);
          findChildren(child.id);
        });
      };
      findChildren(id);
    }

    // Optimistic Update
    setTasks(prev => prev.map(t => idsToUpdate.includes(t.id) ? { ...t, ...updates } : t));

    // Persist to Supabase
    await supabase.from('tasks').update(updates).in('id', idsToUpdate);
  };

  const onDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const onMove = async (id: string, direction: 'up' | 'down') => {
    const list = [...tasks].sort((a, b) => a.position - b.position);
    const index = list.findIndex(t => t.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === list.length - 1)) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const itemA = list[index];
    const itemB = list[swapIndex];
    
    setTasks(prev => prev.map(t => {
      if (t.id === itemA.id) return { ...t, position: itemB.position };
      if (t.id === itemB.id) return { ...t, position: itemA.position };
      return t;
    }));

    await supabase.from('tasks').update({ position: itemB.position }).eq('id', itemA.id);
    await supabase.from('tasks').update({ position: itemA.position }).eq('id', itemB.id);
  };

  return (
    <div className="bg-white border border-[#e0ddd5] rounded-[2.5rem] p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl text-[#3d3b33] font-medium" style={{ fontFamily: 'var(--font-cormorant), serif' }}>{title}</h2>
        <button onClick={() => onAdd()} className="w-10 h-10 flex items-center justify-center bg-[#f7f5f0] hover:bg-[#c2956e] hover:text-white text-[#c2956e] rounded-full transition-all duration-300">
          <Plus size={22} />
        </button>
      </div>
      
      <div className="space-y-1">
        {taskTree.length > 0 ? taskTree.map(t => (
          <RecursiveCheckbox key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} onMove={onMove} />
        )) : (
          <p className="text-[#888] text-sm italic py-4">All captured. Deep breath.</p>
        )}
      </div>
    </div>
  );
}