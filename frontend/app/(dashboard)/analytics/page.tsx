"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUiStore } from "@/store/uiStore";
import { Sparkles, CheckCircle2, Timer, Flame, PenTool, Info, X } from "lucide-react";
import StatCard from "@/components/analytics/StatCard";
import ProductivityChart from "@/components/analytics/ProductivityChart";
import FocusDistribution from "@/components/analytics/FocusDistribution";
import TimeOfDayRadar from "@/components/analytics/TimeOfDayRadar";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import RankBadge from "@/components/analytics/RankBadge";

export interface DailyRecord {
  date: string;
  tasks: { title: string; completed_at: string }[];
  sessions: { title: string; duration_seconds: number }[];
  taskCount: number;
  focusMinutes: number;
}

export interface AnalyticsData {
  totalTasks: number;
  totalFocusMinutes: number;
  currentStreak: number;
  bestStreak: number;
  journalCurrentStreak: number;
  journalBestStreak: number;
  dailyMap: Record<string, DailyRecord>;
  rawSessions: any[];
  levelInfo: { level: number; rank: string; progress: number; xp: number };
}

// XP Thresholds mapping for the modal
export const RANKS =[
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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const[isRankModalOpen, setIsRankModalOpen] = useState(false);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tasksRes, sessionsRes, journalRes] = await Promise.all([
        supabase.from('tasks').select('title, completed_at').eq('user_id', user.id).eq('is_completed', true).is('deleted_at', null),
        supabase.from('time_sessions').select('duration_seconds, created_at, title').eq('user_id', user.id),
        supabase.from('journal_entries').select('entry_date').eq('user_id', user.id).is('deleted_at', null)
      ]);

      const tasks = tasksRes.data || [];
      const sessions = sessionsRes.data ||[];
      const journals = journalRes.data ||[];

      // 1. Core Totals & Gamification
      const totalTasks = tasks.length;
      const totalFocusSeconds = sessions.reduce((acc, s) => acc + s.duration_seconds, 0);
      const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);
      const totalJournals = journals.length;

      const xp = (totalTasks * 10) + (totalFocusMinutes * 2) + (totalJournals * 15);
      const level = Math.floor(Math.sqrt(xp / 50)) + 1;
      const nextLevelXp = Math.pow(level, 2) * 50;
      const prevLevelXp = Math.pow(level - 1, 2) * 50;
      const progress = Math.min(100, Math.max(0, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
      
      const getRank = (lvl: number) => {
        const rankObj = [...RANKS].reverse().find(r => lvl >= r.minLevel);
        return rankObj ? rankObj.name : "Novice";
      };

      // 2. Build Daily Map
      const getLocalYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dailyMap: Record<string, DailyRecord> = {};
      const ensureDay = (ymd: string) => {
        if (!dailyMap[ymd]) dailyMap[ymd] = { date: ymd, tasks: [], sessions:[], taskCount: 0, focusMinutes: 0 };
      };

      tasks.forEach(t => {
        if (!t.completed_at) return;
        const ymd = getLocalYMD(new Date(t.completed_at));
        ensureDay(ymd);
        dailyMap[ymd].tasks.push({ title: t.title, completed_at: t.completed_at });
        dailyMap[ymd].taskCount++;
      });

      sessions.forEach(s => {
        if (!s.created_at) return;
        const ymd = getLocalYMD(new Date(s.created_at));
        const mins = Math.floor(s.duration_seconds / 60);
        ensureDay(ymd);
        dailyMap[ymd].sessions.push({ title: s.title || 'Focus Session', duration_seconds: s.duration_seconds });
        dailyMap[ymd].focusMinutes += mins;
      });

      // 3. Streaks Calculation Helper
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
            for(let i=1; i<sorted.length; i++) {
                const diffDays = Math.round((new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime())/(1000*60*60*24));
                if (diffDays === 1) { curS++; if (curS > maxS) maxS = curS; } 
                else if (diffDays > 1) { curS = 1; }
            }
            best = maxS;
        }
        return { current, best };
      };

      const activeDays = new Set(Object.keys(dailyMap));
      const journalDays = new Set(journals.map(j => j.entry_date));

      const activityStreak = calculateStreak(activeDays);
      const journalStreak = calculateStreak(journalDays);

      setData({
        totalTasks, totalFocusMinutes, 
        currentStreak: activityStreak.current, bestStreak: activityStreak.best,
        journalCurrentStreak: journalStreak.current, journalBestStreak: journalStreak.best,
        dailyMap, rawSessions: sessions,
        levelInfo: { level, rank: getRank(level), progress, xp }
      });
      setLoading(false);
    };

    fetchAndProcessData();
  },[]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-pulse">
        <Sparkles className="text-[#c2956e] w-8 h-8" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#888]">Analyzing Sanctuary...</span>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4 md:p-10 lg:pl-20 xl:pl-28 space-y-8 pb-24 overflow-x-hidden">
      
      <header className="mb-6 animate-fade-up" style={{ animationDelay: '0ms' }}>
        <h1 className="text-5xl md:text-6xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif italic mb-2 tracking-tight">Performance</h1>
        <p className="text-[#b0ad9a] dark:text-[#7a7a7a] tracking-[0.25em] text-[10px] font-bold uppercase">Consistency builds empires</p>
      </header>

      {/* Level Hero Bar */}
      <div className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
        
        <div className="flex items-center gap-6 shrink-0">
          <RankBadge rank={data?.levelInfo.rank || "Novice"} className="w-20 h-20" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] text-[#c2956e] dark:text-[#b0855f] font-bold uppercase tracking-widest">Sanctuary Rank</p>
              <button onClick={() => setIsRankModalOpen(true)} className="outline-none">
                <Info size={14} className="text-[#888] hover:text-[#c2956e] transition-colors" />
              </button>
            </div>
            <h2 className="text-2xl md:text-3xl font-medium text-[#3d3b33] dark:text-white leading-none">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <StatCard 
          title="Tasks Done" 
          value={data?.totalTasks || 0} 
          icon={CheckCircle2} 
          color="sage" 
          infoText="Includes both Routine and Normal tasks completed."
        />
        <StatCard 
          title="Focus Time" 
          value={`${Math.floor((data?.totalFocusMinutes || 0) / 60)}h ${(data?.totalFocusMinutes || 0) % 60}m`} 
          icon={Timer} 
          color="amber" 
          infoText="Total time accumulated from both timers and stopwatches."
        />
        <StatCard 
          title="Activity Streak" 
          value={`${data?.currentStreak || 0} Days`} 
          subValue={data?.bestStreak}
          icon={Flame} 
          color="purple" 
          infoText="Consecutive days with at least one task completed or focus session logged."
        />
        <StatCard 
          title="Journal Streak" 
          value={`${data?.journalCurrentStreak || 0} Days`} 
          subValue={data?.journalBestStreak}
          icon={PenTool} 
          color="blue" 
          infoText="Consecutive days with a journal entry written."
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '300ms' }}>
        <div className="lg:col-span-2">
          <ProductivityChart dailyMap={data?.dailyMap || {}} />
        </div>
        <div className="lg:col-span-1">
          <TimeOfDayRadar dailyMap={data?.dailyMap || {}} />
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
        <ActivityHeatmap dailyMap={data?.dailyMap || {}} />
        <FocusDistribution rawSessions={data?.rawSessions ||[]} />
      </div>

      {/* Gamification Info Modal */}
      {isRankModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsRankModalOpen(false)} />
          <div className="bg-[#f7f5f0] dark:bg-[#161616] border border-[#e0ddd5] dark:border-[#333] w-full max-w-3xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-fade-up max-h-[85vh]">
            
            <header className="px-8 py-6 border-b border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
              <div>
                <h3 className="text-3xl font-serif italic text-[#3d3b33] dark:text-white">Sanctuary Ranks</h3>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] font-bold uppercase tracking-widest mt-1">Evolve through consistency</p>
              </div>
              <button onClick={() => setIsRankModalOpen(false)} className="p-2 rounded-full bg-[#f0ede8] dark:bg-[#222] hover:bg-[#e0ddd5] dark:hover:bg-[#333] transition-colors text-[#3d3b33] dark:text-white">
                <X size={20} />
              </button>
            </header>

            <div className="p-8 overflow-y-auto no-scrollbar space-y-8">
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