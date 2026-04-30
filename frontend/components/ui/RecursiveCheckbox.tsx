// frontend/components/ui/RecursiveCheckbox.tsx
"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/types/app.types";
import { Plus, Trash2, GripVertical, Check, Timer, Hourglass, ChevronRight, ChevronLeft } from "lucide-react";
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
  const { taskArchiveDelay } = useUiStore();
  const { addInstance, setTitle: setTimerTitle, setActiveTab, setForceShowWidgets } = useTimerStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !isEditMode });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : undefined };

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
  const isNormal = task.task_type === 'normal';
  
  // Logic for button visibility sets
  const showFocusButtons = !isEditMode;
  const showOrgButtons = isEditMode && isRoutine;

  const titleSize = depth === 0 ? "text-[15px]" : depth === 1 ? "text-[13.5px]" : "text-[12.5px]";
  const titleWeight = depth === 0 ? "font-[500]" : "font-[400]";
  const checkboxSize = depth === 0 ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]";
  const checkboxRadius = depth === 0 ? "rounded-[5px]" : "rounded-[4px]";

  return (
    <div ref={setNodeRef} style={style} className={`flex flex-col w-full ${isVanishingNow ? "task-vanishing-soothing" : ""}`}>
      <div className={`group relative flex items-center gap-3 py-[7px] px-3 rounded-xl transition-all duration-150 hover-marquee ${isDragging ? "bg-[#f7f5f0] dark:bg-[#2a2a2a] shadow-md ring-1 ring-[#e0ddd5] dark:ring-[#444]" : "hover:bg-[#faf9f6] dark:hover:bg-[#222]"}`}>
        
        {showOrgButtons && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0 text-[#d4d0c8] dark:text-[#555] hover:text-[#c2956e] dark:hover:text-[#d1a784] transition-colors duration-150 touch-none">
            <GripVertical size={14} strokeWidth={1.8} />
          </div>
        )}

        <button onClick={() => onUpdate(task.id, { is_completed: !task.is_completed })} className={`${checkboxSize} ${checkboxRadius} shrink-0 border flex items-center justify-center transition-all duration-200 cursor-pointer ${task.is_completed ? "bg-[#7ca982] dark:bg-[#6a9a70] border-[#7ca982] dark:border-[#6a9a70] shadow-[0_0_0_3px_rgba(124,169,130,0.12)]" : "border-[#d4d0c8] dark:border-[#555] bg-white dark:bg-[#1a1a1a] hover:border-[#7ca982] hover:shadow-[0_0_0_3px_rgba(124,169,130,0.10)]"}`}>
          {task.is_completed && <Check size={depth === 0 ? 10 : 9} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden task-title-container">
          <span 
            ref={textRef}
            contentEditable={isEditMode || isNormal}
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
            className={`marquee-content whitespace-nowrap transition-all duration-200 outline-none ${titleSize} ${titleWeight} ${isEditMode || isNormal ? "cursor-text border-b border-transparent focus:border-[#c2956e]/30 pb-[1px]" : "cursor-default"} ${task.is_completed ? "text-[#c4c0b8] dark:text-[#555] line-through" : "text-[#3d3b33] dark:text-[#e0e0e0]"}`}
          >
            {task.title}
          </span>
        </div>

        {/* Action Buttons Layer: Always opacity-0 until parent group is hovered */}
        <div className="flex flex-wrap items-center gap-0.5 shrink-0 ml-auto bg-inherit pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            
            {/* Actionable Set (Normal Mode) */}
            {showFocusButtons && (
                <>
                    <button onPointerDown={(e) => e.preventDefault()} onClick={() => handleSendToFocus('timer')} title="Send to Timer" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-blue-500 hover:bg-blue-50 transition-all"><Timer size={13} strokeWidth={2} /></button>
                    <button onPointerDown={(e) => e.preventDefault()} onClick={() => handleSendToFocus('stopwatch')} title="Send to Stopwatch" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-orange-500 hover:bg-orange-50 transition-all"><Hourglass size={13} strokeWidth={2} /></button>
                    
                    {/* Normal tasks expose subtask/delete without needing a separate edit mode */}
                    {isNormal && (
                      <>
                        <button onPointerDown={(e) => e.preventDefault()} onClick={() => onAdd(task.id)} title="Add Subtask" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#c2956e] hover:bg-[#c2956e]/10 transition-all"><Plus size={13} strokeWidth={2} /></button>
                        <button onPointerDown={(e) => e.preventDefault()} onClick={() => onDelete(task.id)} title="Delete" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#e07070] hover:bg-[#e07070]/10 transition-all"><Trash2 size={12} strokeWidth={1.8} /></button>
                      </>
                    )}
                </>
            )}

            {/* Organization Set (Routine Edit Mode) */}
            {showOrgButtons && (
                <>
                    <button onPointerDown={(e) => { e.preventDefault(); saveCurrentText(); onIndent(task); }} title="Indent Forward" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#c2956e] hover:bg-[#c2956e]/10 transition-all"><ChevronRight size={14} strokeWidth={2} /></button>
                    <button onPointerDown={(e) => { e.preventDefault(); saveCurrentText(); onUnindent(task); }} title="Indent Backward" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#c2956e] hover:bg-[#c2956e]/10 transition-all"><ChevronLeft size={14} strokeWidth={2} /></button>
                    <button onPointerDown={(e) => e.preventDefault()} onClick={() => onAdd(task.id)} title="Add Subtask" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#c2956e] hover:bg-[#c2956e]/10 transition-all"><Plus size={13} strokeWidth={2} /></button>
                    <button onPointerDown={(e) => e.preventDefault()} onClick={() => onDelete(task.id)} title="Delete" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#e07070] hover:bg-[#e07070]/10 transition-all"><Trash2 size={12} strokeWidth={1.8} /></button>
                </>
            )}
        </div>
      </div>

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