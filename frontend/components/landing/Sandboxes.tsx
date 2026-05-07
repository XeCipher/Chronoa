"use client";

import { useState, useEffect } from "react";
import RecursiveCheckbox from "@/components/ui/RecursiveCheckbox";
import WeekView from "@/components/calendar/WeekView";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import ProductivityChart from "@/components/analytics/ProductivityChart";
import TimeOfDayRadar from "@/components/analytics/TimeOfDayRadar";
import FocusDistribution from "@/components/analytics/FocusDistribution";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import { initialMockTasks, generateMockEvents, generateMockDailyMap } from "./MockData";
import { CheckCircle2, ListTodo, Cloud, Sun, Moon, CloudSun, CloudMoon, CloudRain, CloudDrizzle, Snowflake, CloudLightning, Wind, MapPin, Plus } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTimerStore } from "@/store/timerStore";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";
import { Task, CalendarEvent } from "@/types/app.types";

// Internal Component: Properly replicates the real SceneryBackground with mix-blend modes
function MockLandingScenery({ WTime, isDark }: { WTime: string, isDark: boolean }) {
  const WPalettes: Record<string, any> = {
    dawn: { bg: isDark ? "#1a1210" : "#fdfbf7", orb1: isDark ? "#8a4e40" : "#ffcba6", orb2: isDark ? "#8a5a44" : "#ffa68f", orb3: isDark ? "#6c4f7a" : "#d6aef2" },
    day: { bg: isDark ? "#0f1115" : "#f7f5f0", orb1: isDark ? "#2d3b5c" : "#d4b3ff", orb2: isDark ? "#1e2e42" : "#9bc7f5", orb3: isDark ? "#253828" : "#a1e3b3" },
    dusk: { bg: isDark ? "#1a1012" : "#f8f5f2", orb1: isDark ? "#7a3b4c" : "#ff8a90", orb2: isDark ? "#7a4b6c" : "#f5b0db", orb3: isDark ? "#7d4628" : "#de9c64" },
    night: { bg: isDark ? "#050810" : "#f2f4f8", orb1: isDark ? "#1f2b45" : "#9eb4db", orb2: isDark ? "#111926" : "#b9c6e3", orb3: isDark ? "#172033" : "#8da8cf" },
  };
  const current = WPalettes[WTime];
  return (
    <div className="absolute inset-0 -z-50 overflow-hidden transition-colors duration-[3000ms] rounded-[2.5rem]" style={{ backgroundColor: current.bg }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes mockFloat1 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.7; } 33% { transform: translate(50px, -50px) scale(1.1); opacity: 0.9; } 66% { transform: translate(-30px, 20px) scale(0.9); opacity: 0.6; } }
        @keyframes mockFloat2 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.7; } 33% { transform: translate(-50px, 50px) scale(1.2); opacity: 0.5; } 66% { transform: translate(40px, -30px) scale(0.8); opacity: 0.9; } }
        @keyframes mockFloat3 { 0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.5; } 33% { transform: translate(30px, 40px) scale(0.9); opacity: 0.8; } 66% { transform: translate(-40px, -40px) scale(1.15); opacity: 0.4; } }
        .mock-orb-1 { animation: mockFloat1 18s ease-in-out infinite; }
        .mock-orb-2 { animation: mockFloat2 22s ease-in-out infinite; }
        .mock-orb-3 { animation: mockFloat3 25s ease-in-out infinite; }
      `}} />
      <div className="absolute inset-0 w-full h-full" style={{ opacity: isDark ? 1 : 0.8 }}>
        <div className={`mock-orb-1 absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`} style={{ backgroundColor: current.orb1 }} />
        <div className={`mock-orb-2 absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`} style={{ backgroundColor: current.orb2 }} />
        <div className={`mock-orb-3 absolute top-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`} style={{ backgroundColor: current.orb3 }} />
      </div>
    </div>
  );
}

// Internal Component: Explicit clock
function MockCenterClock({ isDark }: { isDark: boolean }) {
  const [time, setTime] = useState<Date | null>(null);
  
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (!time) return <div className="h-[160px] md:h-[200px]" />;
  
  return (
    <div className="flex flex-col items-center justify-center select-none pointer-events-none transition-colors w-full z-10 -translate-y-8" style={{ filter: isDark ? 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
       <div className="flex items-baseline justify-center">
         <h1 className="text-[90px] md:text-[140px] lg:text-[180px] tracking-tight leading-none" style={{ fontFamily: 'var(--font-cormorant), serif', color: isDark ? '#f0f0f0' : '#3d3b33' }}>
           {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
         </h1>
         <span className="text-xl md:text-3xl ml-2 md:ml-4 font-sans font-medium tracking-[0.2em] uppercase" style={{ color: isDark ? '#b0855f' : '#c2956e' }}>
           {time.getHours() >= 12 ? "PM" : "AM"}
         </span>
       </div>
       <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-8 opacity-85 transition-colors">
         <div className="w-8 md:w-24 h-px" style={{ backgroundColor: isDark ? 'rgba(176,133,95,0.4)' : 'rgba(194,149,110,0.4)' }} />
         <p className="text-[9px] md:text-[14px] tracking-[0.4em] md:tracking-[0.6em] uppercase font-bold text-center" style={{ color: isDark ? '#e0e0e0' : '#3d3b33' }}>
           {time.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
         </p>
         <div className="w-8 md:w-24 h-px" style={{ backgroundColor: isDark ? 'rgba(176,133,95,0.4)' : 'rgba(194,149,110,0.4)' }} />
       </div>
    </div>
  );
}

// Internal Component: Replicates true weather widget expandable layout identically.
function MockWeatherWidget({ isDark }: { isDark: boolean }) {
  const [weather, setWeather] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current=temperature_2m,weather_code,is_day,precipitation,cloud_cover&timezone=auto&forecast_days=1`);
        const data = await res.json();
        if (data?.current) setWeather(data.current);
      } catch(e) {}
    };
    fetchWeather();
  }, []);

  const getWeatherDetails = (code: number, isDay: number, precipitation: number, cloudCover: number) => {
    const day = isDay === 1;
    let calibratedCode = code;

    if (precipitation <= 0 && (code >= 50)) {
      if (cloudCover < 20) calibratedCode = 0; 
      else if (cloudCover < 50) calibratedCode = 1; 
      else calibratedCode = 3; 
    }

    if (calibratedCode === 0) return { text: day ? "Sunny" : "Clear", icon: day ? Sun : Moon, color: day ? "#f59e0b" : "#a5b4fc" };
    if ([1, 2].includes(calibratedCode)) return { text: "Partly Cloudy", icon: day ? CloudSun : CloudMoon, color: "#9ca3af" };
    if (calibratedCode === 3) return { text: "Cloudy", icon: Cloud, color: "#6b7280" };
    if ([45, 48].includes(calibratedCode)) return { text: "Foggy", icon: Wind, color: "#9ca3af" };
    if ([51, 53, 55, 56, 57].includes(calibratedCode)) return { text: "Drizzle", icon: CloudDrizzle, color: "#93c5fd" };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(calibratedCode)) return { text: "Rainy", icon: CloudRain, color: "#3b82f6" };
    if ([71, 73, 75, 77, 85, 86].includes(calibratedCode)) return { text: "Snowy", icon: Snowflake, color: "#dbeafe" };
    if ([95, 96, 99].includes(calibratedCode)) return { text: "Storms", icon: CloudLightning, color: "#a855f7" };
    return { text: day ? "Sunny" : "Clear", icon: day ? Sun : Moon, color: day ? "#f59e0b" : "#a5b4fc" };
  };

  if (!weather) return null;
  const details = getWeatherDetails(weather.weather_code, weather.is_day, weather.precipitation, weather.cloud_cover);
  const Icon = details.icon;

  const bgGlass = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)';
  const borderGlass = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  const textColor = isDark ? '#fff' : '#3d3b33';
  const textMuted = isDark ? '#a0a0a0' : '#b0ad9a';

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-1.5 md:p-2 cursor-default transition-all duration-500 ease-in-out h-[48px] md:h-[56px] overflow-hidden backdrop-blur-xl"
      style={{ backgroundColor: bgGlass, borderColor: borderGlass, maxWidth: isHovered ? '250px' : '104px', paddingRight: isHovered ? '20px' : '8px' }}
    >
      <div className="flex items-center w-[78px] md:w-[88px] shrink-0 justify-between">
        <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shrink-0" style={{ backgroundColor: bgGlass, color: details.color }}>
          <Icon size={18} strokeWidth={2.5} className="md:w-[20px] md:h-[20px]" />
        </div>
        <span className="flex-1 text-center text-[14px] md:text-[15px] font-semibold tabular-nums" style={{ color: textColor }}>
          {Math.round(weather.temperature_2m)}°
        </span>
      </div>
      <div className="flex overflow-hidden transition-all duration-500 ease-in-out" style={{ maxWidth: isHovered ? '150px' : '0px', opacity: isHovered ? 1 : 0, marginLeft: isHovered ? '8px' : '0px' }}>
        <div className="whitespace-nowrap flex flex-col justify-center border-l pl-2.5 md:pl-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(61,59,51,0.15)' }}>
          <span className="text-[10px] md:text-[11px] font-semibold leading-tight tracking-wide" style={{ color: textColor }}>
            {details.text}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest leading-tight flex items-center gap-1 mt-0.5" style={{ color: textMuted }}>
            <MapPin size={8} /> Mumbai
          </span>
        </div>
      </div>
    </div>
  );
}

// Internal Component: Task Progress Widget
function MockHomeTaskProgress({ isDark }: { isDark: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const bgGlass = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)';
  const borderGlass = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  const textColor = isDark ? '#f0f0f0' : '#3d3b33';
  const routinePct = 75;
  const normalLeft = 4;

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex transition-all duration-500 ease-in-out shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer overflow-hidden rounded-[2rem] z-40 backdrop-blur-xl"
      style={{
        backgroundColor: bgGlass, borderColor: borderGlass,
        flexDirection: isHovered ? 'column' : 'row',
        alignItems: isHovered ? 'flex-start' : 'center',
        padding: isHovered ? '16px 20px' : '8px',
        gap: isHovered ? '12px' : '8px',
        width: isHovered ? '200px' : '104px',
        height: isHovered ? 'auto' : '56px'
      }}
    >
      <div className={`flex items-center ${isHovered ? 'w-full' : 'w-auto'}`}>
        <div className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 shrink-0 transition-transform duration-500 rounded-full" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)' }}>
          <svg className="absolute inset-0 w-9 h-9 md:w-10 md:h-10 transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5]/50 dark:stroke-white/10" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#7ca982] transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - routinePct} strokeLinecap="round" />
          </svg>
          <span className="text-[8px] md:text-[9px] font-bold tabular-nums" style={{ color: textColor }}>{routinePct}%</span>
        </div>
        <div className={`flex flex-col justify-center transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap`} style={{ marginLeft: isHovered ? '12px' : '0px', opacity: isHovered ? 1 : 0, maxWidth: isHovered ? '140px' : '0px' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] flex items-center gap-1"><CheckCircle2 size={12}/> Routine</span>
          <span className="text-sm font-medium" style={{ color: textColor }}>Daily Progress</span>
        </div>
      </div>

      <div className="transition-all duration-500 ease-in-out" style={{ width: '100%', height: '1px', backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(61,59,51,0.15)', display: isHovered ? 'block' : 'none', opacity: isHovered ? 1 : 0 }} />

      <div className={`flex items-center ${isHovered ? 'w-full' : 'w-auto'}`}>
        <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full shrink-0 transition-all duration-500 bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md">
          <span className="text-[14px] md:text-[15px] font-semibold tabular-nums">{normalLeft}</span>
        </div>
        <div className={`flex flex-col justify-center transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap`} style={{ marginLeft: isHovered ? '12px' : '0px', opacity: isHovered ? 1 : 0, maxWidth: isHovered ? '140px' : '0px' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#c2956e] dark:text-[#d1a784] flex items-center gap-1"><ListTodo size={12}/> Tasks</span>
          <span className="text-sm font-medium" style={{ color: textColor }}>Remaining</span>
        </div>
      </div>
    </div>
  );
}

// Internal Component: Mock Global Time Widget
function MockGlobalTimeWidget() {
  const store = useTimerStore();
  const hasRunning = store.timers.some(i => i.isRunning) || store.stopwatches.some(i => i.isRunning);

  const [time, setTime] = useState<Date | null>(null);
  
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  return (
    <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex items-center gap-3 bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 md:px-6 py-2.5 md:py-3.5 shadow-lg pointer-events-none scale-75 md:scale-100 origin-bottom-right z-30 transition-all">
      <span className="text-[#3d3b33] dark:text-[#f0f0f0] font-serif text-lg md:text-xl leading-none">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <div className={`relative z-10 rounded-full transition-all duration-500 ${hasRunning ? 'w-2.5 h-2.5 bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'w-[3px] h-3.5 bg-[#c2956e] dark:bg-[#b0855f]'}`} />
      <span className="text-[#b0ad9a] dark:text-[#888] font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em] leading-none mt-0.5">
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

export function MockHomeSandbox() {
  const [isDark, setIsDark] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'dawn'|'day'|'dusk'|'night'>('day');

  useEffect(() => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const globalTheme = localStorage.getItem('chronoa-settings'); 
    let dark = false;
    if (globalTheme && globalTheme.includes('"theme":"dark"')) dark = true;
    else if (globalTheme && globalTheme.includes('"theme":"system"') && isSystemDark) dark = true;
    else if (!globalTheme && isSystemDark) dark = true;
    setIsDark(dark);

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) setTimeOfDay('dawn');
    else if (hour >= 8 && hour < 17) setTimeOfDay('day');
    else if (hour >= 17 && hour < 20) setTimeOfDay('dusk');
    else setTimeOfDay('night');
  }, []);

  return (
    <div className="relative w-full h-[450px] md:h-[600px] rounded-[2.5rem] overflow-hidden border border-[#e0ddd5] dark:border-[#333] shadow-2xl flex flex-col items-center justify-center isolate">
      <MockLandingScenery WTime={timeOfDay} isDark={isDark} />
      
      <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col gap-3 items-end z-40">
        <MockWeatherWidget isDark={isDark} />
        <MockHomeTaskProgress isDark={isDark} />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center z-10 w-full px-4">
        <MockCenterClock isDark={isDark} />
      </div>

      <div className="absolute bottom-6 md:bottom-8 flex flex-col md:flex-row gap-2 md:gap-3 items-center z-20">
        <div className="flex items-center gap-1 bg-white/40 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/50 dark:border-white/10 shadow-xl">
          <button onClick={() => setIsDark(false)} className={`p-2 rounded-full transition-all ${!isDark ? 'bg-white text-[#c2956e] shadow-sm' : 'text-[#888] hover:text-[#3d3b33]'}`}><Sun size={14}/></button>
          <button onClick={() => setIsDark(true)} className={`p-2 rounded-full transition-all ${isDark ? 'bg-[#222] text-[#d1a784] shadow-sm' : 'text-[#888] hover:text-white'}`}><Moon size={14}/></button>
        </div>
        <div className="flex items-center gap-1 bg-white/40 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/50 dark:border-white/10 shadow-xl">
          {(['dawn', 'day', 'dusk', 'night'] as const).map(t => (
            <button key={t} onClick={() => setTimeOfDay(t)} className={`px-4 md:px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${timeOfDay === t ? (isDark ? 'bg-[#222] text-[#d1a784]' : 'bg-white text-[#c2956e]') + ' shadow-sm' : (isDark ? 'text-[#a0a0a0] hover:text-white' : 'text-[#888] hover:text-[#3d3b33]')}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MockTaskSandbox() {
  const [tasks, setTasks] = useState<Task[]>(initialMockTasks);

  const onUpdate = (id: string, updates: any) => {
    setTasks(prev => {
       let next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
       if (updates.is_completed !== undefined) {
         // Auto complete children when a parent is ticked
         const setChildren = (parentId: string, status: boolean) => {
           next = next.map(t => {
             if (t.parent_id === parentId) {
               setChildren(t.id, status);
               return { ...t, is_completed: status };
             }
             return t;
           });
         }
         setChildren(id, updates.is_completed);

         // Auto complete parent if all its siblings get ticked
         const checkParent = (taskId: string) => {
           const t = next.find(x => x.id === taskId);
           if (t && t.parent_id) {
             const siblings = next.filter(x => x.parent_id === t.parent_id);
             const allDone = siblings.every(x => x.is_completed);
             next = next.map(x => x.id === t.parent_id ? { ...x, is_completed: allDone } : x);
             checkParent(t.parent_id);
           }
         };
         checkParent(id);
       }
       return next;
    });
  };

  const onDelete = (id: string) => {
    const idsToDelete = [id];
    const findChildren = (parentId: string) => {
      tasks.filter(t => t.parent_id === parentId).forEach(child => {
          idsToDelete.push(child.id);
          findChildren(child.id);
      });
    };
    findChildren(id);
    setTasks(prev => prev.filter(t => !idsToDelete.includes(t.id)));
  };

  const onIndent = (task: Task) => {
    const siblings = tasks.filter(t => t.parent_id === task.parent_id).sort((a,b) => a.position - b.position);
    const idx = siblings.findIndex(t => t.id === task.id);
    if (idx > 0) {
      const newParentId = siblings[idx - 1].id;
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, parent_id: newParentId } : t));
    }
  };

  const onUnindent = (task: Task) => {
    if (!task.parent_id) return;
    const parent = tasks.find(t => t.id === task.parent_id);
    if (parent) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, parent_id: parent.parent_id } : t));
    }
  };

  const onAdd = (type: 'routine' | 'normal', parentId: string | null) => {
    const newTask = {
      id: Math.random().toString(),
      user_id: 'mock',
      title: "New Item",
      task_type: type,
      parent_id: parentId,
      position: tasks.length,
      is_completed: false,
      created_at: new Date().toISOString(),
      completed_at: null,
      deleted_at: null,
      color: null,
      keep_alive: false,
      is_collapsed: false,
      children: []
    } as Task;
    
    setTasks([...tasks, newTask]);
  };

  const map: Record<string, Task> = {};
  tasks.forEach(t => map[t.id] = { ...t, children: [] });
  const roots: Task[] = [];
  tasks.forEach(t => {
    if (t.parent_id && map[t.parent_id]) map[t.parent_id].children!.push(map[t.id]);
    else roots.push(map[t.id]);
  });

  const routines = roots.filter(t => t.task_type === 'routine');
  const normals = roots.filter(t => t.task_type === 'normal');

  const totalRoutines = tasks.filter(t => t.task_type === 'routine').length;
  const doneRoutines = tasks.filter(t => t.task_type === 'routine' && t.is_completed).length;
  const routinePct = totalRoutines === 0 ? 0 : Math.round((doneRoutines / totalRoutines) * 100);
  
  const normalLeft = tasks.filter(t => t.task_type === 'normal' && !t.is_completed && t.parent_id).length;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center max-w-2xl mx-auto mb-4 px-4">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Frictionless Workflows</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A deeply intuitive task manager featuring infinite nesting, hotkey navigation, and soothing vanishing animations. Tick off parent routines to see children seamlessly resolve. Add to calendar works perfectly.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full h-auto lg:h-[500px]">
        {/* Routines Window */}
        <div className="w-full lg:w-1/2 flex flex-col h-[400px] lg:h-full bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-sm">
          <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 border-b border-[#f0ede8] dark:border-[#2a2a2a] flex flex-col gap-3 shrink-0">
             <div className="flex justify-between items-center">
                 <h2 className="text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0] font-serif font-medium tracking-tight">Routines</h2>
                 <button onClick={() => onAdd('routine', null)} className="w-8 h-8 rounded-full bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] flex items-center justify-center border border-[#e0ddd5] dark:border-[#333] hover:bg-[#c2956e]/10 transition-colors"><Plus size={16}/></button>
             </div>
             {totalRoutines > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-24 md:w-28 h-[3px] bg-[#ebe8e2] dark:bg-[#333] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7ca982] dark:bg-[#6a9a70] rounded-full transition-all duration-500" style={{ width: `${routinePct}%` }} />
                  </div>
                  <span className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] tracking-wide">{routinePct}%</span>
                </div>
             )}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-5 space-y-[2px]">
             {routines.map(t => (
               <RecursiveCheckbox key={t.id} task={t} isEditMode={true} viewMode="focus" allTasks={tasks} onUpdate={onUpdate} onDelete={(id) => onDelete(id)} onRestore={() => {}} onAdd={(pId) => onAdd('routine', pId)} onIndent={onIndent} onUnindent={onUnindent} onMoveUp={() => {}} onMoveDown={() => {}} newTaskId={null} setNewTaskId={() => {}} />
             ))}
          </div>
        </div>

        {/* Tasks Window */}
        <div className="w-full lg:w-1/2 flex flex-col h-[400px] lg:h-full bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-sm">
          <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 border-b border-[#f0ede8] dark:border-[#2a2a2a] flex flex-col gap-3 shrink-0">
             <div className="flex justify-between items-center">
                 <h2 className="text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0] font-serif font-medium tracking-tight">Tasks & Ideas</h2>
                 <button onClick={() => onAdd('normal', null)} className="w-8 h-8 rounded-full bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] flex items-center justify-center border border-[#e0ddd5] dark:border-[#333] hover:bg-[#c2956e]/10 transition-colors"><Plus size={16}/></button>
             </div>
             {normalLeft > 0 && (
                <div className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] tracking-wide mt-0.5">{normalLeft} Remaining</div>
             )}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-5 space-y-[2px]">
             {normals.map(t => (
               <RecursiveCheckbox key={t.id} task={t} isEditMode={true} viewMode="focus" allTasks={tasks} onUpdate={onUpdate} onDelete={(id) => onDelete(id)} onRestore={() => {}} onAdd={(pId) => onAdd('normal', pId)} onIndent={onIndent} onUnindent={onUnindent} onMoveUp={() => {}} onMoveDown={() => {}} newTaskId={null} setNewTaskId={() => {}} />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MockTimeSandbox() {
  useEffect(() => {
    useTimerStore.setState({
      timers:[{ id: 'mock-1', title: 'Deep Work Block', targetMinutes: 25, accumulatedSeconds: 0, isRunning: false, startTime: null }],
      stopwatches:[{ id: 'mock-2', title: 'Reading Documentation', accumulatedSeconds: 900, isRunning: true, startTime: Date.now() }], 
      activeTab: 'stopwatch'
    });
  },[]);

  return (
    <div className="w-full py-16 bg-[#fdfbf7] dark:bg-[#161616] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] md:rounded-[3rem] my-10 flex flex-col items-center relative overflow-hidden shadow-sm min-h-[400px]">
      <div className="text-center max-w-xl mx-auto mb-10 px-4">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Own Your Time</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Aesthetically pleasing, millisecond-accurate timers and stopwatches that synchronize in real-time across your phone and laptop.
        </p>
      </div>
      <div className="w-full relative z-10 mb-6 md:mb-10">
        <ProductivityWidgets isVisible={true} />
      </div>
      <MockGlobalTimeWidget />
    </div>
  );
}

export function MockCalendarSandbox() {
  const [events, setEvents] = useState<CalendarEvent[]>(generateMockEvents());
  
  useEffect(() => {
    const handleAddToCal = (e: any) => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(end.getHours() + 1);
      
      const newEvent = {
        id: Math.random().toString(),
        title: e.detail.title,
        start_time: now.toISOString(),
        end_time: end.toISOString(),
        color: 'amber',
        is_all_day: false,
        is_readonly: false,
        user_id: 'mock'
      } as CalendarEvent;
      
      setEvents(prev => [...prev, newEvent]);
    };
    window.addEventListener('chronoa-add-to-calendar', handleAddToCal);
    return () => window.removeEventListener('chronoa-add-to-calendar', handleAddToCal);
  }, []);

  const EVENT_COLORS: Record<string, string> = {
    amber: 'bg-[#c2956e]/20 dark:bg-[#c2956e]/20 text-[#9e7653] dark:text-[#d1a784] border-[#c2956e]/30',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  const handleEventMove = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, start_time: newStart.toISOString(), end_time: newEnd.toISOString() } : e));
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-8 items-center w-full my-20">
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">Your Days, Visualized</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A gorgeous drag-and-drop calendar built right in. Sync your existing Google & Apple calendars instantly, or subscribe to public <b>.ics</b> links like Formula 1 schedules or national holidays. Notice how seamlessly events overlap and split space. Try adding a task to the calendar from the section above!
        </p>
      </div>
      <div className="w-full lg:w-2/3 h-[400px] md:h-[500px] relative pointer-events-auto">
        <WeekView 
          currentDate={new Date()} events={events} onEventClick={() => {}} onTimeRangeSelected={() => {}} onEventMove={handleEventMove} 
          eventColors={EVENT_COLORS} targetScrollTime={null} daysCount={3}
        />
      </div>
    </div>
  );
}

export function MockNotesSandbox() {
  const initialHtml = `<h1>A Blank Canvas</h1><p>Chronoa provides a completely distraction-free markdown environment for your thoughts, meeting notes, and daily journaling.</p><p>Go ahead, <strong>type something here</strong>. Use standard markdown shortcuts or highlight text to style it.</p>`;
  
  return (
    <div className="w-full flex flex-col gap-6 my-10 md:my-20">
      <div className="text-center max-w-2xl mx-auto mb-4 px-4">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Clarity & Focus</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Beautiful text formatting that stays out of your way. Zoom in and out instantly with intuitive controls.
        </p>
      </div>
      <div className="mock-editor-container w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-12 shadow-2xl h-[350px] md:h-[500px] overflow-y-auto no-scrollbar [&_button[data-tooltip-id='global-tooltip'][data-tooltip-content*='Fullscreen']]:!hidden">
        <DistractionFreeEditor initialContent={initialHtml} onSave={() => {}} noteType="notes" />
      </div>
    </div>
  );
}

export function MockAnalyticsSandbox() {
  const dailyMap = generateMockDailyMap();
  const rawSessions = [
    { title: 'Deep Work', duration_seconds: 18000 },
    { title: 'Reading', duration_seconds: 7200 },
    { title: 'Emails', duration_seconds: 3600 },
    { title: 'Planning', duration_seconds: 2400 }
  ];

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8 my-10 md:my-20">
      <div className="text-center max-w-2xl mx-auto mb-4 px-4">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Insights That Matter</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Chronoa passively analyzes your activity, helping you discover your peak performance hours, flow states, and focus distribution. 
        </p>
      </div>
      <div className="w-full">
        <ActivityHeatmap dailyMap={dailyMap} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityChart dailyMap={dailyMap} />
        </div>
        <div className="lg:col-span-1">
          <TimeOfDayRadar dailyMap={dailyMap} />
        </div>
      </div>
      <div className="w-full mt-2">
        <FocusDistribution rawSessions={rawSessions} />
      </div>
    </div>
  );
}