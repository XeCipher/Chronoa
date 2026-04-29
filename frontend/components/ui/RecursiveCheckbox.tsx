"use client";

import { useState, useRef, useEffect } from "react";
import { Task } from "@/types/app.types";
import { Plus, Trash2, GripVertical, Check } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  task: Task;
  isEditMode: boolean;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  depth?: number;
}

export default function RecursiveCheckbox({ task, isEditMode, onUpdate, onDelete, onAdd, depth = 0 }: Props) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !isEditMode });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : undefined };

  useEffect(() => { if (isEditingText) inputRef.current?.focus(); }, [isEditingText]);

  const handleBlur = () => {
    if (title.trim() && title !== task.title) onUpdate(task.id, { title: title.trim() });
    else setTitle(task.title);
    setIsEditingText(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") { setTitle(task.title); setIsEditingText(false); }
  };

  const titleSize = depth === 0 ? "text-[15px]" : depth === 1 ? "text-[13.5px]" : "text-[12.5px]";
  const titleWeight = depth === 0 ? "font-[500]" : "font-[400]";
  const checkboxSize = depth === 0 ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]";
  const checkboxRadius = depth === 0 ? "rounded-[5px]" : "rounded-[4px]";

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col w-full">
      <div className={`group relative flex items-center gap-3 py-[7px] px-3 rounded-xl transition-all duration-150 ${isDragging ? "bg-[#f7f5f0] dark:bg-[#2a2a2a] shadow-md ring-1 ring-[#e0ddd5] dark:ring-[#444]" : "hover:bg-[#faf9f6] dark:hover:bg-[#222]"}`}>
        {isEditMode && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0 text-[#d4d0c8] dark:text-[#555] hover:text-[#c2956e] dark:hover:text-[#d1a784] transition-colors duration-150 touch-none">
            <GripVertical size={14} strokeWidth={1.8} />
          </div>
        )}

        <button onClick={() => onUpdate(task.id, { is_completed: !task.is_completed })} className={`${checkboxSize} ${checkboxRadius} shrink-0 border flex items-center justify-center transition-all duration-200 cursor-pointer ${task.is_completed ? "bg-[#7ca982] dark:bg-[#6a9a70] border-[#7ca982] dark:border-[#6a9a70] shadow-[0_0_0_3px_rgba(124,169,130,0.12)] dark:shadow-[0_0_0_3px_rgba(106,154,112,0.12)]" : "border-[#d4d0c8] dark:border-[#555] bg-white dark:bg-[#1a1a1a] hover:border-[#7ca982] dark:hover:border-[#6a9a70] hover:shadow-[0_0_0_3px_rgba(124,169,130,0.10)]"}`}>
          {task.is_completed && <Check size={depth === 0 ? 10 : 9} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          {isEditingText ? (
            <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className="flex-1 bg-transparent outline-none border-b border-[#c2956e]/50 dark:border-[#b0855f]/50 text-[#3d3b33] dark:text-[#f0f0f0] text-[14px] font-[400] pb-[2px] tracking-[0.01em] placeholder:text-[#c4c0b8] dark:placeholder:text-[#555]" />
          ) : (
            <span onClick={() => isEditMode && setIsEditingText(true)} className={`flex-1 truncate leading-snug tracking-[0.01em] transition-all duration-200 ${titleSize} ${titleWeight} ${isEditMode ? "cursor-text" : "cursor-default"} ${task.is_completed ? "text-[#c4c0b8] dark:text-[#555] line-through" : "text-[#3d3b33] dark:text-[#e0e0e0]"}`}>
              {task.title}
            </span>
          )}

          {isEditMode && !isEditingText && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button onClick={() => onAdd(task.id)} title="Add subtask" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#c2956e] dark:hover:text-[#d1a784] hover:bg-[#c2956e]/10 dark:hover:bg-[#b0855f]/20 transition-all duration-150"><Plus size={13} strokeWidth={2} /></button>
              <button onClick={() => onDelete(task.id)} title="Delete" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#c4c0b8] dark:text-[#555] hover:text-[#e07070] dark:hover:text-[#e07070] hover:bg-[#e07070]/10 dark:hover:bg-[#e07070]/20 transition-all duration-150"><Trash2 size={12} strokeWidth={1.8} /></button>
            </div>
          )}
        </div>
      </div>

      {task.children && task.children.length > 0 && (
        <div className="ml-[34px] mt-[1px] mb-[2px] pl-4 border-l border-[#ebe8e2] dark:border-[#333] space-y-[1px]">
          {task.children.map((child) => <RecursiveCheckbox key={child.id} task={child} isEditMode={isEditMode} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}