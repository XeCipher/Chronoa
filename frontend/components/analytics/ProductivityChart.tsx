// frontend/components/analytics/ProductivityChart.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { useUiStore } from "@/store/uiStore";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, X, Target, Timer, CheckCircle2 } from 'lucide-react';
import { DailyRecord } from '@/app/(dashboard)/analytics/page';

const getSaturday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = 6 - day; 
  d.setDate(d.getDate() + diff);
  return d;
};

// Intelligently applies border radius only to the absolute highest segment visible for that day
const CustomBarShape = (props: any) => {
  const { fill, x, y, width, height, payload, dataKey } = props;
  
  if (typeof height !== 'number' || height <= 0 || width <= 0) return null;

  // Locate the topmost active stack dynamically
  let topStackKey = null;
  for (let i = 4; i >= 0; i--) {
    if (payload[`stack${i}`] > 0) {
      topStackKey = `stack${i}`;
      break;
    }
  }

  const isTop = dataKey === topStackKey;
  const r = isTop ? Math.min(6, height / 2, width / 2) : 0;
  
  const stackIdx = dataKey.replace('stack', '');
  const actualColor = payload[`color${stackIdx}`] || fill;

  const path = isTop 
    ? `M${x},${y+height} L${x},${y+r} A${r},${r} 0 0,1 ${x+r},${y} L${x+width-r},${y} A${r},${r} 0 0,1 ${x+width},${y+r} L${x+width},${y+height} Z`
    : `M${x},${y+height} L${x},${y} L${x+width},${y} L${x+width},${y+height} Z`;

  return <path d={path} fill={actualColor} />;
};

export default function ProductivityChart({ dailyMap, isSandbox = false }: { dailyMap: Record<string, DailyRecord>, isSandbox?: boolean }) {
  const { theme } = useUiStore();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [isMobile, setIsMobile] = useState(false);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const currentSaturday = getSaturday(today);

  const[endDate, setEndDate] = useState<Date>(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const calRef = useRef<HTMLDivElement>(null);
  
  const [weeksBack, setWeeksBack] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  },[]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  },[]);

  const handlePrev = () => {
    if (isSandbox && weeksBack >= 3) return;
    if (endDate.getTime() === today.getTime()) {
      const prevSat = new Date(currentSaturday);
      prevSat.setDate(prevSat.getDate() - 7);
      setEndDate(prevSat);
    } else {
      const newEnd = new Date(endDate);
      newEnd.setDate(endDate.getDate() - 7);
      setEndDate(newEnd);
    }
    setWeeksBack(prev => prev + 1);
  };

  const handleNext = () => {
    const newEnd = new Date(endDate);
    newEnd.setDate(endDate.getDate() + 7);
    if (newEnd >= today) setEndDate(today);
    else setEndDate(newEnd);
    setWeeksBack(prev => Math.max(0, prev - 1));
  };

  const handleDateSelect = (date: Date) => {
    let weekEnd = getSaturday(date);
    if (weekEnd >= today) weekEnd = today;
    setEndDate(weekEnd);
    setShowCalendar(false);
  };

  const { chartData, maxFocusScale, maxTasksScale } = useMemo(() => {
    // 1. Get Top 4 categories to maintain color consistency across the week
    const catTotals: Record<string, number> = {};
    for(let i=6; i>=0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const record = dailyMap[ymd];
        if (record && record.sessions) {
            record.sessions.forEach((s: any) => {
                const cat = s.title || "Deep Work";
                const mins = s.duration_seconds / 60;
                catTotals[cat] = (catTotals[cat] || 0) + mins;
            });
        }
    }

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topKeys = sortedCats.slice(0, 4).map(x => x[0]);
    
    const FOCUS_COLORS = ['#7ca982', '#6e90c2', '#a882c2', '#5b9ea0']; // Sage, Blue, Purple, Teal
    const OTHERS_COLOR = isDark ? '#333333' : '#e0ddd5';
    
    const colorMap: Record<string, string> = {};
    topKeys.forEach((k, idx) => { colorMap[k] = FOCUS_COLORS[idx % FOCUS_COLORS.length]; });

    const data = [];
    let maxFocus = 0;
    let maxTasks = 0;

    // 2. Iterate each day, sort mathematically ascending, and assign to Recharts generic Stacks
    for(let i=6; i>=0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const record = dailyMap[ymd];

        const dayData: any = {
            display: `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`,
            fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            tasks: record ? record.taskCount : 0,
            focus: record ? record.focusMinutes : 0
        };

        if (dayData.focus > maxFocus) maxFocus = dayData.focus;
        if (dayData.tasks > maxTasks) maxTasks = dayData.tasks;

        // Populate baseline generic stacks to ensure Recharts doesn't crash on undefined values
        [0, 1, 2, 3, 4].forEach(idx => dayData[`stack${idx}`] = 0);

        const todayCats: Record<string, number> = {};
        let todayOthers = 0;
        
        if (record && record.sessions) {
            record.sessions.forEach((s: any) => {
                const cat = s.title || "Deep Work";
                const mins = s.duration_seconds / 60;
                if (topKeys.includes(cat)) {
                    todayCats[cat] = (todayCats[cat] || 0) + mins;
                } else {
                    todayOthers += mins;
                }
            });
        }

        const stackBlocks = Object.entries(todayCats).map(([name, val]) => ({ name, val, color: colorMap[name] }));
        if (todayOthers > 0) stackBlocks.push({ name: 'Others', val: todayOthers, color: OTHERS_COLOR });
        
        // Ensure perfect ascending order per day (Smallest at bottom [stack0], Largest at top)
        stackBlocks.sort((a, b) => a.val - b.val);

        stackBlocks.forEach((block, idx) => {
            dayData[`stack${idx}`] = block.val;
            dayData[`color${idx}`] = block.color;
        });

        // Inject the strictly ordered meta-data for the custom tooltip
        dayData.stackDetails = stackBlocks;
        data.push(dayData);
    }

    // Proportional ratio mapping locking peak focus point securely relative to peak tasks point
    const mFocusScale = maxFocus > 0 ? Math.ceil(maxFocus * 1.1) : 60;
    const mTasksScale = maxTasks > 0 ? Math.ceil(maxTasks * 1.1) : 5;

    return { chartData: data, maxFocusScale: mFocusScale, maxTasksScale: mTasksScale };
  }, [dailyMap, endDate, isDark]);

  const isSelectedWeek = (d: Date) => {
    const chartStart = new Date(endDate);
    chartStart.setDate(chartStart.getDate() - 6);
    chartStart.setHours(0,0,0,0);
    const chartEnd = new Date(endDate);
    chartEnd.setHours(23,59,59,999);
    return d >= chartStart && d <= chartEnd;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Visually flip the order for the tooltip so Largest chunks appear first
      const sortedFocus = [...(data.stackDetails || [])].reverse();

      const totalMins = Math.floor(data.focus);
      const totalH = Math.floor(totalMins / 60);
      const totalM = totalMins % 60;
      const totalTimeStr = totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`;

      return (
        <div className="bg-white dark:bg-[#222] border border-[#e0ddd5] dark:border-[#444] p-4 rounded-2xl shadow-xl flex flex-col z-[100] min-w-[200px]">
          <p className="text-[11px] font-bold text-[#3d3b33] dark:text-[#f0f0f0] mb-3 pb-2 border-b border-[#e0ddd5] dark:border-[#333]">{data.fullDate}</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Timer size={12} className="text-[#888] dark:text-[#a0a0a0]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#888] dark:text-[#a0a0a0]">Focus Time</span>
                </div>
                <span className="text-[10px] font-bold text-[#3d3b33] dark:text-[#f0f0f0] bg-[#f0ede8] dark:bg-[#333] px-1.5 py-0.5 rounded-md shadow-sm">
                  {totalTimeStr}
                </span>
              </div>
              
              {sortedFocus.length > 0 ? sortedFocus.map((p: any) => {
                const mins = Math.floor(p.val);
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                return (
                  <div key={p.name} className="flex items-center justify-between gap-6 pl-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
                      <span className="text-xs text-[#888] dark:text-[#a0a0a0] font-medium">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#3d3b33] dark:text-[#e0e0e0]">{timeStr}</span>
                  </div>
                );
              }) : (
                <span className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] italic pl-1">No focus sessions</span>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-4 mt-1 pt-3 border-t border-[#e0ddd5] dark:border-[#333]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-[#c2956e] dark:text-[#b0855f]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#c2956e] dark:text-[#b0855f]">Tasks Done</span>
              </div>
              <span className="text-sm font-semibold text-[#3d3b33] dark:text-[#e0e0e0]">{data.tasks || 0}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const [weekday, ...dateParts] = payload.value.split(' ');
    const date = dateParts.join(' ');
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} textAnchor="middle" fill={isDark ? '#7a7a7a' : '#b0ad9a'} fontSize={10} fontWeight={700} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{weekday}</text>
        <text x={0} y={0} dy={28} textAnchor="middle" fill={isDark ? '#f0f0f0' : '#3d3b33'} fontSize={11} fontWeight={600}>{date}</text>
      </g>
    );
  };

  const renderCalendar = () => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days =[];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div ref={calRef} className="absolute top-12 right-0 mt-2 p-4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl shadow-xl z-50 w-[260px]">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-1 text-[#888] hover:text-[#c2956e]"><ChevronLeft size={16}/></button>
          <span className="text-sm font-bold text-[#3d3b33] dark:text-[#f0f0f0] uppercase tracking-widest">{calMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
          <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} disabled={year === today.getFullYear() && month === today.getMonth()} className="p-1 text-[#888] hover:text-[#c2956e] disabled:opacity-30"><ChevronRight size={16}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="text-[9px] font-bold text-[#b0ad9a]">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const isFuture = d > today;
            const inActiveWeek = isSelectedWeek(d);
            return (
              <button 
                key={i} 
                onClick={() => !isFuture && handleDateSelect(d)}
                disabled={isFuture}
                className={`relative flex items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors 
                  ${isFuture ? 'opacity-30 cursor-not-allowed text-[#b0ad9a]' : 
                    inActiveWeek ? 'bg-[#c2956e] text-white shadow-sm' : 
                    'hover:bg-[#c2956e]/10 hover:text-[#c2956e] text-[#3d3b33] dark:text-[#e0e0e0]'}
                `}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-8 shadow-sm h-[320px] md:h-[400px] flex flex-col transition-colors relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] font-serif tracking-tight">Activity Flow</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] mt-1">
            {chartData[0].fullDate} - {chartData[6].fullDate}
          </p>
        </div>
        
        <div className="flex items-center gap-2 relative">
           {!isSandbox && endDate.getTime() !== today.getTime() && (
             <button 
               onClick={() => setEndDate(today)} 
               className="flex items-center justify-center p-2 rounded-xl bg-[#c2956e]/10 text-[#c2956e] hover:bg-[#c2956e] hover:text-white transition-colors shrink-0"
               data-tooltip-id={!isMobile ? "global-tooltip" : undefined} data-tooltip-content="Return to Present"
             >
               <Target size={16} />
             </button>
           )}
           {!isSandbox && (
             <button onClick={() => setShowCalendar(!showCalendar)} className={`p-2 rounded-xl border transition-colors ${showCalendar ? 'bg-[#c2956e] text-white border-[#c2956e]' : 'bg-[#f7f5f0] dark:bg-[#222] text-[#888] border-[#e0ddd5] dark:border-[#333] hover:text-[#c2956e]'}`}>
                {showCalendar ? <X size={16} /> : <CalIcon size={16}/>}
             </button>
           )}
           {showCalendar && renderCalendar()}

           <div className="flex items-center bg-[#f7f5f0] dark:bg-[#222] rounded-xl p-0.5 border border-[#e0ddd5] dark:border-[#333]">
              <button 
                onClick={handlePrev} 
                disabled={isSandbox && weeksBack >= 3} 
                className={`p-1.5 transition-colors ${isSandbox && weeksBack >= 3 ? 'opacity-30 cursor-not-allowed text-[#b0ad9a]' : 'text-[#888] hover:text-[#3d3b33] dark:hover:text-white'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-1" />
              <button onClick={handleNext} disabled={endDate.getTime() === today.getTime()} className="p-1.5 text-[#888] hover:text-[#3d3b33] dark:hover:text-white transition-colors disabled:opacity-30"><ChevronRight size={16} /></button>
           </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {/* Extended left margin width perfectly prevents timing cutoffs */}
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#f0ede8'} />
            <XAxis dataKey="display" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} dy={10} interval={0} />
            
            {/* Left Y Axis mapped dynamically to the maximum limit of Focus Minutes */}
            <YAxis 
              yAxisId="left" 
              domain={[0, maxFocusScale]}
              axisLine={false} 
              tickLine={false} 
              width={55}
              tick={{ fill: isDark ? '#7a7a7a' : '#b0ad9a', fontSize: 11 }} 
              tickFormatter={(val) => {
                if (val === 0) return '0m';
                const h = Math.floor(val / 60);
                const m = val % 60;
                if (h > 0 && m === 0) return `${h}h`;
                if (h > 0) return `${h}h ${m}m`;
                return `${m}m`;
              }}
            />
            
            {/* Right Y Axis mathematically synchronized with the Left Y Axis based on absolute maximum Task limits */}
            <YAxis 
              yAxisId="right" 
              domain={[0, maxTasksScale]}
              orientation="right" 
              hide={true} 
              width={0} 
              axisLine={false} 
              tickLine={false} 
              tick={false} 
            />
            
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#2a2a2a' : '#f7f5f0' }} />
            
            {/* Dynamically build Focus Stacks */}
            {[0, 1, 2, 3, 4].map((idx) => (
              <Bar 
                 key={`stack${idx}`} 
                 yAxisId="left" 
                 dataKey={`stack${idx}`} 
                 stackId="focusStack"
                 maxBarSize={40} 
                 isAnimationActive={false}
                 shape={(props: any) => <CustomBarShape {...props} />}
              />
            ))}
            
            {/* Tasks curve uses our signature Amber/Yellow color mapped safely to the Right Y Axis relative ratio */}
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="tasks" 
              name="Tasks Done" 
              stroke={isDark ? '#b0855f' : '#c2956e'} 
              strokeWidth={4} 
              dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1a1a1a' : '#fff' }} 
              activeDot={{ r: 7 }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}