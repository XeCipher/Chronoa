// frontend/components/tasks/TaskSection.tsx
"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types/app.types";
import RecursiveCheckbox from "../ui/RecursiveCheckbox";
import { Plus, Edit3, CheckCircle2, ChevronDown, ChevronUp, GripVertical, Check } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { flushSync } from "react-dom";

import {
  DndContext,
  DragOverlay,
  AutoScrollActivator,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

interface Props {
  type: "routine" | "normal";
  title: string;
  viewMode?: "focus" | "archive" | "trash";
  searchQuery?: string;
}

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

const findTaskNode = (nodes: Task[], id: string): Task | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findTaskNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const getNodeDepth = (allTasks: Task[], task: Task): number => {
  let depth = 0;
  let currentParentId = task.parent_id;
  while (currentParentId) {
    depth++;
    const parent = allTasks.find((t) => t.id === currentParentId);
    if (!parent) break;
    currentParentId = parent.parent_id;
  }
  return depth;
};

const countSubtasks = (node: Task): number => {
  if (!node.children || node.children.length === 0) return 0;
  let total = node.children.length;
  for (const child of node.children) {
    total += countSubtasks(child);
  }
  return total;
};

const OVERLAY_COLOR_STYLES: Record<string, string> = {
  none: "bg-white/95 dark:bg-[#1e1e1e]/95 ring-1 ring-[#c2956e]/40 dark:ring-[#b0855f]/50",
  rose: "bg-rose-50/95 dark:bg-rose-950/95 ring-1 ring-rose-300 dark:ring-rose-800",
  amber: "bg-amber-50/95 dark:bg-amber-950/95 ring-1 ring-amber-300 dark:ring-amber-800",
  emerald: "bg-emerald-50/95 dark:bg-emerald-950/95 ring-1 ring-emerald-300 dark:ring-emerald-800",
  blue: "bg-blue-50/95 dark:bg-blue-950/95 ring-1 ring-blue-300 dark:ring-blue-800",
  purple: "bg-purple-50/95 dark:bg-purple-950/95 ring-1 ring-purple-300 dark:ring-purple-800",
};

function TaskDragOverlay({ task, depth }: { task: Task; depth: number }) {
  const baseColor = task.color && task.color !== "none" ? task.color : "none";
  const colorClass = OVERLAY_COLOR_STYLES[baseColor] || OVERLAY_COLOR_STYLES.none;
  const titleSize = depth === 0 ? "text-[15px]" : depth === 1 ? "text-[13.5px]" : "text-[12.5px]";
  const titleWeight = depth === 0 ? "font-[500]" : "font-[400]";
  const checkboxSize = depth === 0 ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]";
  const checkboxRadius = depth === 0 ? "rounded-[5px]" : "rounded-[4px]";
  const subtaskCount = countSubtasks(task);

  return (
    <div
      className={`flex items-center gap-3 py-[7px] px-3 rounded-xl backdrop-blur-md shadow-[0_14px_34px_rgba(44,43,39,0.16)] dark:shadow-[0_14px_34px_rgba(0,0,0,0.65)] cursor-grabbing select-none ${colorClass}`}
    >
      <div className="p-2 md:p-1 -ml-3 md:-ml-2 -mr-1 md:mr-1 text-[#c2956e] dark:text-[#d1a784] shrink-0">
        <GripVertical size={14} />
      </div>

      <div
        className={`${checkboxSize} ${checkboxRadius} shrink-0 border flex items-center justify-center ${
          task.is_completed
            ? "bg-[#7ca982] dark:bg-[#6a9a70] border-[#7ca982]"
            : "border-[#d4d0c8] dark:border-[#555] bg-white dark:bg-[#1a1a1a]"
        }`}
      >
        {task.is_completed && <Check size={depth === 0 ? 10 : 9} strokeWidth={3} className="text-white" />}
      </div>

      <span
        className={`flex-1 min-w-0 py-0.5 break-words line-clamp-2 ${titleSize} ${titleWeight} ${
          task.is_completed ? "text-[#c4c0b8] dark:text-[#555] line-through" : "text-[#3d3b33] dark:text-[#e0e0e0]"
        }`}
      >
        {task.title}
      </span>

      {subtaskCount > 0 && (
        <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f7f5f0] dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] border border-[#e0ddd5] dark:border-[#3a3a3a]">
          {subtaskCount} {subtaskCount === 1 ? "subtask" : "subtasks"}
        </span>
      )}
    </div>
  );
}

export default function TaskSection({ type, title, viewMode = "focus", searchQuery = "" }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dropAnimEnabled, setDropAnimEnabled] = useState(true);

  const {
    taskArchiveDelay,
    moveCompletedToBottom,
    keepParentTaskAlive,
    addTaskAtTop,
    archiveLayout,
    archiveSort,
    mobileRoutineCollapsed,
    setMobileRoutineCollapsed,
    setActiveTaskIdWithMenu,
  } = useUiStore();

  const [now, setNow] = useState(Date.now());
  const sectionRef = useRef<HTMLDivElement>(null);

  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

  const isDraggingRef = useRef(false);

  // Mutation lock blocks stale replica database responses from glitching the UI during typing/toggling
  const lastMutateTime = useRef<number>(0);
  const markMutated = () => {
    lastMutateTime.current = Date.now();
  };

  // Scope keyboard drag strictly to siblings under the same parent so expanded children are skipped cleanly
  const siblingKeyboardCoordinates: KeyboardCoordinateGetter = useCallback((event, { currentCoordinates, context }) => {
    if (event.code !== "ArrowDown" && event.code !== "ArrowUp") {
      return undefined;
    }

    event.preventDefault();

    const { active, collisionRect, droppableContainers, droppableRects } = context;
    if (!active || !collisionRect) return undefined;

    const activeContainerId = active.data.current?.sortable?.containerId;
    const activeTask = tasksRef.current.find((t) => t.id === active.id);
    const activeParentId = activeTask ? activeTask.parent_id ?? null : null;

    const siblingRects = droppableContainers
      .getEnabled()
      .filter((container) => {
        if (activeContainerId && container.data.current?.sortable?.containerId) {
          return container.data.current.sortable.containerId === activeContainerId;
        }
        const containerTask = tasksRef.current.find((t) => t.id === container.id);
        return (containerTask ? containerTask.parent_id ?? null : null) === activeParentId;
      })
      .map((container) => ({
        id: container.id,
        rect: droppableRects.get(container.id),
      }))
      .filter((item): item is { id: UniqueIdentifier; rect: NonNullable<typeof item.rect> } => Boolean(item.rect))
      .sort((a, b) => a.rect.top - b.rect.top);

    if (siblingRects.length === 0) return undefined;

    const probeY = collisionRect.top + Math.min(20, collisionRect.height / 2);

    let currentIndex = siblingRects.findIndex(({ rect }) => probeY >= rect.top && probeY <= rect.bottom);

    if (currentIndex === -1) {
      let bestDist = Infinity;
      siblingRects.forEach(({ rect }, idx) => {
        const dist = Math.min(Math.abs(probeY - rect.top), Math.abs(probeY - rect.bottom));
        if (dist < bestDist) {
          bestDist = dist;
          currentIndex = idx;
        }
      });
    }

    if (currentIndex === -1) return undefined;

    const targetIndex =
      event.code === "ArrowDown"
        ? Math.min(siblingRects.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    if (targetIndex === currentIndex) return undefined;

    const targetRect = siblingRects[targetIndex].rect;
    const deltaY = targetRect.top - collisionRect.top;

    return {
      x: currentCoordinates.x,
      y: currentCoordinates.y + deltaY,
    };
  }, []);

  // Only match siblings sharing the same parent_id, using pointer Y against vertical spans so tall expanded parents work cleanly
  const siblingCollisionDetection: CollisionDetection = useCallback(
    ({ active, collisionRect, droppableRects, droppableContainers, pointerCoordinates }) => {
      const activeContainerId = active.data.current?.sortable?.containerId;
      const activeTask = tasksRef.current.find((t) => t.id === active.id);
      const activeParentId = activeTask ? activeTask.parent_id ?? null : null;

      const siblingContainers = droppableContainers.filter((container) => {
        if (activeContainerId && container.data.current?.sortable?.containerId) {
          return container.data.current.sortable.containerId === activeContainerId;
        }
        const containerTask = tasksRef.current.find((t) => t.id === container.id);
        return (containerTask ? containerTask.parent_id ?? null : null) === activeParentId;
      });

      const probeY = pointerCoordinates
        ? pointerCoordinates.y
        : collisionRect.top + Math.min(20, collisionRect.height / 2);

      const collisions: {
        id: UniqueIdentifier;
        dist: number;
        centerDist: number;
        data: Record<string, unknown>;
      }[] = [];

      for (const container of siblingContainers) {
        const rect = droppableRects.get(container.id);
        if (!rect) continue;

        let dist = 0;
        if (probeY < rect.top) {
          dist = rect.top - probeY;
        } else if (probeY > rect.bottom) {
          dist = probeY - rect.bottom;
        }

        const centerY = rect.top + rect.height / 2;
        const centerDist = Math.abs(probeY - centerY);

        collisions.push({
          id: container.id,
          dist,
          centerDist,
          data: { droppableContainer: container, value: dist },
        });
      }

      collisions.sort((a, b) => a.dist - b.dist || a.centerDist - b.centerDist);
      return collisions.map(({ id, data }) => ({ id, data }));
    },
    []
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: siblingKeyboardCoordinates,
    })
  );

  const isCollapsedMobile = type === "routine" ? mobileRoutineCollapsed : false;
  const delayMs = taskArchiveDelay <= 0 ? 1000 : taskArchiveDelay * 60 * 1000;

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTasks = async (isBackgroundSync = false) => {
    if (isBackgroundSync && (isDraggingRef.current || Date.now() - lastMutateTime.current < 2500)) {
      return;
    }

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("task_type", type)
      .order("position", { ascending: true });

    if (data) {
      setTasks((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
    }
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

    fetchTasks(false);

    const channelId = `rt_${type}_${Math.random().toString(36).substring(7)}`;
    let timeoutId: NodeJS.Timeout;

    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fetchTasks(true), 400);
      })
      .subscribe();

    const handleRefetch = () => {
      lastMutateTime.current = 0;
      fetchTasks(false);
    };
    window.addEventListener("chronoa-tasks-refetch", handleRefetch);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeoutId);
      window.removeEventListener("chronoa-tasks-refetch", handleRefetch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Only tick the 1s clock while there is at least one completed task waiting to vanish
  const hasPendingAutoArchive = useMemo(() => {
    if (viewMode !== "focus" || isEditMode || taskArchiveDelay < 0) return false;
    const current = Date.now();
    return tasks.some(
      (t) =>
        t.deleted_at === null &&
        t.is_completed &&
        t.completed_at &&
        current - new Date(t.completed_at).getTime() < delayMs + 2000
    );
  }, [tasks, viewMode, isEditMode, taskArchiveDelay, delayMs]);

  useEffect(() => {
    if (!hasPendingAutoArchive) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasPendingAutoArchive]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`chronoa_cache_tasks_${type}`, JSON.stringify(tasks));
    }
  }, [tasks, isLoading, type]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".context-menu-portal")) return;

      if (isEditMode && type === "routine" && sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setIsEditMode(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditMode, type]);

  const onAddRef = useRef<(parentId: string | null, relativeToTask?: Task) => Promise<void>>(() =>
    Promise.resolve()
  );

  useEffect(() => {
    if (type !== "normal") return;
    const handleGlobalAdd = () => onAddRef.current(null);
    window.addEventListener("chronoa-add-task", handleGlobalAdd);
    return () => window.removeEventListener("chronoa-add-task", handleGlobalAdd);
  }, [type]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

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

    const isFlatList = viewMode === "trash" || (viewMode === "archive" && archiveLayout === "list");
    if (isFlatList) {
      const list = tasks.filter((t) => {
        const modeMatch = viewMode === "trash" ? t.deleted_at !== null : t.deleted_at === null && t.is_completed;
        return modeMatch && matchesSearch(t);
      });

      list.sort((a, b) => {
        const timeA = new Date(viewMode === "trash" ? a.deleted_at! : a.completed_at!).getTime();
        const timeB = new Date(viewMode === "trash" ? b.deleted_at! : b.completed_at!).getTime();
        return viewMode === "trash" || archiveSort === "newest" ? timeB - timeA : timeA - timeB;
      });
      return list;
    }

    // Prune first strictly by viewMode visibility so sibling branches stay intact
    const pruneByMode = (node: Task): boolean => {
      if (node.children) node.children = node.children.filter((c) => pruneByMode(c));

      const hasVisibleChildren = (node.children && node.children.length > 0) || false;

      const selfMatchesMode =
        viewMode === "archive"
          ? node.deleted_at === null && node.is_completed
          : node.deleted_at === null &&
            (!node.is_completed ||
              isEditMode ||
              taskArchiveDelay < 0 ||
              (node.completed_at && now - new Date(node.completed_at).getTime() < delayMs));

      return Boolean(selfMatchesMode || hasVisibleChildren);
    };

    // When searching, retain the complete parent tree (including siblings) whenever any node matches
    const hasSearchMatchInTree = (node: Task): boolean => {
      if (matchesSearch(node)) return true;
      return Boolean(node.children && node.children.some((c) => hasSearchMatchInTree(c)));
    };

    const tree = roots.filter((r) => {
      if (!pruneByMode(r)) return false;
      return !searchQuery.trim() || hasSearchMatchInTree(r);
    });

    const sort = (nodes: Task[]) => {
      nodes.sort((a, b) => {
        if (viewMode === "archive") {
          const timeA = new Date(a.completed_at || a.created_at).getTime();
          const timeB = new Date(b.completed_at || b.created_at).getTime();
          return archiveSort === "newest" ? timeB - timeA : timeA - timeB;
        }
        if (moveCompletedToBottom && !isEditMode) {
          if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        }
        return a.position - b.position;
      });
      nodes.forEach((n) => {
        if (n.children) sort(n.children);
      });
      return nodes;
    };

    return sort(tree);
  }, [tasks, viewMode, archiveLayout, archiveSort, searchQuery, isEditMode, now, delayMs, taskArchiveDelay, moveCompletedToBottom]);

  const flattenedVisibleTasks: Task[] = [];
  const gatherVisible = (nodes: Task[]) => {
    nodes.forEach((n) => {
      flattenedVisibleTasks.push(n);
      if (n.children) gatherVisible(n.children);
    });
  };
  if (viewMode === "focus") gatherVisible(displayTasks);

  const baseTasksForProgress = type === "routine" ? tasks.filter((t) => t.deleted_at === null) : flattenedVisibleTasks;
  const totalTasksCount = baseTasksForProgress.length;
  const totalCompletedCount = baseTasksForProgress.filter((t) => t.is_completed).length;
  const progressPercent = totalTasksCount > 0 ? Math.round((totalCompletedCount / totalTasksCount) * 100) : 0;

  const activeDragTask = useMemo(
    () => (activeDragId ? findTaskNode(displayTasks, activeDragId) : null),
    [activeDragId, displayTasks]
  );

  const activeDragDepth = useMemo(
    () => (activeDragTask ? getNodeDepth(tasks, activeDragTask) : 0),
    [activeDragTask, tasks]
  );

  const onUpdate = async (id: string, updates: Partial<Task>) => {
    markMutated();
    const isToggling = updates.hasOwnProperty("is_completed");
    const isDone = updates.is_completed;
    const completionTime = isDone ? new Date().toISOString() : null;
    const tasksToUpdate: { id: string; updates: Partial<Task> }[] = [];

    if (isToggling) {
      const addChildrenToUpdate = (parentId: string) => {
        tasks
          .filter((t) => t.parent_id === parentId && t.deleted_at === null)
          .forEach((child) => {
            if (isDone) {
              if (!child.is_completed) {
                tasksToUpdate.push({
                  id: child.id,
                  updates: { is_completed: true, completed_at: completionTime },
                });
              }
              addChildrenToUpdate(child.id);
            } else {
              if (child.is_completed) {
                tasksToUpdate.push({
                  id: child.id,
                  updates: { is_completed: false, completed_at: null },
                });
              }
              addChildrenToUpdate(child.id);
            }
          });
      };
      addChildrenToUpdate(id);

      const checkParentStatus = (taskId: string, status: boolean) => {
        const currentTask = tasks.find((t) => t.id === taskId);
        if (!currentTask?.parent_id) return;

        const parentTask = tasks.find((t) => t.id === currentTask.parent_id);
        const shouldKeepAlive = keepParentTaskAlive || parentTask?.keep_alive;

        const siblings = tasks.filter(
          (t) => t.parent_id === currentTask.parent_id && t.id !== taskId && t.deleted_at === null
        );

        const allSiblingsChecked = siblings.every((s) => {
          const pendingUpdate = tasksToUpdate.find((u) => u.id === s.id);
          if (pendingUpdate && pendingUpdate.updates.is_completed !== undefined) {
            return pendingUpdate.updates.is_completed;
          }
          return s.is_completed;
        });

        if (status && allSiblingsChecked && !shouldKeepAlive) {
          tasksToUpdate.push({
            id: currentTask.parent_id,
            updates: { is_completed: true, completed_at: completionTime },
          });
          checkParentStatus(currentTask.parent_id, true);
        } else if (!status) {
          if (!tasksToUpdate.some((u) => u.id === currentTask.parent_id)) {
            tasksToUpdate.push({
              id: currentTask.parent_id,
              updates: { is_completed: false, completed_at: null },
            });
            checkParentStatus(currentTask.parent_id, false);
          }
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
        ...tasksToUpdate.map((bulk) => supabase.from("tasks").update(bulk.updates).eq("id", bulk.id)),
      ]);
    } catch (err) {
      console.error("Failed to sync updates to database", err);
    }
  };

  const onToggleCollapseAll = async (task: Task, collapsed: boolean) => {
    markMutated();
    const idsToUpdate: string[] = [task.id];

    const collectNestedParents = (node: Task) => {
      if (!node.children) return;
      node.children.forEach((child) => {
        if (child.children && child.children.length > 0) {
          idsToUpdate.push(child.id);
          collectNestedParents(child);
        }
      });
    };
    collectNestedParents(task);

    if (viewMode === "focus") {
      setTasks((prev) => prev.map((t) => (idsToUpdate.includes(t.id) ? { ...t, is_collapsed: collapsed } : t)));
      try {
        await supabase.from("tasks").update({ is_collapsed: collapsed }).in("id", idsToUpdate);
      } catch (err) {
        console.error("Failed to toggle collapse all", err);
      }
    } else {
      const stored = localStorage.getItem("chronoa_archive_collapsed");
      const parsed = stored ? JSON.parse(stored) : {};
      idsToUpdate.forEach((id) => {
        parsed[id] = collapsed;
      });
      localStorage.setItem("chronoa_archive_collapsed", JSON.stringify(parsed));
      window.dispatchEvent(new CustomEvent("chronoa-archive-collapse-sync", { detail: parsed }));
    }
  };

  const onAdd = async (parentId: string | null = null, relativeToTask?: Task) => {
    markMutated();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (type === "routine" && mobileRoutineCollapsed) setMobileRoutineCollapsed(false);

    const ancestorsToUpdate: string[] = [];
    if (parentId) {
      let currentId: string | null = parentId;
      while (currentId) {
        const p = tasks.find((t) => t.id === currentId);
        if (p) {
          ancestorsToUpdate.push(p.id);
          currentId = p.parent_id;
        } else {
          break;
        }
      }
    }

    let newPosition = 0;
    const shiftUpdates: { id: string; updates: Partial<Task> }[] = [];

    if (relativeToTask) {
      newPosition = relativeToTask.position + 1;
      tasks
        .filter((t) => t.parent_id === parentId && t.position >= newPosition)
        .forEach((t) => shiftUpdates.push({ id: t.id, updates: { position: t.position + 1 } }));
    } else {
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
      children: [],
    };

    flushSync(() => {
      setTasks((prev) => {
        const updatedList = prev.map((t) => {
          const shift = shiftUpdates.find((s) => s.id === t.id);
          let nextT = shift ? { ...t, ...shift.updates } : t;

          if (t.id === parentId) {
            nextT = { ...nextT, is_collapsed: false, is_completed: false, completed_at: null };
          } else if (ancestorsToUpdate.includes(t.id)) {
            nextT = { ...nextT, is_completed: false, completed_at: null };
          }
          return nextT;
        });
        return [...updatedList, tempTask];
      });
      setNewTaskId(newId);
    });

    const promises: any[] = [
      supabase.from("tasks").insert({
        id: newId,
        user_id: user.id,
        title: "New Item",
        task_type: type,
        parent_id: parentId,
        position: newPosition,
      }),
      ...shiftUpdates.map((u) => supabase.from("tasks").update(u.updates).eq("id", u.id)),
    ];

    if (parentId) {
      promises.push(
        supabase
          .from("tasks")
          .update({ is_collapsed: false, is_completed: false, completed_at: null })
          .eq("id", parentId)
      );
      const otherAncestors = ancestorsToUpdate.filter((id) => id !== parentId);
      if (otherAncestors.length > 0) {
        promises.push(
          supabase.from("tasks").update({ is_completed: false, completed_at: null }).in("id", otherAncestors)
        );
      }
    }

    const results = await Promise.all(promises);

    const error = results.find((r) => r.error);
    if (error) {
      console.error("Failed adding task or shifting siblings", error);
      fetchTasks(true);
    }
  };

  useEffect(() => {
    onAddRef.current = onAdd;
  }, [onAdd]);

  const onDelete = async (id: string, isPermanent: boolean = false) => {
    markMutated();
    const taskToDelete = tasks.find((t) => t.id === id);
    const parentId = taskToDelete?.parent_id;

    const idsToDelete = [id];
    const findChildren = (pId: string) => {
      tasks
        .filter((t) => t.parent_id === pId)
        .forEach((child) => {
          idsToDelete.push(child.id);
          findChildren(child.id);
        });
    };
    findChildren(id);

    const tasksToUpdate: { id: string; updates: Partial<Task> }[] = [];
    const completionTime = new Date().toISOString();

    if (parentId) {
      const checkParentStatusAfterDelete = (currentParentId: string) => {
        const parentTask = tasks.find((t) => t.id === currentParentId);
        if (!parentTask || parentTask.is_completed) return;

        const shouldKeepAlive = keepParentTaskAlive || parentTask.keep_alive;

        const remainingSiblings = tasks.filter(
          (t) => t.parent_id === currentParentId && !idsToDelete.includes(t.id) && t.deleted_at === null
        );

        if (remainingSiblings.length > 0 && remainingSiblings.every((s) => s.is_completed) && !shouldKeepAlive) {
          tasksToUpdate.push({
            id: currentParentId,
            updates: { is_completed: true, completed_at: completionTime },
          });
          if (parentTask.parent_id) {
            checkParentStatusAfterDelete(parentTask.parent_id);
          }
        }
      };
      checkParentStatusAfterDelete(parentId);
    }

    if (isPermanent) {
      setTasks((prev) =>
        prev
          .filter((t) => !idsToDelete.includes(t.id))
          .map((t) => {
            const u = tasksToUpdate.find((x) => x.id === t.id);
            return u ? { ...t, ...u.updates } : t;
          })
      );
      try {
        const promises: any[] = [supabase.from("tasks").delete().in("id", idsToDelete)];
        tasksToUpdate.forEach((u) => promises.push(supabase.from("tasks").update(u.updates).eq("id", u.id)));
        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to delete tasks permanently", err);
      }
    } else {
      const deletedTime = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) => {
          if (idsToDelete.includes(t.id)) return { ...t, deleted_at: deletedTime };
          const u = tasksToUpdate.find((x) => x.id === t.id);
          if (u) return { ...t, ...u.updates };
          return t;
        })
      );
      try {
        const promises: any[] = [supabase.from("tasks").update({ deleted_at: deletedTime }).in("id", idsToDelete)];
        tasksToUpdate.forEach((u) => promises.push(supabase.from("tasks").update(u.updates).eq("id", u.id)));
        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to move tasks to trash", err);
      }
    }
  };

  const onRestore = async (id: string, mode: "from_trash" | "from_archive") => {
    markMutated();
    const idsToUpdate = [id];

    const findChildren = (parentId: string) => {
      tasks
        .filter((t) => t.parent_id === parentId)
        .forEach((child) => {
          if (!idsToUpdate.includes(child.id)) {
            idsToUpdate.push(child.id);
          }
          findChildren(child.id);
        });
    };
    findChildren(id);

    let current = tasks.find((t) => t.id === id);
    while (current && current.parent_id) {
      const parent = tasks.find((t) => t.id === current!.parent_id);
      if (parent) {
        if (!idsToUpdate.includes(parent.id)) idsToUpdate.push(parent.id);
        current = parent;
      } else break;
    }

    if (mode === "from_trash") {
      setTasks((prev) => prev.map((t) => (idsToUpdate.includes(t.id) ? { ...t, deleted_at: null } : t)));
      await supabase.from("tasks").update({ deleted_at: null }).in("id", idsToUpdate);
    } else if (mode === "from_archive") {
      setTasks((prev) =>
        prev.map((t) => (idsToUpdate.includes(t.id) ? { ...t, is_completed: false, completed_at: null } : t))
      );
      await supabase.from("tasks").update({ is_completed: false, completed_at: null }).in("id", idsToUpdate);
    }
  };

  const onIndent = async (task: Task) => {
    markMutated();

    const visibleSiblings = tasks
      .filter(
        (t) =>
          t.parent_id === task.parent_id &&
          t.deleted_at === null &&
          (!t.is_completed ||
            isEditMode ||
            taskArchiveDelay < 0 ||
            (t.completed_at && now - new Date(t.completed_at).getTime() < delayMs))
      )
      .sort((a, b) => {
        if (moveCompletedToBottom && !isEditMode) {
          if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        }
        return a.position - b.position;
      });

    const index = visibleSiblings.findIndex((t) => t.id === task.id);

    if (index > 0) {
      const previousSibling = visibleSiblings[index - 1];
      const newParentId = previousSibling.id;

      const newSiblings = tasks.filter((t) => t.parent_id === newParentId);
      const newPosition = newSiblings.length > 0 ? Math.max(...newSiblings.map((t) => t.position)) + 1 : 0;

      const ancestorsToUpdate: string[] = [];
      if (!task.is_completed) {
        let currentId: string | null = newParentId;
        while (currentId) {
          const p = tasks.find((t) => t.id === currentId);
          if (p) {
            ancestorsToUpdate.push(p.id);
            currentId = p.parent_id;
          } else break;
        }
      }

      setTasks((prev) =>
        prev.map((t) => {
          let updatedT = t;
          if (t.id === task.id) {
            updatedT = { ...updatedT, parent_id: newParentId, position: newPosition };
          }
          if (ancestorsToUpdate.includes(t.id)) {
            updatedT = { ...updatedT, is_completed: false, completed_at: null, is_collapsed: false };
          }
          return updatedT;
        })
      );

      try {
        const promises = [
          supabase.from("tasks").update({ parent_id: newParentId, position: newPosition }).eq("id", task.id),
        ];
        if (ancestorsToUpdate.length > 0) {
          promises.push(
            supabase
              .from("tasks")
              .update({ is_completed: false, completed_at: null, is_collapsed: false })
              .in("id", ancestorsToUpdate)
          );
        }
        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to indent task", err);
      }
    }
  };

  const onUnindent = async (task: Task) => {
    markMutated();
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

    const ancestorsToUpdate: string[] = [];
    if (!task.is_completed && newParentId) {
      let currentId: string | null = newParentId;
      while (currentId) {
        const p = tasks.find((t) => t.id === currentId);
        if (p) {
          ancestorsToUpdate.push(p.id);
          currentId = p.parent_id;
        } else break;
      }
    }

    setTasks((prev) =>
      prev.map((t) => {
        const update = tasksToUpdate.find((u) => u.id === t.id);
        let updatedT = update ? ({ ...t, ...update.updates } as Task) : t;
        if (ancestorsToUpdate.includes(t.id)) {
          updatedT = { ...updatedT, is_completed: false, completed_at: null, is_collapsed: false };
        }
        return updatedT;
      })
    );

    try {
      const promises = tasksToUpdate.map((update) =>
        supabase.from("tasks").update(update.updates).eq("id", update.id)
      );
      if (ancestorsToUpdate.length > 0) {
        promises.push(
          supabase
            .from("tasks")
            .update({ is_completed: false, completed_at: null, is_collapsed: false })
            .in("id", ancestorsToUpdate)
        );
      }
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to unindent task", err);
    }
  };

  const onMoveUp = async (task: Task) => {
    markMutated();
    const visibleSiblings = tasks
      .filter(
        (t) =>
          t.parent_id === task.parent_id &&
          t.deleted_at === null &&
          (!t.is_completed ||
            isEditMode ||
            taskArchiveDelay < 0 ||
            (t.completed_at && now - new Date(t.completed_at).getTime() < delayMs))
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

      const rawSiblings = tasks.filter((t) => t.parent_id === task.parent_id).sort((a, b) => a.position - b.position);

      const rawTaskIndex = rawSiblings.findIndex((t) => t.id === task.id);

      const newRawSiblings = [...rawSiblings];
      const [removedTask] = newRawSiblings.splice(rawTaskIndex, 1);

      const adjustedTargetIndex = newRawSiblings.findIndex((t) => t.id === swapTarget.id);

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
    markMutated();
    const visibleSiblings = tasks
      .filter(
        (t) =>
          t.parent_id === task.parent_id &&
          t.deleted_at === null &&
          (!t.is_completed ||
            isEditMode ||
            taskArchiveDelay < 0 ||
            (t.completed_at && now - new Date(t.completed_at).getTime() < delayMs))
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

      const rawSiblings = tasks.filter((t) => t.parent_id === task.parent_id).sort((a, b) => a.position - b.position);

      const rawTaskIndex = rawSiblings.findIndex((t) => t.id === task.id);

      const newRawSiblings = [...rawSiblings];
      const [removedTask] = newRawSiblings.splice(rawTaskIndex, 1);

      const adjustedTargetIndex = newRawSiblings.findIndex((t) => t.id === swapTarget.id);

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

  const handleDragStart = (event: DragStartEvent) => {
    markMutated();
    isDraggingRef.current = true;
    setActiveTaskIdWithMenu(null);

    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.classList.contains("task-input-field")
    ) {
      document.activeElement.blur();
    }

    const dragId = String(event.active.id);
    const draggedNode = findTaskNode(displayTasks, dragId);
    const hasExpandedChildren = Boolean(
      draggedNode && !draggedNode.is_collapsed && draggedNode.children && draggedNode.children.length > 0
    );

    setDropAnimEnabled(!hasExpandedChildren);
    setActiveDragId(dragId);

    if (typeof window !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    markMutated();
    isDraggingRef.current = false;
    setActiveDragId(null);

    if (typeof window !== "undefined") {
      document.body.style.overflow = "";
    }

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

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const newSiblings = arrayMove(siblings, oldIndex, newIndex);
      const positionUpdates = new Map<string, number>();
      const changedUpdates: { id: string; position: number }[] = [];

      newSiblings.forEach((t, i) => {
        positionUpdates.set(t.id, i);
        if (t.position !== i) {
          changedUpdates.push({ id: t.id, position: i });
        }
      });

      if (changedUpdates.length === 0) return;

      setTasks((prev) =>
        prev.map((t) => {
          const nextPos = positionUpdates.get(t.id);
          return nextPos !== undefined ? { ...t, position: nextPos } : t;
        })
      );

      try {
        await Promise.all(
          changedUpdates.map((u) => supabase.from("tasks").update({ position: u.position }).eq("id", u.id))
        );
      } catch (err) {
        console.error("Failed to reorder tasks", err);
      }
    }
  };

  const handleDragCancel = () => {
    isDraggingRef.current = false;
    setActiveDragId(null);
    if (typeof window !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  const toggleMobileCollapse = () => {
    if (type === "routine") setMobileRoutineCollapsed(!mobileRoutineCollapsed);
  };

  const getEmptyMessage = () => {
    if (viewMode === "archive") return "No Completed Records";
    if (viewMode === "trash") return "Trash is Empty";
    if (type === "routine") {
      if (tasks.length === 0) return "Add habits or daily tasks to start tracking your routine.";
      return "You're doing great!";
    }
    return "Clear Space";
  };

  const renderContent = () => {
    return (
      <div
        className={`px-3 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4 min-h-[60px] flex-1 flex flex-col ${
          isCollapsedMobile ? "hidden md:flex" : "flex"
        }`}
      >
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
          <div className="flex flex-col flex-1 items-center justify-center py-10 gap-2 px-4 text-center">
            <span className="text-2xl opacity-20 dark:opacity-10 select-none text-[#3d3b33] dark:text-white">✦</span>
            <p className="text-[12px] text-[#c4c0b8] dark:text-[#555] tracking-wide uppercase font-bold leading-relaxed">
              {getEmptyMessage()}
            </p>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {viewMode === "focus" ? (
              <SortableContext
                id="sortable-root"
                items={displayTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
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
                    onToggleCollapseAll={onToggleCollapseAll}
                    depth={0}
                    newTaskId={newTaskId}
                    setNewTaskId={setNewTaskId}
                    searchQuery={searchQuery}
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
                  isFlatList={viewMode === "trash" || (viewMode === "archive" && archiveLayout === "list")}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onAdd={onAdd}
                  onIndent={onIndent}
                  onUnindent={onUnindent}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onToggleCollapseAll={onToggleCollapseAll}
                  depth={0}
                  newTaskId={newTaskId}
                  setNewTaskId={setNewTaskId}
                  searchQuery={searchQuery}
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
      className="relative flex flex-col h-full bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-[0_2px_16px_rgba(44,43,39,0.05)] transition-all duration-300"
    >
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 md:pb-5 border-b border-[#f0ede8] dark:border-[#2a2a2a] shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2">
              <h2
                className="text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0] leading-none font-medium font-serif tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => document.getElementById("tasks-scroll-container")?.scrollTo({ top: 0, behavior: "smooth" })}
              >
                {title}
              </h2>
              {type === "routine" && (
                <button
                  onClick={toggleMobileCollapse}
                  className="md:hidden p-1.5 -ml-1 text-[#b0ad9a] dark:text-[#7a7a7a] active:bg-gray-100 dark:active:bg-[#333] rounded-lg transition-colors"
                  data-tooltip-id="task-tooltip"
                  data-tooltip-content={isCollapsedMobile ? "Expand" : "Collapse"}
                >
                  {isCollapsedMobile ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              )}
            </div>

            {viewMode === "focus" && (
              <div className="flex items-center gap-2 shrink-0 h-8 md:h-9">
                {type === "normal" && (
                  <button
                    onClick={() => onAdd(null)}
                    className="flex w-8 h-8 md:w-9 md:h-9 items-center justify-center bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] rounded-full hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20 transition-all shadow-sm border border-[#e0ddd5] dark:border-[#333]"
                    data-tooltip-id="task-tooltip"
                    data-tooltip-content="Add Task"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                )}

                {type === "routine" && isEditMode && (
                  <button
                    onClick={() => onAdd(null)}
                    className="flex w-8 h-8 md:w-9 md:h-9 items-center justify-center bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] rounded-full hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20 transition-all shadow-sm border border-[#e0ddd5] dark:border-[#333]"
                    data-tooltip-id="task-tooltip"
                    data-tooltip-content="Add Routine Item"
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
                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 h-8 md:h-9 rounded-full text-[10px] md:text-[11px] font-[600] tracking-[0.08em] uppercase transition-all duration-200 shadow-sm border ${
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

          {viewMode === "focus" && type === "routine" && totalTasksCount > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 md:w-28 h-[3px] bg-[#ebe8e2] dark:bg-[#333] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7ca982] dark:bg-[#6a9a70] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] tracking-wide">{progressPercent}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {viewMode === "focus" ? (
          <DndContext
            id={`tasks-dnd-${type}`}
            sensors={sensors}
            collisionDetection={siblingCollisionDetection}
            modifiers={[restrictToVerticalAxis]}
            autoScroll={{ activator: AutoScrollActivator.Pointer }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {renderContent()}
            {mounted &&
              createPortal(
                <DragOverlay
                  dropAnimation={
                    dropAnimEnabled
                      ? {
                          duration: 180,
                          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                          sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                              active: {
                                opacity: "0",
                              },
                            },
                          }),
                        }
                      : null
                  }
                  style={{ height: "auto" }}
                  zIndex={1000}
                >
                  {activeDragTask ? <TaskDragOverlay task={activeDragTask} depth={activeDragDepth} /> : null}
                </DragOverlay>,
                document.body
              )}
          </DndContext>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}