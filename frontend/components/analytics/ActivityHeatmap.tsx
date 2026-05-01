"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import { useUiStore } from "@/store/uiStore";
import { Tooltip } from 'react-tooltip';
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyRecord } from '@/app/(dashboard)/analytics/page';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ActivityHeatmap({ dailyMap }: { dailyMap: Record<string, DailyRecord> }) {
  const { theme } = useUiStore();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const today = new Date();
  const [endMonth, setEndMonth] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colors = isDark 
    ? ['#222222', '#1e4a28', '#2d6d39', '#3b8e49', '#4bae5c']
    : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  const { weeks, monthLabels } = useMemo(() => {
    const endDate = new Date(endMonth.year, endMonth.month + 1, 0); // Last day of selected month
    if (endDate > today) {
        endDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    }

    // Determine max count for color scaling
    const maxCount = Math.max(...Object.values(dailyMap).map(d => d.taskCount + (d.focusMinutes > 0 ? 1 : 0)), 1);
    
    const getLevel = (count: number) => {
      if (count === 0) return 0;
      if (count > maxCount * 0.75) return 4;
      if (count > maxCount * 0.5) return 3;
      if (count > maxCount * 0.25) return 2;
      return 1;
    };

    const days = [];
    // Go back exactly 364 days to build exactly 52 full weeks leading up to the endDate
    for (let i = 364; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const record = dailyMap[ymd];
      const count = record ? record.taskCount + (record.focusMinutes > 0 ? 1 : 0) : 0;
      days.push({
        date: ymd,
        count,
        level: getLevel(count),
        dayOfWeek: d.getDay(),
        monthNum: d.getMonth()
      });
    }

    const grid: any[][] = [];
    let currentWeek: any[] = [];
    
    // Pad the first week to start on Sunday
    if (days[0].dayOfWeek !== 0) {
      for (let i = 0; i < days[0].dayOfWeek; i++) currentWeek.push(null);
    }

    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    });

    // Pad the last week to end on Saturday
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      grid.push(currentWeek);
    }

    // Map month labels correctly over the columns
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, i) => {
       const firstValidDay = week.find(d => d !== null);
       if (firstValidDay && firstValidDay.monthNum !== lastMonth) {
          monthLabels.push({ label: MONTHS[firstValidDay.monthNum], weekIndex: i });
          lastMonth = firstValidDay.monthNum;
       }
    });

    return { weeks: grid, monthLabels };
  }, [dailyMap, endMonth]);

  const renderMonthPicker = () => {
    return (
      <div ref={pickerRef} className="absolute top-12 right-0 mt-2 p-4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-2xl shadow-xl z-50 w-[240px] animate-fade-up">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setPickerYear(y => y - 1)} className="p-1 text-[#888] hover:text-[#c2956e]"><ChevronLeft size={16}/></button>
          <span className="text-sm font-bold text-[#3d3b33] dark:text-[#f0f0f0]">{pickerYear}</span>
          <button onClick={() => setPickerYear(y => y + 1)} disabled={pickerYear >= today.getFullYear()} className="p-1 text-[#888] hover:text-[#c2956e] disabled:opacity-30"><ChevronRight size={16}/></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((m, i) => {
            const isFuture = pickerYear === today.getFullYear() && i > today.getMonth();
            const isSelected = pickerYear === endMonth.year && i === endMonth.month;
            return (
              <button 
                key={m} 
                onClick={() => { setEndMonth({ year: pickerYear, month: i }); setShowPicker(false); }}
                disabled={isFuture}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  isFuture ? 'opacity-30 cursor-not-allowed text-[#b0ad9a]' : 
                  isSelected ? 'bg-[#c2956e] text-white' : 
                  'hover:bg-[#f0ede8] dark:hover:bg-[#333] text-[#3d3b33] dark:text-[#f0f0f0]'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col transition-colors min-h-[300px]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-medium text-[#3d3b33] dark:text-[#f0f0f0] italic font-serif">Master Canvas</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] mt-1">12 Months of Focus</p>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowPicker(!showPicker)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-colors ${showPicker ? 'bg-[#c2956e] text-white border-[#c2956e]' : 'bg-[#f7f5f0] dark:bg-[#222] text-[#888] border-[#e0ddd5] dark:border-[#333] hover:text-[#c2956e]'}`}>
             <CalIcon size={14} /> {MONTHS[endMonth.month]} {endMonth.year}
          </button>
          {showPicker && renderMonthPicker()}
        </div>
      </div>
      
      {/* Wrapper to align axes and grid */}
      <div className="flex flex-1 w-full relative">
        
        {/* Isolated Y-Axis Container (No Overlap) */}
        <div className="w-8 shrink-0 flex flex-col relative text-[9px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#555] mr-2">
           {/* 12px height + 3px gap = 15px per block. The top month row is 20px. Mon = index 1, Wed = index 3, Fri = index 5 */}
           <span className="absolute top-[35px]">Mon</span>
           <span className="absolute top-[65px]">Wed</span>
           <span className="absolute top-[95px]">Fri</span>
        </div>

        {/* X-Axis & Grid Container */}
        {/* We use dir="rtl" to keep right-side flush and naturally cut off overflowing items on the left side (like GitHub) */}
        <div className="flex-1 overflow-hidden" dir="rtl">
          {/* Inner wrapper reverted to ltr so grid builds left-to-right correctly */}
          <div className="flex flex-col w-max" dir="ltr">
            
            {/* Month X-Axis */}
            <div className="relative w-full h-[20px] mb-1">
               {monthLabels.map((m, i) => (
                 <span key={i} className="absolute text-[9px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]" style={{ left: `calc(${m.weekIndex} * 15px)` }}>
                   {m.label}
                 </span>
               ))}
            </div>

            {/* The Grid Canvas */}
            <div className="flex gap-[3px] items-start w-max">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => {
                    if (!day) return <div key={dIdx} className="w-[12px] h-[12px] rounded-[3px] bg-transparent" />;
                    return (
                      <div 
                        key={dIdx}
                        data-tooltip-id="canvas-tooltip"
                        data-tooltip-content={`${day.count} activities on ${day.date}`}
                        className="w-[12px] h-[12px] rounded-[3px] transition-transform hover:scale-125 cursor-crosshair border border-black/5 dark:border-white/5"
                        style={{ backgroundColor: colors[day.level] }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
        <span>Less</span>
        {colors.map((c, i) => (
          <div key={i} className="w-[12px] h-[12px] rounded-[3px] border border-black/5 dark:border-white/5" style={{ backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>

      <Tooltip 
        id="canvas-tooltip" 
        className="z-50"
        style={{ backgroundColor: isDark ? '#333' : '#3d3b33', color: '#fff', borderRadius: '12px', fontSize: '11px', padding: '6px 12px', fontWeight: '600' }} 
      />
    </div>
  );
}