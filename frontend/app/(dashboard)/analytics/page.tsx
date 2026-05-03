// frontend/app/(dashboard)/analytics/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles, CheckCircle2, Timer, Flame, PenTool, Info, X, BarChart2, Target, Search, ChevronDown, ChevronRight, Check } from "lucide-react";
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
  { name: "Blossom", minLevel: 15, minXp: 11111 },
  { name: "Grandmaster", minLevel: 20, minXp: 20000 },
  { name: "Legend", minLevel: 30, minXp: 45000 },
  { name: "Chronoa Ascendant", minLevel: 50, minXp: 125000 }
];

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Recursive Component for Task Selection
const TaskTreeNode = ({ node, selectedIds, onToggle, searchQuery, parentSelected = false }: any) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedIds.has(node.id) || parentSelected;
  
  const hasMatchingDescendant = (n: any): boolean => {
    if (n.title.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    return n.children.some((c: any) => hasMatchingDescendant(c));
  };
  
  const isVisible = !searchQuery || hasMatchingDescendant(node);

  if (!isVisible) return null;

  const renderTitle = () => {
    if (searchQuery) {
      const parts = node.title.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
      return parts.map((part: string, i: number) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <span key={i} className="bg-[#c2956e]/40 dark:bg-[#b0855f]/50 text-[#3d3b33] dark:text-white rounded-[4px] px-[2px] font-semibold">{part}</span>
        ) : part
      );
    }
    return node.title;
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 py-2.5 px-3 hover:bg-[#f7f5f0] dark:hover:bg-[#222] rounded-[1rem] transition-colors group cursor-pointer" onClick={() => { if(!parentSelected) onToggle(node.id); }}>
        <button 
          disabled={parentSelected}
          className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-all shrink-0 ${parentSelected ? 'opacity-50 cursor-not-allowed bg-[#7ca982] border-[#7ca982]' : isSelected ? 'bg-[#7ca982] border-[#7ca982]' : 'bg-white dark:bg-[#1a1a1a] border-[#d4d0c8] dark:border-[#555] group-hover:border-[#7ca982]'}`}
        >
          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>
        
        {node.children && node.children.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="shrink-0 -ml-1 text-[#b0ad9a] hover:text-[#c2956e] dark:hover:text-[#d1a784] transition-colors p-1">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} className="opacity-40 group-hover:opacity-100" />}
          </button>
        )}

        <span className={`text-[14px] font-medium truncate ${parentSelected ? 'opacity-60' : ''} text-[#3d3b33] dark:text-[#f0f0f0]`}>
          {renderTitle()}
        </span>
      </div>
      
      {isExpanded && node.children && node.children.length > 0 && (
        <div className="ml-[18px] pl-4 border-l border-[#e0ddd5] dark:border-[#333] mt-1 space-y-1">
          {node.children.map((child: any) => (
            <TaskTreeNode 
              key={child.id} 
              node={child} 
              selectedIds={selectedIds} 
              onToggle={onToggle} 
              searchQuery={searchQuery}
              parentSelected={isSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function AnalyticsPage() {
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [rawSessions, setRawSessions] = useState<any[]>([]);
  const [rawJournals, setRawJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState<'all' | 'routine' | 'normal'>('all');
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);

  // Tracker Logic
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [selectedTrackedIds, setSelectedTrackedIds] = useState<Set<string>>(new Set());
  const [trackerSearch, setTrackerSearch] = useState("");

  useEffect(() => {
    setSelectedTrackedIds(new Set());
    setTrackerSearch("");
  }, [filterType]);

  useEffect(() => {
    let hasCache = false;
    const cachedTasks = localStorage.getItem('chronoa_cache_rawTasks_v2');
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
        supabase.from('tasks').select('id, title, parent_id, task_type, is_completed, completed_at, deleted_at').eq('user_id', user.id).is('deleted_at', null),
        supabase.from('time_sessions').select('duration_seconds, created_at, title').eq('user_id', user.id),
        supabase.from('journal_entries').select('entry_date').eq('user_id', user.id).is('deleted_at', null)
      ]);

      const newTasks = tasksRes.data || [];
      const newSessions = sessionsRes.data || [];
      const newJournals = journalRes.data || [];

      setRawTasks(newTasks);
      setRawSessions(newSessions);
      setRawJournals(newJournals);
      
      localStorage.setItem('chronoa_cache_rawTasks_v2', JSON.stringify(newTasks));
      localStorage.setItem('chronoa_cache_rawSessions', JSON.stringify(newSessions));
      localStorage.setItem('chronoa_cache_rawJournals', JSON.stringify(newJournals));
      
      setLoading(false);
    };

    fetchRawData();
  }, []);

  // Modal scroll locking
  useEffect(() => {
    if (isRankModalOpen || isTrackerModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isRankModalOpen, isTrackerModalOpen]);

  const toggleSelection = (id: string) => {
    setSelectedTrackedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const taskTree = useMemo(() => {
    if (filterType === 'all') return [];
    const items = rawTasks.filter(t => t.task_type === filterType);
    const map = new Map<string, any>();
    
    items.forEach(t => map.set(t.id, { ...t, children: [] }));
    
    const roots: any[] = [];
    items.forEach(t => {
      if (t.parent_id && map.has(t.parent_id)) {
        map.get(t.parent_id).children.push(map.get(t.id));
      } else {
        roots.push(map.get(t.id));
      }
    });
    return roots;
  }, [rawTasks, filterType]);

  const data = useMemo<AnalyticsData | null>(() => {
    if (loading && rawTasks.length === 0) return null;

    let baseTasks = rawTasks.filter(t => filterType === 'all' || t.task_type === filterType);
    let trackedIds = new Set<string>();
    let trackedTitles = new Set<string>();

    // 1. Gather all tasks and their descendants if specific tasks are tracked
    if (selectedTrackedIds.size > 0) {
      const collect = (id: string) => {
        trackedIds.add(id);
        const t = rawTasks.find(x => x.id === id);
        if (t && t.title) trackedTitles.add(t.title.trim());
        rawTasks.filter(x => x.parent_id === id).forEach(child => collect(child.id));
      };
      selectedTrackedIds.forEach(id => collect(id));
      
      baseTasks = baseTasks.filter(t => trackedIds.has(t.id));
    }

    const completedTasks = baseTasks.filter(t => t.is_completed && t.completed_at);

    // 2. Map sessions intelligently for the Pie Chart using colon sub-category logic
    let mappedSessions: any[] = [];
    if (selectedTrackedIds.size > 0) {
      mappedSessions = rawSessions.filter(s => {
        const title = s.title || '';
        const main = title.split(':')[0].trim();
        return trackedTitles.has(main) || trackedTitles.has(title);
      }).map(s => {
        const title = s.title || '';
        const main = title.split(':')[0].trim();
        if (trackedTitles.has(main) && title.includes(':')) {
           const sub = title.substring(title.indexOf(':') + 1).trim();
           return { ...s, title: sub || main };
        }
        return s;
      });
    } else {
      mappedSessions = rawSessions.map(s => {
        const title = s.title || '';
        return { ...s, title: title.split(':')[0].trim() };
      });
    }

    // 3. Global XP Logic (XP shouldn't plummet just because you filtered views)
    const globalCompletedTasks = rawTasks.filter(t => t.is_completed && t.completed_at).length;
    const globalFocusSeconds = rawSessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    const globalFocusMinutes = Math.floor(globalFocusSeconds / 60);
    const totalJournals = rawJournals.length;

    const xp = (globalCompletedTasks * 10) + (globalFocusMinutes * 2) + (totalJournals * 15);
    const level = Math.floor(Math.sqrt(xp / 50)) + 1;
    const nextLevelXp = Math.pow(level, 2) * 50;
    const prevLevelXp = Math.pow(level - 1, 2) * 50;
    const progress = Math.min(100, Math.max(0, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
    
    const getRank = (lvl: number) => {
      const rankObj = [...RANKS].reverse().find(r => lvl >= r.minLevel);
      return rankObj ? rankObj.name : "Novice";
    };

    // 4. Aggregation into maps
    const getLocalYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dailyMap: Record<string, DailyRecord> = {};
    const ensureDay = (ymd: string) => {
      if (!dailyMap[ymd]) dailyMap[ymd] = { date: ymd, tasks: [], sessions: [], taskCount: 0, focusMinutes: 0 };
    };

    completedTasks.forEach(t => {
      if (!t.completed_at) return;
      const ymd = getLocalYMD(new Date(t.completed_at));
      ensureDay(ymd);
      dailyMap[ymd].tasks.push({ title: t.title, completed_at: t.completed_at, task_type: t.task_type });
      dailyMap[ymd].taskCount++;
    });

    mappedSessions.forEach(s => {
      if (!s.created_at) return;
      const ymd = getLocalYMD(new Date(s.created_at));
      const mins = Math.floor(s.duration_seconds / 60);
      ensureDay(ymd);
      dailyMap[ymd].sessions.push({ title: s.title || 'Focus Session', duration_seconds: s.duration_seconds });
      dailyMap[ymd].focusMinutes += mins;
    });

    // 5. Streak Computation
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
    const filteredFocusMinutes = mappedSessions.reduce((acc, s) => acc + Math.floor(s.duration_seconds / 60), 0);

    return {
      totalFilteredTasks: completedTasks.length,
      totalFocusMinutes: filteredFocusMinutes, 
      currentStreak: activityStreak.current, 
      bestStreak: activityStreak.best,
      journalCurrentStreak: journalStreak.current, 
      journalBestStreak: journalStreak.best,
      dailyMap, 
      rawSessions: mappedSessions,
      levelInfo: { level, rank: getRank(level), progress, xp }
    };
  }, [rawTasks, rawSessions, rawJournals, loading, filterType, selectedTrackedIds]);

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
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 -mb-1 shrink-0">
          {filterType !== 'all' && (
            <button 
              onClick={() => setIsTrackerModalOpen(true)}
              data-tooltip-id="global-tooltip"
              data-tooltip-content={`Track Specific ${filterType === 'routine' ? 'Routines' : 'Tasks'}`}
              className={`order-2 md:order-1 relative flex items-center justify-center w-[42px] h-[42px] rounded-[1rem] transition-colors shadow-sm border shrink-0 ${selectedTrackedIds.size > 0 ? 'bg-[#c2956e] text-white border-[#c2956e]' : 'bg-white dark:bg-[#1a1a1a] text-[#888] border-[#e0ddd5] dark:border-[#333] hover:text-[#c2956e]'}`}
            >
              <Target size={18} /> 
              {selectedTrackedIds.size > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 border-2 border-[#f7f5f0] dark:border-[#121212] text-[8px] font-bold text-white">
                  {selectedTrackedIds.size}
                </span>
              )}
            </button>
          )}
          
          <div className="order-1 md:order-2 flex bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-[1.25rem] shadow-sm shrink-0">
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
          title={selectedTrackedIds.size > 0 ? "Tracked Tasks Done" : filterType === 'all' ? "Tasks Done" : filterType === 'routine' ? "Routines Done" : "Normal Tasks"} 
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

      {/* Task Tracker Modal */}
      {isTrackerModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsTrackerModalOpen(false)} />
          <div className="bg-[#f7f5f0] dark:bg-[#161616] border border-[#e0ddd5] dark:border-[#333] w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[85vh] animate-fade-up">
            
            <header className="px-8 py-6 border-b border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
              <div>
                <h3 className="text-2xl font-serif text-[#3d3b33] dark:text-white">Track {filterType === 'routine' ? 'Routines' : 'Tasks'}</h3>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] font-bold uppercase tracking-widest mt-1">Select specific items to analyze</p>
              </div>
              <button onClick={() => setIsTrackerModalOpen(false)} className="p-2 rounded-full bg-[#f0ede8] dark:bg-[#222] hover:bg-[#e0ddd5] dark:hover:bg-[#333] transition-colors text-[#3d3b33] dark:text-white">
                <X size={20} />
              </button>
            </header>

            <div className="p-6 border-b border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#f7f5f0] dark:bg-[#161616] shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                <input 
                  type="text" placeholder="Search..." 
                  value={trackerSearch} onChange={e => setTrackerSearch(e.target.value)}
                  spellCheck={false}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-[#c2956e] text-[#3d3b33] dark:text-[#f0f0f0] transition-colors shadow-sm"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-2 bg-white dark:bg-[#1a1a1a]">
              {taskTree.length > 0 ? taskTree.map(node => (
                <TaskTreeNode 
                  key={node.id} 
                  node={node} 
                  selectedIds={selectedTrackedIds} 
                  onToggle={toggleSelection} 
                  searchQuery={trackerSearch} 
                />
              )) : (
                <p className="text-center text-[#b0ad9a] dark:text-[#7a7a7a] text-sm italic">No {filterType}s found.</p>
              )}
            </div>

            <footer className="px-8 py-5 border-t border-[#e0ddd5] dark:border-[#2a2a2a] flex justify-between items-center bg-[#f7f5f0] dark:bg-[#161616] shrink-0">
              <button 
                onClick={() => setSelectedTrackedIds(new Set())}
                className="text-[10px] font-bold text-[#888] hover:text-[#3d3b33] dark:hover:text-white uppercase tracking-widest transition-colors"
              >
                Clear Selection
              </button>
              <button 
                onClick={() => setIsTrackerModalOpen(false)}
                className="px-6 py-3 bg-[#c2956e] dark:bg-[#b0855f] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-105 transition-all"
              >
                Apply Tracker
              </button>
            </footer>
          </div>
        </div>
      )}

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