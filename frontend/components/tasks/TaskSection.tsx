// frontend/components/tasks/TaskSection.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import RecursiveCheckbox from "../ui/RecursiveCheckbox";
import { Plus, Edit3, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { flushSync } from "react-dom";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

interface Props {
  type: "routine" | "normal";
  title: string;
  viewMode?: 'focus' | 'archive' | 'trash';
  searchQuery?: string;
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function TaskSection({ type, title, viewMode = 'focus', searchQuery = '' }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  
  const { 
    taskArchiveDelay, moveCompletedToBottom, keepParentTaskAlive, addTaskAtTop, archiveLayout, archiveSort,
    mobileRoutineCollapsed, mobileTasksCollapsed, setMobileRoutineCollapsed, setMobileTasksCollapsed
  } = useUiStore();
  
  const [now, setNow] = useState(Date.now());
  const sectionRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isCollapsedMobile = type === 'routine' ? mobileRoutineCollapsed : mobileTasksCollapsed;

  const fetchTasks = async () => {
    let { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("task_type", type)
      .order("position", { ascending: true });

    if (data) setTasks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const cached = localStorage.getItem(`chronoa_cache_tasks_${type}`);
    if (cached) {
      try {
        setTasks(JSON.parse(cached));
        setIsLoading(false);
      } catch (e) {}
    }

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

  // Sync tasks state to cache whenever it changes (after initial load)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`chronoa_cache_tasks_${type}`, JSON.stringify(tasks));
    }
  }, [tasks, isLoading, type]);

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

  const onAddRef = useRef<(parentId: string | null, relativeToTask?: Task) => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (type !== 'normal') return;
    const handleGlobalAdd = () => onAddRef.current(null);
    window.addEventListener('chronoa-add-task', handleGlobalAdd);
    return () => window.removeEventListener('chronoa-add-task', handleGlobalAdd);
  }, [type]);

  const delayMs = taskArchiveDelay <= 0 ? 1000 : taskArchiveDelay * 60 * 1000;

  const displayTasks = useMemo(() => {
    const map: Record<string, Task> = {};
    tasks.forEach((t) => (map[t.id] = { ...t, children: [] }));
    const roots: Task[] = [];
    
    tasks.forEach((t) => {
      if (t.parent_id && map[t.parent_id]) {
        map[t.parent_id].children!.push(map[t.id]);
      } else {
        roots.push(map[t.id]);
      }
    });

    const matchesSearch = (t: Task) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());

    const isFlatList = viewMode === 'trash' || (viewMode === 'archive' && archiveLayout === 'list');
    if (isFlatList) {
       let list = tasks.filter(t => {
          const modeMatch = viewMode === 'trash' ? t.deleted_at !== null : (t.deleted_at === null && t.is_completed);
          return modeMatch && matchesSearch(t);
       });

       list.sort((a, b) => {
          const timeA = new Date(viewMode === 'trash' ? a.deleted_at! : a.completed_at!).getTime();
          const timeB = new Date(viewMode === 'trash' ? b.deleted_at! : b.completed_at!).getTime();
          return viewMode === 'trash' || archiveSort === 'newest' ? timeB - timeA : timeA - timeB;
       });
       return list;
    }

    const prune = (node: Task): boolean => {
      if (node.children) node.children = node.children.filter(c => prune(c));
      
      const hasVisibleChildren = (node.children && node.children.length > 0) || false;
      
      const selfMatchesMode = viewMode === 'archive' 
          ? (node.deleted_at === null && node.is_completed)
          : (node.deleted_at === null && (!node.is_completed || isEditMode || taskArchiveDelay < 0 || (node.completed_at && now - new Date(node.completed_at).getTime() < delayMs)));

      return Boolean((selfMatchesMode && matchesSearch(node)) || hasVisibleChildren);
    };

    const tree = roots.filter(r => prune(r));
    
    const sort = (nodes: Task[]) => {
       nodes.sort((a, b) => {
          if (viewMode === 'archive') {
             const timeA = new Date(a.completed_at || a.created_at).getTime();
             const timeB = new Date(b.completed_at || b.created_at).getTime();
             return archiveSort === 'newest' ? timeB - timeA : timeA - timeB;
          }
          if (moveCompletedToBottom && !isEditMode) {
             if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
          }
          return a.position - b.position;
       });
       nodes.forEach(n => { if(n.children) sort(n.children); });
       return nodes;
    };
    
    return sort(tree);
  }, [tasks, viewMode, archiveLayout, archiveSort, searchQuery, isEditMode, now, delayMs, taskArchiveDelay, moveCompletedToBottom]);

  const flattenedVisibleTasks: Task[] = [];
  const gatherVisible = (nodes: Task[]) => {
    nodes.forEach(n => { flattenedVisibleTasks.push(n); if (n.children) gatherVisible(n.children); });
  };
  if (viewMode === 'focus') gatherVisible(displayTasks);

  const baseTasksForProgress = type === 'routine' ? tasks.filter(t => t.deleted_at === null) : flattenedVisibleTasks;
  const totalTasksCount = baseTasksForProgress.length;
  const totalCompletedCount = baseTasksForProgress.filter((t) => t.is_completed).length;
  const progressPercent = totalTasksCount > 0 ? Math.round((totalCompletedCount / totalTasksCount) * 100) : 0;

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

  const onAdd = async (parentId: string | null = null, relativeToTask?: Task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (type === 'routine' && mobileRoutineCollapsed) setMobileRoutineCollapsed(false);
    if (type === 'normal' && mobileTasksCollapsed) setMobileTasksCollapsed(false);

    if (parentId) {
      setTasks((prev) => prev.map((t) => t.id === parentId ? { ...t, is_collapsed: false } : t));
      supabase.from("tasks").update({ is_collapsed: false }).eq("id", parentId).then();
    }

    let newPosition = 0;
    let shiftUpdates: { id: string, updates: Partial<Task> }[] = [];

    if (relativeToTask) {
      // Add just below the specific task
      newPosition = relativeToTask.position + 1;
      // Shift all siblings that currently occupy this or later positions
      tasks
        .filter(t => t.parent_id === parentId && t.position >= newPosition)
        .forEach(t => shiftUpdates.push({ id: t.id, updates: { position: t.position + 1 } }));
    } else {
      // Default top/bottom logic for when parent is known but specific location isn't (like adding subtask)
      const siblings = tasks.filter((t) => t.parent_id === parentId);
      if (siblings.length > 0) {
        if (addTaskAtTop) {
          newPosition = Math.min(...siblings.map((t) => t.position)) - 1;
        } else {
          newPosition = Math.max(...siblings.map((t) => t.position)) + 1;
        }
      }
    }

    const newId = generateUUID();
    const tempTask: Task = {
      id: newId,
      user_id: user.id,
      title: "New Item", 
      task_type: type,
      parent_id: parentId,
      position: newPosition,
      is_completed: false,
      created_at: new Date().toISOString(),
      completed_at: null,
      deleted_at: null,
      color: null,
      keep_alive: false,
      is_collapsed: false,
      children: []
    };

    flushSync(() => {
      // Apply shifts and new task locally
      setTasks((prev) => {
        const updatedList = prev.map(t => {
          const shift = shiftUpdates.find(s => s.id === t.id);
          return shift ? { ...t, ...shift.updates } : t;
        });
        return [...updatedList, tempTask];
      });
      setNewTaskId(newId);
    });

    // Sync to DB
    const results = await Promise.all([
      supabase.from("tasks").insert({
        id: newId,
        user_id: user.id,
        title: "New Item",
        task_type: type,
        parent_id: parentId,
        position: newPosition,
      }),
      ...shiftUpdates.map(u => supabase.from("tasks").update(u.updates).eq("id", u.id))
    ]);

    const error = results.find(r => r.error);
    if (error) {
      console.error("Failed adding task or shifting siblings", error);
      fetchTasks(); // Re-sync if atomic operation failed
    }
  };

  useEffect(() => { onAddRef.current = onAdd; }, [onAdd]);

  const onDelete = async (id: string, isPermanent: boolean = false) => {
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

    if (isPermanent) {
      setTasks((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
      try {
        await supabase.from("tasks").delete().in("id", idsToDelete);
      } catch (err) { console.error("Failed to delete tasks permanently", err); }
    } else {
      const deletedTime = new Date().toISOString();
      setTasks((prev) => prev.map((t) => idsToDelete.includes(t.id) ? { ...t, deleted_at: deletedTime } : t));
      try {
        await supabase.from("tasks").update({ deleted_at: deletedTime }).in("id", idsToDelete);
      } catch (err) { console.error("Failed to move tasks to trash", err); }
    }
  };

  const onRestore = async (id: string, mode: 'from_trash' | 'from_archive') => {
    const idsToUpdate = [id];
    let current = tasks.find(t => t.id === id);
    
    while (current && current.parent_id) {
       const parent = tasks.find(t => t.id === current!.parent_id);
       if (parent) {
          if (!idsToUpdate.includes(parent.id)) idsToUpdate.push(parent.id);
          current = parent;
       } else break;
    }

    if (mode === 'from_trash') {
       setTasks(prev => prev.map(t => idsToUpdate.includes(t.id) ? { ...t, deleted_at: null } : t));
       await supabase.from('tasks').update({ deleted_at: null }).in('id', idsToUpdate);
    } else if (mode === 'from_archive') {
       setTasks(prev => prev.map(t => idsToUpdate.includes(t.id) ? { ...t, is_completed: false, completed_at: null } : t));
       await supabase.from('tasks').update({ is_completed: false, completed_at: null }).in('id', idsToUpdate);
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
    const visibleSiblings = tasks
      .filter((t) => 
        t.parent_id === task.parent_id &&
        t.deleted_at === null &&
        (!t.is_completed || isEditMode || taskArchiveDelay < 0 || (t.completed_at && (now - new Date(t.completed_at).getTime() < delayMs)))
      )
      .sort((a, b) => {
        if (moveCompletedToBottom && !isEditMode) {
          if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        }
        return a.position - b.position;
      });

    const visibleIndex = visibleSiblings.findIndex((t) => t.id === task.id);
    
    if (visibleIndex > 0) {
      const swapTarget = visibleSiblings[visibleIndex - 1];

      const rawSiblings = tasks
        .filter(t => t.parent_id === task.parent_id)
        .sort((a, b) => a.position - b.position);

      const rawTaskIndex = rawSiblings.findIndex(t => t.id === task.id);
      
      const newRawSiblings = [...rawSiblings];
      const [removedTask] = newRawSiblings.splice(rawTaskIndex, 1);
      
      const adjustedTargetIndex = newRawSiblings.findIndex(t => t.id === swapTarget.id);
      
      newRawSiblings.splice(adjustedTargetIndex, 0, removedTask);

      const tasksToUpdate = newRawSiblings.map((t, i) => ({ id: t.id, updates: { position: i } }));

      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          const update = tasksToUpdate.find((u) => u.id === t.id);
          return update ? { ...t, ...update.updates } : t;
        })
      );

      try {
        await Promise.all(
          tasksToUpdate.map((u) => {
            return supabase.from("tasks").update(u.updates).eq("id", u.id);
          })
        );
      } catch (err) {
        console.error("Failed to move task up", err);
      }
    }
  };

  const onMoveDown = async (task: Task) => {
    const visibleSiblings = tasks
      .filter((t) => 
        t.parent_id === task.parent_id &&
        t.deleted_at === null &&
        (!t.is_completed || isEditMode || taskArchiveDelay < 0 || (t.completed_at && (now - new Date(t.completed_at).getTime() < delayMs)))
      )
      .sort((a, b) => {
        if (moveCompletedToBottom && !isEditMode) {
          if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        }
        return a.position - b.position;
      });

    const visibleIndex = visibleSiblings.findIndex((t) => t.id === task.id);
    
    if (visibleIndex > -1 && visibleIndex < visibleSiblings.length - 1) {
      const swapTarget = visibleSiblings[visibleIndex + 1];

      const rawSiblings = tasks
        .filter(t => t.parent_id === task.parent_id)
        .sort((a, b) => a.position - b.position);

      const rawTaskIndex = rawSiblings.findIndex(t => t.id === task.id);
      
      const newRawSiblings = [...rawSiblings];
      const [removedTask] = newRawSiblings.splice(rawTaskIndex, 1);
      
      const adjustedTargetIndex = newRawSiblings.findIndex(t => t.id === swapTarget.id);
      
      newRawSiblings.splice(adjustedTargetIndex + 1, 0, removedTask);

      const tasksToUpdate = newRawSiblings.map((t, i) => ({ id: t.id, updates: { position: i } }));

      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          const update = tasksToUpdate.find((u) => u.id === t.id);
          return update ? { ...t, ...update.updates } : t;
        })
      );

      try {
        await Promise.all(
          tasksToUpdate.map((u) => {
            return supabase.from("tasks").update(u.updates).eq("id", u.id);
          })
        );
      } catch (err) {
        console.error("Failed to move task down", err);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (activeTask && overTask && activeTask.parent_id === overTask.parent_id) {
      const siblings = tasks
        .filter((t) => t.parent_id === activeTask.parent_id)
        .sort((a, b) => a.position - b.position);

      const oldIndex = siblings.findIndex((t) => t.id === active.id);
      const newIndex = siblings.findIndex((t) => t.id === over.id);

      const newSiblings = arrayMove(siblings, oldIndex, newIndex);
      const tasksToUpdate = newSiblings.map((t, i) => ({
        id: t.id,
        updates: { position: i },
      }));

      setTasks((prev) =>
        prev.map((t) => {
          const update = tasksToUpdate.find((u) => u.id === t.id);
          return update ? { ...t, ...update.updates } : t;
        })
      );

      try {
        await Promise.all(
          tasksToUpdate.map((u) => supabase.from("tasks").update(u.updates).eq("id", u.id))
        );
      } catch (err) {
        console.error("Failed to reorder tasks", err);
      }
    }
  };

  const toggleMobileCollapse = () => {
    if (type === 'routine') setMobileRoutineCollapsed(!mobileRoutineCollapsed);
    else setMobileTasksCollapsed(!mobileTasksCollapsed);
  };

  const renderContent = () => {
    return (
      <div className={`px-3 md:px-5 py-3 md:py-4 min-h-[60px] ${isCollapsedMobile ? 'hidden md:block' : 'block'}`}>
        {isLoading && tasks.length === 0 ? (
          <div className="space-y-3 py-2 px-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-[5px] bg-[#ebe8e2] dark:bg-[#333] animate-pulse" />
                <div className="h-3 bg-[#ebe8e2] dark:bg-[#333] rounded-full animate-pulse w-full" />
              </div>
            ))}
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-2xl opacity-20 dark:opacity-10 select-none text-[#3d3b33] dark:text-white">
              ✦
            </span>
            <p className="text-[12px] text-[#c4c0b8] dark:text-[#555] tracking-wide uppercase font-bold">
              {viewMode === 'archive' ? 'No Completed Records' : viewMode === 'trash' ? 'Trash is Empty' : 'Clear Space'}
            </p>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {viewMode === "focus" ? (
              <SortableContext items={displayTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {displayTasks.map((t) => (
                  <RecursiveCheckbox
                    key={t.id}
                    task={t}
                    isEditMode={type === "normal" ? true : isEditMode}
                    viewMode={viewMode}
                    allTasks={tasks}
                    isFlatList={false}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onRestore={onRestore}
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
              </SortableContext>
            ) : (
              displayTasks.map((t) => (
                <RecursiveCheckbox
                  key={t.id}
                  task={t}
                  isEditMode={type === "normal" ? true : isEditMode}
                  viewMode={viewMode}
                  allTasks={tasks}
                  isFlatList={viewMode === 'trash' || (viewMode === 'archive' && archiveLayout === 'list')}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onAdd={onAdd}
                  onIndent={onIndent}
                  onUnindent={onUnindent}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  depth={0}
                  newTaskId={newTaskId}
                  setNewTaskId={setNewTaskId}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={sectionRef}
      className="relative flex flex-col bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-[0_2px_16px_rgba(44,43,39,0.05)] transition-all duration-300"
    >
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 md:pb-5 border-b border-[#f0ede8] dark:border-[#2a2a2a]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0] leading-none font-medium font-serif tracking-tight">
                {title}
              </h2>
              <button 
                onClick={toggleMobileCollapse}
                className="md:hidden p-1.5 -ml-1 text-[#b0ad9a] dark:text-[#7a7a7a] active:bg-gray-100 dark:active:bg-[#333] rounded-lg transition-colors"
                data-tooltip-id="task-tooltip" data-tooltip-content={isCollapsedMobile ? "Expand" : "Collapse"}
              >
                {isCollapsedMobile ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>
            
            {viewMode === "focus" && type === "routine" && totalTasksCount > 0 && (
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
          
          {viewMode === "focus" && (
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {type === "normal" && (
                <button
                  onClick={() => onAdd(null)}
                  className="flex w-8 h-8 md:w-9 md:h-9 items-center justify-center bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] rounded-full hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20 transition-all shadow-sm border border-[#e0ddd5] dark:border-[#333]"
                  data-tooltip-id="task-tooltip" data-tooltip-content="Add Task"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              )}
              
              {type === "routine" && isEditMode && (
                <button
                  onClick={() => onAdd(null)}
                  className="flex w-8 h-8 md:w-9 md:h-9 items-center justify-center bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] rounded-full hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20 transition-all shadow-sm border border-[#e0ddd5] dark:border-[#333]"
                  data-tooltip-id="task-tooltip" data-tooltip-content="Add Routine Item"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              )}

              {type === "routine" && (
                <button
                  onClick={() => {
                    const nextMode = !isEditMode;
                    setIsEditMode(nextMode);
                    if (nextMode && type === "routine" && mobileRoutineCollapsed) {
                      setMobileRoutineCollapsed(false);
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-[11px] font-[600] tracking-[0.08em] uppercase transition-all duration-200 shadow-sm border ${
                    isEditMode
                      ? "bg-[#c2956e] dark:bg-[#b0855f] text-white border-[#c2956e] dark:border-[#b0855f] shadow-md"
                      : "bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] border-[#e0ddd5] dark:border-[#333] hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20"
                  }`}
                >
                  {isEditMode ? (
                    <>
                      <CheckCircle2 size={14} className="md:w-[15px] md:h-[15px]" /> 
                      <span className="hidden sm:inline">Done</span>
                    </>
                  ) : (
                    <>
                      <Edit3 size={14} className="md:w-[15px] md:h-[15px]" /> 
                      <span className="hidden sm:inline">Edit</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {viewMode === "focus" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {renderContent()}
        </DndContext>
      ) : (
        renderContent()
      )}

    </div>
  );
}