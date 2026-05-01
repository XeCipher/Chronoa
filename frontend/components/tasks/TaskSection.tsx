// frontend/components/tasks/TaskSection.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import RecursiveCheckbox from "../ui/RecursiveCheckbox";
import { Plus, Edit3, CheckCircle2 } from "lucide-react";
import { useUiStore } from "@/store/uiStore";

interface Props {
  type: "routine" | "normal";
  title: string;
}

export default function TaskSection({ type, title }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const { taskArchiveDelay, moveCompletedToBottom, keepParentTaskAlive, addTaskAtTop } = useUiStore();
  const [now, setNow] = useState(Date.now());
  const sectionRef = useRef<HTMLDivElement>(null);

  const fetchTasks = async () => {
    let { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("task_type", type)
      .is("deleted_at", null)
      .order("position", { ascending: true });

    if (error) {
      const fallback = await supabase
        .from("tasks")
        .select("*")
        .eq("task_type", type)
        .order("position", { ascending: true });
      data = fallback.data;
    }

    if (data) setTasks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    const channelId = `rt_${type}_${Math.random().toString(36).substring(7)}`;
    let timeoutId: NodeJS.Timeout;

    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fetchTasks(), 400);
        }
      )
      .subscribe();

    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
      clearTimeout(timeoutId);
    };
  }, [type]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isEditMode &&
        type === "routine" &&
        sectionRef.current &&
        !sectionRef.current.contains(e.target as Node)
      ) {
        setIsEditMode(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditMode, type]);

  const delayMs = taskArchiveDelay <= 0 ? 1000 : taskArchiveDelay * 60 * 1000;

  const filteredTasks = useMemo(() => {
    if (isEditMode) return tasks;
    if (taskArchiveDelay < 0) return tasks;
    return tasks.filter((t) => {
      if (!t.is_completed || !t.completed_at) return true;
      const completedTime = new Date(t.completed_at).getTime();
      return now - completedTime < delayMs;
    });
  }, [tasks, isEditMode, taskArchiveDelay, now, delayMs]);

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

    const sortNodes = (nodes: Task[]) => {
      nodes.sort((a, b) => a.position - b.position);
      if (moveCompletedToBottom && !isEditMode) {
        nodes.sort((a, b) =>
          a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1
        );
      }
      nodes.forEach((n) => {
        if (n.children) sortNodes(n.children);
      });
      return nodes;
    };

    return sortNodes(roots);
  }, [filteredTasks, moveCompletedToBottom, isEditMode]);

  const totalTasksCount = tasks.length;
  const totalCompletedCount = tasks.filter((t) => t.is_completed).length;
  const progressPercent =
    totalTasksCount > 0
      ? Math.round((totalCompletedCount / totalTasksCount) * 100)
      : 0;

  const onUpdate = async (id: string, updates: Partial<Task>) => {
    const isToggling = updates.hasOwnProperty("is_completed");
    const isDone = updates.is_completed;
    const completionTime = isDone ? new Date().toISOString() : null;
    let tasksToUpdate: { id: string; updates: Partial<Task> }[] = [];

    if (isToggling) {
      const addChildrenToUpdate = (parentId: string) => {
        tasks
          .filter((t) => t.parent_id === parentId)
          .forEach((child) => {
            if (child.is_completed !== isDone) {
              tasksToUpdate.push({
                id: child.id,
                updates: { is_completed: isDone, completed_at: completionTime },
              });
            }
            addChildrenToUpdate(child.id);
          });
      };
      addChildrenToUpdate(id);

      const checkParentStatus = (taskId: string, status: boolean) => {
        const currentTask = tasks.find((t) => t.id === taskId);
        if (!currentTask?.parent_id) return;

        const parentTask = tasks.find((t) => t.id === currentTask.parent_id);
        const shouldKeepAlive = keepParentTaskAlive || parentTask?.keep_alive;

        const siblings = tasks.filter(
          (t) => t.parent_id === currentTask.parent_id && t.id !== taskId
        );
        const allSiblingsChecked = siblings.every((s) => s.is_completed);

        if (status && allSiblingsChecked && !shouldKeepAlive) {
          tasksToUpdate.push({
            id: currentTask.parent_id,
            updates: { is_completed: true, completed_at: completionTime },
          });
          checkParentStatus(currentTask.parent_id, true);
        } else if (!status) {
          tasksToUpdate.push({
            id: currentTask.parent_id,
            updates: { is_completed: false, completed_at: null },
          });
          checkParentStatus(currentTask.parent_id, false);
        }
      };
      checkParentStatus(id, !!isDone);
      updates.completed_at = completionTime;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) return { ...t, ...updates };
        const bulk = tasksToUpdate.find((u) => u.id === t.id);
        return bulk ? { ...t, ...bulk.updates } : t;
      })
    );

    // Ensure database processes updates correctly and concurrently
    try {
      await Promise.all([
        supabase.from("tasks").update(updates).eq("id", id),
        ...tasksToUpdate.map((bulk) =>
          supabase.from("tasks").update(bulk.updates).eq("id", bulk.id)
        ),
      ]);
    } catch (err) {
      console.error("Failed to sync updates to database", err);
    }
  };

  const onAdd = async (parentId: string | null = null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const siblings = tasks.filter((t) => t.parent_id === parentId);
    let newPosition = 0;
    
    if (siblings.length > 0) {
      if (addTaskAtTop) {
        newPosition = Math.min(...siblings.map((t) => t.position)) - 1;
      } else {
        newPosition = Math.max(...siblings.map((t) => t.position)) + 1;
      }
    }

    const { data } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: "New Item",
        task_type: type,
        parent_id: parentId,
        position: newPosition,
      })
      .select()
      .single();

    if (data) {
      setTasks((prev) => [...prev, data]);
      setNewTaskId(data.id);
    }
  };

  const onDelete = async (id: string) => {
    const idsToDelete = [id];
    const findChildren = (parentId: string) => {
      tasks
        .filter((t) => t.parent_id === parentId)
        .forEach((child) => {
          idsToDelete.push(child.id);
          findChildren(child.id);
        });
    };
    findChildren(id);

    const deletedTime = new Date().toISOString();
    setTasks((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
    
    try {
      await Promise.all(
        idsToDelete.map((delId) =>
          supabase.from("tasks").update({ deleted_at: deletedTime }).eq("id", delId)
        )
      );
    } catch (err) {
      console.error("Failed to delete tasks", err);
    }
  };

  const onIndent = async (task: Task) => {
    const siblings = tasks
      .filter((t) => t.parent_id === task.parent_id)
      .sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((t) => t.id === task.id);
    
    if (index > 0) {
      const previousSibling = siblings[index - 1];
      const newParentId = previousSibling.id;
      const newSiblings = tasks.filter((t) => t.parent_id === newParentId);
      const newPosition =
        newSiblings.length > 0
          ? Math.max(...newSiblings.map((t) => t.position)) + 1
          : 0;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, parent_id: newParentId, position: newPosition }
            : t
        )
      );
      
      try {
        await supabase
          .from("tasks")
          .update({ parent_id: newParentId, position: newPosition })
          .eq("id", task.id);
      } catch (err) {
        console.error("Failed to indent task", err);
      }
    }
  };

  const onUnindent = async (task: Task) => {
    if (!task.parent_id) return;
    const parent = tasks.find((t) => t.id === task.parent_id);
    if (!parent) return;

    const newParentId = parent.parent_id;
    const newSiblings = tasks.filter((t) => t.parent_id === newParentId);
    const newPosition = parent.position + 1;

    const tasksToUpdate: { id: string; updates: Partial<Task> }[] = [
      { id: task.id, updates: { parent_id: newParentId, position: newPosition } },
    ];

    newSiblings.forEach((t) => {
      if (t.position >= newPosition) {
        tasksToUpdate.push({ id: t.id, updates: { position: t.position + 1 } });
      }
    });

    setTasks((prev) =>
      prev.map((t) => {
        const update = tasksToUpdate.find((u) => u.id === t.id);
        return update ? ({ ...t, ...update.updates } as Task) : t;
      })
    );

    try {
      await Promise.all(
        tasksToUpdate.map((update) =>
          supabase.from("tasks").update(update.updates).eq("id", update.id)
        )
      );
    } catch (err) {
      console.error("Failed to unindent task", err);
    }
  };

  const onMoveUp = async (task: Task) => {
    const siblings = tasks
      .filter((t) => t.parent_id === task.parent_id)
      .sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((t) => t.id === task.id);
    
    if (index > 0) {
      const prevTask = siblings[index - 1];
      const currentTask = siblings[index];
      
      // Optimize by only swapping the positions of the two affected tasks
      const tasksToUpdate = [
        { id: prevTask.id, updates: { position: currentTask.position } },
        { id: currentTask.id, updates: { position: prevTask.position } }
      ];
      
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          const update = tasksToUpdate.find((u) => u.id === t.id);
          return update ? { ...t, ...update.updates } : t;
        })
      );

      try {
        await Promise.all(
          tasksToUpdate.map((u) =>
            supabase.from("tasks").update(u.updates).eq("id", u.id)
          )
        );
      } catch (err) {
        console.error("Failed to move task up", err);
      }
    }
  };

  const onMoveDown = async (task: Task) => {
    const siblings = tasks
      .filter((t) => t.parent_id === task.parent_id)
      .sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((t) => t.id === task.id);
    
    if (index < siblings.length - 1) {
      const currentTask = siblings[index];
      const nextTask = siblings[index + 1];
      
      // Optimize by only swapping the positions of the two affected tasks
      const tasksToUpdate = [
        { id: currentTask.id, updates: { position: nextTask.position } },
        { id: nextTask.id, updates: { position: currentTask.position } }
      ];
      
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          const update = tasksToUpdate.find((u) => u.id === t.id);
          return update ? { ...t, ...update.updates } : t;
        })
      );

      try {
        await Promise.all(
          tasksToUpdate.map((u) =>
            supabase.from("tasks").update(u.updates).eq("id", u.id)
          )
        );
      } catch (err) {
        console.error("Failed to move task down", err);
      }
    }
  };

  return (
    <div
      ref={sectionRef}
      className="relative flex flex-col bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-[0_2px_16px_rgba(44,43,39,0.05)] transition-all duration-300"
    >
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 md:pb-5 border-b border-[#f0ede8] dark:border-[#2a2a2a]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2
              className="text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0] leading-none italic font-medium"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {title}
            </h2>
            {type === "routine" && totalTasksCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 md:w-28 h-[3px] bg-[#ebe8e2] dark:bg-[#333] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7ca982] dark:bg-[#6a9a70] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] tracking-wide">
                  {progressPercent}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {type === "routine" ? (
              <button
                onClick={() => setIsEditMode((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-[600] tracking-[0.08em] uppercase transition-all duration-200 ${
                  isEditMode
                    ? "bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-lg"
                    : "bg-[#f7f5f0] dark:bg-[#222] text-[#c2956e] dark:text-[#d1a784] hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20"
                }`}
              >
                {isEditMode ? (
                  <>
                    <CheckCircle2 size={13} /> Done
                  </>
                ) : (
                  <>
                    <Edit3 size={12} /> Edit
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => onAdd(null)}
                className="w-9 h-9 flex items-center justify-center bg-[#f7f5f0] dark:bg-[#222] text-[#c2956e] dark:text-[#d1a784] rounded-full hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20 transition-all"
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 md:px-5 py-3 md:py-4 min-h-[60px]">
        {isLoading ? (
          <div className="space-y-3 py-2 px-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-[5px] bg-[#ebe8e2] dark:bg-[#333] animate-pulse" />
                <div className="h-3 bg-[#ebe8e2] dark:bg-[#333] rounded-full animate-pulse w-full" />
              </div>
            ))}
          </div>
        ) : taskTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-2xl opacity-20 dark:opacity-10 select-none text-[#3d3b33] dark:text-white">
              ✦
            </span>
            <p className="text-[12px] text-[#c4c0b8] dark:text-[#555] tracking-wide uppercase font-bold">
              Clear Space
            </p>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {taskTree.map((t) => (
              <RecursiveCheckbox
                key={t.id}
                task={t}
                isEditMode={type === "normal" ? true : isEditMode}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAdd={onAdd}
                onIndent={onIndent}
                onUnindent={onUnindent}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                depth={0}
                newTaskId={newTaskId}
                setNewTaskId={setNewTaskId}
              />
            ))}
          </div>
        )}
      </div>

      {isEditMode && type === "routine" && (
        <div className="px-5 pb-5">
          <button
            onClick={() => onAdd(null)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#d4d0c8] dark:border-[#444] rounded-xl text-[12px] text-[#b0ad9a] dark:text-[#777] hover:border-[#c2956e] dark:hover:border-[#b0855f] hover:text-[#c2956e] dark:hover:text-[#b0855f] transition-all"
          >
            <Plus size={14} /> Add routine item
          </button>
        </div>
      )}
    </div>
  );
}