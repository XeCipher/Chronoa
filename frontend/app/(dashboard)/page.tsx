// FILE: frontend/app/(dashboard)/page.tsx
"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  CheckCircle2, FileText, Timer, CalendarDays, BarChart2, 
  Smartphone, Download, Sun, Moon, Monitor, Share, 
  PlusSquare, Play, Pause, Square, AlertTriangle, Sparkles,
  CloudSun, ListTodo, MapPin, Video, Keyboard, RefreshCw, ArchiveRestore
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

const GithubIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// --- INTERACTIVE MOCK COMPONENTS ---

const MockWorkspace = () => {
  const [routines, setRoutines] = useState([
    { id: 1, text: "Morning Meditation", done: true },
    { id: 2, text: "Review Daily Goals", done: false },
    { id: 3, text: "Drink Water", done: false },
  ]);
  
  const [tasks, setTasks] = useState([
    { id: 4, text: "Finish landing page design", done: false },
    { id: 5, text: "Sync Apple Calendar", done: false },
    { id: 6, text: "Enter 2 hours of Deep Work", done: false },
  ]);

  const routinePct = Math.round((routines.filter(r => r.done).length / routines.length) * 100);
  const normalLeft = tasks.filter(t => !t.done).length;

  const toggleRoutine = (id: number) => setRoutines(routines.map(r => r.id === id ? { ...r, done: !r.done } : r));
  const toggleTask = (id: number) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full items-start justify-center">
      {/* Left: Task Lists */}
      <div className="flex-1 w-full max-w-md space-y-6">
        <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-4">My Routine</h3>
          <div className="space-y-2">
            {routines.map((r) => (
              <div key={r.id} onClick={() => toggleRoutine(r.id)} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-[#f7f5f0] dark:hover:bg-[#222] transition-colors group">
                <button className={`w-5 h-5 rounded-[5px] border flex items-center justify-center transition-all ${r.done ? 'bg-[#7ca982] border-[#7ca982]' : 'border-[#d4d0c8] dark:border-[#555] group-hover:border-[#7ca982]'}`}>
                  {r.done && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                </button>
                <span className={`text-[15px] transition-colors ${r.done ? 'text-[#b0ad9a] dark:text-[#555] line-through' : 'text-[#3d3b33] dark:text-[#e0e0e0]'}`}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-4">Tasks & Ideas</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {tasks.filter(t => !t.done).map((t) => (
                <motion.div 
                  key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20, filter: "blur(8px)", height: 0, marginBottom: 0 }}
                  onClick={() => toggleTask(t.id)} 
                  className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-[#f7f5f0] dark:hover:bg-[#222] transition-colors group"
                >
                  <button className="w-5 h-5 rounded-[5px] border border-[#d4d0c8] dark:border-[#555] flex items-center justify-center transition-all group-hover:border-[#7ca982]" />
                  <span className="text-[15px] text-[#3d3b33] dark:text-[#e0e0e0]">{t.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {normalLeft === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center text-xs font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#555]">
                You're doing great!
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Widgets */}
      <div className="w-full lg:w-64 flex flex-col gap-4 sticky top-32">
        
        {/* Weather Widget */}
        <div className="flex items-center bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] shadow-sm rounded-[2rem] p-2 h-[56px]">
          <div className="flex items-center w-[88px] shrink-0 justify-between">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
              <CloudSun size={20} strokeWidth={2.5} />
            </div>
            <span className="flex-1 text-center text-[15px] font-semibold text-[#3d3b33] dark:text-white tabular-nums">28°</span>
          </div>
          <div className="flex overflow-hidden">
            <div className="whitespace-nowrap flex flex-col justify-center border-l border-[#e0ddd5] dark:border-[#333] pl-3">
              <span className="text-[11px] font-semibold text-[#3d3b33] dark:text-white leading-tight tracking-wide">Partly Cloudy</span>
              <span className="text-[8px] text-[#b0ad9a] dark:text-[#a0a0a0] font-bold uppercase tracking-widest leading-tight flex items-center gap-1 mt-0.5">
                <MapPin size={8} /> Mumbai
              </span>
            </div>
          </div>
        </div>

        {/* Progress Widget */}
        <div className="flex flex-col items-start bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] shadow-sm rounded-[2rem] p-5 gap-3 w-full">
          <div className="flex items-center w-full">
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0 bg-[#f7f5f0] dark:bg-[#252525] rounded-full">
              <svg className="absolute inset-0 w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#e0ddd5] dark:stroke-[#333]" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#7ca982] transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - routinePct} strokeLinecap="round" />
              </svg>
              <span className="text-[9px] font-bold text-[#3d3b33] dark:text-white tabular-nums">{routinePct}%</span>
            </div>
            <div className="flex flex-col justify-center ml-3 overflow-hidden whitespace-nowrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] dark:text-[#8cbd92] flex items-center gap-1">
                <CheckCircle2 size={12}/> Routine
              </span>
              <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Daily Progress</span>
            </div>
          </div>
          <div className="w-full h-px bg-[#e0ddd5] dark:bg-[#333]" />
          <div className="flex items-center w-full">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 transition-colors duration-500 ${normalLeft > 0 ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] text-[#3d3b33] dark:text-white'}`}>
              <span className="text-[15px] font-semibold tabular-nums">{normalLeft}</span>
            </div>
            <div className="flex flex-col justify-center ml-3 overflow-hidden whitespace-nowrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#c2956e] dark:text-[#d1a784] flex items-center gap-1">
                <ListTodo size={12}/> Tasks
              </span>
              <span className="text-sm font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Remaining</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const MockTimer = () => {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(25 * 60);

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setTime(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(i);
  }, [running]);

  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = (time % 60).toString().padStart(2, '0');
  const progress = 1 - time / (25 * 60);

  return (
    <div className="flex flex-col items-center p-8 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] shadow-xl w-full max-w-sm mx-auto select-none group">
      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="96" cy="96" r="90" fill="none" stroke="currentColor" className="text-[#f0ede8] dark:text-[#2a2a2a]" strokeWidth="6" />
          <motion.circle
            cx="96" cy="96" r="90" fill="none" stroke="currentColor"
            className="text-[#c2956e] dark:text-[#b0855f]" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            animate={{ strokeDashoffset: (2 * Math.PI * 90) * (1 - progress) }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-mono text-[#3d3b33] dark:text-[#f0f0f0] font-light tracking-tighter tabular-nums">
            {m}:{s}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b0ad9a] dark:text-[#7a7a7a] mt-2">Deep Work</span>
        </div>
      </div>
      <div className="flex gap-4">
        <button onClick={() => setRunning(!running)} className="w-16 h-16 flex items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#121212] rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all">
          {running ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        <button onClick={() => { setRunning(false); setTime(25 * 60); }} className="w-16 h-16 flex items-center justify-center bg-[#f0ede8] dark:bg-[#2a2a2a] text-[#888] dark:text-[#a0a0a0] rounded-full hover:scale-105 active:scale-95 transition-all hover:text-[#3d3b33] dark:hover:text-white">
          <Square size={20} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

const MockCalendar = () => {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const days = Array.from({length: 7}).map((_, i) => addDays(weekStart, i));
  const currentMins = today.getHours() * 60 + today.getMinutes();

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
      {/* Calendar Week View */}
      <div className="flex-1 w-full bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-[400px]">
        <div className="flex border-b border-[#e0ddd5] dark:border-[#333] bg-[#f7f5f0]/50 dark:bg-[#222]/50 shrink-0">
          <div className="w-12 border-r border-[#e0ddd5] dark:border-[#333]" />
          <div className="flex-1 grid grid-cols-7 divide-x divide-[#e0ddd5] dark:divide-[#333]">
            {days.map((d, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-2 gap-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">{format(d, 'EEE')}</span>
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isSameDay(d, today) ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#3d3b33] dark:text-[#e0e0e0]'}`}>{format(d, 'd')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex relative overflow-hidden bg-[#fdfbf7] dark:bg-[#161616]">
          <div className="w-12 border-r border-[#e0ddd5] dark:border-[#333] bg-white dark:bg-[#1a1a1a] z-20">
             <div className="h-[60px] relative"><span className="absolute -top-2 right-2 text-[9px] font-bold text-[#b0ad9a]">9 AM</span></div>
             <div className="h-[60px] relative"><span className="absolute -top-2 right-2 text-[9px] font-bold text-[#b0ad9a]">10 AM</span></div>
             <div className="h-[60px] relative"><span className="absolute -top-2 right-2 text-[9px] font-bold text-[#b0ad9a]">11 AM</span></div>
          </div>
          <div className="flex-1 relative flex">
             <div className="absolute top-[80px] left-0 right-0 z-30 border-t-[2px] border-red-500 opacity-90 pointer-events-none">
               <div className="absolute -left-1.5 -top-[5px] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
             </div>
             {days.map((d, i) => (
               <div key={i} className="flex-1 border-r border-[#e0ddd5] dark:border-[#333] relative">
                 {isSameDay(d, today) && (
                   <>
                     <div className="absolute top-[20px] h-[50px] left-1 right-1 bg-[#c2956e] text-white rounded-md p-1.5 text-[9px] font-bold shadow-sm z-20 cursor-grab hover:scale-[1.02] transition-transform">
                       Team Sync<br/><span className="font-medium opacity-80">9:20 - 10:10 AM</span>
                     </div>
                     <div className="absolute top-[100px] h-[60px] left-1 right-1 bg-blue-500 text-white rounded-md p-1.5 text-[9px] font-bold shadow-sm z-20 cursor-grab hover:scale-[1.02] transition-transform">
                       Deep Work<br/><span className="font-medium opacity-80">10:40 - 11:40 AM</span>
                     </div>
                   </>
                 )}
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule Widget */}
      <div className="w-full lg:w-72 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={18} className="text-[#c2956e]" />
          <h3 className="font-serif font-medium text-xl text-[#3d3b33] dark:text-[#f0f0f0]">Schedule</h3>
        </div>
        <div className="space-y-2">
          <div className="bg-[#c2956e]/20 border border-[#c2956e]/30 text-[#9e7653] dark:text-[#d1a784] p-3 rounded-xl shadow-sm">
             <div className="font-bold text-sm">Team Sync</div>
             <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">9:20 AM - 10:10 AM</div>
             <button className="mt-2 bg-[#c2956e] text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 w-max"><Video size={10}/> Join</button>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-3 rounded-xl shadow-sm ring-1 ring-offset-1 ring-offset-transparent ring-blue-500">
             <div className="font-bold text-sm">Deep Work</div>
             <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">10:40 AM - 11:40 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MockAnalytics = () => {
  const data = [
    { subject: 'MORNING', A: 80, fullMark: 100 },
    { subject: 'AFTERNOON', A: 100, fullMark: 100 },
    { subject: 'EVENING', A: 50, fullMark: 100 },
    { subject: 'NIGHT', A: 20, fullMark: 100 },
  ];
  const pieData = [
    { name: 'Deep Work', value: 400, color: '#c2956e' },
    { name: 'Meetings', value: 150, color: '#7ca982' },
    { name: 'Planning', value: 100, color: '#6e90c2' },
    { name: 'Emails', value: 50, color: '#a882c2' },
  ];

  const [activeFilters, setActiveFilters] = useState(new Set(['Deep Work', 'Meetings', 'Planning', 'Emails']));

  const toggleFilter = (name: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const activePieData = pieData.filter(d => activeFilters.has(d.name));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chronotype Radar */}
      <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 shadow-sm h-[350px] flex flex-col">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">Chronotype</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">Peak Performance</p>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
              <PolarGrid stroke="#e0ddd5" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
              <Radar name="Output" dataKey="A" stroke="#c2956e" strokeWidth={2} fill="#c2956e" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Focus Pie Chart */}
      <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 shadow-sm h-[350px] flex items-center">
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={activePieData} innerRadius="65%" outerRadius="90%" paddingAngle={4} dataKey="value" stroke="none" animationDuration={800}>
                {activePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0ad9a]">Top Focus</span>
             <span className="text-base font-serif text-[#3d3b33] dark:text-[#f0f0f0]">{activePieData[0]?.name || 'None'}</span>
          </div>
        </div>
        <div className="w-1/2 pl-6 flex flex-col gap-2">
           {pieData.map((d) => {
             const isActive = activeFilters.has(d.name);
             return (
               <button key={d.name} onClick={() => toggleFilter(d.name)} className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${isActive ? 'bg-[#f7f5f0] dark:bg-[#222]' : 'opacity-40 hover:bg-gray-50 dark:hover:bg-[#333]'}`}>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isActive ? d.color : 'transparent', border: `1px solid ${d.color}` }} />
                   <span className="text-xs font-medium text-[#3d3b33] dark:text-[#f0f0f0]">{d.name}</span>
                 </div>
               </button>
             );
           })}
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const { theme, setTheme } = useUiStore();
  const { scrollYProgress } = useScroll();
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/home');
      } else {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  useEffect(() => {
    try {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {}
  }, [theme]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

  if (isChecking) return <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#121212]" />;

  const palettes = {
    dawn: "bg-[radial-gradient(circle,rgba(255,203,166,0.15)_0%,transparent_60%)]",
    day: "bg-[radial-gradient(circle,rgba(168,130,194,0.15)_0%,transparent_60%)]",
    dusk: "bg-[radial-gradient(circle,rgba(255,138,144,0.15)_0%,transparent_60%)]",
    night: "bg-[radial-gradient(circle,rgba(158,180,219,0.15)_0%,transparent_60%)]"
  };

  return (
    <div className="relative min-h-screen bg-[#f7f5f0] dark:bg-[#121212] overflow-x-hidden selection:bg-[#c2956e]/30 dark:selection:bg-[#b0855f]/40 transition-colors duration-700 font-sans">
      
      {/* Background Parallax Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-100 transition-colors duration-1000">
        <motion.div style={{ y: y1 }} className={`absolute w-[800px] h-[800px] -translate-y-48 translate-x-32 blur-[100px] transition-colors duration-1000 ${palettes[timeOfDay]}`} />
        <motion.div style={{ y: y2 }} className="absolute w-[800px] h-[800px] translate-y-48 -translate-x-32 bg-[radial-gradient(circle,rgba(124,169,130,0.15)_0%,transparent_60%)] blur-[100px]" />
        <motion.div style={{ y: y3 }} className="absolute w-[1000px] h-[1000px] translate-y-12 bg-[radial-gradient(circle,rgba(194,149,110,0.1)_0%,transparent_60%)] blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-[#121212]/80 backdrop-blur-xl border-b border-[#e0ddd5] dark:border-[#2a2a2a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif font-bold tracking-tight">Chronoa</h1>
            <span className="hidden sm:inline-block px-2.5 py-1 bg-[#c2956e]/10 text-[#c2956e] text-[9px] font-bold uppercase tracking-widest rounded-full border border-[#c2956e]/20">Open Source</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {mounted && (
              <button onClick={cycleTheme} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#888] hover:text-[#c2956e] transition-all hover:scale-105 shadow-sm" title={`Theme: ${theme}`}>
                <ThemeIcon size={16} />
              </button>
            )}
            <a href="https://github.com/XeCipher/Chronoa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#888] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all hover:scale-105 shadow-sm">
              <GithubIcon size={18} />
            </a>
            <button onClick={handleGoogleLogin} disabled={isLoading} className="px-5 sm:px-6 py-2.5 bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#1a1a1a] rounded-full text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-black dark:hover:bg-white shadow-md hover:scale-105 hover:shadow-lg disabled:opacity-50">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-40 pb-20 sm:pt-48 sm:pb-32 px-6 w-full flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c2956e]/10 dark:bg-[#b0855f]/10 border border-[#c2956e]/20 dark:border-[#b0855f]/20 text-[#c2956e] dark:text-[#d1a784] text-[10px] font-bold uppercase tracking-widest mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#c2956e] dark:bg-[#d1a784] animate-pulse" /> Welcome to your personal workspace
          </div>
          
          <h2 className="text-6xl sm:text-7xl md:text-8xl text-[#3d3b33] dark:text-[#f0f0f0] mb-6 tracking-tight font-serif leading-[1.05]">
            Master your time. <br />
            <span className="italic text-[#c2956e] dark:text-[#d1a784]">Clear your mind.</span>
          </h2>
          
          <p className="text-[#888888] dark:text-[#a0a0a0] text-lg sm:text-xl md:text-2xl mb-12 max-w-2xl leading-relaxed">
            Chronoa seamlessly merges intentional task management, deep work timers, distraction-free journaling, and RPG analytics into one beautiful experience.
          </p>

          <button onClick={handleGoogleLogin} disabled={isLoading} className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#c2956e] dark:bg-[#b0855f] rounded-2xl text-white text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#b0855f] dark:hover:bg-[#9e7653] hover:shadow-xl hover:shadow-[#c2956e]/20 hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0 bg-white rounded-full p-[3px] shadow-sm group-hover:scale-110 transition-transform">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </motion.div>
      </main>

      {/* Feature Sections */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col gap-32 overflow-hidden">
        
        {/* Environment & Scenery */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white leading-tight mb-4">Adapts to your rhythm.</h2>
            <p className="text-lg text-[#888] dark:text-[#a0a0a0] leading-relaxed mb-8">
              Experience dynamic sceneries that naturally shift with the time of day, creating a calming, aesthetic backdrop for your deep work sessions.
            </p>
            <div className="flex bg-white/50 dark:bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-[#e0ddd5] dark:border-[#333] shadow-sm mx-auto w-max">
              {(['dawn', 'day', 'dusk', 'night'] as const).map(t => (
                <button key={t} onClick={() => setTimeOfDay(t)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${timeOfDay === t ? 'bg-white dark:bg-[#222] text-[#c2956e] shadow-sm' : 'text-[#888] hover:text-[#3d3b33] dark:hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tasks & Widgets */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="flex-1 space-y-6 text-center lg:text-left">
            <div className="w-14 h-14 bg-[#7ca982]/10 text-[#7ca982] rounded-2xl flex items-center justify-center mx-auto lg:mx-0 shadow-sm border border-[#7ca982]/20">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white leading-tight">Intentional Tasks</h2>
            <p className="text-lg text-[#888] dark:text-[#a0a0a0] leading-relaxed max-w-lg mx-auto lg:mx-0">
              A meticulously designed daily list. Completed items gracefully vanish, leaving only what requires your attention. Watch your widgets update in real-time.
            </p>
          </motion.div>
          <div className="flex-[1.5] w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7ca982]/20 to-transparent blur-[80px] -z-10 rounded-full" />
            <MockWorkspace />
          </div>
        </div>

        {/* Deep Work Timer */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="flex-1 space-y-6 text-center lg:text-left">
            <div className="w-14 h-14 bg-[#c2956e]/10 text-[#c2956e] rounded-2xl flex items-center justify-center mx-auto lg:mx-0 shadow-sm border border-[#c2956e]/20">
              <Timer size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white leading-tight">Deep Work Timers</h2>
            <p className="text-lg text-[#888] dark:text-[#a0a0a0] leading-relaxed max-w-lg mx-auto lg:mx-0">
              Integrated pomodoro timers and stopwatches. Start a session on your laptop, pause it on your phone. Real-time synchronization down to the millisecond.
            </p>
          </motion.div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tl from-[#c2956e]/20 to-transparent blur-[80px] -z-10 rounded-full" />
            <MockTimer />
          </div>
        </div>

        {/* Calendar Sync */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="flex-1 space-y-6 text-center lg:text-left">
            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 shadow-sm border border-blue-500/20">
              <CalendarDays size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white leading-tight">Unified Calendar</h2>
            <p className="text-lg text-[#888] dark:text-[#a0a0a0] leading-relaxed max-w-lg mx-auto lg:mx-0">
              View your day beautifully. Connect your Apple or Google calendars, or subscribe to any public ICS link like F1 or IPL schedules. Smooth drag-and-drop included.
            </p>
          </motion.div>
          <div className="flex-[1.5] w-full relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent blur-[80px] -z-10 rounded-full" />
            <MockCalendar />
          </div>
        </div>

        {/* Analytics */}
        <div className="flex flex-col items-center gap-12 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="text-center max-w-2xl">
            <div className="w-14 h-14 bg-[#a882c2]/10 text-[#a882c2] rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-[#a882c2]/20 mb-6">
              <BarChart2 size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white leading-tight mb-4">Level up your productivity</h2>
            <p className="text-lg text-[#888] dark:text-[#a0a0a0] leading-relaxed">
              Earn XP automatically as you work. Ascend through RPG-style ranks and visualize your peak performance zones with gorgeous, interactive heatmaps.
            </p>
          </motion.div>
          <div className="w-full relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#a882c2]/10 to-transparent blur-[100px] -z-10 rounded-full" />
            <MockAnalytics />
          </div>
        </div>

      </section>

      {/* Grid Features (Journal, Settings, Search) */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: FileText, color: "text-[#a882c2]", bg: "bg-[#a882c2]/10", title: "Distraction-free Notes", desc: "A zen-like rich-text editor for your daily journal entries, meeting notes, and free-form thoughts." },
            { icon: Keyboard, color: "text-[#5b9ea0]", bg: "bg-[#5b9ea0]/10", title: "Global Hotkeys", desc: "Speed up your workflow with intuitive mnemonic shortcuts. Press Alt+H for Home, Alt+T for Tasks." },
            { icon: RefreshCw, color: "text-[#c2956e]", bg: "bg-[#c2956e]/10", title: "Routine Resets", desc: "Customize exactly what hour your daily habits and routines uncheck for the new day." }
          ].map((feat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
               <div className={`w-14 h-14 ${feat.bg} ${feat.color} rounded-2xl flex items-center justify-center mb-6`}>
                 <feat.icon size={26} strokeWidth={2.5} />
               </div>
               <h3 className="text-2xl font-serif text-[#3d3b33] dark:text-white mb-3 font-medium">{feat.title}</h3>
               <p className="text-[#888] dark:text-[#a0a0a0] text-[15px] leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mobile App & Download Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
            <Sparkles size={14} /> Install Chronoa Anywhere
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif text-[#3d3b33] dark:text-white">Experience Chronoa Natively</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
          {/* Android APK */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-start relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm">
              <Smartphone size={32} strokeWidth={2} />
            </div>
            <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-white mb-3">Android Native</h3>
            <p className="text-[15px] text-[#888] dark:text-[#a0a0a0] mb-8 leading-relaxed">
              Download our ultra-lightweight ~1MB native APK. It bypasses the Google Play Store overhead entirely, granting you instant, clean access to your workspace.
            </p>
            <a href="/chronoa.apk" download className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95">
              <Download size={18} /> Download APK
            </a>
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 w-full">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800/80 dark:text-amber-500/90 leading-relaxed font-medium">
                Browsers often flag direct APK downloads as "harmful" because they aren't downloaded via the Play Store. This is standard behavior. Chronoa is completely safe and open-source.
              </p>
            </div>
          </motion.div>

          {/* iOS / PWA */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-start relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm">
              <Monitor size={32} strokeWidth={2} />
            </div>
            <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-white mb-3">iOS & Desktop</h3>
            <p className="text-[15px] text-[#888] dark:text-[#a0a0a0] mb-8 leading-relaxed">
              Chronoa is engineered as a highly optimized Progressive Web App (PWA). Add it directly to your home screen for a seamless, app-like fullscreen experience.
            </p>
            
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-4 bg-[#f7f5f0]/80 dark:bg-[#252525]/80 p-4 md:p-5 rounded-2xl border border-[#e0ddd5] dark:border-[#444] shadow-inner">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Share size={20} />
                </div>
                <div className="text-[15px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">1. Tap the <strong>Share</strong> button in Safari or Chrome</div>
              </div>
              <div className="flex items-center gap-4 bg-[#f7f5f0]/80 dark:bg-[#252525]/80 p-4 md:p-5 rounded-2xl border border-[#e0ddd5] dark:border-[#444] shadow-inner">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <PlusSquare size={20} />
                </div>
                <div className="text-[15px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">2. Select <strong>Add to Home Screen</strong></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-[#e0ddd5] dark:border-[#2a2a2a] bg-white/50 dark:bg-[#121212]/50 backdrop-blur-md py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#888] dark:text-[#7a7a7a] font-medium">
          <p>© {new Date().getFullYear()} Chronoa. Built for deep focus.</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/XeCipher/Chronoa" target="_blank" rel="noopener noreferrer" className="hover:text-[#c2956e] transition-colors flex items-center gap-2">
              <GithubIcon size={16} /> Source Code
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}