// frontend/components/ui/RecursiveCheckbox.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types/app.types";
import { 
  Plus, Trash2, Check, Timer, Hourglass, ChevronRight, ChevronLeft, 
  MoreVertical, ArrowUp, ArrowDown, Palette, ChevronDown, Infinity as InfinityIcon
} from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useTimerStore } from "@/store/timerStore";

interface Props {
  task: Task;
  isEditMode: boolean;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  onIndent: (task: Task) => void;
  onUnindent: (task: Task) => void;
  onMoveUp: (task: Task) => void;
  onMoveDown: (task: Task) => void;
  depth?: number;
  newTaskId: string | null;
  setNewTaskId: (id: string | null) => void;
}

export default function RecursiveCheckbox({ 
  task, isEditMode, onUpdate, onDelete, onAdd, onIndent, onUnindent, 
  onMoveUp, onMoveDown, depth = 0, newTaskId, setNewTaskId 
}: Props) {
  const router = useRouter();
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { taskArchiveDelay, activeTaskIdWithMenu, setActiveTaskIdWithMenu, collapsedTasks, toggleTaskCollapse, keepParentTaskAlive } = useUiStore();
  const { addInstance, setTitle: setTimerTitle, setActiveTab, setForceShowWidgets } = useTimerStore();

  const [initialTitle] = useState(task.title);

  const isRoutine = task.task_type === 'routine';
  const isNormal = task.task_type === 'normal';

  // Handles closing the unified menu when clicking elsewhere in the document
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

  // Handle setting focus when new task is created
  useEffect(() => {
    if (newTaskId === task.id) {
      setNewTaskId(null); 
      setTimeout(() => {
        if (textRef.current) {
          textRef.current.focus();
          const range = document.createRange();
          range.selectNodeContents(textRef.current);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 50);
    }
  }, [newTaskId, task.id, setNewTaskId]);

  // Safely update DOM node content natively if changed from database, without interrupting active typing
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
    const newTitle = textRef.current.textContent || '';
    if (newTitle.trim() && newTitle !== task.title) {
      onUpdate(task.id, { title: newTitle.trim() });
    }
  };

  const handleInput = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const newTitle = textRef.current?.textContent || '';
      if (newTitle.trim() && newTitle !== task.title) {
        onUpdate(task.id, { title: newTitle.trim() });
      }
    }, 1000);
  };

  const handleSendToFocus = (tab: 'timer' | 'stopwatch') => {
    saveCurrentText(); 
    const id = addInstance(tab);
    setTimerTitle(tab, id, textRef.current?.textContent || task.title);
    setActiveTab(tab);
    setForceShowWidgets(true);
    router.push('/');
  };

  const isVanishingNow = taskArchiveDelay <= 0 && task.is_completed && !isEditMode;
  const isMenuOpen = activeTaskIdWithMenu === task.id;

  const showTimerStopwatchOutside = isRoutine && !isEditMode;
  const showManagementActions = isNormal || (isRoutine && isEditMode);
  // Unlocked Keep Alive for every task acting as a parent
  const showKeepAlive = task.children && task.children.length > 0 && showManagementActions && !keepParentTaskAlive;

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
    if (window.innerWidth < 768) {
      setActiveTaskIdWithMenu(isMenuOpen ? null : task.id);
    }
  };

  const colorStyles: Record<string, string> = {
    none: isMenuOpen ? "bg-[#ebe8e2]/60 dark:bg-[#222]" : "hover:bg-[#ebe8e2]/60 dark:hover:bg-[#222]",
    rose: isMenuOpen ? "bg-rose-100 dark:bg-rose-900/40 ring-1 ring-rose-200 dark:ring-rose-800" : "bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/40",
    amber: isMenuOpen ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-200 dark:ring-amber-800" : "bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/40",
    emerald: isMenuOpen ? "bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-200 dark:ring-emerald-800" : "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    blue: isMenuOpen ? "bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800" : "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/40",
    purple: isMenuOpen ? "bg-purple-100 dark:bg-purple-900/40 ring-1 ring-purple-200 dark:ring-purple-800" : "bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-200 dark:ring-purple-900 hover:bg-purple-100 dark:hover:bg-purple-900/40"
  };

  const availableColors = [
    { id: 'none', bg: 'bg-[#e0ddd5] dark:bg-[#555]' },
    { id: 'rose', bg: 'bg-rose-400 dark:bg-rose-500' },
    { id: 'amber', bg: 'bg-amber-400 dark:bg-amber-500' },
    { id: 'emerald', bg: 'bg-emerald-400 dark:bg-emerald-500' },
    { id: 'blue', bg: 'bg-blue-400 dark:bg-blue-500' },
    { id: 'purple', bg: 'bg-purple-400 dark:bg-purple-500' },
  ];

  const baseColor = task.color && task.color !== 'none' ? task.color : 'none';
  const activeColorStyle = colorStyles[baseColor];

  return (
    <div className={`flex flex-col w-full ${isVanishingNow ? "task-vanishing-soothing" : ""}`}>
      <div 
        ref={containerRef}
        onClick={handleRowClick}
        className={`group relative flex items-center gap-3 py-[7px] px-3 rounded-xl transition-all duration-150 ${activeColorStyle} ${isMenuOpen ? "z-10" : ""}`}
      >
        
        {/* Checkbox */}
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { is_completed: !task.is_completed }); }} 
          className={`${checkboxSize} ${checkboxRadius} shrink-0 border flex items-center justify-center transition-all duration-200 cursor-pointer ${task.is_completed ? "bg-[#7ca982] dark:bg-[#6a9a70] border-[#7ca982] shadow-[0_0_0_3px_rgba(124,169,130,0.12)]" : "border-[#d4d0c8] dark:border-[#555] bg-white dark:bg-[#1a1a1a] hover:border-[#7ca982] hover:shadow-[0_0_0_3px_rgba(124,169,130,0.10)]"}`}
        >
          {task.is_completed && <Check size={depth === 0 ? 10 : 9} strokeWidth={3} className="text-white" />}
        </button>

        {/* Hierarchy Toggle */}
        {task.children && task.children.length > 0 && (
           <button 
             onClick={(e) => { e.stopPropagation(); toggleTaskCollapse(task.id); }} 
             className="shrink-0 -ml-1 text-[#b0ad9a] hover:text-[#c2956e] dark:hover:text-[#d1a784] transition-colors p-1"
             title={collapsedTasks[task.id] ? "Expand" : "Collapse"}
           >
              {collapsedTasks[task.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} className="opacity-40 group-hover:opacity-100" />}
           </button>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <span 
            ref={textRef}
            contentEditable={isEditMode || isNormal}
            suppressContentEditableWarning
            onMouseDown={(e) => e.stopPropagation()}
            onInput={handleInput}
            onBlur={() => saveCurrentText()}
            onKeyDown={(e) => {
              if (e.altKey && e.key === "ArrowUp") { e.preventDefault(); onMoveUp(task); return; }
              if (e.altKey && e.key === "ArrowDown") { e.preventDefault(); onMoveDown(task); return; }
              if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
              if (e.key === "Escape") { e.currentTarget.textContent = task.title; e.currentTarget.blur(); }
              if (e.key === "Tab") {
                e.preventDefault();
                saveCurrentText();
                if (e.shiftKey) onUnindent(task);
                else onIndent(task);
              }
            }}
            className={`break-words whitespace-pre-wrap transition-all duration-200 outline-none ${titleSize} ${titleWeight} ${isEditMode || isNormal ? "cursor-text border-b border-transparent focus:border-[#c2956e]/30 pb-[1px]" : "cursor-default"} ${task.is_completed ? "text-[#c4c0b8] dark:text-[#555] line-through" : "text-[#3d3b33] dark:text-[#e0e0e0]"}`}
          >
            {initialTitle}
          </span>

          {/* Expanded Menu for Task Actions */}
          {isMenuOpen && (
            <div className="flex flex-col gap-3 mt-2 pt-3 border-t border-[#e0ddd5] dark:border-[#333] animate-fade-up w-full" onClick={e => e.stopPropagation()}>
               <div className="hidden md:flex flex-wrap gap-3 items-center justify-between w-full">
                  {/* Timer/Stopwatch only shown if showManagementActions (Since Desktop Routines don't have 3-dot) */}
                  {showManagementActions && (
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleSendToFocus('timer')} title="Send to Timer" className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"><Timer size={14} /></button>
                       <button onClick={() => handleSendToFocus('stopwatch')} title="Send to Stopwatch" className="flex items-center justify-center w-8 h-8 rounded-lg text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/40"><Hourglass size={14} /></button>
                    </div>
                  )}
                  
                  {showManagementActions && (
                     <div className="flex items-center gap-3 md:ml-auto flex-wrap">
                        {/* Task Highlighting Colors */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-[#252525] rounded-lg p-1.5 border border-[#e0ddd5] dark:border-[#333] shadow-sm">
                           <Palette size={13} className="text-[#888] mx-1" />
                           {availableColors.map(c => (
                             <button
                               key={c.id}
                               onClick={() => { onUpdate(task.id, { color: c.id === 'none' ? null : c.id }); }}
                               className={`w-4 h-4 rounded-full ${c.bg} transition-all ${task.color === c.id || (!task.color && c.id === 'none') ? 'ring-2 ring-offset-1 ring-[#c2956e] dark:ring-offset-[#252525] scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                               title={`Highlight: ${c.id}`}
                             />
                           ))}
                        </div>

                        {/* Hierarchical Controls */}
                        <div className="flex items-center bg-white dark:bg-[#252525] rounded-lg p-0.5 border border-[#e0ddd5] dark:border-[#333] shadow-sm">
                           <button onClick={() => onMoveUp(task)} className="p-1.5 text-[#888] hover:text-[#c2956e] hover:bg-[#f7f5f0] dark:hover:bg-[#1a1a1a] rounded-md transition-colors" title="Move Up"><ArrowUp size={14} /></button>
                           <button onClick={() => onMoveDown(task)} className="p-1.5 text-[#888] hover:text-[#c2956e] hover:bg-[#f7f5f0] dark:hover:bg-[#1a1a1a] rounded-md transition-colors" title="Move Down"><ArrowDown size={14} /></button>
                           <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-0.5"/>
                           <button onClick={() => onUnindent(task)} className="p-1.5 text-[#888] hover:text-[#c2956e] hover:bg-[#f7f5f0] dark:hover:bg-[#1a1a1a] rounded-md transition-colors" title="Outdent"><ChevronLeft size={14} /></button>
                           <button onClick={() => onIndent(task)} className="p-1.5 text-[#888] hover:text-[#c2956e] hover:bg-[#f7f5f0] dark:hover:bg-[#1a1a1a] rounded-md transition-colors" title="Indent"><ChevronRight size={14} /></button>
                        </div>
                     </div>
                  )}
               </div>

               {/* Mobile-only compact action row inside menu */}
               <div className="flex md:hidden items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSendToFocus('timer')} className="p-2 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/20 transition-colors"><Timer size={16} /></button>
                    <button onClick={() => handleSendToFocus('stopwatch')} className="p-2 rounded-lg text-orange-600 bg-orange-50 dark:bg-orange-900/20 transition-colors"><Hourglass size={16} /></button>
                    {showKeepAlive && (
                        <button onClick={() => onUpdate(task.id, { keep_alive: !task.keep_alive })} className={`p-2 rounded-lg transition-colors ${task.keep_alive ? 'text-white bg-[#7ca982]' : 'text-[#7ca982] bg-[#7ca982]/10'}`}><InfinityIcon size={16} /></button>
                    )}
                  </div>
                  {showManagementActions && (
                     <div className="flex items-center gap-2">
                        <button onClick={() => onAdd(task.id)} className="p-2 rounded-lg text-[#c2956e] bg-[#c2956e]/10 transition-colors"><Plus size={16} /></button>
                        <button onClick={() => onDelete(task.id)} className="p-2 rounded-lg text-red-500 bg-red-50 dark:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Unified Quick Actions & 3-Dot (Desktop & Mobile) */}
        <div className={`flex items-center shrink-0 ml-auto gap-0.5 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-100 md:opacity-0 group-hover:opacity-100'}`}>
            
            {/* Desktop Only Tools */}
            <div className="hidden md:flex items-center gap-0.5">
                {showTimerStopwatchOutside && (
                    <>
                        <button onClick={() => handleSendToFocus('timer')} title="Send to Timer" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Timer size={14} /></button>
                        <button onClick={() => handleSendToFocus('stopwatch')} title="Send to Stopwatch" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"><Hourglass size={14} /></button>
                    </>
                )}
                {showManagementActions && (
                    <>
                      {showKeepAlive && (
                         <button onClick={() => onUpdate(task.id, { keep_alive: !task.keep_alive })} title="Keep parent task alive" className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${task.keep_alive ? 'text-[#7ca982] bg-[#7ca982]/10' : 'text-[#c4c0b8] hover:text-[#7ca982] hover:bg-[#7ca982]/10'}`}><InfinityIcon size={14} /></button>
                      )}
                      <button onClick={() => onAdd(task.id)} title="Add Subtask" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-[#c2956e] hover:bg-[#c2956e]/10 transition-all"><Plus size={14} /></button>
                      <button onClick={() => onDelete(task.id)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                    </>
                )}
            </div>
            
            {/* 3-Dot Menu Toggle - Hidden on desktop if !showManagementActions (i.e. Desktop Routine View) */}
            <button onClick={toggleMenu} title="More Options" className={`menu-toggle-btn w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-[#3d3b33] dark:hover:text-white hover:bg-white dark:hover:bg-[#333] transition-all ml-1 ${!showManagementActions ? 'md:hidden' : ''}`}>
               <MoreVertical size={14} />
            </button>
        </div>
      </div>

      {/* Recursive Children Rendering */}
      {!collapsedTasks[task.id] && task.children && task.children.length > 0 && (
        <div className="ml-[34px] mt-[1px] mb-[2px] pl-4 border-l border-[#ebe8e2] dark:border-[#333] space-y-[1px]">
          {task.children.map((child) => (
            <RecursiveCheckbox 
              key={child.id} 
              task={child} 
              isEditMode={isEditMode} 
              onUpdate={onUpdate} 
              onDelete={onDelete} 
              onAdd={onAdd} 
              onIndent={onIndent} 
              onUnindent={onUnindent} 
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              depth={depth + 1} 
              newTaskId={newTaskId} 
              setNewTaskId={setNewTaskId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}