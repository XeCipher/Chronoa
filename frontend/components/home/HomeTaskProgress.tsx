// frontend/components/home/HomeTaskProgress.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUiStore } from "@/store/uiStore";
import { CheckCircle2, ListTodo } from "lucide-react";
import { usePathname } from "next/navigation";

export default function HomeTaskProgress() {
  const { showHomeTaskProgress } = useUiStore();
  const pathname = usePathname();
  
  // Synchronously initialize state with localStorage to completely eliminate the mount flicker
  const [routinePct, setRoutinePct] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('chronoa_cache_home_task_routine_pct');
      return cached ? parseInt(cached, 10) : 0;
    }
    return 0;
  });
  
  const [normalLeft, setNormalLeft] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('chronoa_cache_home_task_normal_left');
      return cached ? parseInt(cached, 10) : 0;
    }
    return 0;
  });
  
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chronoa_cache_home_task_routine_pct') === null;
    }
    return true;
  });
  
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

  const fetchTasks = useCallback(async () => {
    if (!showHomeTaskProgress) return;
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
      
      localStorage.setItem('chronoa_cache_home_task_routine_pct', newPct.toString());
      localStorage.setItem('chronoa_cache_home_task_normal_left', normals.length.toString());
    }
    setLoading(false);
  }, [showHomeTaskProgress]);

  useEffect(() => {
    if (!showHomeTaskProgress) return;

    fetchTasks();

    const channel = supabase.channel('home_tasks_progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe();

    const handleFocusAndVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchTasks();
      }
    };

    window.addEventListener('focus', handleFocusAndVisibility);
    window.addEventListener('visibilitychange', handleFocusAndVisibility);
    // Interval ensures automated updates if laptop stays continually powered on
    const intervalId = setInterval(fetchTasks, 5 * 60 * 1000);

    return () => { 
      supabase.removeChannel(channel); 
      window.removeEventListener('focus', handleFocusAndVisibility);
      window.removeEventListener('visibilitychange', handleFocusAndVisibility);
      clearInterval(intervalId);
    };
  }, [showHomeTaskProgress, fetchTasks]);

  // Next.js Router specific effect to guarantee a data refresh on direct navigation to `/home`
  useEffect(() => {
    if (showHomeTaskProgress && pathname === '/home') {
      fetchTasks();
    }
  }, [pathname, showHomeTaskProgress, fetchTasks]);

  if (!showHomeTaskProgress || loading) return null;

  return (
    <div 
      ref={widgetRef}
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setIsHovered(true); }}
      onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) setIsHovered(false); }}
      className={`flex bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 transition-all duration-500 ease-in-out shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer overflow-hidden rounded-[2rem] animate-fade-up z-40
        ${showFull ? 'flex-col items-start p-4 md:p-5 gap-3 w-[180px] md:w-[200px]' : 'flex-row items-center p-1.5 md:p-2 h-[48px] md:h-[56px] w-[90px] md:w-[104px] gap-1.5 md:gap-2'}
      `}
    >
      
      {/* Routine Section */}
      <div className={`flex items-center ${showFull ? 'w-full' : 'w-auto'}`}>
        <div className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 shrink-0 transition-transform duration-500 bg-white/20 dark:bg-black/40 rounded-full">
          <svg className="absolute inset-0 w-9 h-9 md:w-10 md:h-10 transform -rotate-90" viewBox="0 0 36 36">
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
        <div className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full shrink-0 transition-all duration-500 ${normalLeft >= 1 ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'bg-white/20 dark:bg-black/20 border border-black/10 dark:border-white/10 text-[#3d3b33] dark:text-white'}`}>
          <span className="text-[14px] md:text-[15px] font-semibold tabular-nums">{normalLeft}</span>
        </div>
        
        <div className={`flex flex-col justify-center transition-all duration-500 ease-in-out ${showFull ? 'ml-3 opacity-100 max-w-[140px]' : 'ml-0 opacity-0 max-w-0'} overflow-hidden whitespace-nowrap`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${normalLeft >= 1 ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#c2956e] dark:text-[#d1a784]'}`}>
            <ListTodo size={12}/> Tasks
          </span>
          <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Remaining</span>
        </div>
      </div>

    </div>
  );
}