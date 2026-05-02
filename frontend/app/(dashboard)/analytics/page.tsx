// frontend/app/(dashboard)/analytics/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles, CheckCircle2, Timer, Flame, PenTool, Info, X, BarChart2 } from "lucide-react";
import StatCard from "@/components/analytics/StatCard";
import ProductivityChart from "@/components/analytics/ProductivityChart";
import FocusDistribution from "@/components/analytics/FocusDistribution";
import TimeOfDayRadar from "@/components/analytics/TimeOfDayRadar";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import RankBadge from "@/components/analytics/RankBadge";

export interface DailyRecord {
  date: string;
  tasks: { title: string; completed_at: string; task_type: string }[];
  sessions: { title: string; duration_seconds: number }[];
  taskCount: number;
  focusMinutes: number;
}

export interface AnalyticsData {
  totalFilteredTasks: number;
  totalFocusMinutes: number;
  currentStreak: number;
  bestStreak: number;
  journalCurrentStreak: number;
  journalBestStreak: number;
  dailyMap: Record<string, DailyRecord>;
  rawSessions: any[];
  levelInfo: { level: number; rank: string; progress: number; xp: number };
}

export const RANKS = [
  { name: "Novice", minLevel: 1, minXp: 0 },
  { name: "Apprentice", minLevel: 4, minXp: 450 },
  { name: "Scholar", minLevel: 7, minXp: 1800 },
  { name: "Adept", minLevel: 10, minXp: 4050 },
  { name: "Master", minLevel: 15, minXp: 11250 },
  { name: "Grandmaster", minLevel: 20, minXp: 20000 },
  { name: "Legend", minLevel: 30, minXp: 45000 },
  { name: "Chronoa Ascendant", minLevel: 50, minXp: 125000 }
];

export default function AnalyticsPage() {
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [rawSessions, setRawSessions] = useState<any[]>([]);
  const [rawJournals, setRawJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState<'all' | 'routine' | 'normal'>('all');
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);

  useEffect(() => {
    let hasCache = false;
    const cachedTasks = localStorage.getItem('chronoa_cache_rawTasks');
    const cachedSessions = localStorage.getItem('chronoa_cache_rawSessions');
    const cachedJournals = localStorage.getItem('chronoa_cache_rawJournals');
    
    if (cachedTasks && cachedSessions && cachedJournals) {
      try {
        setRawTasks(JSON.parse(cachedTasks));
        setRawSessions(JSON.parse(cachedSessions));
        setRawJournals(JSON.parse(cachedJournals));
        setLoading(false);
        hasCache = true;
      } catch(e) {}
    }

    const fetchRawData = async () => {
      if (!hasCache) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tasksRes, sessionsRes, journalRes] = await Promise.all([
        supabase.from('tasks').select('title, completed_at, task_type').eq('user_id', user.id).eq('is_completed', true).is('deleted_at', null),
        supabase.from('time_sessions').select('duration_seconds, created_at, title').eq('user_id', user.id),
        supabase.from('journal_entries').select('entry_date').eq('user_id', user.id).is('deleted_at', null)
      ]);

      const newTasks = tasksRes.data || [];
      const newSessions = sessionsRes.data || [];
      const newJournals = journalRes.data || [];

      setRawTasks(newTasks);
      setRawSessions(newSessions);
      setRawJournals(newJournals);
      
      localStorage.setItem('chronoa_cache_rawTasks', JSON.stringify(newTasks));
      localStorage.setItem('chronoa_cache_rawSessions', JSON.stringify(newSessions));
      localStorage.setItem('chronoa_cache_rawJournals', JSON.stringify(newJournals));
      
      setLoading(false);
    };

    fetchRawData();
  }, []);

  // Handle modal scroll locking to prevent background bleeding
  useEffect(() => {
    if (isRankModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isRankModalOpen]);

  const data = useMemo<AnalyticsData | null>(() => {
    if (loading && rawTasks.length === 0) return null;

    const filteredTasks = rawTasks.filter(t => filterType === 'all' || t.task_type === filterType);

    const globalTotalTasks = rawTasks.length;
    const totalFocusSeconds = rawSessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);
    const totalJournals = rawJournals.length;

    const xp = (globalTotalTasks * 10) + (totalFocusMinutes * 2) + (totalJournals * 15);
    const level = Math.floor(Math.sqrt(xp / 50)) + 1;
    const nextLevelXp = Math.pow(level, 2) * 50;
    const prevLevelXp = Math.pow(level - 1, 2) * 50;
    const progress = Math.min(100, Math.max(0, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
    
    const getRank = (lvl: number) => {
      const rankObj = [...RANKS].reverse().find(r => lvl >= r.minLevel);
      return rankObj ? rankObj.name : "Novice";
    };

    const getLocalYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dailyMap: Record<string, DailyRecord> = {};
    const ensureDay = (ymd: string) => {
      if (!dailyMap[ymd]) dailyMap[ymd] = { date: ymd, tasks: [], sessions: [], taskCount: 0, focusMinutes: 0 };
    };

    filteredTasks.forEach(t => {
      if (!t.completed_at) return;
      const ymd = getLocalYMD(new Date(t.completed_at));
      ensureDay(ymd);
      dailyMap[ymd].tasks.push({ title: t.title, completed_at: t.completed_at, task_type: t.task_type });
      dailyMap[ymd].taskCount++;
    });

    rawSessions.forEach(s => {
      if (!s.created_at) return;
      const ymd = getLocalYMD(new Date(s.created_at));
      const mins = Math.floor(s.duration_seconds / 60);
      ensureDay(ymd);
      dailyMap[ymd].sessions.push({ title: s.title || 'Focus Session', duration_seconds: s.duration_seconds });
      dailyMap[ymd].focusMinutes += mins;
    });

    const calculateStreak = (daySet: Set<string>) => {
      let current = 0, best = 0;
      const todayYmd = getLocalYMD(new Date());
      const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      
      let checkDate = new Date();
      if (!daySet.has(todayYmd)) checkDate = yesterdayDate;

      while(daySet.has(getLocalYMD(checkDate))) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
      }

      const sorted = Array.from(daySet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      if (sorted.length > 0) {
          let maxS = 1, curS = 1;
          for(let i = 1; i < sorted.length; i++) {
              const diffDays = Math.round((new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays === 1) { curS++; if (curS > maxS) maxS = curS; } 
              else if (diffDays > 1) { curS = 1; }
          }
          best = maxS;
      }
      return { current, best };
    };

    const activeDays = new Set(Object.keys(dailyMap));
    const journalDays = new Set(rawJournals.map(j => j.entry_date));

    const activityStreak = calculateStreak(activeDays);
    const journalStreak = calculateStreak(journalDays);

    return {
      totalFilteredTasks: filteredTasks.length,
      totalFocusMinutes, 
      currentStreak: activityStreak.current, 
      bestStreak: activityStreak.best,
      journalCurrentStreak: journalStreak.current, 
      journalBestStreak: journalStreak.best,
      dailyMap, 
      rawSessions,
      levelInfo: { level, rank: getRank(level), progress, xp }
    };
  }, [rawTasks, rawSessions, rawJournals, loading, filterType]);

  if (loading && rawTasks.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 animate-pulse pt-32">
        <Sparkles className="text-[#c2956e] w-8 h-8" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#888]">Analyzing Data...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full mx-auto p-4 md:p-10 lg:pl-20 xl:pl-28 space-y-8 pb-24 overflow-x-hidden">
      
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0] mb-2">
            <BarChart2 size={20} className="text-[#c2956e]" />
            <h1 className="text-2xl font-serif font-medium tracking-tight">Performance</h1>
          </div>
          <p className="text-[#b0ad9a] dark:text-[#7a7a7a] tracking-[0.25em] text-[10px] font-bold uppercase ml-1">Consistency builds empires</p>
        </div>
        
        <div className="flex bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl shadow-sm w-fit shrink-0">
          {['all', 'routine', 'normal'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilterType(f as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === f ? 'bg-[#c2956e] dark:bg-[#b0855f] text-white shadow-md' : 'text-[#888] hover:text-[#3d3b33] dark:hover:text-[#ccc]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Level Hero Bar */}
      <div className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-10">
        
        <div className="flex items-center gap-6 shrink-0">
          <RankBadge rank={data?.levelInfo.rank || "Novice"} className="w-20 h-20" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] text-[#c2956e] dark:text-[#b0855f] font-bold uppercase tracking-widest">Chronoa Rank</p>
              <button onClick={() => setIsRankModalOpen(true)} className="outline-none p-1 -m-1">
                <Info size={14} className="text-[#888] hover:text-[#c2956e] transition-colors" />
              </button>
            </div>
            <h2 className="text-2xl md:text-3xl font-medium text-[#3d3b33] dark:text-white leading-none font-serif">
              {data?.levelInfo.rank}
            </h2>
          </div>
        </div>
        
        <div className="flex-1 w-full mt-2 md:mt-0">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-medium text-[#888] dark:text-[#aaa]">Experience</span>
            <span className="text-[10px] font-bold tracking-widest text-[#3d3b33] dark:text-[#e0e0e0] uppercase">{data?.levelInfo.xp} / {Math.pow(data?.levelInfo.level || 1, 2) * 50} XP</span>
          </div>
          <div className="w-full h-3 bg-[#f0ede8] dark:bg-[#2a2a2a] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#c2956e] to-[#a882c2] transition-all duration-1000 ease-out"
              style={{ width: `${data?.levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title={filterType === 'all' ? "Tasks Done" : filterType === 'routine' ? "Routines Done" : "Normal Tasks"} 
          value={data?.totalFilteredTasks || 0} 
          icon={CheckCircle2} 
          color="sage"
        />
        <StatCard 
          title="Focus Time" 
          value={`${Math.floor((data?.totalFocusMinutes || 0) / 60)}h ${(data?.totalFocusMinutes || 0) % 60}m`} 
          icon={Timer} 
          color="amber"
        />
        <StatCard 
          title="Activity Streak" 
          value={`${data?.currentStreak || 0} Days`} 
          subValue={data?.bestStreak}
          icon={Flame} 
          color="purple"
        />
        <StatCard 
          title="Journal Streak" 
          value={`${data?.journalCurrentStreak || 0} Days`} 
          subValue={data?.journalBestStreak}
          icon={PenTool} 
          color="blue"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityChart dailyMap={data?.dailyMap || {}} />
        </div>
        <div className="lg:col-span-1">
          <TimeOfDayRadar dailyMap={data?.dailyMap || {}} />
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityHeatmap dailyMap={data?.dailyMap || {}} />
        <FocusDistribution rawSessions={data?.rawSessions || []} />
      </div>

      {/* Gamification Info Modal */}
      {isRankModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsRankModalOpen(false)} />
          <div className="bg-[#f7f5f0] dark:bg-[#161616] border border-[#e0ddd5] dark:border-[#333] w-full max-w-3xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[85vh]">
            
            <header className="px-8 py-6 border-b border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
              <div>
                <h3 className="text-3xl font-serif text-[#3d3b33] dark:text-white">Chronoa Ranks</h3>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] font-bold uppercase tracking-widest mt-1">Evolve through consistency</p>
              </div>
              <button onClick={() => setIsRankModalOpen(false)} className="p-2 rounded-full bg-[#f0ede8] dark:bg-[#222] hover:bg-[#e0ddd5] dark:hover:bg-[#333] transition-colors text-[#3d3b33] dark:text-white">
                <X size={20} />
              </button>
            </header>

            <div className="p-8 overflow-y-auto overscroll-y-contain no-scrollbar space-y-8">
              <div className="flex gap-4 p-4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] rounded-2xl">
                <Info className="text-[#c2956e] shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-[#3d3b33] dark:text-[#e0e0e0] leading-relaxed">
                  <span className="font-bold">How XP Works:</span> You earn XP automatically as you use Chronoa.
                  <ul className="mt-2 space-y-1 grid grid-cols-1 sm:grid-cols-3">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7ca982]"/> 10 XP / Task</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#c2956e]"/> 2 XP / Focus Min</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#6e90c2]"/> 15 XP / Journal</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {RANKS.map((r, i) => (
                  <div key={i} className="flex flex-col items-center p-4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#2a2a2a] rounded-[1.5rem] shadow-sm text-center">
                    <RankBadge rank={r.name} className="w-16 h-16 mb-4" />
                    <h4 className="font-bold text-[#3d3b33] dark:text-[#f0f0f0] text-sm mb-1">{r.name}</h4>
                    <span className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] uppercase tracking-widest font-semibold">{r.minXp.toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}