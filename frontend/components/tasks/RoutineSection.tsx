"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import RecursiveCheckbox from "../ui/RecursiveCheckbox";
import { Plus } from "lucide-react";

export default function RoutineSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to build the nested tree from a flat array
  const buildTree = (list: Task[]): Task[] => {
    const map: { [key: string]: Task } = {};
    const roots: Task[] = [];
    
    list.forEach(node => {
      node.children = [];
      map[node.id] = node;
    });

    list.forEach(node => {
      if (node.parent_id && map[node.parent_id]) {
        map[node.parent_id].children?.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('task_type', 'routine')
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching tasks:', error);
      else {
        setTasks(data || []);
      }
      setLoading(false);
    };

    fetchTasks();

    const channel = supabase
      .channel('tasks_routine')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `task_type=eq.routine` }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddTask = async (parentId: string | null = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const newTask = {
      user_id: user.id,
      title: 'New Routine',
      task_type: 'routine' as const,
      parent_id: parentId,
    };
    
    const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
    if (error) console.error("Error adding task:", error);
  };
  
  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) console.error("Error updating task:", error);
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error("Error deleting task:", error);
  };

  const nestedTasks = buildTree(tasks);

  return (
    <div className="bg-white/50 p-6 rounded-2xl border border-gray-200/80 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Routine</h2>
        {/* We generally won't add root routines from the UI, but it's here for setup */}
        <button onClick={() => handleAddTask()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors">
          <Plus size={16} />
          Add Routine Item
        </button>
      </div>
      {loading ? (
        <p className="text-gray-400">Loading routine...</p>
      ) : (
        nestedTasks.length > 0 ? (
          nestedTasks.map(task => (
            <RecursiveCheckbox
              key={task.id}
              task={task}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />
          ))
        ) : (
          <p className="text-gray-400 italic">No routines defined yet.</p>
        )
      )}
    </div>
  );
}