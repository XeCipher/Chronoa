// frontend/components/analytics/ProductivityChart.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { useUiStore } from "@/store/uiStore";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, X } from 'lucide-react';
import { DailyRecord } from '@/app/(dashboard)/analytics/page';

const getSaturday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = 6 - day; 
  d.setDate(d.getDate() + diff);
  return d;
};

export default function ProductivityChart({ dailyMap }: { dailyMap: Record<string, DailyRecord> }) {
  const { theme } = useUiStore();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const today = new Date();
  today.setHours(0,0,0,0);
  
  const currentSaturday = getSaturday(today);

  const [endDate, setEndDate] = useState<Date>(currentSaturday);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrev = () => {
    const newEnd = new Date(endDate);
    newEnd.setDate(endDate.getDate() - 7);
    setEndDate(newEnd);
  };

  const handleNext = () => {
    const newEnd = new Date(endDate);
    newEnd.setDate(endDate.getDate() + 7);
    if (newEnd > currentSaturday) setEndDate(currentSaturday);
    else setEndDate(newEnd);
  };

  const handleDateSelect = (date: Date) => {
    let weekEnd = getSaturday(date);
    if (weekEnd > currentSaturday) weekEnd = currentSaturday;
    setEndDate(weekEnd);
    setShowCalendar(false);
  };

  const chartData = useMemo(() => {
    const data = [];
    for(let i=6; i>=0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const record = dailyMap[ymd];
      
      data.push({
        display: `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`,
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tasks: record ? record.taskCount : 0,
        focus: record ? record.focusMinutes : 0,
        rawTasks: record ? record.tasks : [],
        rawSessions: record ? record.sessions : []
      });
    }
    return data;
  }, [dailyMap, endDate]);

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
      return (
        <div className="bg-white dark:bg-[#222] border border-[#e0ddd5] dark:border-[#444] p-4 rounded-2xl shadow-xl w-64 max-h-[300px] flex flex-col z-[100]">
          <p className="text-sm font-bold text-[#3d3b33] dark:text-[#f0f0f0] mb-3 pb-2 border-b border-[#e0ddd5] dark:border-[#333]">{data.fullDate}</p>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {data.rawTasks.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7ca982] mb-1">Tasks Completed</p>
                <ul className="space-y-1">
                  {data.rawTasks.map((t: any, i: number) => (
                    <li key={i} className="text-xs text-[#3d3b33] dark:text-[#e0e0e0] flex items-start gap-1.5 leading-tight">
                      <span className="text-[#7ca982] mt-0.5">•</span> {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.rawSessions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2956e] mb-1">Focus Sessions</p>
                <ul className="space-y-1">
                  {data.rawSessions.map((s: any, i: number) => (
                    <li key={i} className="text-xs text-[#3d3b33] dark:text-[#e0e0e0] flex justify-between items-start gap-2 leading-tight">
                      <span className="flex items-start gap-1.5"><span className="text-[#c2956e] mt-0.5">•</span> {s.title}</span>
                      <span className="text-[#b0ad9a] dark:text-[#7a7a7a] tabular-nums shrink-0">{Math.floor(s.duration_seconds/60)}m</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.rawTasks.length === 0 && data.rawSessions.length === 0 && (
               <p className="text-xs text-[#b0ad9a] italic">No activity recorded.</p>
            )}
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
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div ref={calRef} className="absolute top-12 right-0 mt-2 p-4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl shadow-xl z-50 w-[260px] animate-fade-up">
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
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-8 shadow-sm h-[400px] flex flex-col transition-colors relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] italic font-serif">Productivity Pulse</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] mt-1">
            {chartData[0].fullDate} - {chartData[6].fullDate}
          </p>
        </div>
        
        <div className="flex items-center gap-2 relative">
           {endDate.getTime() !== currentSaturday.getTime() && (
             <button onClick={() => setEndDate(currentSaturday)} className="hidden md:block px-3 py-1.5 rounded-xl bg-[#c2956e]/10 text-[#c2956e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#c2956e] hover:text-white transition-colors">
               Present
             </button>
           )}
           <button onClick={() => setShowCalendar(!showCalendar)} className={`p-2 rounded-xl border transition-colors ${showCalendar ? 'bg-[#c2956e] text-white border-[#c2956e]' : 'bg-[#f7f5f0] dark:bg-[#222] text-[#888] border-[#e0ddd5] dark:border-[#333] hover:text-[#c2956e]'}`}>
              {showCalendar ? <X size={16} /> : <CalIcon size={16}/>}
           </button>
           {showCalendar && renderCalendar()}

           <div className="flex items-center bg-[#f7f5f0] dark:bg-[#222] rounded-xl p-0.5 border border-[#e0ddd5] dark:border-[#333]">
              <button onClick={handlePrev} className="p-1.5 text-[#888] hover:text-[#3d3b33] dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>
              <div className="w-px h-4 bg-[#e0ddd5] dark:bg-[#444] mx-1" />
              <button onClick={handleNext} disabled={endDate.getTime() === currentSaturday.getTime()} className="p-1.5 text-[#888] hover:text-[#3d3b33] dark:hover:text-white transition-colors disabled:opacity-30"><ChevronRight size={16} /></button>
           </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
            <defs>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#6a9a70' : '#7ca982'} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={isDark ? '#6a9a70' : '#7ca982'} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#f0ede8'} />
            <XAxis dataKey="display" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#7a7a7a' : '#b0ad9a', fontSize: 11 }} />
            
            <YAxis yAxisId="right" orientation="right" hide={true} width={0} axisLine={false} tickLine={false} tick={false} />
            
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#2a2a2a' : '#f7f5f0' }} />
            <Bar yAxisId="left" dataKey="tasks" name="Tasks Done" fill="url(#colorTasks)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Line yAxisId="right" type="monotone" dataKey="focus" name="Focus Time" stroke={isDark ? '#b0855f' : '#c2956e'} strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1a1a1a' : '#fff' }} activeDot={{ r: 7 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}