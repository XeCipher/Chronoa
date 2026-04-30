// frontend/components/ui/RecursiveCheckbox.tsx
"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types/app.types";
import { Plus, Trash2, GripVertical, Check, Timer, Hourglass, ChevronRight, ChevronLeft, MoreVertical } from "lucide-react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  depth?: number;
  newTaskId: string | null;
  setNewTaskId: (id: string | null) => void;
}

export default function RecursiveCheckbox({ task, isEditMode, onUpdate, onDelete, onAdd, onIndent, onUnindent, depth = 0, newTaskId, setNewTaskId }: Props) {
  const router = useRouter();
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { taskArchiveDelay, activeTaskIdWithMenu, setActiveTaskIdWithMenu } = useUiStore();
  const { addInstance, setTitle: setTimerTitle, setActiveTab, setForceShowWidgets } = useTimerStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !isEditMode });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : undefined };

  // Handle click-away to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (activeTaskIdWithMenu === task.id) setActiveTaskIdWithMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTaskIdWithMenu, task.id, setActiveTaskIdWithMenu]);

  // Focus management for new items
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

  const saveCurrentText = () => {
    if (!textRef.current) return;
    const newTitle = textRef.current.textContent || '';
    if (newTitle.trim() && newTitle !== task.title) {
      onUpdate(task.id, { title: newTitle.trim() });
    }
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
  const isRoutine = task.task_type === 'routine';
  const isMenuOpen = activeTaskIdWithMenu === task.id;

  // Visual constraints
  const titleSize = depth === 0 ? "text-[15px]" : depth === 1 ? "text-[13.5px]" : "text-[12.5px]";
  const titleWeight = depth === 0 ? "font-[500]" : "font-[400]";
  const checkboxSize = depth === 0 ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]";
  const checkboxRadius = depth === 0 ? "rounded-[5px]" : "rounded-[4px]";

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTaskIdWithMenu(isMenuOpen ? null : task.id);
  };

  // Visibility logic based on task type and mode
  const showFocusActions = !isRoutine || (!isEditMode && isRoutine);
  const showManagementActions = !isRoutine || (isEditMode && isRoutine);

  return (
    <div ref={setNodeRef} style={style} className={`flex flex-col w-full ${isVanishingNow ? "task-vanishing-soothing" : ""}`}>
      <div 
        ref={containerRef}
        className={`group relative flex items-center gap-3 py-[7px] px-3 rounded-xl transition-all duration-150 ${isDragging ? "bg-[#f7f5f0] dark:bg-[#2a2a2a] shadow-md ring-1 ring-[#e0ddd5] dark:ring-[#444]" : "hover:bg-[#faf9f6] dark:hover:bg-[#222]"}`}
      >
        
        {/* Drag Handle - Centered vertically via items-center on parent */}
        {isEditMode && isRoutine && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0 text-[#d4d0c8] dark:text-[#555] hover:text-[#c2956e] transition-colors duration-150 touch-none">
            <GripVertical size={14} strokeWidth={1.8} />
          </div>
        )}

        {/* Checkbox - Centered vertically via items-center on parent */}
        <button onClick={() => onUpdate(task.id, { is_completed: !task.is_completed })} className={`${checkboxSize} ${checkboxRadius} shrink-0 border flex items-center justify-center transition-all duration-200 cursor-pointer ${task.is_completed ? "bg-[#7ca982] dark:bg-[#6a9a70] border-[#7ca982] shadow-[0_0_0_3px_rgba(124,169,130,0.12)]" : "border-[#d4d0c8] dark:border-[#555] bg-white dark:bg-[#1a1a1a] hover:border-[#7ca982] hover:shadow-[0_0_0_3px_rgba(124,169,130,0.10)]"}`}>
          {task.is_completed && <Check size={depth === 0 ? 10 : 9} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Text Title - Multi-line enabled */}
          <span 
            ref={textRef}
            contentEditable={isEditMode || !isRoutine}
            suppressContentEditableWarning
            onBlur={() => saveCurrentText()}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
              if (e.key === "Escape") { e.currentTarget.textContent = task.title; e.currentTarget.blur(); }
              if (e.key === "Tab") {
                e.preventDefault();
                saveCurrentText();
                if (e.shiftKey) onUnindent(task);
                else onIndent(task);
              }
            }}
            className={`break-words whitespace-pre-wrap transition-all duration-200 outline-none pr-6 md:group-hover:pr-44 ${titleSize} ${titleWeight} ${isEditMode || !isRoutine ? "cursor-text border-b border-transparent focus:border-[#c2956e]/30 pb-[1px]" : "cursor-default"} ${task.is_completed ? "text-[#c4c0b8] dark:text-[#555] line-through" : "text-[#3d3b33] dark:text-[#e0e0e0]"}`}
          >
            {task.title}
          </span>

          {/* Mobile Actions - Opens below text */}
          {isMenuOpen && (
            <div className="md:hidden flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#e0ddd5] dark:border-[#333] animate-fade-up">
                {showFocusActions && (
                    <>
                        <button onClick={() => handleSendToFocus('timer')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-500 bg-blue-50 dark:bg-blue-500/10 text-[10px] font-bold uppercase tracking-wider"><Timer size={12} /> Timer</button>
                        <button onClick={() => handleSendToFocus('stopwatch')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-orange-500 bg-orange-50 dark:bg-orange-500/10 text-[10px] font-bold uppercase tracking-wider"><Hourglass size={12} /> Stopwatch</button>
                    </>
                )}
                
                {showManagementActions && (
                   <>
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#252525] rounded-lg p-0.5">
                          <button onClick={() => { saveCurrentText(); onUnindent(task); }} className="p-1.5 text-[#888] hover:text-[#c2956e]"><ChevronLeft size={14} /></button>
                          <button onClick={() => { saveCurrentText(); onIndent(task); }} className="p-1.5 text-[#888] hover:text-[#c2956e] border-l border-gray-200 dark:border-[#333]"><ChevronRight size={14} /></button>
                      </div>
                      <button onClick={() => onAdd(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#c2956e] bg-[#c2956e]/10 text-[10px] font-bold uppercase tracking-wider"><Plus size={12} /> Subtask</button>
                      <button onClick={() => onDelete(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 bg-red-50 dark:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider ml-auto"><Trash2 size={12} /> Delete</button>
                   </>
                )}
            </div>
          )}
        </div>

        {/* Desktop Actions - Absolutely centered to text height */}
        <div className="hidden md:flex items-center gap-0.5 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 bg-[#faf9f6] dark:bg-[#222] pl-4 py-1.5 rounded-l-xl shadow-[-15px_0_15px_-5px_rgba(250,249,246,1)] dark:shadow-[-15px_0_15px_-5px_rgba(34,34,34,1)]">
            {showFocusActions && (
                <>
                    <button onClick={() => handleSendToFocus('timer')} title="Send to Timer" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"><Timer size={14} /></button>
                    <button onClick={() => handleSendToFocus('stopwatch')} title="Send to Stopwatch" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"><Hourglass size={14} /></button>
                </>
            )}
            
            {showManagementActions && (
                <>
                  <button onClick={() => { saveCurrentText(); onIndent(task); }} title="Indent Forward" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-[#3d3b33] dark:hover:text-white hover:bg-white dark:hover:bg-[#333] transition-all"><ChevronRight size={15} /></button>
                  <button onClick={() => { saveCurrentText(); onUnindent(task); }} title="Indent Backward" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-[#3d3b33] dark:hover:text-white hover:bg-white dark:hover:bg-[#333] transition-all"><ChevronLeft size={15} /></button>
                  <button onClick={() => onAdd(task.id)} title="Add Subtask" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-[#c2956e] hover:bg-[#c2956e]/10 transition-all"><Plus size={14} /></button>
                  <button onClick={() => onDelete(task.id)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#c4c0b8] hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                </>
            )}
        </div>

        {/* Mobile More Toggle */}
        <div className="md:hidden shrink-0 ml-auto flex items-center">
          <button
            onClick={toggleMenu}
            className={`p-1.5 rounded-md transition-colors ${isMenuOpen ? 'text-[#c2956e] bg-[#c2956e]/10' : 'text-[#c4c0b8]'}`}
          >
            <MoreVertical size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Children */}
      {task.children && task.children.length > 0 && (
        <SortableContext items={task.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="ml-[34px] mt-[1px] mb-[2px] pl-4 border-l border-[#ebe8e2] dark:border-[#333] space-y-[1px]">
            {task.children.map((child) => (
              <RecursiveCheckbox key={child.id} task={child} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} onIndent={onIndent} onUnindent={onUnindent} depth={depth + 1} newTaskId={newTaskId} setNewTaskId={setNewTaskId} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}