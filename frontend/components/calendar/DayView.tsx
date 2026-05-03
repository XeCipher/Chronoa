// frontend/components/calendar/DayView.tsx
"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { format, isToday, isSameDay, setHours, setMinutes } from "date-fns";
import { CalendarEvent } from "@/types/app.types";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeRangeSelected: (start: Date, end: Date) => void;
  eventColors: Record<string, string>;
  targetScrollTime: string | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DayView({ currentDate, events, onEventClick, onTimeRangeSelected, eventColors, targetScrollTime }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      if (targetScrollTime) {
         const d = new Date(targetScrollTime);
         const targetMins = d.getHours() * 60 + d.getMinutes();
         scrollRef.current.scrollTop = Math.max(0, targetMins - scrollRef.current.clientHeight / 2);
      } else {
         const currentMins = now.getHours() * 60 + now.getMinutes();
         scrollRef.current.scrollTop = Math.max(0, currentMins - scrollRef.current.clientHeight / 2);
      }
    }
  }, [targetScrollTime]);

  const allDayEvents = useMemo(() => {
    return events.filter(e => e.is_all_day && isSameDay(new Date(e.start_time), currentDate));
  }, [events, currentDate]);

  const timeEvents = useMemo(() => {
    return events.filter(e => !e.is_all_day && isSameDay(new Date(e.start_time), currentDate));
  }, [events, currentDate]);

  const getPositionStyle = (start: Date, end: Date) => {
    const startMins = start.getHours() * 60 + start.getMinutes();
    let endMins = end.getHours() * 60 + end.getMinutes();
    if (!isSameDay(end, start)) endMins = 24 * 60;
    
    const height = Math.max(endMins - startMins, 20);
    return { top: `${startMins}px`, height: `${height}px` };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const y = e.nativeEvent.offsetY;
    const hour = Math.floor(y / 60);
    const min = Math.floor((y % 60) / 15) * 15;
    const time = setMinutes(setHours(currentDate, hour), min);
    
    setIsDragging(true);
    setDragStart(time);
    setDragCurrent(time);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const y = Math.max(0, Math.min(e.nativeEvent.offsetY, 1440));
    const hour = Math.floor(y / 60);
    const min = Math.floor((y % 60) / 15) * 15;
    const time = setMinutes(setHours(currentDate, hour), min);
    setDragCurrent(time);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragCurrent) {
       const start = dragStart < dragCurrent ? dragStart : dragCurrent;
       let end = dragStart > dragCurrent ? dragStart : dragCurrent;
       if (end.getTime() - start.getTime() < 30 * 60000) end = new Date(start.getTime() + 30 * 60000);
       onTimeRangeSelected(start, end);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  const currentMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm overflow-hidden flex-1 min-h-0 max-w-4xl mx-auto w-full select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      
      <div className="flex border-b border-[#e0ddd5] dark:border-[#333] bg-[#f7f5f0]/50 dark:bg-[#222]/50 shrink-0">
        <div className="w-16 border-r border-[#e0ddd5] dark:border-[#333] shrink-0" />
        <div className="flex-1 flex flex-col items-center justify-center py-4 gap-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
            {format(currentDate, 'EEEE')}
          </span>
          <span className={`w-10 h-10 flex items-center justify-center rounded-full text-xl font-medium ${isToday(currentDate) ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#3d3b33] dark:text-[#e0e0e0]'}`}>
            {format(currentDate, 'd')}
          </span>
        </div>
      </div>

      {allDayEvents.length > 0 && (
         <div className="flex border-b border-[#e0ddd5] dark:border-[#333] bg-white dark:bg-[#1e1e1e] shrink-0 min-h-[30px]">
            <div className="w-16 border-r border-[#e0ddd5] dark:border-[#333] shrink-0 flex items-center justify-center">
               <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0ad9a]">All-day</span>
            </div>
            <div className="flex-1 relative p-2 overflow-y-auto max-h-[100px]">
               <div className="flex flex-col gap-1">
                 {allDayEvents.map(e => (
                   <div key={e.id} onClick={() => onEventClick(e)} className={`px-3 py-2 text-[11px] font-bold rounded-lg cursor-pointer ${eventColors[e.color] || eventColors['amber']}`}>
                     {e.title}
                   </div>
                 ))}
               </div>
            </div>
         </div>
      )}

      {/* Time Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar flex relative bg-[#fdfbf7] dark:bg-[#161616]">
        
        {/* Horizontal Lines & Global Red Line Container (Placed exactly inside the flex-1) */}
        <div className="absolute top-0 right-0 left-16 h-[1440px] pointer-events-none z-0">
          {HOURS.map(hour => (
            <div key={hour} className="absolute w-full border-b border-[#e0ddd5] dark:border-[#2a2a2a] opacity-50 shrink-0" style={{ top: `${hour * 60}px` }} />
          ))}
          <div className="absolute left-0 w-full border-t border-red-500 opacity-40" style={{ top: `${currentMins}px` }} />
        </div>

        <div className="w-16 border-r border-[#e0ddd5] dark:border-[#333] shrink-0 relative bg-white dark:bg-[#1a1a1a] z-20 h-[1440px]">
          {HOURS.map(hour => (
            <div key={hour} className="h-[60px] relative">
              {hour > 0 && (
                <span className="absolute -top-2.5 right-3 text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a]">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              )}
            </div>
          ))}
        </div>

        <div 
          className="flex-1 relative h-[1440px] cursor-default z-10" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          {isToday(currentDate) && (
            <div className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none" style={{ top: `${currentMins}px` }}>
               <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-md shadow-red-500/50" />
            </div>
          )}

          {isDragging && dragStart && dragCurrent && (
             (() => {
               const s = dragStart < dragCurrent ? dragStart : dragCurrent;
               let e = dragStart > dragCurrent ? dragStart : dragCurrent;
               if (e.getTime() - s.getTime() < 30 * 60000) e = new Date(s.getTime() + 30 * 60000);
               const ghostStyle = getPositionStyle(s, e);
               return (
                  <div className="absolute left-2 right-4 rounded-xl bg-[#c2956e] text-white shadow-md pointer-events-none z-40 p-2 overflow-hidden" style={ghostStyle}>
                    <div className="text-xs font-bold leading-tight">New Event</div>
                  </div>
               );
             })()
          )}

          {timeEvents.map(event => {
            const style = getPositionStyle(new Date(event.start_time), new Date(event.end_time));
            const colorClasses = eventColors[event.color] || eventColors['amber'];
            return (
              <div 
                key={event.id}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                className={`absolute left-2 right-4 rounded-xl border p-2 cursor-pointer shadow-md overflow-hidden hover:z-30 hover:scale-[1.01] transition-transform ${colorClasses} z-20`}
                style={style}
              >
                <div className="text-sm font-bold leading-tight">{event.title}</div>
                <div className="text-[11px] opacity-80 mt-1">
                  {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                </div>
                {event.description && <div className="text-[11px] mt-2 opacity-70 line-clamp-2">{event.description}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}