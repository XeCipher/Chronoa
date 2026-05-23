// frontend/components/landing/Sandboxes.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import RecursiveCheckbox from "@/components/ui/RecursiveCheckbox";
import WeekView from "@/components/calendar/WeekView";
import DistractionFreeEditor from "@/components/notes/DistractionFreeEditor";
import { initialMockTasks, generateMockEvents, generateMockDailyMap, generateMockSessions } from "./MockData";
import { 
  CheckCircle2, ListTodo, Cloud, Sun, Moon, CloudSun, CloudMoon, 
  CloudRain, CloudDrizzle, Snowflake, CloudLightning, Wind, MapPin, 
  Plus, Play, Pause, Square, Trash2, Timer, CheckSquare, CalendarDays, 
  BookOpen, Navigation, FileText, Sparkles, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Task, CalendarEvent } from "@/types/app.types";

import ProductivityChart from "@/components/analytics/ProductivityChart";
import TimeOfDayRadar from "@/components/analytics/TimeOfDayRadar";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import FocusDistribution from "@/components/analytics/FocusDistribution";

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
        <div className={`mock-orb-1 absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`} style={{ backgroundColor: current.orb1 }} />
        <div className={`mock-orb-2 absolute bottom-[-20%] left-[-10%] w-[90vw] h-[90vw] md:w-[60vw] md:h-[60vw] rounded-full filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`} style={{ backgroundColor: current.orb2 }} />
        <div className={`mock-orb-3 absolute top-[20%] left-[20%] w-[75vw] h-[75vw] md:w-[45vw] md:h-[45vw] rounded-full filter blur-[100px] md:blur-[140px] transition-colors duration-[3000ms] ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`} style={{ backgroundColor: current.orb3 }} />
      </div>
    </div>
  );
}

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

function MockWeatherWidget({ isDark }: { isDark: boolean }) {
  const [weather, setWeather] = useState<any>(null);
  const [isToggled, setIsToggled] = useState(false);

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
      onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setIsToggled(true); }}
      onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) setIsToggled(false); }}
      onClick={() => setIsToggled(!isToggled)}
      className={`flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-1.5 md:p-2 cursor-pointer transition-all duration-500 ease-in-out h-[48px] md:h-[56px] overflow-hidden backdrop-blur-xl ${isToggled ? 'max-w-[250px] pr-4 md:pr-5' : 'max-w-[90px] md:max-w-[104px] md:hover:max-w-[250px] md:hover:pr-4 md:hover:pr-5'}`}
      style={{ backgroundColor: bgGlass, borderColor: borderGlass }}
    >
      <div className="flex items-center w-[78px] md:w-[88px] shrink-0 justify-between">
        <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shrink-0" style={{ backgroundColor: bgGlass, color: details.color }}>
          <Icon size={18} strokeWidth={2.5} className="md:w-[20px] md:h-[20px]" />
        </div>
        <span className="flex-1 text-center text-[14px] md:text-[15px] font-semibold tabular-nums" style={{ color: textColor }}>
          {Math.round(weather.temperature_2m)}°
        </span>
      </div>
      <div className={`flex overflow-hidden transition-all duration-500 ease-in-out ${isToggled ? 'max-w-[150px] opacity-100 ml-1.5 md:ml-2' : 'max-w-0 opacity-0 md:group-hover:max-w-[150px] md:group-hover:opacity-100 md:group-hover:ml-1.5 md:group-hover:md:ml-2'}`}>
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

function MockHomeTaskProgress({ isDark }: { isDark: boolean }) {
  const [isToggled, setIsToggled] = useState(false);
  const [stats, setStats] = useState({ routinePct: 50, normalLeft: 4 });

  useEffect(() => {
    const handler = (e: any) => setStats(e.detail);
    window.addEventListener('mock-tasks-updated', handler);
    return () => window.removeEventListener('mock-tasks-updated', handler);
  }, []);
  
  const bgGlass = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)';
  const borderGlass = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  const textColor = isDark ? '#f0f0f0' : '#3d3b33';

  return (
    <div 
      onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) setIsToggled(true); }}
      onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) setIsToggled(false); }}
      onClick={() => setIsToggled(!isToggled)}
      className={`flex transition-all duration-500 ease-in-out shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer overflow-hidden rounded-[2rem] z-40 backdrop-blur-xl ${isToggled ? 'flex-col items-start p-4 md:p-5 gap-3 w-[180px] md:w-[200px]' : 'flex-row items-center p-1.5 md:p-2 h-[48px] md:h-[56px] w-[90px] md:w-[104px] gap-1.5 md:gap-2'}`}
      style={{ backgroundColor: bgGlass, borderColor: borderGlass }}
    >
      <div className={`flex items-center ${isToggled ? 'w-full' : 'w-auto'}`}>
        <div className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 shrink-0 transition-transform duration-500 rounded-full" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)' }}>
          <svg className="absolute inset-0 w-9 h-9 md:w-10 md:h-10 transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5]/50 dark:stroke-white/10" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#7ca982] transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - stats.routinePct} strokeLinecap="round" />
          </svg>
          <span className="text-[8px] md:text-[9px] font-bold tabular-nums" style={{ color: textColor }}>{stats.routinePct}%</span>
        </div>
        <div className={`flex flex-col justify-center transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isToggled ? 'ml-3 opacity-100 max-w-[140px]' : 'ml-0 opacity-0 max-w-0'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] flex items-center gap-1"><CheckCircle2 size={12}/> Routine</span>
          <span className="text-sm font-medium" style={{ color: textColor }}>Daily Progress</span>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isToggled ? 'w-full h-px opacity-100' : 'hidden opacity-0'}`} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(61,59,51,0.15)' }} />

      <div className={`flex items-center ${isToggled ? 'w-full' : 'w-auto'}`}>
        <div className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full shrink-0 transition-all duration-500 ${stats.normalLeft >= 1 ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'bg-white/20 dark:bg-black/20 border border-black/10 dark:border-white/10 text-[#3d3b33] dark:text-white'}`}>
          <span className="text-[14px] md:text-[15px] font-semibold tabular-nums">{stats.normalLeft}</span>
        </div>
        <div className={`flex flex-col justify-center transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isToggled ? 'ml-3 opacity-100 max-w-[140px]' : 'ml-0 opacity-0 max-w-0'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${stats.normalLeft >= 1 ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#c2956e] dark:text-[#d1a784]'}`}><ListTodo size={12}/> Tasks</span>
          <span className="text-sm font-medium" style={{ color: textColor }}>Remaining</span>
        </div>
      </div>
    </div>
  );
}

function ExpandedMockTasksProgressWidget({ routinePct, normalLeft }: { routinePct: number, normalLeft: number }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center p-5 gap-6 w-full bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[2rem] shadow-sm shrink-0">
      <div className="flex items-center w-full md:w-auto flex-1">
        <div className="relative flex items-center justify-center w-12 h-12 shrink-0 bg-[#f7f5f0] dark:bg-[#252525] rounded-full">
          <svg className="absolute inset-0 w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5] dark:stroke-[#333]" strokeWidth="3" />
            <circle 
              cx="18" cy="18" r="16" fill="none" 
              className="stroke-[#7ca982] transition-all duration-1000 ease-out" 
              strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - routinePct} strokeLinecap="round" 
            />
          </svg>
          <span className="text-[10px] font-bold text-[#3d3b33] dark:text-[#f0f0f0] tabular-nums">{routinePct}%</span>
        </div>
        <div className="flex flex-col justify-center ml-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7ca982] dark:text-[#8cbd92] flex items-center gap-1.5">
            <CheckCircle2 size={14}/> Routine
          </span>
          <span className="text-base font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Daily Progress</span>
        </div>
      </div>
      <div className="hidden md:block w-px h-10 bg-[#e0ddd5] dark:bg-[#333]" />
      <div className="md:hidden h-px w-full bg-[#e0ddd5] dark:bg-[#333]" />
      <div className="flex items-center w-full md:w-auto flex-1">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 transition-all duration-500 ${normalLeft >= 1 ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'bg-[#f7f5f0] dark:bg-[#252525] text-[#888]'}`}>
          <span className="text-lg font-semibold tabular-nums">{normalLeft}</span>
        </div>
        <div className="flex flex-col justify-center ml-4">
          <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${normalLeft >= 1 ? 'text-[#c2956e] dark:text-[#d1a784]' : 'text-[#888]'}`}>
            <ListTodo size={14}/> Tasks
          </span>
          <span className="text-base font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Remaining</span>
        </div>
      </div>
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
    <div className="flex flex-col gap-5 w-full items-center">
      <div className="relative w-full h-[450px] md:h-[600px] rounded-[2.5rem] overflow-hidden border border-[#e0ddd5] dark:border-[#333] shadow-2xl flex flex-col items-center justify-center isolate">
        <MockLandingScenery WTime={timeOfDay} isDark={isDark} />
        
        <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col gap-3 items-end z-40">
          <MockWeatherWidget isDark={isDark} />
          <MockHomeTaskProgress isDark={isDark} />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center z-10 w-full px-4">
          <MockCenterClock isDark={isDark} />
        </div>
      </div>

      <div className="flex flex-row flex-wrap justify-center gap-2 md:gap-3 items-center z-20">
        <div className="flex items-center gap-1 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-full border border-[#e0ddd5] dark:border-[#333] shadow-sm">
          <button onClick={() => setIsDark(false)} className={`p-2 rounded-full transition-all cursor-pointer ${!isDark ? 'bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-[#f0f0f0]'}`}><Sun size={14}/></button>
          <button onClick={() => setIsDark(true)} className={`p-2 rounded-full transition-all cursor-pointer ${isDark ? 'bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-[#f0f0f0]'}`}><Moon size={14}/></button>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-full border border-[#e0ddd5] dark:border-[#333] shadow-sm">
          {(['dawn', 'day', 'dusk', 'night'] as const).map(t => (
            <button key={t} onClick={() => setTimeOfDay(t)} className={`px-4 md:px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${timeOfDay === t ? 'bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-[#f0f0f0]'}`}>
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
  const [stats, setStats] = useState({ routinePct: 50, normalLeft: 4 });
  const [isRoutineEditMode, setIsRoutineEditMode] = useState(false);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const totalRoutines = tasks.filter(t => t.task_type === 'routine' && t.deleted_at === null).length;
    const doneRoutines = tasks.filter(t => t.task_type === 'routine' && t.is_completed && t.deleted_at === null).length;
    const routinePct = totalRoutines === 0 ? 0 : Math.round((doneRoutines / totalRoutines) * 100);
    const normalLeft = tasks.filter(t => t.task_type === 'normal' && !t.is_completed && t.deleted_at === null).length;
    
    setStats({ routinePct, normalLeft });
    window.dispatchEvent(new CustomEvent('mock-tasks-updated', { detail: { routinePct, normalLeft } }));
  }, [tasks]);

  useEffect(() => {
    const listener = (e: any) => {
      const title = e.detail.title;
      setTasks(prev => {
        const newTask = {
          id: Math.random().toString(),
          user_id: 'mock',
          title: title,
          task_type: 'normal',
          parent_id: null,
          position: prev.length,
          is_completed: false,
          created_at: new Date().toISOString(),
          completed_at: null,
          deleted_at: null,
          color: null,
          keep_alive: false,
          is_collapsed: false,
          children: []
        } as Task;
        return [...prev, newTask];
      });
      
      const el = document.getElementById('mock-task-sandbox');
      const container = document.getElementById('landing-scroll-container');
      if (el && container) {
         const targetScrollTop = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 100;
         container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2000);
    };
    window.addEventListener('sandbox-add-task', listener);
    return () => window.removeEventListener('sandbox-add-task', listener);
  }, []);

  const onUpdate = (id: string, updates: any) => {
    setTasks(prev => {
       let next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
       
       if (updates.is_completed !== undefined) {
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

         const checkParent = (taskId: string) => {
           const currentTask = next.find(x => x.id === taskId);
           if (!currentTask?.parent_id) return;
           
           const parentTask = next.find(x => x.id === currentTask.parent_id);
           const shouldKeepAlive = parentTask?.keep_alive; 
           
           const siblings = next.filter(x => x.parent_id === currentTask.parent_id && x.deleted_at === null); 
           const allDone = siblings.every(x => x.is_completed);
             
           if (currentTask.is_completed && allDone && !shouldKeepAlive) {
               next = next.map(x => x.id === currentTask.parent_id ? { ...x, is_completed: true } : x);
               checkParent(currentTask.parent_id);
           } else if (!currentTask.is_completed) {
               next = next.map(x => x.id === currentTask.parent_id ? { ...x, is_completed: false } : x);
               checkParent(currentTask.parent_id);
           }
         };
         checkParent(id);
       }
       return next;
    });
  };

  const onDelete = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && !taskToDelete.parent_id) {
       const remainingRoots = tasks.filter(t => t.task_type === taskToDelete.task_type && !t.parent_id).length;
       if (remainingRoots <= 1) {
          return;
       }
    }

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

  return (
    <div id="mock-task-sandbox" className={`flex flex-col gap-6 w-full pt-10 md:pt-16 pb-10 transition-all duration-500 rounded-[3rem] p-2 md:p-6 ${highlight ? 'ring-4 ring-[#c2956e] bg-white/30 dark:bg-[#1a1a1a]/30' : ''}`}>
      <div className="text-center max-w-2xl mx-auto mb-4 px-4">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Frictionless Workflows</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A deeply intuitive task manager featuring infinite nesting, hotkey navigation, and soothing vanishing animations. Tick off parent routines to see children seamlessly resolve. Add to calendar works perfectly.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Col: Widget + Routines */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 h-auto lg:h-[450px]">
          <ExpandedMockTasksProgressWidget routinePct={stats.routinePct} normalLeft={stats.normalLeft} />
          
          <div className="flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-sm h-auto max-h-[500px] lg:h-auto lg:max-h-none w-full">
            <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 border-b border-[#f0ede8] dark:border-[#2a2a2a] flex flex-col gap-3 shrink-0">
               <div className="flex justify-between items-start md:items-center">
                   <div className="flex flex-col">
                       <h2 className="text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0] font-serif font-medium tracking-tight leading-none">Routines</h2>
                       <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] mt-1.5 font-medium">Habits that reset every day.</p>
                   </div>
                   <div className="flex items-center gap-2">
                       {isRoutineEditMode && (
                           <button onClick={() => onAdd('routine', null)} className="cursor-pointer w-8 h-8 rounded-full bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] flex items-center justify-center border border-[#e0ddd5] dark:border-[#333] md:hover:bg-[#c2956e]/10 transition-colors shadow-sm"><Plus size={16}/></button>
                       )}
                       <button onClick={() => setIsRoutineEditMode(!isRoutineEditMode)} className={`cursor-pointer flex items-center justify-center gap-1.5 px-3 h-8 rounded-full text-[10px] font-[600] tracking-[0.08em] uppercase transition-all shadow-sm border ${isRoutineEditMode ? 'bg-[#c2956e] text-white border-[#c2956e]' : 'bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] border-[#e0ddd5] dark:border-[#333]'}`}>
                           {isRoutineEditMode ? 'Done' : 'Edit'}
                       </button>
                   </div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-5 flex flex-col gap-[2px]">
               {routines.map(t => (
                 <RecursiveCheckbox key={t.id} task={t} isEditMode={isRoutineEditMode} viewMode="focus" allTasks={tasks} onUpdate={onUpdate} onDelete={(id) => onDelete(id)} onRestore={() => {}} onAdd={(pId) => onAdd('routine', pId)} onIndent={onIndent} onUnindent={onUnindent} onMoveUp={() => {}} onMoveDown={() => {}} newTaskId={null} setNewTaskId={() => {}} isSandbox={true} />
               ))}
            </div>
          </div>
        </div>

        {/* Right Col: Tasks Window */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-sm h-auto max-h-[500px] lg:h-[450px] lg:max-h-none w-full">
          <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 border-b border-[#f0ede8] dark:border-[#2a2a2a] flex flex-col gap-3 shrink-0">
             <div className="flex justify-between items-start md:items-center">
                 <div className="flex flex-col">
                     <h2 className="text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0] font-serif font-medium tracking-tight leading-none">Tasks & Ideas</h2>
                     <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] mt-1.5 font-medium">One-off tasks and projects.</p>
                 </div>
                 <button onClick={() => onAdd('normal', null)} className="cursor-pointer w-8 h-8 rounded-full bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] flex items-center justify-center border border-[#e0ddd5] dark:border-[#333] md:hover:bg-[#c2956e]/10 transition-colors shadow-sm"><Plus size={16}/></button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-5 flex flex-col gap-[2px]">
             {normals.map(t => (
               <RecursiveCheckbox key={t.id} task={t} isEditMode={true} viewMode="focus" allTasks={tasks} onUpdate={onUpdate} onDelete={(id) => onDelete(id)} onRestore={() => {}} onAdd={(pId) => onAdd('normal', pId)} onIndent={onIndent} onUnindent={onUnindent} onMoveUp={() => {}} onMoveDown={() => {}} newTaskId={null} setNewTaskId={() => {}} isSandbox={true} />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Local isolated implementation for the time sandbox
function MockEngineCard({ engine, tab, onUpdate, onRemove, isOnlyInstance }: any) {
  const [liveSeconds, setLiveSeconds] = useState(engine.accumulatedSeconds);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (engine.isRunning && engine.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - engine.startTime!) / 1000);
        setLiveSeconds(engine.accumulatedSeconds + elapsed);
      }, 500);
    } else {
      setLiveSeconds(engine.accumulatedSeconds);
    }
    return () => clearInterval(interval);
  }, [engine.isRunning, engine.startTime, engine.accumulatedSeconds]);

  const handleStop = () => {
    const finalSeconds = engine.accumulatedSeconds + Math.floor((Date.now() - (engine.startTime || Date.now())) / 1000);
    onUpdate(engine.id, { isRunning: false, accumulatedSeconds: finalSeconds, startTime: null });
  };

  const handleStart = () => {
    onUpdate(engine.id, { isRunning: true, startTime: Date.now() });
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDisplaySeconds = tab === 'timer' 
    ? Math.max(0, ((engine.targetMinutes || 0) * 60) - liveSeconds)
    : liveSeconds;

  const isUntouched = engine.title === 'New Session' && engine.accumulatedSeconds === 0 && !engine.isRunning && (tab === 'stopwatch' || engine.targetMinutes === 25);
  const hideDelete = isOnlyInstance && isUntouched;

  return (
    <div className="relative shrink-0 w-[24rem] max-w-[85vw] bg-white/60 dark:bg-[#1e1e1e]/80 backdrop-blur-3xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-5 transition-colors snap-center group">
      {!hideDelete && (
        <button 
          onClick={() => onRemove(engine.id)}
          className="cursor-pointer absolute top-5 right-6 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity text-gray-400 lg:hover:text-red-500 dark:text-gray-500 lg:dark:hover:text-red-400"
        >
          <Trash2 size={18} />
        </button>
      )}
      
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex flex-col">
          <div className="text-[3.5rem] sm:text-[4rem] leading-none text-[#3d3b33] dark:text-[#f0f0f0] font-mono tracking-tighter font-light drop-shadow-sm transition-colors">
            {formatTime(currentDisplaySeconds)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(engine.accumulatedSeconds > 0 || engine.isRunning) && (
            <button onClick={handleStop} className="cursor-pointer w-12 h-12 flex items-center justify-center bg-white/60 dark:bg-black/60 border border-white/80 dark:border-white/10 text-red-500 rounded-full md:hover:scale-105 active:scale-95 transition-all shadow-sm md:hover:bg-white md:dark:hover:bg-black">
              <Square size={18} fill="currentColor" />
            </button>
          )}
          <button 
            onClick={engine.isRunning ? handleStop : handleStart}
            className="cursor-pointer w-14 h-14 flex items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#121212] rounded-full md:hover:scale-105 active:scale-95 transition-all shadow-lg md:hover:bg-black md:dark:hover:bg-white"
          >
            {engine.isRunning ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <input 
          type="text" value={engine.title} onChange={(e) => onUpdate(engine.id, { title: e.target.value })}
          spellCheck={false}
          className="flex-1 bg-white/40 dark:bg-black/40 border border-transparent rounded-2xl px-5 py-3 text-sm font-medium text-[#3d3b33] dark:text-white outline-none focus:bg-white/70 dark:focus:bg-black/60 focus:border-white dark:focus:border-white/20 transition-all placeholder:text-[#888] dark:placeholder:text-[#aaa] placeholder:font-normal shadow-inner shadow-black/5"
          placeholder="What are you focusing on?"
        />
        {tab === 'timer' && (
          <input 
            type="number" min="1"
            value={engine.targetMinutes || 1} 
            onChange={(e) => onUpdate(engine.id, { targetMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
            disabled={engine.isRunning || engine.accumulatedSeconds > 0} 
            className={`w-20 bg-white/40 dark:bg-black/40 border border-transparent rounded-2xl px-2 py-3 text-center text-sm font-bold text-[#3d3b33] dark:text-white outline-none focus:bg-white/70 dark:focus:bg-black/60 focus:border-white dark:focus:border-white/20 transition-all shadow-inner shadow-black/5 ${
              (engine.isRunning || engine.accumulatedSeconds > 0) ? 'opacity-40 cursor-not-allowed select-none' : ''
            }`}
            placeholder="Min"
          />
        )}
      </div>
    </div>
  );
}

function MockGlobalTimeWidget({ hasRunning }: { hasRunning: boolean }) {
  const [time, setTime] = useState<Date | null>(null);
  
  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  
  if (!time) return null;
  
  return (
    <div className="flex items-center justify-center gap-3 bg-white/80 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-6 py-3.5 shadow-sm pointer-events-none w-max max-w-[90vw] mb-6 md:mb-8 transition-all duration-300">
      <span className="text-[#3d3b33] dark:text-[#f0f0f0] font-serif text-xl leading-none shrink-0">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <div className={`shrink-0 rounded-full transition-all duration-500 ${hasRunning ? 'w-2.5 h-2.5 bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'w-[3px] h-3.5 bg-[#c2956e] dark:bg-[#b0855f]'}`} />
      <span className="text-[#b0ad9a] dark:text-[#888] font-bold text-[10px] uppercase tracking-[0.2em] leading-none mt-0.5 truncate">
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

export function MockTimeSandbox() {
  const [highlight, setHighlight] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'stopwatch'>('stopwatch');
  
  const [timers, setTimers] = useState<any[]>([
    { id: 'mock-1', title: 'Deep Work Block', targetMinutes: 25, accumulatedSeconds: 0, isRunning: false, startTime: null }
  ]);
  
  const [stopwatches, setStopwatches] = useState<any[]>([
    { id: 'mock-2', title: 'Reading Documentation', accumulatedSeconds: 900, isRunning: true, startTime: Date.now() }
  ]);

  useEffect(() => {
    const listener = (e: any) => {
       const { tab, title } = e.detail;
       const newInstance = {
         id: `mock-${Date.now()}`,
         title: title,
         targetMinutes: tab === 'timer' ? 25 : undefined,
         accumulatedSeconds: 0,
         isRunning: false,
         startTime: null
       };

       if (tab === 'timer') setTimers(prev => [...prev, newInstance]);
       else setStopwatches(prev => [...prev, newInstance]);
       
       setActiveTab(tab);

       const el = document.getElementById('mock-time-sandbox');
       const container = document.getElementById('landing-scroll-container');
       if (el && container) {
          const targetScrollTop = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 100;
          container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
       }
       setHighlight(true);
       setTimeout(() => setHighlight(false), 2000);
    };
    window.addEventListener('sandbox-send-focus', listener);
    return () => window.removeEventListener('sandbox-send-focus', listener);
  }, []);

  const handleUpdate = (id: string, updates: any) => {
    if (activeTab === 'timer') setTimers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    else setStopwatches(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleAdd = () => {
    const newInstance = {
      id: `mock-${Date.now()}`,
      title: 'New Session',
      targetMinutes: activeTab === 'timer' ? 25 : undefined,
      accumulatedSeconds: 0,
      isRunning: false,
      startTime: null
    };
    if (activeTab === 'timer') setTimers(prev => [...prev, newInstance]);
    else setStopwatches(prev => [...prev, newInstance]);
  };

  const handleRemove = (id: string) => {
    if (activeTab === 'timer') {
       setTimers(prev => prev.length === 1 
         ? [{ id: `mock-${Date.now()}`, title: 'New Session', targetMinutes: 25, accumulatedSeconds: 0, isRunning: false, startTime: null }] 
         : prev.filter(t => t.id !== id));
    } else {
       setStopwatches(prev => prev.length === 1 
         ? [{ id: `mock-${Date.now()}`, title: 'New Session', accumulatedSeconds: 0, isRunning: false, startTime: null }] 
         : prev.filter(s => s.id !== id));
    }
  };

  const activeList = activeTab === 'timer' ? timers : stopwatches;
  const hasRunning = timers.some(t => t.isRunning) || stopwatches.some(s => s.isRunning);

  const isAnyRunning = (tab: 'timer' | 'stopwatch') => {
    const list = tab === 'timer' ? timers : stopwatches;
    return list.some(i => i.isRunning);
  };

  return (
    <div id="mock-time-sandbox" className={`w-full pt-10 md:pt-14 pb-8 md:pb-14 bg-white/50 dark:bg-[#121212]/50 backdrop-blur-2xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] md:rounded-[3rem] my-10 flex flex-col items-center relative shadow-sm min-h-[300px] md:min-h-[360px] transition-all duration-500 overflow-hidden ${highlight ? 'ring-4 ring-[#c2956e]' : ''}`}>
      
      {/* Decorative ambient background for the card */}
      <div className="absolute inset-0 pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#c2956e] rounded-full blur-[100px] opacity-20" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#a882c2] rounded-full blur-[100px] opacity-10" />
      </div>

      <div className="text-center max-w-xl mx-auto mb-8 px-4 w-full">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Own Your Time</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Aesthetically pleasing, millisecond-accurate timers and stopwatches that synchronize in real-time across your phone and laptop. Below is the global time widget, which is present on every page of the laptop interface.
        </p>
      </div>
      
      <MockGlobalTimeWidget hasRunning={hasRunning} />

      <div className="w-full flex flex-col items-center relative z-10 w-full mt-2">
        <div className="flex justify-center items-center w-[24rem] max-w-[85vw] mb-6">
          <div className="flex bg-[#ebe8e2] dark:bg-[#1a1a1a] p-1 rounded-full shadow-inner border border-[#d4d0c8] dark:border-[#333]">
            {(['stopwatch', 'timer'] as const).map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab)}
                className={`cursor-pointer px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === tab ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] dark:text-[#a0a0a0] md:hover:text-[#3d3b33] md:dark:hover:text-[#f0f0f0]'}`}
              >
                {tab} {isAnyRunning(tab) && <span className="w-1.5 h-1.5 bg-[#c2956e] dark:bg-[#b0855f] rounded-full animate-ping"/>}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex flex-row pb-8 -mb-8 pt-4">
          <div className="flex-1 min-w-0 shrink"></div>
          <div className="flex gap-4 px-4 sm:px-8 w-max shrink-0">
            {activeList.map(engine => (
              <MockEngineCard key={engine.id} engine={engine} tab={activeTab} onUpdate={handleUpdate} onRemove={handleRemove} isOnlyInstance={activeList.length === 1} />
            ))}
            
            <button 
              onClick={handleAdd} 
              className="shrink-0 w-[6rem] sm:w-[8rem] bg-white/60 dark:bg-[#1e1e1e]/80 md:hover:bg-white/80 md:dark:hover:bg-[#2a2a2a]/80 backdrop-blur-3xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] flex flex-col items-center justify-center gap-3 transition-colors snap-center cursor-pointer shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              <Plus size={28} className="text-[#3d3b33] dark:text-[#f0f0f0]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3d3b33] dark:text-[#f0f0f0]">Add</span>
            </button>
          </div>
          <div className="flex-1 min-w-0 shrink"></div>
        </div>
      </div>
    </div>
  );
}

export function MockCalendarSandbox() {
  const [events, setEvents] = useState<CalendarEvent[]>(generateMockEvents());
  const [targetScrollTime, setTargetScrollTime] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setTargetScrollTime(newEvent.start_time);

      const el = document.getElementById('mock-calendar-sandbox');
      const container = document.getElementById('landing-scroll-container');
      if (el && container) {
         const targetScrollTop = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 100;
         container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2000);
    };

    window.addEventListener('sandbox-add-calendar', handleAddToCal);
    return () => window.removeEventListener('sandbox-add-calendar', handleAddToCal);
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
    <div id="mock-calendar-sandbox" className={`flex flex-col lg:flex-row-reverse gap-6 md:gap-20 items-center w-full my-10 md:my-20 p-2 md:p-6 transition-all duration-500 rounded-[3rem] max-lg:h-[72vh] max-lg:max-h-[550px] max-lg:min-h-[430px] ${highlight ? 'ring-4 ring-[#c2956e] bg-white/30 dark:bg-[#1a1a1a]/30' : ''}`}>
      <div className="w-full lg:w-1/3 flex flex-col gap-2 md:gap-4 px-4 md:px-8 text-center lg:text-left shrink-0">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">Your Days, Visualized</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          A gorgeous drag-and-drop calendar. Sync Google & Apple calendars, or subscribe to public <b>.ics</b> links. Try adding a task directly from the tasks section!
        </p>
      </div>
      <div className="w-full lg:w-2/3 flex-1 lg:h-[500px] relative pointer-events-auto rounded-[2rem] shadow-2xl min-h-0">
        <WeekView 
          currentDate={new Date()} events={events} onEventClick={() => {}} onTimeRangeSelected={() => {}} onEventMove={handleEventMove} 
          eventColors={EVENT_COLORS} targetScrollTime={targetScrollTime} daysCount={isMobile ? 2 : 3}
        />
      </div>
    </div>
  );
}

export function MockNotesSandbox() {
  const [content, setContent] = useState(`<h1>A Blank Canvas</h1><p>Chronoa provides a completely distraction-free markdown environment for your thoughts, meeting notes, and daily journaling.</p><p><br/></p><p>Go ahead, <strong>type something here</strong>. Use standard markdown shortcuts or highlight text to style it.</p>`);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const listener = (e: any) => {
      setContent(prev => prev + `<p><br></p><p><strong>AI:</strong> ${e.detail.text}</p>`);
      const el = document.getElementById('mock-notes-sandbox');
      const container = document.getElementById('landing-scroll-container');
      if (el && container) {
         const targetScrollTop = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 100;
         container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2000);
    };
    window.addEventListener('sandbox-add-note', listener);
    return () => window.removeEventListener('sandbox-add-note', listener);
  }, []);

  return (
    <div id="mock-notes-sandbox" className={`w-full flex flex-col gap-4 md:gap-6 my-10 md:my-20 max-lg:h-[72vh] max-lg:max-h-[550px] max-lg:min-h-[430px] transition-all duration-500 rounded-[3rem] p-2 md:p-6 ${highlight ? 'ring-4 ring-[#c2956e] bg-white/30 dark:bg-[#1a1a1a]/30' : ''}`}>
      <div className="text-center max-w-2xl mx-auto px-4 w-full shrink-0">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-2 md:mb-3">Clarity & Focus</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Beautiful text formatting that stays out of your way. Zoom in and out instantly with intuitive controls.
        </p>
      </div>
      <div 
        className="mock-editor-container cursor-text w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] px-4 pt-2 pb-6 md:px-10 md:pt-4 md:pb-10 shadow-2xl flex-1 min-h-0 overflow-y-auto no-scrollbar relative md:h-auto md:max-h-[500px]"
        onClick={(e) => {
           const target = e.target as HTMLElement;
           if (!target.closest('button') && !target.closest('a') && !target.closest('input') && !target.closest('.no-editor-focus')) {
              window.dispatchEvent(new CustomEvent('focus-editor'));
           }
        }}
      >
        <DistractionFreeEditor initialContent={content} onSave={setContent} isSandbox={true} />
      </div>
    </div>
  );
}

export function MockAnalyticsSandbox() {
  const dailyMap = useMemo(() => generateMockDailyMap(), []);
  const rawSessions = useMemo(() => generateMockSessions(), []);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const listener = () => {
      const el = document.getElementById('mock-analytics-sandbox');
      const container = document.getElementById('landing-scroll-container');
      if (el && container) {
         const targetScrollTop = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 100;
         container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2000);
    };
    window.addEventListener('sandbox-analytics', listener);
    return () => window.removeEventListener('sandbox-analytics', listener);
  }, []);

  return (
    <div id="mock-analytics-sandbox" className={`w-full flex flex-col gap-6 md:gap-8 my-10 md:my-20 transition-all duration-500 rounded-[3rem] p-2 md:p-6 ${highlight ? 'ring-4 ring-[#c2956e] bg-white/30 dark:bg-[#1a1a1a]/30' : ''}`}>
      <div className="text-center max-w-2xl mx-auto mb-10 px-4 w-full">
        <h3 className="text-3xl md:text-4xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-3">Insights That Matter</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm">
          Chronoa passively analyzes your activity, helping you discover your peak performance hours, flow states, and focus distribution. 
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        <div className="lg:col-span-2">
          <ProductivityChart dailyMap={dailyMap} isSandbox={true} />
        </div>
        <div className="lg:col-span-1">
          <TimeOfDayRadar dailyMap={dailyMap} isSandbox={true} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
        <ActivityHeatmap dailyMap={dailyMap} isSandbox={true} />
        <FocusDistribution rawSessions={rawSessions} />
      </div>
    </div>
  );
}

// Clean, manual-scroll component with a delightful "peek" animation on mount
const MarqueeRow = React.memo(({ prompts, speed = 0.5 }: { prompts: any[], speed?: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const isTouching = useRef(false);
  const scrollPos = useRef(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect if the device relies primarily on touch (disables auto-scroll)
    const checkTouch = () => {
      setIsTouchDevice(
        window.matchMedia('(hover: none)').matches || 
        ('ontouchstart' in window) || 
        navigator.maxTouchPoints > 0
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isTouchDevice) return;

    let animationId: number;
    let lastTime = performance.now();

    const scroll = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Prevent huge jumps if tab goes inactive
      if (delta < 100) { 
        if (!isHovered.current && !isTouching.current) {
          scrollPos.current += (speed * 60 / 1000) * delta;
          
          // We duplicated the array, so half of the total width is the exact loop point
          const maxScroll = el.scrollWidth / 2;
          
          if (scrollPos.current >= maxScroll) {
            scrollPos.current -= maxScroll;
          }
          
          el.scrollLeft = scrollPos.current;
        } else {
          // Keep our tracker strictly synced when the user scrolls natively
          scrollPos.current = el.scrollLeft;
        }
      }

      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [speed, isTouchDevice]);

  if (prompts.length === 0) return null;

  // Duplicate the prompts to create an infinitely looping array
  const duplicatedPrompts = [...prompts, ...prompts];

  return (
    <div 
      ref={scrollRef}
      className="flex w-full overflow-x-auto no-scrollbar py-2"
      style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
      onTouchStart={() => { isTouching.current = true; }}
      onTouchEnd={() => { isTouching.current = false; }}
    >
      <div className="flex gap-4 w-max px-2 pointer-events-auto">
        {duplicatedPrompts.map((p, i) => (
           <button 
             key={i}
             onClick={(e) => {
               e.preventDefault(); 
               if (p.action) p.action();
               else window.dispatchEvent(new CustomEvent('chronoa-ai-prompt', { detail: p.text }));
             }}
             className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] transition-all shrink-0 cursor-pointer shadow-sm group select-none md:hover:-translate-y-0.5 ${p.border}`}
           >
             <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${p.bg}`}>
               <p.icon size={14} className={`${p.color} transition-colors`} />
             </div>
             <span className="text-[14px] font-medium text-[#888] dark:text-[#a0a0a0] md:group-hover:text-[#3d3b33] md:dark:group-hover:text-[#f0f0f0] whitespace-nowrap transition-colors">{p.text}</span>
           </button>
        ))}
      </div>
    </div>
  );
});
MarqueeRow.displayName = 'MarqueeRow';

export function MockAiSandbox() {
  const [row1, setRow1] = useState<any[]>([]);
  const [row2, setRow2] = useState<any[]>([]);

  useEffect(() => {
    const scrollToSandbox = (id: string) => {
      const el = document.getElementById(id);
      const container = document.getElementById('landing-scroll-container');
      if (el && container) {
          const targetScrollTop = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 100;
          container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }
    };

    const HARDCODED_PROMPTS = [
      { icon: Timer, text: "Start a 25m deep work timer", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20", border: "md:hover:border-amber-500/50 md:dark:hover:border-amber-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-send-focus', { detail: { tab: 'timer', title: 'Deep Work' } })) },
      { icon: CheckSquare, text: "Add 'Review PRs' to my tasks", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20", border: "md:hover:border-emerald-500/50 md:dark:hover:border-emerald-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-add-task', { detail: { title: 'Review PRs' } })) },
      { icon: CalendarDays, text: "Schedule a team sync", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20", border: "md:hover:border-blue-500/50 md:dark:hover:border-blue-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-add-calendar', { detail: { title: 'Team Sync' } })) },
      { icon: BookOpen, text: "Draft a journal entry about today", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/20", border: "md:hover:border-rose-500/50 md:dark:hover:border-rose-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-add-note', { detail: { text: 'Today was highly productive. I managed to stay focused and clear my task list.' } })) },
      { icon: Timer, text: "Start a break timer", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20", border: "md:hover:border-amber-500/50 md:dark:hover:border-amber-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-send-focus', { detail: { tab: 'timer', title: 'Break' } })) },
      { icon: CheckSquare, text: "Add 'Buy groceries' task", color: "text-[#7ca982] dark:text-[#8cbd92]", bg: "bg-[#7ca982]/20 dark:bg-[#7ca982]/20", border: "md:hover:border-[#7ca982]/50 md:dark:hover:border-[#7ca982]/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-add-task', { detail: { title: 'Buy groceries' } })) },
      { icon: CalendarDays, text: "Schedule 'Deep Work'", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20", border: "md:hover:border-purple-500/50 md:dark:hover:border-purple-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-add-calendar', { detail: { title: 'Deep Work' } })) },
      { icon: FileText, text: "Note down a new project idea", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/20", border: "md:hover:border-rose-500/50 md:dark:hover:border-rose-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-add-note', { detail: { text: 'Project Idea: A new minimalist workspace app that integrates AI.' } })) },
      { icon: Navigation, text: "Show my analytics", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20", border: "md:hover:border-blue-500/50 md:dark:hover:border-blue-500/50", action: () => { scrollToSandbox('mock-analytics-sandbox'); window.dispatchEvent(new CustomEvent('sandbox-analytics')); } },
      { icon: Navigation, text: "Take me to my calendar", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20", border: "md:hover:border-purple-500/50 md:dark:hover:border-purple-500/50", action: () => scrollToSandbox('mock-calendar-sandbox') },
      { icon: CheckSquare, text: "Let's do some planning", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20", border: "md:hover:border-emerald-500/50 md:dark:hover:border-emerald-500/50", action: () => scrollToSandbox('mock-task-sandbox') },
      { icon: Square, text: "Start a stopwatch for reading", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20", border: "md:hover:border-amber-500/50 md:dark:hover:border-amber-500/50", action: () => window.dispatchEvent(new CustomEvent('sandbox-send-focus', { detail: { tab: 'stopwatch', title: 'Reading' } })) },
    ];

    const shuffled = [...HARDCODED_PROMPTS].sort(() => 0.5 - Math.random());
    setRow1(shuffled.slice(0, 6));
    setRow2(shuffled.slice(6, 12));
  }, []);

  return (
    <div id="intelligence" className="w-full flex flex-col gap-6 md:gap-8 my-10 md:my-20">
      <div className="text-center max-w-2xl mx-auto px-4 w-full shrink-0 mb-6">
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 rounded-full bg-[#c2956e]/10 flex items-center justify-center text-[#c2956e] shadow-sm border border-[#c2956e]/20">
              <Sparkles size={32} className="fill-current" />
           </div>
        </div>
        <h3 className="text-3xl md:text-5xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-4 tracking-tight">And of course, an Intelligence.</h3>
        <p className="text-[#888] dark:text-[#a0a0a0] leading-relaxed text-sm md:text-base">
          Manual data entry is a thing of the past. Chronoa AI is deeply woven into your workspace to automate your workflow. It doesn't just converse with you. It executes commands instantly. Try the actions below to experience it natively.
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl flex flex-col items-center justify-center">
        <div className="w-full relative flex flex-col gap-2 py-4"
             style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
           <MarqueeRow prompts={row1} speed={0.6} />
           <MarqueeRow prompts={row2} speed={0.4} />
        </div>
      </div>
    </div>
  );
}