// frontend/components/ui/RecursiveCheckbox.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Task } from "@/types/app.types";
import { 
  Plus, Trash2, Check, Timer, Hourglass, ChevronRight, ChevronLeft, 
  MoreVertical, ArrowUp, ArrowDown, ChevronDown, Infinity as InfinityIcon, 
  RotateCcw, Clock, GripVertical, CornerDownRight, CalendarDays
} from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useTimerStore } from "@/store/timerStore";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  task: Task;
  isEditMode: boolean;
  viewMode: 'focus' | 'archive' | 'trash';
  allTasks: Task[];
  isFlatList?: boolean;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string, isPermanent: boolean) => void;
  onRestore: (id: string, mode: 'from_trash' | 'from_archive') => void;
  onAdd: (parentId: string | null, relativeToTask?: Task) => void;
  onIndent: (task: Task) => void;
  onUnindent: (task: Task) => void;
  onMoveUp: (task: Task) => void;
  onMoveDown: (task: Task) => void;
  depth?: number;
  newTaskId: string | null;
  setNewTaskId: (id: string | null) => void;
  searchQuery?: string;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getDescendantCount = (n: Task): number => {
  let count = 0;
  if (n.children) {
      count += n.children.length;
      n.children.forEach(c => count += getDescendantCount(c));
  }
  return count;
};

const hasSearchMatchInDescendants = (n: Task, query: string): boolean => {
  if (!query || !n.children) return false;
  const q = query.toLowerCase();
  return n.children.some(c => 
      c.title.toLowerCase().includes(q) || hasSearchMatchInDescendants(c, query)
  );
};

export default function RecursiveCheckbox({ 
  task, isEditMode, viewMode, allTasks, isFlatList, onUpdate, onDelete, onRestore, onAdd, onIndent, onUnindent, 
  onMoveUp, onMoveDown, depth = 0, newTaskId, setNewTaskId, searchQuery = ""
}: Props) {
  const router = useRouter();
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { taskArchiveDelay, activeTaskIdWithMenu, setActiveTaskIdWithMenu, disabledHotkeys } = useUiStore();
  const { addInstance, setTitle: setTimerTitle, setActiveTab, setForceShowWidgets } = useTimerStore();

  const [initialTitle] = useState(task.title);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  const [optimisticCollapsed, setOptimisticCollapsed] = useState<boolean | null>(null);
  
  const [localCollapsed, setLocalCollapsed] = useState<boolean>(() => {
    return getDescendantCount(task) > 5;
  });

  useEffect(() => {
    setMounted(true);
    if (viewMode !== 'focus') {
      const stored = localStorage.getItem('chronoa_archive_collapsed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[task.id] !== undefined) {
          setLocalCollapsed(parsed[task.id]);
        }
      }
    }
  }, [task.id, viewMode]);

  useEffect(() => {
    if (optimisticCollapsed === task.is_collapsed) {
       setOptimisticCollapsed(null);
    }
  }, [task.is_collapsed, optimisticCollapsed]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id,
    disabled: viewMode !== 'focus' 
  });
  
  const sortableStyle = {
    transform: CSS.Translate.toString(transform), 
    transition,
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" as const : undefined,
  };

  const isRoutine = task.task_type === 'routine';
  const isNormal = task.task_type === 'normal';
  
  const disableMenu = task.is_completed && (isNormal || (isRoutine && !isEditMode));

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!isExpanded) {
         setIsOverflowing(el.scrollHeight > el.clientHeight);
      } else {
         const computedLineHeight = window.getComputedStyle(el).lineHeight;
         const lineHeight = computedLineHeight === 'normal' ? 22 : parseFloat(computedLineHeight) || 22; 
         const maxHeight = lineHeight * 10; 
         setIsOverflowing(el.scrollHeight > maxHeight + 5);
      }
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isExpanded, task.title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as Element).closest?.('.context-menu-portal')) return;
      
      if (activeTaskIdWithMenu !== task.id) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (target.closest('.menu-toggle-btn') || target.closest('.context-menu-portal')) return;
        setActiveTaskIdWithMenu(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTaskIdWithMenu, task.id, setActiveTaskIdWithMenu]);

  useEffect(() => {
    if (activeTaskIdWithMenu !== task.id) return;
    const handleScroll = (e: Event) => {
      if ((e.target as HTMLElement).closest('.context-menu-portal')) return;
      setActiveTaskIdWithMenu(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeTaskIdWithMenu, task.id, setActiveTaskIdWithMenu]);

  useEffect(() => {
    if (newTaskId === task.id) {
      setTimeout(() => {
        const el = textRef.current;
        if (el) {
          el.focus();
          if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        }
        setNewTaskId(null);
      }, 100); 
    }
  }, [newTaskId, task.id, setNewTaskId]);

  useEffect(() => {
    if (textRef.current && document.activeElement !== textRef.current) {
      if (textRef.current.textContent !== task.title) {
        textRef.current.textContent = task.title;
      }
    }
  }, [task.title]);

  const saveCurrentText = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (!textRef.current) return;
    
    let newTitle = textRef.current.textContent || '';
    if (!newTitle.trim()) {
      newTitle = "New Item";
      textRef.current.textContent = newTitle;
    } else {
      newTitle = newTitle.trim();
    }

    if (newTitle !== task.title) {
      onUpdate(task.id, { title: newTitle });
    }
  };

  const handleInput = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const newTitle = textRef.current?.textContent || '';
      if (newTitle.trim() && newTitle.trim() !== task.title) {
        onUpdate(task.id, { title: newTitle.trim() });
      }
    }, 1000);
  };

  const handleSendToFocus = (tab: 'timer' | 'stopwatch') => {
    saveCurrentText(); 
    const title = textRef.current?.textContent || task.title;
    const id = addInstance(tab, title);
    setTimerTitle(tab, id, title);
    setActiveTab(tab);
    setActiveTaskIdWithMenu(null);
    
    if (window.innerWidth >= 768) {
       useUiStore.getState().setGlobalTimeWidgetExpanded(true);
       setTimeout(() => {
          useUiStore.getState().setGlobalTimeWidgetExpanded(false);
       }, 4000);
    } else {
       setForceShowWidgets(true);
       router.push('/');
    }
  };

  const getPath = (t: Task) => {
    let path: string[] = [];
    let cur = t;
    while (cur.parent_id) {
       const p = allTasks.find(x => x.id === cur.parent_id);
       if (p) { path.unshift(p.title); cur = p; } else break;
    }
    return path.join(" > ");
  };

  const isVanishingNow = viewMode === 'focus' && taskArchiveDelay <= 0 && task.is_completed && !isEditMode;
  const isMenuOpen = activeTaskIdWithMenu === task.id;

  const showManagementActions = viewMode === 'focus' && (isNormal || (isRoutine && isEditMode));
  const showFocusOptions = viewMode === 'focus' && !(isRoutine && isEditMode);
  
  const hasChildren = task.children && task.children.length > 0;
  const showKeepAliveToggle = showManagementActions && hasChildren;

  const hasSearchMatch = hasSearchMatchInDescendants(task, searchQuery);
  
  let isCollapsed = false;
  if (hasSearchMatch) {
      isCollapsed = false;
  } else if (viewMode === 'focus') {
      isCollapsed = optimisticCollapsed !== null ? optimisticCollapsed : (task.is_collapsed ?? false);
  } else {
      isCollapsed = localCollapsed;
  }

  const titleSize = depth === 0 ? "text-[15px]" : depth === 1 ? "text-[13.5px]" : "text-[12.5px]";
  const titleWeight = depth === 0 ? "font-[500]" : "font-[400]";
  const checkboxSize = depth === 0 ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]";
  const checkboxRadius = depth === 0 ? "rounded-[5px]" : "rounded-[4px]";

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMenuOpen) {
      setActiveTaskIdWithMenu(null);
    } else {
      setMenuRect(e.currentTarget.getBoundingClientRect());
      setActiveTaskIdWithMenu(task.id);
    }
  };

  const availableColors = [
    { id: 'none', bg: 'bg-[#e0ddd5] dark:bg-[#555]' },
    { id: 'rose', bg: 'bg-rose-400 dark:bg-rose-500' },
    { id: 'amber', bg: 'bg-amber-400 dark:bg-amber-500' },
    { id: 'emerald', bg: 'bg-emerald-400 dark:bg-emerald-500' },
    { id: 'blue', bg: 'bg-blue-400 dark:bg-blue-500' },
    { id: 'purple', bg: 'bg-purple-400 dark:bg-purple-500' },
  ];

  const colorStyles: Record<string, string> = {
    none: isMenuOpen ? "bg-[#ebe8e2]/60 dark:bg-[#222]" : "md:hover:bg-[#ebe8e2]/60 md:dark:hover:bg-[#222]",
    rose: isMenuOpen ? "bg-rose-100 dark:bg-rose-900/40 ring-1 ring-rose-200 dark:ring-rose-800" : "bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-900 md:hover:bg-rose-100 md:dark:hover:bg-rose-900/40",
    amber: isMenuOpen ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-200 dark:ring-amber-800" : "bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-900 md:hover:bg-amber-100 md:dark:hover:bg-amber-900/40",
    emerald: isMenuOpen ? "bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-200 dark:ring-emerald-800" : "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-900 md:hover:bg-emerald-100 md:dark:hover:bg-emerald-900/40",
    blue: isMenuOpen ? "bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800" : "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-900 md:hover:bg-blue-100 md:dark:hover:bg-blue-900/40",
    purple: isMenuOpen ? "bg-purple-100 dark:bg-purple-900/40 ring-1 ring-purple-200 dark:ring-purple-800" : "bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-200 dark:ring-purple-900 md:hover:bg-purple-100 md:dark:hover:bg-purple-900/40"
  };

  const baseColor = task.color && task.color !== 'none' ? task.color : 'none';
  const activeColorStyle = colorStyles[baseColor];
  
  const allowTextEdit = viewMode === 'focus' && (isEditMode || isNormal);
  const daysLeft = task.deleted_at ? Math.max(0, Math.ceil(5 - (Date.now() - new Date(task.deleted_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const isStruckThrough = task.is_completed && viewMode !== 'archive';

  const getDescendantColors = (node: Task): string[] => {
    const colors = new Set<string>();
    const traverse = (n: Task) => {
      if (n.color && n.color !== 'none') colors.add(n.color);
      if (n.children) n.children.forEach(traverse);
    };
    if (node.children) node.children.forEach(traverse);
    return Array.from(colors);
  };
  const descendantColors = isCollapsed ? getDescendantColors(task) : [];

  const renderTitle = () => {
    if (!isExpanded && searchQuery) {
      const parts = initialTitle.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <span key={i} className="bg-[#c2956e]/40 dark:bg-[#b0855f]/50 text-[#3d3b33] dark:text-white rounded-[4px] px-[2px] font-semibold">{part}</span>
        ) : part
      );
    }
    return initialTitle;
  };

  const renderChildren = () => (
    task.children!.map((child) => (
      <RecursiveCheckbox 
        key={child.id} 
        task={child} 
        isEditMode={isEditMode} 
        viewMode={viewMode}
        allTasks={allTasks}
        isFlatList={isFlatList}
        onUpdate={onUpdate} 
        onDelete={onDelete} 
        onRestore={onRestore}
        onAdd={onAdd} 
        onIndent={onIndent} 
        onUnindent={onUnindent} 
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        depth={depth + 1} 
        newTaskId={newTaskId} 
        setNewTaskId={setNewTaskId} 
        searchQuery={searchQuery}
      />
    ))
  );

  const MenuItem = ({ icon: Icon, label, onClick, destructive = false }: any) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); setActiveTaskIdWithMenu(null); }}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-xs font-medium transition-colors md:hover:bg-[#f0ede8] md:dark:hover:bg-[#2a2a2a] ${destructive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-[#3d3b33] dark:text-[#e0e0e0]'}`}
    >
      <Icon size={14} className={destructive ? "text-red-500" : "text-[#888] dark:text-[#a0a0a0]"} />
      <span>{label}</span>
    </button>
  );

  const MenuDivider = () => <div className="h-px bg-[#e0ddd5] dark:bg-[#333] my-1 mx-2 shrink-0" />;

  const renderContextMenu = () => {
    if (!mounted || !isMenuOpen || !menuRect) return null;

    let top: number | string = menuRect.bottom + 8;
    let bottom: number | string = 'auto';

    if (menuRect.bottom > window.innerHeight / 2) {
        top = 'auto';
        bottom = window.innerHeight - menuRect.top + 8;
    }

    let left = menuRect.right - 180; 
    if (left < 16) left = 16;

    return createPortal(
      <div 
        className="context-menu-portal fixed z-[9999] bg-white/95 dark:bg-[#1c1c1c]/95 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] shadow-2xl rounded-2xl p-1.5 flex flex-col w-[180px] animate-fade-up overflow-y-auto no-scrollbar max-h-[70vh]"
        style={{ top, bottom, left }}
        onClick={(e) => e.stopPropagation()}
      >
        {viewMode === 'focus' && (
           <>
             {showFocusOptions && (
               <>
                 <MenuItem icon={CalendarDays} label="Add to Calendar" onClick={() => {
                   window.dispatchEvent(new CustomEvent('chronoa-add-to-calendar', { detail: { title: task.title } }));
                 }} />
                 <MenuItem icon={Hourglass} label="Send to Stopwatch" onClick={() => handleSendToFocus('stopwatch')} />
                 <MenuItem icon={Timer} label="Send to Timer" onClick={() => handleSendToFocus('timer')} />
               </>
             )}

             {showManagementActions && (
               <>
                 {showFocusOptions && <MenuDivider />}
                 <MenuItem icon={CornerDownRight} label="Add Subtask" onClick={() => onAdd(task.id)} />
                 
                 <MenuDivider />
                 <div className="flex items-center justify-between px-1.5 py-1">
                   <button onClick={(e) => { e.stopPropagation(); onMoveUp(task); setActiveTaskIdWithMenu(null); }} className="p-1.5 text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white rounded-lg md:hover:bg-[#f0ede8] md:dark:hover:bg-[#2a2a2a] transition-colors"><ArrowUp size={16} /></button>
                   <button onClick={(e) => { e.stopPropagation(); onMoveDown(task); setActiveTaskIdWithMenu(null); }} className="p-1.5 text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white rounded-lg md:hover:bg-[#f0ede8] md:dark:hover:bg-[#2a2a2a] transition-colors"><ArrowDown size={16} /></button>
                   <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-1 shrink-0" />
                   <button onClick={(e) => { e.stopPropagation(); onUnindent(task); setActiveTaskIdWithMenu(null); }} className="p-1.5 text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white rounded-lg md:hover:bg-[#f0ede8] md:dark:hover:bg-[#2a2a2a] transition-colors"><ChevronLeft size={16} /></button>
                   <button onClick={(e) => { e.stopPropagation(); onIndent(task); setActiveTaskIdWithMenu(null); }} className="p-1.5 text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white rounded-lg md:hover:bg-[#f0ede8] md:dark:hover:bg-[#2a2a2a] transition-colors"><ChevronRight size={16} /></button>
                 </div>
                 
                 {showKeepAliveToggle && (
                   <>
                     <MenuDivider />
                     <MenuItem icon={InfinityIcon} label={task.keep_alive ? "Disable Keep Alive" : "Keep Parent Alive"} onClick={() => onUpdate(task.id, { keep_alive: !task.keep_alive })} />
                   </>
                 )}
                 
                 <MenuDivider />
                 <div className="px-2 py-2 flex items-center justify-between">
                   {availableColors.map(c => (
                      <button
                         key={c.id}
                         onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { color: c.id === 'none' ? null : c.id }); setActiveTaskIdWithMenu(null); }}
                         className={`w-5 h-5 rounded-full ${c.bg} transition-all shrink-0 ${task.color === c.id || (!task.color && c.id === 'none') ? 'ring-[1.5px] ring-offset-2 ring-[#c2956e] dark:ring-offset-[#1c1c1c] scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                      />
                   ))}
                 </div>
                 
                 <MenuDivider />
                 <MenuItem icon={Trash2} label="Delete" destructive onClick={() => onDelete(task.id, false)} />
               </>
             )}
           </>
        )}

        {viewMode === 'archive' && (
           <>
             <MenuItem icon={RotateCcw} label="Restore to Focus" onClick={() => onRestore(task.id, 'from_archive')} />
             <MenuDivider />
             <MenuItem icon={Trash2} label="Move to Trash" destructive onClick={() => onDelete(task.id, false)} />
           </>
        )}

        {viewMode === 'trash' && (
           <>
             <MenuItem icon={RotateCcw} label="Restore from Trash" onClick={() => onRestore(task.id, 'from_trash')} />
             <MenuDivider />
             <MenuItem icon={Trash2} label="Delete Permanently" destructive onClick={() => onDelete(task.id, true)} />
           </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div ref={setNodeRef} style={sortableStyle} className={`flex flex-col w-full ${isVanishingNow ? "task-vanishing-soothing" : ""}`}>
      <div 
        ref={containerRef}
        className={`group relative flex items-center gap-3 py-[7px] px-3 rounded-xl transition-all duration-150 ${activeColorStyle} ${isMenuOpen ? "z-10" : ""}`}
      >
        
        {viewMode === 'focus' && (
          <div 
            {...attributes} 
            {...listeners} 
            className={`cursor-grab active:cursor-grabbing text-[#c4c0b8] dark:text-[#555] md:hover:text-[#c2956e] md:dark:hover:text-[#b0855f] p-1 -ml-2 -mr-1 md:mr-1 transition-opacity touch-none ${isDragging ? 'opacity-100' : 'opacity-30 md:opacity-0 md:group-hover:opacity-100'}`}
          >
            <GripVertical size={14} />
          </div>
        )}

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (viewMode === 'focus') onUpdate(task.id, { is_completed: !task.is_completed }); 
          }} 
          disabled={viewMode !== 'focus'}
          className={`${checkboxSize} ${checkboxRadius} shrink-0 border flex items-center justify-center transition-all duration-200 ${viewMode !== 'focus' ? 'cursor-default opacity-80' : 'cursor-pointer'} ${task.is_completed ? "bg-[#7ca982] dark:bg-[#6a9a70] border-[#7ca982] shadow-[0_0_0_3px_rgba(124,169,130,0.12)]" : "border-[#d4d0c8] dark:border-[#555] bg-white dark:bg-[#1a1a1a] md:hover:border-[#7ca982] md:hover:shadow-[0_0_0_3px_rgba(124,169,130,0.10)]"}`}
        >
          {task.is_completed && <Check size={depth === 0 ? 10 : 9} strokeWidth={3} className="text-white" />}
        </button>

        {!isFlatList && hasChildren && (
           <button 
             onClick={(e) => { 
               e.stopPropagation(); 
               const newVal = !isCollapsed;
               if (viewMode === 'focus') {
                   setOptimisticCollapsed(newVal); 
                   onUpdate(task.id, { is_collapsed: newVal }); 
               } else {
                   setLocalCollapsed(newVal);
                   const stored = localStorage.getItem('chronoa_archive_collapsed');
                   const parsed = stored ? JSON.parse(stored) : {};
                   parsed[task.id] = newVal;
                   localStorage.setItem('chronoa_archive_collapsed', JSON.stringify(parsed));
               }
             }} 
             className="shrink-0 -ml-1 text-[#b0ad9a] md:hover:text-[#c2956e] md:dark:hover:text-[#d1a784] transition-colors p-1"
           >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} className="opacity-40 md:group-hover:opacity-100" />}
           </button>
        )}

        <div className="flex-1 flex flex-col min-w-0 py-0.5">
          {isFlatList && <div className="text-[9px] font-bold text-[#b0ad9a] uppercase truncate tracking-tighter opacity-70 mb-0.5">{getPath(task)}</div>}
          
          <div className="flex items-center gap-1.5 w-full">
            <span 
              ref={textRef}
              data-task-id={task.id}
              contentEditable={allowTextEdit}
              suppressContentEditableWarning
              spellCheck={false}
              onMouseDown={(e) => e.stopPropagation()}
              onFocus={() => setIsExpanded(true)}
              onInput={handleInput}
              onBlur={() => {
                saveCurrentText();
                setIsExpanded(false); 
              }}
              onKeyDown={(e) => {
                if (e.shiftKey && e.key === "ArrowUp" && !disabledHotkeys?.includes('focus_up')) {
                  e.preventDefault();
                  const inputs = Array.from(document.querySelectorAll('.task-input-field')) as HTMLElement[];
                  const idx = inputs.findIndex(el => el.getAttribute('data-task-id') === task.id);
                  if (idx > 0) inputs[idx - 1].focus();
                  return;
                }
                if (e.shiftKey && e.key === "ArrowDown" && !disabledHotkeys?.includes('focus_down')) {
                  e.preventDefault();
                  const focusNext = () => {
                    const inputs = Array.from(document.querySelectorAll('.task-input-field')) as HTMLElement[];
                    const idx = inputs.findIndex(el => el.getAttribute('data-task-id') === task.id);
                    if (idx !== -1 && idx < inputs.length - 1) inputs[idx + 1].focus();
                  };
                  
                  if (!isFlatList && isCollapsed && hasChildren) {
                     const newVal = false;
                     if (viewMode === 'focus') {
                         setOptimisticCollapsed(newVal); 
                         onUpdate(task.id, { is_collapsed: newVal }); 
                     } else {
                         setLocalCollapsed(newVal);
                         const stored = localStorage.getItem('chronoa_archive_collapsed');
                         const parsed = stored ? JSON.parse(stored) : {};
                         parsed[task.id] = newVal;
                         localStorage.setItem('chronoa_archive_collapsed', JSON.stringify(parsed));
                     }
                     setTimeout(focusNext, 50); 
                  } else {
                     focusNext();
                  }
                  return;
                }

                if (e.altKey && e.key === "ArrowUp" && !disabledHotkeys?.includes('up')) { e.preventDefault(); onMoveUp(task); return; }
                if (e.altKey && e.key === "ArrowDown" && !disabledHotkeys?.includes('down')) { e.preventDefault(); onMoveDown(task); return; }
                
                if (e.key === "Enter") {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    saveCurrentText();
                    onAdd(task.parent_id, task);
                  } else if (e.shiftKey) {
                    e.preventDefault();
                    document.execCommand('insertText', false, '\n');
                    handleInput();
                  } else {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }
                
                if (e.key === "Escape") { e.currentTarget.textContent = task.title; e.currentTarget.blur(); }
                if (e.key === "Tab") {
                  const isDisabled = e.shiftKey ? disabledHotkeys?.includes('unindent') : disabledHotkeys?.includes('indent');
                  if (!isDisabled) {
                    e.preventDefault();
                    saveCurrentText();
                    if (e.shiftKey) onUnindent(task);
                    else onIndent(task);
                  }
                }
              }}
              style={!isExpanded ? { display: '-webkit-box', WebkitLineClamp: 10, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : { display: 'block' }}
              className={`task-input-field break-words whitespace-pre-wrap flex-1 min-w-[50px] transition-all duration-200 outline-none ${titleSize} ${titleWeight} ${allowTextEdit ? "cursor-text border-b border-transparent focus:border-[#c2956e]/30 pb-[1px]" : "cursor-default"} ${isStruckThrough ? "text-[#c4c0b8] dark:text-[#555] line-through" : "text-[#3d3b33] dark:text-[#e0e0e0]"}`}
            >
              {renderTitle()}
            </span>
            
            {isCollapsed && descendantColors.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 px-1 opacity-80">
                {descendantColors.map(c => {
                   const colorObj = availableColors.find(ac => ac.id === c);
                   return colorObj ? <div key={c} className={`w-1.5 h-1.5 rounded-full ${colorObj.bg.split(' ')[0]}`} /> : null;
                })}
              </div>
            )}
          </div>

          {isOverflowing && (
             <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-[10px] text-[#c2956e] dark:text-[#b0855f] font-bold uppercase tracking-wider mt-0.5 opacity-80 md:hover:opacity-100 transition-opacity flex items-center gap-1 w-max outline-none"
             >
                {isExpanded ? "Show Less" : "Read More"}
             </button>
          )}

          {(viewMode === 'archive' || (viewMode === 'trash' && task.is_completed)) && task.completed_at && (
            <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-[#c2956e] uppercase tracking-widest">
              <Clock size={10} /> Completed {new Date(task.completed_at).toLocaleDateString()} at {new Date(task.completed_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
          )}

          {viewMode === 'trash' && (
            <div className={`text-[9px] font-bold uppercase mt-1 tracking-widest flex items-center gap-1 ${daysLeft <= 1 ? 'text-red-500' : 'text-[#b0ad9a]'}`}>
               {daysLeft > 0 ? `Deletes in ${daysLeft} days` : 'Deletes soon'}
            </div>
          )}
        </div>

        <div className={`flex items-center shrink-0 ml-auto gap-1 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
            {viewMode === 'focus' && showManagementActions && !disableMenu && (
               <button 
                  onClick={(e) => { e.stopPropagation(); onAdd(task.parent_id, task); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-[#c2956e] md:hover:bg-[#c2956e]/10 transition-all" 
               >
                  <Plus size={18} />
               </button>
            )}
            
            {!disableMenu && (
              <button 
                 onClick={toggleMenu} 
                 className={`menu-toggle-btn w-8 h-8 flex items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-[#3d3b33] md:dark:hover:text-white md:hover:bg-[#ebe8e2] md:dark:hover:bg-[#333] transition-all ${isMenuOpen ? 'bg-[#ebe8e2] dark:bg-[#333] text-[#3d3b33] dark:text-white' : ''}`}
              >
                 <MoreVertical size={16} />
              </button>
            )}
        </div>
      </div>

      {!isFlatList && !isCollapsed && hasChildren && (
        <div className="ml-[34px] mt-[1px] mb-[2px] pl-4 border-l border-[#ebe8e2] dark:border-[#2a2a2a] space-y-[1px]">
          {viewMode === 'focus' ? (
            <SortableContext items={task.children!.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {renderChildren()}
            </SortableContext>
          ) : (
            renderChildren()
          )}
        </div>
      )}

      {renderContextMenu()}
    </div>
  );
}