"use client";

import { useState, useRef, useEffect } from "react";
import { Task } from "@/types/app.types";
import { Plus, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react";

interface Props {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

export default function RecursiveCheckbox({ task, onUpdate, onDelete, onAdd, onMove }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleBlur = () => {
    if (title.trim() && title !== task.title) {
      onUpdate(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="group flex items-center gap-4 py-3 px-3 hover:bg-[#c2956e]/5 rounded-2xl transition-all duration-200">
        
        {/* LARGE CHECKBOX (22px) */}
        <div 
          onClick={() => onUpdate(task.id, { is_completed: !task.is_completed })}
          className={`w-[22px] h-[22px] shrink-0 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
            task.is_completed 
              ? 'bg-[#7ca982] border-[#7ca982] shadow-sm shadow-[#7ca982]/20' 
              : 'border-[#e0ddd5] bg-white hover:border-[#c2956e]'
          }`}
        >
          {task.is_completed && <Check size={14} className="text-white stroke-[3px]" />}
        </div>

        {/* TITLE */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              className="w-full bg-transparent border-b-2 border-[#c2956e] outline-none text-[#3d3b33] py-0.5 text-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            />
          ) : (
            <span 
              onClick={() => setIsEditing(true)}
              className={`block truncate text-lg font-medium cursor-text transition-all ${
                task.is_completed ? 'text-[#888] line-through opacity-50' : 'text-[#3d3b33]'
              }`}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-[#e0ddd5]/50">
          <button onClick={() => onMove(task.id, 'up')} className="p-1.5 hover:bg-[#f7f5f0] rounded-md text-gray-400 hover:text-[#c2956e]">
            <ChevronUp size={16} />
          </button>
          <button onClick={() => onMove(task.id, 'down')} className="p-1.5 hover:bg-[#f7f5f0] rounded-md text-gray-400 hover:text-[#c2956e]">
            <ChevronDown size={16} />
          </button>
          <button onClick={() => onAdd(task.id)} className="p-1.5 hover:bg-[#f7f5f0] rounded-md text-gray-400 hover:text-[#7ca982]">
            <Plus size={16} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 hover:bg-[#f7f5f0] rounded-md text-gray-400 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* CHILDREN (Improved Indentation with vertical line) */}
      {task.children && task.children.length > 0 && (
        <div className="ml-[23px] pl-6 border-l-2 border-[#e0ddd5]/40 mt-1 space-y-1">
          {task.children.map(child => (
            <RecursiveCheckbox 
              key={child.id} 
              task={child} 
              onUpdate={onUpdate} 
              onDelete={onDelete} 
              onAdd={onAdd}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}