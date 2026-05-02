// frontend/components/home/HomeTaskProgress.tsx
"use client";

import { useEffect, useState } from "react";
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
  
  const showFull = isExpanded || isHovered;

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
        setRoutinePct(routineTotal === 0 ? 0 : Math.round((routineDone / routineTotal) * 100));
        setNormalLeft(normals.length);
      }
      setLoading(false);
    };

    fetchTasks();

    const channel = supabase.channel('home_tasks_progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showHomeTaskProgress]);

  if (!showHomeTaskProgress || loading) return null;

  return (
    <div className="fixed md:bottom-10 md:right-10 top-6 left-6 md:top-auto md:left-auto z-40 animate-fade-up">
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex flex-col items-center bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer
          ${showFull ? 'gap-3 p-4 md:p-5 rounded-3xl' : 'gap-2 p-2 rounded-full'}
        `}
      >
        
        {/* ROW 1: Routine */}
        <div className={`flex items-center transition-all duration-500 ${showFull ? 'gap-4' : 'gap-0'}`}>
          <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0">
            <svg className="w-10 h-10 md:w-12 md:h-12 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5] dark:stroke-white/10" strokeWidth="3" />
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#7ca982] dark:stroke-[#6a9a70]" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - routinePct} strokeLinecap="round" />
            </svg>
            <span className="absolute text-[9px] md:text-[10px] font-bold text-[#3d3b33] dark:text-white">{routinePct}%</span>
          </div>
          <div className={`flex flex-col justify-center overflow-hidden whitespace-nowrap transition-all duration-500 ${showFull ? 'w-24 opacity-100 pr-2' : 'w-0 opacity-0 pr-0'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] dark:text-[#8cbd92] flex items-center gap-1"><CheckCircle2 size={12}/> Routine</span>
            <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0] mt-0.5">Daily Progress</span>
          </div>
        </div>

        {/* Divider */}
        <div className={`bg-[#3d3b33]/10 dark:bg-white/10 transition-all duration-500 ${showFull ? 'w-8 h-px opacity-100' : 'w-0 h-0 opacity-0'}`} />

        {/* ROW 2: Tasks */}
        <div className={`flex items-center transition-all duration-500 ${showFull ? 'gap-4' : 'gap-0'}`}>
          <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shrink-0 transition-colors duration-500 ${normalLeft >= 1 ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'bg-white/40 dark:bg-black/40 text-[#c2956e] dark:text-[#d1a784]'}`}>
            <span className="text-base md:text-lg font-serif italic">{normalLeft}</span>
          </div>
          <div className={`flex flex-col justify-center overflow-hidden whitespace-nowrap transition-all duration-500 ${showFull ? 'w-24 opacity-100 pr-2' : 'w-0 opacity-0 pr-0'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${normalLeft >= 1 ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#c2956e] dark:text-[#d1a784]'}`}><ListTodo size={12}/> Tasks</span>
            <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0] mt-0.5">Remaining</span>
          </div>
        </div>

      </div>
    </div>
  );
}