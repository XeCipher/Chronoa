"use client";

import { useState, useEffect } from "react";
import RecursiveCheckbox from "@/components/ui/RecursiveCheckbox";
import WeekView from "@/components/calendar/WeekView";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import ProductivityChart from "@/components/analytics/ProductivityChart";
import TimeOfDayRadar from "@/components/analytics/TimeOfDayRadar";
import FocusDistribution from "@/components/analytics/FocusDistribution";
import { initialMockTasks, generateMockEvents, generateMockDailyMap } from "./MockData";
import { CheckCircle2, ListTodo, Cloud, Sun, Moon, CloudSun, CloudMoon, CloudRain, CloudDrizzle, Snowflake, CloudLightning, Wind, MapPin } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTimerStore } from "@/store/timerStore";
import ProductivityWidgets from "@/components/home/ProductivityWidgets";

// Internal Component: Completely isolated background injection for the Sandbox to not be overridden by the global `.dark` tag on `html`.
function MockLandingScenery({ WTime, isDark }: { WTime: string, isDark: boolean }) {
  const WPalettes: Record<string, any> = {
    dawn: { bg: isDark ? "#1a1210" : "#fdfbf7", orb1: isDark ? "#8a4e40" : "#ffcba6", orb2: isDark ? "#8a5a44" : "#ffa68f", orb3: isDark ? "#6c4f7a" : "#d6aef2" },
    day: { bg: isDark ? "#0f1115" : "#f7f5f0", orb1: isDark ? "#2d3b5c" : "#d4b3ff", orb2: isDark ? "#1e2e42" : "#9bc7f5", orb3: isDark ? "#253828" : "#a1e3b3" },
    dusk: { bg: isDark ? "#1a1012" : "#f8f5f2", orb1: isDark ? "#7a3b4c" : "#ff8a90", orb2: isDark ? "#7a4b6c" : "#f5b0db", orb3: isDark ? "#7d4628" : "#de9c64" },
    night: { bg: isDark ? "#050810" : "#f2f4f8", orb1: isDark ? "#1f2b45" : "#9eb4db", orb2: isDark ? "#111926" : "#b9c6e3", orb3: isDark ? "#172033" : "#8da8cf" },
  };
  const current = WPalettes[WTime];
  return (
    <div className="absolute inset-0 -z-50 overflow-hidden transition-colors duration-[2000ms] rounded-[2.5rem]" style={{ backgroundColor: current.bg }}>
      <div className="absolute inset-0 w-full h-full mix-blend-overlay" style={{ opacity: isDark ? 1 : 0.8 }}>
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[100px] transition-colors duration-[2000ms]" style={{ backgroundColor: current.orb1 }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full filter blur-[100px] transition-colors duration-[2000ms]" style={{ backgroundColor: current.orb2 }} />
        <div className="absolute top-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full filter blur-[100px] transition-colors duration-[2000ms]" style={{ backgroundColor: current.orb3 }} />
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
    <div className="flex flex-col items-center justify-center select-none pointer-events-none transition-colors w-full z-10" style={{ filter: isDark ? 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
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

// Internal Component: Completely working weather fetching widget tailored for sandbox isolated colors.
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
      className="absolute top-6 right-6 md:top-8 md:right-8 z-40 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-1.5 md:p-2 cursor-default transition-all duration-500 ease-in-out h-[48px] md:h-[56px] overflow-hidden"
      style={{ backgroundColor: bgGlass, borderColor: borderGlass, maxWidth: isHovered ? '250px' : '90px', paddingRight: isHovered ? '20px' : '8px' }}
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

// Internal Component: Mock Global Time Widget
function MockGlobalTimeWidget() {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  return (
    <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex items-center gap-3 bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 md:px-6 py-2.5 md:py-3.5 shadow-lg pointer-events-none scale-75 md:scale-100 origin-bottom-right z-30">
      <span className="text-[#3d3b33] dark:text-[#f0f0f0] font-serif text-lg md:text-xl leading-none">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
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
      <MockWeatherWidget isDark={isDark} />
      
      <div className="absolute inset-0 flex items-center justify-center z-10 w-full px-4">
        <MockCenterClock isDark={isDark} />
      </div>

      <div className="absolute bottom-6 md:bottom-8 flex flex-col md:flex-row gap-2 md:gap-3 items-center z-20">
        <div className="flex bg-white/40 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/50 dark:border-white/10 shadow-xl">
          <button onClick={() => setIsDark(false)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${!isDark ? 'bg-white text-[#c2956e] shadow-sm' : 'text-[#888] hover:text-[#3d3b33]'}`}>Light</button>
          <button onClick={() => setIsDark(true)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-[#222] text-[#d1a784] shadow-sm' : 'text-[#888] hover:text-white'}`}>Dark</button>
        </div>
        <div className="flex bg-white/40 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/50 dark:border-white/10 shadow-xl">
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
  const[tasks, setTasks] = useState(initialMockTasks);

  const routinePct = Math.round((tasks.filter(t => t.task_type === 'routine' && t.is_completed).length / tasks.filter(t => t.task_type === 'routine').length) * 100) || 0;
  const normalLeft = tasks.filter(t => t.task_type === 'normal' && !t.is_completed && t.parent_id).length;

  const onUpdate = (id: string, updates: any) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (updates.is_completed !== undefined) {
           const completedAt = updates.is_completed ? new Date().toISOString() : null;
           return { ...t, ...updates, completed_at: completedAt };
        }
        return { ...t, ...updates };
      }
      return t;
    }));
  };

  // Re-build tree for RecursiveCheckbox
  const map: Record<string, any> = {};
  tasks.forEach(t => map[t.id] = { ...t, children: [] });
  const roots: any[] =[];
  tasks.forEach(t => {
    if (t.parent_id && map[t.parent_id]) map[t.parent_id].children.push(map[t.id]);
    else roots.push(map[t.id]);
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">Frictionless Workflows</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A deeply intuitive task manager featuring infinite nesting, hotkey navigation, and soothing vanishing animations. Tick off the tasks below to see the progress widget react instantly.
        </p>
        <div className="flex bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-4 md:p-5 shadow-lg w-max gap-4">
          <div className="flex items-center">
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0 bg-white dark:bg-black/40 rounded-full shadow-sm">
              <svg className="absolute inset-0 w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5] dark:stroke-white/10" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#7ca982] transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - routinePct} strokeLinecap="round" />
              </svg>
              <span className="text-[9px] font-bold text-[#3d3b33] dark:text-white">{routinePct}%</span>
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] flex items-center gap-1"><CheckCircle2 size={12}/> Routine</span>
              <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Daily Progress</span>
            </div>
          </div>
          <div className="w-px bg-[#e0ddd5] dark:bg-[#333] self-stretch mx-2" />
          <div className="flex items-center">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 transition-colors ${normalLeft >= 1 ? 'bg-[#c2956e] text-white shadow-md' : 'bg-white dark:bg-black/20 text-[#3d3b33] dark:text-white border border-[#e0ddd5] dark:border-[#333]'}`}>
              <span className="text-[15px] font-semibold">{normalLeft}</span>
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#c2956e] flex items-center gap-1"><ListTodo size={12}/> Tasks</span>
              <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-5 md:p-6 shadow-xl">
        <DndContext collisionDetection={closestCenter}>
          <SortableContext items={roots.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {roots.map(t => (
              <RecursiveCheckbox
                key={t.id} task={t} isEditMode={true} viewMode="focus" allTasks={tasks}
                onUpdate={onUpdate} onDelete={() => {}} onRestore={() => {}} onAdd={() => {}} onIndent={() => {}} onUnindent={() => {}} onMoveUp={() => {}} onMoveDown={() => {}} newTaskId={null} setNewTaskId={() => {}}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export function MockTimeSandbox() {
  useEffect(() => {
    useTimerStore.setState({
      timers:[{ id: 'mock-1', title: 'Deep Work Block', targetMinutes: 25, accumulatedSeconds: 0, isRunning: false, startTime: null }],
      stopwatches:[{ id: 'mock-2', title: 'Reading Documentation', accumulatedSeconds: 900, isRunning: true, startTime: Date.now() }], // 15 mins passed visually, and currently ticking up
      activeTab: 'stopwatch'
    });
  },[]);

  return (
    <div className="w-full py-16 bg-[#fdfbf7] dark:bg-[#161616] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] md:rounded-[3rem] my-10 flex flex-col items-center relative overflow-hidden shadow-xl min-h-[400px]">
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
  const events = generateMockEvents();
  const EVENT_COLORS: Record<string, string> = {
    amber: 'bg-[#c2956e]/20 dark:bg-[#c2956e]/20 text-[#9e7653] dark:text-[#d1a784] border-[#c2956e]/30',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-8 items-center w-full my-20">
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">Your Days, Visualized</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A gorgeous drag-and-drop calendar built right in. Sync your existing Google & Apple calendars instantly, or subscribe to public <b>.ics</b> links like Formula 1 schedules or national holidays.
        </p>
      </div>
      <div className="w-full lg:w-2/3 h-[400px] md:h-[500px] relative pointer-events-none md:pointer-events-auto">
        <WeekView 
          currentDate={new Date()} events={events} onEventClick={() => {}} onTimeRangeSelected={() => {}} onEventMove={() => {}} 
          eventColors={EVENT_COLORS} targetScrollTime={null} daysCount={3}
        />
      </div>
    </div>
  );
}

export function MockNotesSandbox() {
  const initialHtml = `<h1>A Blank Canvas</h1><p>Chronoa provides a completely distraction-free markdown environment for your thoughts, meeting notes, and daily journaling.</p><p>Go ahead, <strong>type something here</strong>. Use standard markdown shortcuts or highlight text to style it.</p>`;
  
  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-12 shadow-2xl my-10 md:my-20 flex flex-col gap-6">
      <DistractionFreeEditor initialContent={initialHtml} onSave={() => {}} noteType="notes" />
    </div>
  );
}

export function MockAnalyticsSandbox() {
  const dailyMap = generateMockDailyMap();
  const rawSessions =[
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