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

export default function CustomDateTimePicker({ value, onChange, isAllDay, label, minDate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(new Date(value));
  const popoverRef = useRef<HTMLDivElement>(null);

  const [inputHour, setInputHour] = useState(String(value.getHours() % 12 || 12));
  const [inputMin, setInputMin] = useState(String(value.getMinutes()).padStart(2, '0'));

  useEffect(() => {
    setInputHour(String(value.getHours() % 12 || 12));
    setInputMin(String(value.getMinutes()).padStart(2, '0'));
  }, [value]);

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

  const applyTime = (hStr: string, mStr: string, isPM: boolean) => {
    let h = parseInt(hStr) || 12;
    let m = parseInt(mStr) || 0;
    
    if (h < 1) h = 1;
    if (h > 12) h = 12;
    if (m < 0) m = 0;
    if (m > 59) m = 59;

    const newDate = new Date(value);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;

    newDate.setHours(h);
    newDate.setMinutes(m);
    onChange(newDate);
  };

  const handleAmPm = (mode: 'AM' | 'PM') => {
    applyTime(inputHour, inputMin, mode === 'PM');
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputHour(e.target.value);
    applyTime(e.target.value, inputMin, value.getHours() >= 12);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMin(e.target.value);
    applyTime(inputHour, e.target.value, value.getHours() >= 12);
  };

  const flushHour = () => {
    let h = parseInt(inputHour);
    if (isNaN(h) || h < 1) h = 12;
    if (h > 12) h = 12;
    setInputHour(String(h));
  };

  const flushMin = () => {
    let m = parseInt(inputMin);
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    setInputMin(String(m).padStart(2, '0'));
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
            <div className="flex items-center justify-between border-b border-[#e0ddd5] dark:border-[#333] pb-4 mb-4 gap-2">
              <div className="flex items-center gap-1 bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-xl p-1 shadow-inner">
                <input 
                  type="number" min="1" max="12" 
                  inputMode="numeric" pattern="[0-9]*"
                  value={inputHour} 
                  onChange={handleHourChange} 
                  onBlur={flushHour}
                  className="w-8 bg-transparent text-center text-sm font-bold outline-none text-[#3d3b33] dark:text-white appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
                <span className="text-[#b0ad9a] font-bold pb-0.5">:</span>
                <input 
                  type="number" min="0" max="59" 
                  inputMode="numeric" pattern="[0-9]*"
                  value={inputMin} 
                  onChange={handleMinChange} 
                  onBlur={flushMin}
                  className="w-8 bg-transparent text-center text-sm font-bold outline-none text-[#3d3b33] dark:text-white appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
              <div className="flex bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-xl p-1 shadow-inner">
                 <button onClick={() => handleAmPm('AM')} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${value.getHours() < 12 ? 'bg-white dark:bg-[#3d3b33] text-[#c2956e] shadow-sm' : 'text-[#888] hover:text-[#3d3b33] dark:hover:text-white'}`}>AM</button>
                 <button onClick={() => handleAmPm('PM')} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${value.getHours() >= 12 ? 'bg-white dark:bg-[#3d3b33] text-[#c2956e] shadow-sm' : 'text-[#888] hover:text-[#3d3b33] dark:hover:text-white'}`}>PM</button>
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