"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import RecursiveCheckbox from "../ui/RecursiveCheckbox";
import { Plus, Edit3, CheckCircle2 } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';

interface Props {
  type: "routine" | "normal";
  title: string;
}

export default function TaskSection({ type, title }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { taskArchiveDelay } = useUiStore();
  
  // 1. Live Timer State: Updates every 10 seconds to trigger re-filtering
  const [now, setNow] = useState(Date.now());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("task_type", type)
      .order("position", { ascending: true });
    if (data) setTasks(data);
    setIsLoading(false);
  };

  // Set up Real-time subscription and Initial Fetch
  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel(`rt_${type}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchTasks()
      )
      .subscribe();

    // Start the live vanishing interval
    const timer = setInterval(() => setNow(Date.now()), 10000);

    return () => { 
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [type]);

  // 2. Logic: Filter out "Vanished" tasks based on current 'now' timestamp
  const filteredTasks = useMemo(() => {
    // Show everything in Edit Mode so we can manage archived tasks
    if (isEditMode) return tasks;
    
    // If delay is -1, show everything forever
    if (taskArchiveDelay < 0) return tasks;

    const delayMs = taskArchiveDelay * 60 * 1000;
    return tasks.filter((t) => {
      if (!t.is_completed || !t.completed_at) return true;
      const completedTime = new Date(t.completed_at).getTime();
      return (now - completedTime) < delayMs;
    });
  }, [tasks, isEditMode, taskArchiveDelay, now]);

  // 3. Logic: Build the Recursive Tree from the flat filtered list
  const taskTree = useMemo(() => {
    const map: Record<string, Task> = {};
    const roots: Task[] = [];
    filteredTasks.forEach((t) => (map[t.id] = { ...t, children: [] }));
    filteredTasks.forEach((t) => {
      if (t.parent_id && map[t.parent_id]) {
        map[t.parent_id].children!.push(map[t.id]);
      } else if (!t.parent_id) {
        roots.push(map[t.id]);
      }
    });
    return roots;
  }, [filteredTasks]);

  // Stats for the header
  const completedCount = useMemo(
    () => tasks.filter((t) => !t.parent_id && t.is_completed).length,
    [tasks]
  );
  const rootCount = useMemo(
    () => tasks.filter((t) => !t.parent_id).length,
    [tasks]
  );

  const onUpdate = async (id: string, updates: Partial<Task>) => {
    const isToggling = updates.hasOwnProperty('is_completed');
    const isDone = updates.is_completed;
    const completionTime = isDone ? new Date().toISOString() : null;
    
    let tasksToUpdate: { id: string, updates: Partial<Task> }[] = [];

    if (isToggling) {
      // A. DOWNWARD: If parent is checked, check all children recursively
      // FIX: Only add children that are NOT already in the desired state to prevent ghost reappearance
      const addChildrenToUpdate = (parentId: string) => {
        tasks.filter(t => t.parent_id === parentId).forEach(child => {
          if (child.is_completed !== isDone) {
            tasksToUpdate.push({ id: child.id, updates: { is_completed: isDone, completed_at: completionTime } });
          }
          addChildrenToUpdate(child.id);
        });
      };
      addChildrenToUpdate(id);

      // B. UPWARD: If all siblings are checked, auto-check the parent
      const checkParentStatus = (taskId: string, status: boolean) => {
        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask?.parent_id) return;

        const siblings = tasks.filter(t => t.parent_id === currentTask.parent_id && t.id !== taskId);
        const allSiblingsChecked = siblings.every(s => s.is_completed);

        if (status && allSiblingsChecked) {
          tasksToUpdate.push({ id: currentTask.parent_id, updates: { is_completed: true, completed_at: completionTime } });
          checkParentStatus(currentTask.parent_id, true);
        } else if (!status) {
          tasksToUpdate.push({ id: currentTask.parent_id, updates: { is_completed: false, completed_at: null } });
          checkParentStatus(currentTask.parent_id, false);
        }
      };
      checkParentStatus(id, !!isDone);
      
      updates.completed_at = completionTime;
    }

    // Apply Optimistic Update locally
    setTasks(prev => prev.map(t => {
      if (t.id === id) return { ...t, ...updates };
      const bulk = tasksToUpdate.find(u => u.id === t.id);
      return bulk ? { ...t, ...bulk.updates } : t;
    }));

    // Batch update database
    await supabase.from('tasks').update(updates).eq('id', id);
    for (const bulk of tasksToUpdate) {
      await supabase.from('tasks').update(bulk.updates).eq('id', bulk.id);
    }
  };

  const onAdd = async (parentId: string | null = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: "New Item",
      task_type: type,
      parent_id: parentId,
      position: tasks.length,
    });
    fetchTasks();
  };

  const onDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    
    const reordered = arrayMove(tasks, oldIndex, newIndex).map((t, idx) => ({
      ...t,
      position: idx,
    }));

    setTasks(reordered);
    await Promise.all(
      reordered.map((t, idx) =>
        supabase.from("tasks").update({ position: idx }).eq("id", t.id)
      )
    );
  };

  return (
    <div className="relative flex flex-col bg-white/70 backdrop-blur-sm border border-[#ebe8e2] rounded-[28px] overflow-hidden shadow-[0_2px_16px_rgba(44,43,39,0.05)] transition-all duration-300">
      
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-[#f0ede8]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[26px] text-[#3d3b33] leading-none italic font-medium" style={{ fontFamily: "var(--font-cormorant), serif" }}>
              {title}
            </h2>
            {type === "routine" && rootCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-28 h-[3px] bg-[#ebe8e2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7ca982] rounded-full transition-all duration-500" style={{ width: `${(completedCount / rootCount) * 100}%` }} />
                </div>
                <span className="text-[11px] text-[#b0ad9a] tracking-wide">{completedCount}/{rootCount}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {type === "routine" && (
              <button onClick={() => setIsEditMode((v) => !v)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-[600] tracking-[0.08em] uppercase transition-all duration-200 ${isEditMode ? "bg-[#c2956e] text-white shadow-lg" : "bg-[#f7f5f0] text-[#c2956e] hover:bg-[#c2956e]/10"}`}>
                {isEditMode ? <><CheckCircle2 size={13} /> Done</> : <><Edit3 size={12} /> Edit</>}
              </button>
            )}
            {type === "normal" && (
              <button onClick={() => onAdd(null)} className="w-9 h-9 flex items-center justify-center bg-[#f7f5f0] text-[#c2956e] rounded-full hover:bg-[#c2956e]/10 transition-all">
                <Plus size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Body */}
      <div className="px-5 py-4 min-h-[60px]">
        {isLoading ? (
          <div className="space-y-3 py-2 px-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-[5px] bg-[#ebe8e2] animate-pulse" />
                <div className="h-3 bg-[#ebe8e2] rounded-full animate-pulse w-full" />
              </div>
            ))}
          </div>
        ) : taskTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-2xl opacity-20 select-none">✦</span>
            <p className="text-[12px] text-[#c4c0b8] tracking-wide uppercase font-bold">Clear Space</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-[2px]">
                {taskTree.map((t) => (
                  <RecursiveCheckbox 
                    key={t.id} 
                    task={t} 
                    isEditMode={type === "normal" || isEditMode} 
                    onUpdate={onUpdate} 
                    onDelete={onDelete} 
                    onAdd={onAdd} 
                    depth={0} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer (Edit mode only) */}
      {isEditMode && type === "routine" && (
        <div className="px-5 pb-5">
          <button onClick={() => onAdd(null)} className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#d4d0c8] rounded-xl text-[12px] text-[#b0ad9a] hover:border-[#c2956e] hover:text-[#c2956e] transition-all">
            <Plus size={14} /> Add routine item
          </button>
        </div>
      )}
    </div>
  );
}