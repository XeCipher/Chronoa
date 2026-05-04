// frontend/components/home/HomeTaskProgress.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUiStore } from "@/store/uiStore";
import { CheckCircle2, ListTodo } from "lucide-react";

export default function HomeTaskProgress() {
  const { showHomeTaskProgress } = useUiStore();
  const [routinePct, setRoutinePct] = useState(0);
  const [normalLeft, setNormalLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  const showFull = isExpanded || isHovered;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
       document.removeEventListener("mousedown", handleClickOutside);
       document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!showHomeTaskProgress) return;

    const fetchTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('tasks')
        .select('task_type, is_completed, deleted_at')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (data) {
        const routines = data.filter(t => t.task_type === 'routine');
        const normals = data.filter(t => t.task_type === 'normal' && !t.is_completed);
        
        const routineTotal = routines.length;
        const routineDone = routines.filter(t => t.is_completed).length;
        
        const newPct = routineTotal === 0 ? 0 : Math.round((routineDone / routineTotal) * 100);
        setRoutinePct(newPct);
        setNormalLeft(normals.length);
      }
      setLoading(false);
    };

    fetchTasks();

    const channel = supabase.channel('home_tasks_progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showHomeTaskProgress]);

  if (!showHomeTaskProgress || loading) return null;

  return (
    <div className="relative animate-fade-up z-40">
      <div 
        ref={widgetRef}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setIsHovered(true); }}
        onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) setIsHovered(false); }}
        className={`flex items-start bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 transition-all duration-500 ease-in-out shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer overflow-hidden rounded-[2rem]
          ${showFull ? 'flex-col p-4 md:p-5 gap-3 max-w-[240px]' : 'flex-row p-2 gap-2 max-w-[120px]'}
        `}
      >
        
        {/* Routine Section */}
        <div className={`flex items-center ${showFull ? 'w-full' : 'w-auto'}`}>
          <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0 transition-transform duration-500 bg-white/20 dark:bg-black/40 rounded-full">
            <svg className="absolute inset-0 w-10 h-10 md:w-12 md:h-12 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5]/50 dark:stroke-white/10" strokeWidth="3" />
              <circle 
                cx="18" cy="18" r="16" fill="none" 
                className="stroke-[#7ca982] transition-all duration-1000 ease-out" 
                strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - routinePct} strokeLinecap="round" 
              />
            </svg>
            <span className="text-[8px] md:text-[9px] font-bold text-[#3d3b33] dark:text-white tabular-nums">{routinePct}%</span>
          </div>
          
          <div className={`flex flex-col justify-center transition-all duration-500 ease-in-out ${showFull ? 'ml-3 opacity-100 max-w-[140px]' : 'ml-0 opacity-0 max-w-0'} overflow-hidden whitespace-nowrap`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] dark:text-[#8cbd92] flex items-center gap-1">
              <CheckCircle2 size={12}/> Routine
            </span>
            <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Daily Progress</span>
          </div>
        </div>

        {/* Separator */}
        <div className={`transition-all duration-500 ease-in-out bg-[#3d3b33]/15 dark:bg-white/15 ${showFull ? 'w-full h-px opacity-100' : 'hidden opacity-0'}`} />

        {/* Normal Tasks Section */}
        <div className={`flex items-center ${showFull ? 'w-full' : 'w-auto'}`}>
          <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shrink-0 transition-all duration-500 ${normalLeft >= 1 ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'bg-white/40 dark:bg-black/40 text-[#c2956e] dark:text-[#d1a784]'}`}>
            <span className="text-base md:text-lg font-serif tabular-nums">{normalLeft}</span>
          </div>
          
          <div className={`flex flex-col justify-center transition-all duration-500 ease-in-out ${showFull ? 'ml-3 opacity-100 max-w-[140px]' : 'ml-0 opacity-0 max-w-0'} overflow-hidden whitespace-nowrap`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${normalLeft >= 1 ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#c2956e] dark:text-[#d1a784]'}`}>
              <ListTodo size={12}/> Tasks
            </span>
            <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Remaining</span>
          </div>
        </div>

      </div>
    </div>
  );
}