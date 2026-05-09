// frontend/components/calendar/CustomDateTimePicker.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfDay, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  isAllDay: boolean;
  label: string;
  minDate?: Date;
}

// Apple-style native feeling wheel picker component
function WheelPicker({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const ITEM_HEIGHT = 32;

  useEffect(() => {
    if (!scrollRef.current) return;
    const idx = options.indexOf(value);
    if (idx !== -1) {
      isProgrammaticScroll.current = true;
      scrollRef.current.scrollTop = idx * ITEM_HEIGHT;
      setTimeout(() => { isProgrammaticScroll.current = false; }, 100);
    }
  }, [value, options]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    const el = e.currentTarget;
    const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
    if (options[idx] && options[idx] !== value) {
      onChange(options[idx]);
    }
  };

  return (
    <div 
      ref={scrollRef} 
      onScroll={handleScroll}
      className="h-[96px] overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center relative z-10 w-full"
    >
      <div style={{ height: ITEM_HEIGHT }} />
      {options.map((opt) => (
        <div 
          key={opt} 
          style={{ height: ITEM_HEIGHT }} 
          className={`snap-center flex items-center justify-center text-sm font-bold transition-colors cursor-pointer ${opt === value ? 'text-[#c2956e] dark:text-[#b0855f]' : 'text-[#888] dark:text-[#7a7a7a]'}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </div>
      ))}
      <div style={{ height: ITEM_HEIGHT }} />
    </div>
  );
}

export default function CustomDateTimePicker({ value, onChange, isAllDay, label, minDate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(new Date(value));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const days = eachDayOfInterval({ start: startOfMonth(monthCursor), end: endOfMonth(monthCursor) });
  const startOffset = days[0].getDay();
  const calendarGrid = Array.from({ length: startOffset }, () => null).concat(days as any[]);

  const handleDaySelect = (day: Date) => {
    const newDate = new Date(value);
    newDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(newDate);
    if (isAllDay) setIsOpen(false);
  };

  const currentHour = String(value.getHours() % 12 || 12);
  const currentMin = String(Math.floor(value.getMinutes() / 5) * 5).padStart(2, '0');
  const currentAmPm = value.getHours() >= 12 ? 'PM' : 'AM';

  const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutesOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
  const ampmOptions =['AM', 'PM'];

  const handleTimeChange = (hStr: string, mStr: string, apStr: string) => {
    let h = parseInt(hStr);
    if (apStr === 'PM' && h !== 12) h += 12;
    if (apStr === 'AM' && h === 12) h = 0;
    const newDate = new Date(value);
    newDate.setHours(h, parseInt(mStr), 0, 0);
    onChange(newDate);
  };

  return (
    <div className="relative flex-1 flex flex-col gap-1.5" ref={popoverRef}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#888] ml-1">{label}</span>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center bg-white dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-4 py-3 text-sm focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-white transition-colors shadow-sm"
      >
        <CalIcon size={16} className="text-[#b0ad9a] mr-2 shrink-0" />
        <span className="font-medium">
          {format(value, isAllDay ? 'MMM d, yyyy' : 'MMM d, yyyy • h:mm a')}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 md:left-auto md:right-0 w-[280px] bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[1.5rem] shadow-2xl z-50 p-5 animate-fade-up">
          
          {!isAllDay && (
            <div className="flex items-center justify-center border-b border-[#e0ddd5] dark:border-[#333] pb-4 mb-4 gap-2">
              <div className="flex items-center justify-center gap-1 bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-2xl p-1.5 shadow-inner relative overflow-hidden h-[96px] w-full">
                <div className="absolute top-1/2 -translate-y-1/2 w-[calc(100%-12px)] h-[32px] bg-white dark:bg-[#333] shadow-sm rounded-lg z-0" />
                <div className="flex-1 z-10"><WheelPicker options={hoursOptions} value={currentHour} onChange={(val) => handleTimeChange(val, currentMin, currentAmPm)} /></div>
                <span className="font-bold text-[#b0ad9a] z-10 pb-[2px]">:</span>
                <div className="flex-1 z-10"><WheelPicker options={minutesOptions} value={currentMin} onChange={(val) => handleTimeChange(currentHour, val, currentAmPm)} /></div>
                <div className="flex-1 z-10"><WheelPicker options={ampmOptions} value={currentAmPm} onChange={(val) => handleTimeChange(currentHour, currentMin, val)} /></div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setMonthCursor(subMonths(monthCursor, 1))} className="p-1.5 text-[#888] bg-[#f7f5f0] dark:bg-[#252525] rounded-lg hover:text-[#c2956e] transition-colors"><ChevronLeft size={16}/></button>
            <span className="text-[11px] font-bold text-[#3d3b33] dark:text-[#f0f0f0] uppercase tracking-widest">{format(monthCursor, 'MMMM yyyy')}</span>
            <button onClick={() => setMonthCursor(addMonths(monthCursor, 1))} className="p-1.5 text-[#888] bg-[#f7f5f0] dark:bg-[#252525] rounded-lg hover:text-[#c2956e] transition-colors"><ChevronRight size={16}/></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S','M','T','W','T','F','S'].map((d, i) => <span key={i} className="text-[9px] font-bold text-[#b0ad9a]">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((d, i) => {
              if (!d) return <div key={i} />;
              const isSelected = isSameDay(d, value);
              
              const isPast = minDate && isBefore(d, startOfDay(minDate));

              return (
                <button 
                  key={i} onClick={() => { if(!isPast) handleDaySelect(d); }}
                  disabled={isPast as boolean}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors 
                    ${isPast ? 'opacity-30 cursor-not-allowed text-[#b0ad9a]' : 
                    isSelected ? 'bg-[#c2956e] text-white shadow-md' : 'hover:bg-[#f0ede8] dark:hover:bg-[#333] text-[#3d3b33] dark:text-white'}`}
                >
                  {format(d, 'd')}
                </button>
              )
            })}
          </div>

        </div>
      )}
    </div>
  );
}