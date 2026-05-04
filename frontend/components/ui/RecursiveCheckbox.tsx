// frontend/components/ui/RecursiveCheckbox.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types/app.types";
import { 
  Plus, Trash2, Check, Timer, Hourglass, ChevronRight, ChevronLeft, 
  MoreVertical, ArrowUp, ArrowDown, Palette, ChevronDown, Infinity as InfinityIcon, RotateCcw, Clock, GripVertical, CornerDownRight
} from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useTimerStore } from "@/store/timerStore";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

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

  const [localCollapsed, setLocalCollapsed] = useState<boolean>(() => {
    return getDescendantCount(task) > 5;
  });

  useEffect(() => {
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
      if (activeTaskIdWithMenu !== task.id) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (target.closest('.menu-toggle-btn')) return;
        setActiveTaskIdWithMenu(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
  const showTimerStopwatchOutside = viewMode === 'focus' && isRoutine && !isEditMode;
  const hasChildren = task.children && task.children.length > 0;
  const showKeepAliveToggle = showManagementActions && hasChildren;

  const hasSearchMatch = hasSearchMatchInDescendants(task, searchQuery);
  let isCollapsed = false;
  if (hasSearchMatch) {
      isCollapsed = false;
  } else if (viewMode === 'focus') {
      isCollapsed = task.is_collapsed ?? false;
  } else {
      isCollapsed = localCollapsed;
  }

  const titleSize = depth === 0 ? "text-[15px]" : depth === 1 ? "text-[13.5px]" : "text-[12.5px]";
  const titleWeight = depth === 0 ? "font-[500]" : "font-[400]";
  const checkboxSize = depth === 0 ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]";
  const checkboxRadius = depth === 0 ? "rounded-[5px]" : "rounded-[4px]";

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTaskIdWithMenu(isMenuOpen ? null : task.id);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'SPAN') return;
    if (window.innerWidth < 768 && viewMode === 'focus') {
      setActiveTaskIdWithMenu(isMenuOpen ? null : task.id);
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

  return (
    <div ref={setNodeRef} style={sortableStyle} className={`flex flex-col w-full ${isVanishingNow ? "task-vanishing-soothing" : ""}`}>
      <div 
        ref={containerRef}
        onClick={handleRowClick}
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
               if (viewMode === 'focus') {
                   onUpdate(task.id, { is_collapsed: !isCollapsed }); 
               } else {
                   const newVal = !isCollapsed;
                   setLocalCollapsed(newVal);
                   const stored = localStorage.getItem('chronoa_archive_collapsed');
                   const parsed = stored ? JSON.parse(stored) : {};
                   parsed[task.id] = newVal;
                   localStorage.setItem('chronoa_archive_collapsed', JSON.stringify(parsed));
               }
             }} 
             className="shrink-0 -ml-1 text-[#b0ad9a] md:hover:text-[#c2956e] md:dark:hover:text-[#d1a784] transition-colors p-1"
             data-tooltip-id="task-tooltip"
             data-tooltip-content={isCollapsed ? "Expand" : "Collapse"}
           >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} className="opacity-40 md:group-hover:opacity-100" />}
           </button>
        )}

        <div className="flex-1 flex flex-col min-w-0 py-0.5">
          {isFlatList && <div className="text-[9px] font-bold text-[#b0ad9a] uppercase truncate tracking-tighter opacity-70 mb-0.5">{getPath(task)}</div>}
          
          <div className="flex items-center gap-1.5 w-full">
            <span 
              ref={textRef}
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
              className={`break-words whitespace-pre-wrap flex-1 min-w-[50px] transition-all duration-200 outline-none ${titleSize} ${titleWeight} ${allowTextEdit ? "cursor-text border-b border-transparent focus:border-[#c2956e]/30 pb-[1px]" : "cursor-default"} ${isStruckThrough ? "text-[#c4c0b8] dark:text-[#555] line-through" : "text-[#3d3b33] dark:text-[#e0e0e0]"}`}
            >
              {renderTitle()}
            </span>
            
            {isCollapsed && descendantColors.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 px-1 opacity-80">
                {descendantColors.map(c => {
                   const colorObj = availableColors.find(ac => ac.id === c);
                   return colorObj ? <div key={c} className={`w-1.5 h-1.5 rounded-full ${colorObj.bg.split(' ')[0]}`} data-tooltip-id="task-tooltip" data-tooltip-content={c} /> : null;
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

          {isMenuOpen && viewMode === 'focus' && (
            <div className="mt-2 pt-2.5 border-t border-[#e0ddd5] dark:border-[#333] animate-fade-up w-full" onClick={e => e.stopPropagation()}>
               <div className="flex flex-wrap gap-2 items-center w-full">
                  
                  <div className="flex items-center bg-white dark:bg-[#252525] rounded-xl p-1 border border-[#e0ddd5] dark:border-[#333] shadow-sm shrink-0">
                     <button onClick={() => handleSendToFocus('timer')} className="flex items-center justify-center p-1.5 rounded-lg text-blue-600 dark:text-blue-400 md:hover:bg-blue-50 md:dark:hover:bg-blue-900/20 transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Send to Timer">
                        <Timer size={15} />
                     </button>
                     <button onClick={() => handleSendToFocus('stopwatch')} className="flex items-center justify-center p-1.5 rounded-lg text-orange-600 dark:text-orange-400 md:hover:bg-orange-50 md:dark:hover:bg-orange-900/20 transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Send to Stopwatch">
                        <Hourglass size={15} />
                     </button>
                     {showKeepAliveToggle && (
                        <div className="flex items-center md:hidden">
                          <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-1" />
                          <button onClick={() => onUpdate(task.id, { keep_alive: !task.keep_alive })} className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${task.keep_alive ? 'text-white bg-[#7ca982] dark:bg-[#6a9a70]' : 'text-[#7ca982] md:hover:bg-[#7ca982]/10'}`} data-tooltip-id="task-tooltip" data-tooltip-content="Keep Parent Alive">
                            <InfinityIcon size={15} />
                          </button>
                        </div>
                     )}
                  </div>

                  {/* Mobile Only: Add Subtask and Delete */}
                  {showManagementActions && (
                    <div className="flex md:hidden items-center bg-white dark:bg-[#252525] rounded-xl p-1 border border-[#e0ddd5] dark:border-[#333] shadow-sm shrink-0">
                      <button 
                        onClick={() => onAdd(task.id)} 
                        className="flex items-center justify-center p-1.5 rounded-lg text-[#888] hover:bg-[#f0ede8] dark:hover:bg-[#111] transition-colors" 
                        data-tooltip-id="task-tooltip" data-tooltip-content="Add Subtask"
                      >
                        <CornerDownRight size={15} />
                      </button>
                      <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-1" />
                      <button 
                        onClick={() => onDelete(task.id, false)} 
                        className="flex items-center justify-center p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" 
                        data-tooltip-id="task-tooltip" data-tooltip-content="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}

                  {showManagementActions && (
                     <div className="flex items-center bg-white dark:bg-[#252525] rounded-xl p-1 border border-[#e0ddd5] dark:border-[#333] shadow-sm shrink-0">
                        <button onClick={() => onMoveUp(task)} className="p-1.5 text-[#888] md:hover:text-[#c2956e] md:hover:bg-[#f7f5f0] md:dark:hover:bg-[#1a1a1a] rounded-lg transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Move Up"><ArrowUp size={15} /></button>
                        <button onClick={() => onMoveDown(task)} className="p-1.5 text-[#888] md:hover:text-[#c2956e] md:hover:bg-[#f7f5f0] md:dark:hover:bg-[#1a1a1a] rounded-lg transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Move Down"><ArrowDown size={15} /></button>
                        <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-1" />
                        <button onClick={() => onUnindent(task)} className="p-1.5 text-[#888] md:hover:text-[#c2956e] md:hover:bg-[#f7f5f0] md:dark:hover:bg-[#1a1a1a] rounded-lg transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Outdent"><ChevronLeft size={15} /></button>
                        <button onClick={() => onIndent(task)} className="p-1.5 text-[#888] md:hover:text-[#c2956e] md:hover:bg-[#f7f5f0] md:dark:hover:bg-[#1a1a1a] rounded-lg transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Indent"><ChevronRight size={15} /></button>
                     </div>
                  )}

                  {showManagementActions && (
                     <div className="flex items-center bg-white dark:bg-[#252525] rounded-xl p-1.5 border border-[#e0ddd5] dark:border-[#333] shadow-sm shrink-0 max-w-full overflow-x-auto no-scrollbar">
                        <Palette size={14} className="text-[#888] mx-1.5 shrink-0" />
                        <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-1 shrink-0" />
                        <div className="flex items-center gap-2 px-1 shrink-0">
                           {availableColors.map(c => (
                              <button
                                 key={c.id}
                                 onClick={() => onUpdate(task.id, { color: c.id === 'none' ? null : c.id })}
                                 className={`w-4 h-4 rounded-full ${c.bg} transition-all shrink-0 ${task.color === c.id || (!task.color && c.id === 'none') ? 'ring-2 ring-offset-2 ring-[#c2956e] dark:ring-offset-[#252525] scale-110' : 'opacity-60 md:hover:opacity-100 md:hover:scale-110'}`}
                                 data-tooltip-id="task-tooltip" data-tooltip-content={`Highlight: ${c.id}`}
                              />
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>

        <div className={`flex items-center shrink-0 ml-auto gap-0.5 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
            {viewMode === 'focus' && (
              <div className="flex items-center gap-0.5">
                  {showTimerStopwatchOutside && (
                      <div className="hidden md:flex items-center gap-0.5">
                          <button onClick={() => handleSendToFocus('timer')} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-blue-500 md:hover:bg-blue-50 md:dark:hover:bg-blue-900/20 transition-all" data-tooltip-id="task-tooltip" data-tooltip-content="Send to Timer"><Timer size={14} /></button>
                          <button onClick={() => handleSendToFocus('stopwatch')} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-orange-500 md:hover:bg-orange-50 md:dark:hover:bg-orange-900/20 transition-all" data-tooltip-id="task-tooltip" data-tooltip-content="Send to Stopwatch"><Hourglass size={14} /></button>
                      </div>
                  )}
                  {showManagementActions && (
                      <>
                        {showKeepAliveToggle && (
                           <button onClick={() => onUpdate(task.id, { keep_alive: !task.keep_alive })} className={`hidden md:flex w-7 h-7 items-center justify-center rounded-lg transition-all ${task.keep_alive ? 'text-white bg-[#7ca982] dark:bg-[#6a9a70]' : 'text-[#c4c0b8] md:hover:text-[#7ca982] md:hover:bg-[#7ca982]/10'}`} data-tooltip-id="task-tooltip" data-tooltip-content="Keep parent task alive"><InfinityIcon size={14} /></button>
                        )}
                        {/* Desktop ONLY: Add Child */}
                        <button onClick={() => onAdd(task.id)} className="hidden md:flex w-7 h-7 items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-[#c2956e] md:hover:bg-[#c2956e]/10 transition-all" data-tooltip-id="task-tooltip" data-tooltip-content="Add Subtask"><CornerDownRight size={14} /></button>
                        {/* Add Sibling: Always on desktop hover, visible on mobile when menu open */}
                        <button onClick={() => onAdd(task.parent_id, task)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-[#c2956e] md:hover:bg-[#c2956e]/10 transition-all ${isMenuOpen ? 'flex' : 'hidden md:flex'}`} data-tooltip-id="task-tooltip" data-tooltip-content="Add Sibling Below"><Plus size={14} /></button>
                        {/* Desktop ONLY: Delete */}
                        <button onClick={() => onDelete(task.id, false)} className="hidden md:flex w-7 h-7 items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-red-500 md:hover:bg-red-500/10 transition-all" data-tooltip-id="task-tooltip" data-tooltip-content="Delete"><Trash2 size={14} /></button>
                      </>
                  )}
              </div>
            )}
            
            {viewMode === 'archive' && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => onRestore(task.id, 'from_archive')} className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-lg text-gray-400 dark:text-[#888] md:hover:text-[#c2956e] transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Restore to Focus"><RotateCcw size={15} strokeWidth={2.5} /></button>
                <button onClick={() => onDelete(task.id, false)} className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-lg text-gray-400 dark:text-[#888] md:hover:text-red-500 transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Move to Trash"><Trash2 size={15} strokeWidth={2} /></button>
              </div>
            )}

            {viewMode === 'trash' && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => onRestore(task.id, 'from_trash')} className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-lg text-gray-400 dark:text-[#888] md:hover:text-[#7ca982] transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Restore from Trash"><RotateCcw size={15} strokeWidth={2.5} /></button>
                <button onClick={() => onDelete(task.id, true)} className="p-1.5 md:hover:bg-white md:dark:hover:bg-[#2a2a2a] rounded-lg text-gray-400 dark:text-[#888] md:hover:text-red-500 transition-colors" data-tooltip-id="task-tooltip" data-tooltip-content="Delete Permanently"><Trash2 size={15} strokeWidth={2} /></button>
              </div>
            )}
            
            {viewMode === 'focus' && (
              <button onClick={toggleMenu} className={`menu-toggle-btn w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] md:hover:text-[#3d3b33] md:dark:hover:text-white md:hover:bg-white md:dark:hover:bg-[#333] transition-all ml-1 ${!showManagementActions ? 'md:hidden' : ''}`} data-tooltip-id="task-tooltip" data-tooltip-content="More Options">
                 <MoreVertical size={14} />
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
    </div>
  );
}