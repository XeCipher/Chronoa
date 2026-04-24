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
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Props {
  type: "routine" | "normal";
  title: string;
}

export default function TaskSection({ type, title }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { taskArchiveDelay } = useUiStore();

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
    return () => { supabase.removeChannel(channel); };
  }, [type]);

  // Filter out completed tasks that have passed the archive delay
  const filteredTasks = useMemo(() => {
    if (isEditMode) return tasks;
    if (taskArchiveDelay < 0) return tasks;
    const now = Date.now();
    const delayMs = taskArchiveDelay * 60 * 1000;
    return tasks.filter((t) => {
      if (!t.is_completed || !t.completed_at) return true;
      return now - new Date(t.completed_at).getTime() < delayMs;
    });
  }, [tasks, isEditMode, taskArchiveDelay]);

  // Build tree structure from flat list
  const taskTree = useMemo(() => {
    const map: Record<string, Task> = {};
    const roots: Task[] = [];
    filteredTasks.forEach((t) => (map[t.id] = { ...t, children: [] }));
    filteredTasks.forEach((t) => {
      if (t.parent_id && map[t.parent_id]) {
        map[t.parent_id].children!.push(map[t.id]);
      } else {
        roots.push(map[t.id]);
      }
    });
    return roots;
  }, [filteredTasks]);

  // Stats for routine section header badge
  const completedCount = useMemo(
    () => tasks.filter((t) => !t.parent_id && t.is_completed).length,
    [tasks]
  );
  const rootCount = useMemo(
    () => tasks.filter((t) => !t.parent_id).length,
    [tasks]
  );

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

  const onUpdate = async (id: string, updates: Partial<Task>) => {
    let tasksToUpdate: {id: string, updates: Partial<Task>}[] = [];
    const now = new Date().toISOString();

    if (updates.hasOwnProperty('is_completed')) {
      const isDone = updates.is_completed;
      const completionTime = isDone ? now : null;
      
      // 1. DOWNWARD: Check all children
      const addChildrenToUpdate = (parentId: string) => {
        tasks.filter(t => t.parent_id === parentId).forEach(child => {
          tasksToUpdate.push({ id: child.id, updates: { is_completed: isDone, completed_at: completionTime } });
          addChildrenToUpdate(child.id);
        });
      };
      addChildrenToUpdate(id);

      // 2. UPWARD: If all siblings are checked, check the parent
      const checkParentStatus = (taskId: string, status: boolean) => {
        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask?.parent_id) return;
        const siblings = tasks.filter(t => t.parent_id === currentTask.parent_id && t.id !== taskId);
        const allSiblingsChecked = siblings.every(s => s.is_completed);

        if (status && allSiblingsChecked) {
          tasksToUpdate.push({ id: currentTask.parent_id, updates: { is_completed: true, completed_at: now } });
          checkParentStatus(currentTask.parent_id, true);
        } else if (!status) {
          tasksToUpdate.push({ id: currentTask.parent_id, updates: { is_completed: false, completed_at: null } });
          checkParentStatus(currentTask.parent_id, false);
        }
      };
      checkParentStatus(id, !!isDone);
      updates.completed_at = completionTime;
    }

    // Apply Optimistic Update
    setTasks(prev => prev.map(t => {
      if (t.id === id) return { ...t, ...updates };
      const bulk = tasksToUpdate.find(u => u.id === t.id);
      return bulk ? { ...t, ...bulk.updates } : t;
    }));

    // Persist
    await supabase.from('tasks').update(updates).eq('id', id);
    for (const bulk of tasksToUpdate) {
      await supabase.from('tasks').update(bulk.updates).eq('id', bulk.id);
    }
  };

  const onAdd = async (parentId: string | null = null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("tasks").insert({
      user_id: user?.id,
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

  return (
    <div
      className="
        relative flex flex-col
        bg-white/70 backdrop-blur-sm
        border border-[#ebe8e2]
        rounded-[28px] overflow-hidden
        shadow-[0_2px_16px_rgba(44,43,39,0.05)]
        transition-all duration-300
      "
    >
      {/* ── Card Header ──────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-5 border-b border-[#f0ede8]">
        <div className="flex items-start justify-between gap-4">

          {/* Title + progress badge */}
          <div className="flex flex-col gap-1.5">
            <h2
              className="text-[26px] text-[#3d3b33] leading-none"
              style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 500 }}
            >
              {title}
            </h2>

            {/* Only show progress for routine */}
            {type === "routine" && rootCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                {/* Mini progress bar */}
                <div className="w-28 h-[3px] bg-[#ebe8e2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7ca982] rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / rootCount) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#b0ad9a] tracking-wide">
                  {completedCount}/{rootCount}
                </span>
              </div>
            )}
          </div>

          {/* Action button(s) */}
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {type === "routine" && (
              <button
                onClick={() => setIsEditMode((v) => !v)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full
                  text-[11px] font-[600] tracking-[0.08em] uppercase
                  transition-all duration-200
                  ${isEditMode
                    ? "bg-[#c2956e] text-white shadow-[0_2px_8px_rgba(194,149,110,0.30)]"
                    : "bg-[#f7f5f0] text-[#c2956e] hover:bg-[#c2956e]/10"
                  }
                `}
              >
                {isEditMode ? (
                  <><CheckCircle2 size={13} /> Done</>
                ) : (
                  <><Edit3 size={12} /> Edit</>
                )}
              </button>
            )}

            {type === "normal" && (
              <button
                onClick={() => onAdd(null)}
                title="Add task"
                className="
                  w-9 h-9 flex items-center justify-center
                  bg-[#f7f5f0] text-[#c2956e]
                  rounded-full hover:bg-[#c2956e]/10
                  transition-all duration-150
                "
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Task List Body ────────────────────────────────────────────────── */}
      <div className="px-5 py-4 min-h-[60px]">
        {isLoading ? (
          /* Skeleton shimmer */
          <div className="space-y-3 py-2 px-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-[5px] bg-[#ebe8e2] animate-pulse shrink-0" />
                <div
                  className="h-3 bg-[#ebe8e2] rounded-full animate-pulse"
                  style={{ width: `${55 + i * 10}%`, animationDelay: `${i * 80}ms` }}
                />
              </div>
            ))}
          </div>
        ) : taskTree.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-2xl select-none">✦</span>
            <p className="text-[12px] text-[#c4c0b8] tracking-wide text-center">
              {type === "routine"
                ? "Add your daily habits to get started"
                : "All clear — nothing pending"}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
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

      {/* ── Edit Mode Footer — add root item ─────────────────────────────── */}
      {isEditMode && type === "routine" && (
        <div className="px-5 pb-5">
          <button
            onClick={() => onAdd(null)}
            className="
              w-full flex items-center justify-center gap-2 py-2.5
              border border-dashed border-[#d4d0c8]
              rounded-xl text-[12px] text-[#b0ad9a]
              hover:border-[#c2956e] hover:text-[#c2956e] hover:bg-[#c2956e]/5
              transition-all duration-200
            "
          >
            <Plus size={14} strokeWidth={2} />
            Add routine item
          </button>
        </div>
      )}
    </div>
  );
}