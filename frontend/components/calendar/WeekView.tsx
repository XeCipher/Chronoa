// frontend/components/calendar/WeekView.tsx
"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { eachDayOfInterval, format, isToday, isSameDay, setHours, setMinutes, startOfDay, endOfDay } from "date-fns";
import { CalendarEvent } from "@/types/app.types";
import { MapPin, GripHorizontal } from "lucide-react";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeRangeSelected: (start: Date, end: Date) => void;
  onEventMove: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  eventColors: Record<string, string>;
  targetScrollTime: string | null;
  daysCount?: number;
  scrollToNowTrigger?: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatEventTime = (d: Date) => d.getMinutes() === 0 ? format(d, 'h a') : format(d, 'h:mm a');

// Custom smooth scroll utility for a deliberate, slow animation
const smoothScrollTo = (element: HTMLElement, targetPosition: number, duration: number) => {
  const startPosition = element.scrollTop;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Cubic ease-in-out curve
    const ease = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    element.scrollTop = startPosition + distance * ease;

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

export default function WeekView({ currentDate, events, onEventClick, onTimeRangeSelected, onEventMove, eventColors, targetScrollTime, daysCount = 7, scrollToNowTrigger }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // For initial mount / search target scroll
  useEffect(() => {
    if (scrollRef.current) {
      if (targetScrollTime) {
         const d = new Date(targetScrollTime);
         const targetMins = d.getHours() * 60 + d.getMinutes();
         smoothScrollTo(scrollRef.current, Math.max(0, targetMins - scrollRef.current.clientHeight / 2), 1200);
      } else {
         const current = new Date();
         const currentMins = current.getHours() * 60 + current.getMinutes();
         scrollRef.current.scrollTop = Math.max(0, currentMins - scrollRef.current.clientHeight / 2); // Instant on mount
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetScrollTime]);

  // For "Today" button click
  useEffect(() => {
    if (scrollToNowTrigger && scrollToNowTrigger > 0 && scrollRef.current) {
       const current = new Date();
       const currentMins = current.getHours() * 60 + current.getMinutes();
       smoothScrollTo(scrollRef.current, Math.max(0, currentMins - scrollRef.current.clientHeight / 2), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToNowTrigger]);

  const days = useMemo(() => {
    const end = new Date(currentDate);
    end.setDate(end.getDate() + (daysCount - 1));
    return eachDayOfInterval({ start: currentDate, end });
  }, [currentDate, daysCount]);

  const allDayEvents = useMemo(() => {
    return events.filter(e => e.is_all_day).filter(e => {
       const start = new Date(e.start_time);
       const end = new Date(e.end_time);
       return start <= endOfDay(days[days.length - 1]) && end >= startOfDay(days[0]);
    });
  }, [events, days]);

  const timeEvents = useMemo(() => {
    return events.filter(e => !e.is_all_day).filter(e => {
       const start = new Date(e.start_time);
       const end = new Date(e.end_time);
       return start <= endOfDay(days[days.length - 1]) && end >= startOfDay(days[0]);
    });
  }, [events, days]);

  const getPositionStyle = (start: Date, end: Date, day: Date) => {
    let startMins = 0;
    if (isSameDay(start, day)) startMins = start.getHours() * 60 + start.getMinutes();
    
    let endMins = 24 * 60;
    if (isSameDay(end, day)) endMins = end.getHours() * 60 + end.getMinutes();
    
    const height = Math.max(endMins - startMins, 30);
    return { top: `${startMins}px`, height: `${height}px` };
  };

  const calculateOverlaps = (day: Date) => {
    const dayEvents = timeEvents.filter(e => {
        const sStr = format(new Date(e.start_time), 'yyyy-MM-dd');
        const eStr = format(new Date(e.end_time), 'yyyy-MM-dd');
        const dStr = format(day, 'yyyy-MM-dd');
        return dStr >= sStr && dStr <= eStr;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const clusters: any[] = [];
    dayEvents.forEach(ev => {
        const start = new Date(ev.start_time);
        const end = new Date(ev.end_time);
        const evStart = isSameDay(start, day) ? start.getHours() * 60 + start.getMinutes() : 0;
        const rawEvEnd = isSameDay(end, day) ? end.getHours() * 60 + end.getMinutes() : 24 * 60;
        
        const MIN_DURATION = 30; // 30 minutes prevents visually thin elements from entirely layering over each other
        const evEnd = Math.max(rawEvEnd, evStart + MIN_DURATION);
        
        let added = false;
        for (const cluster of clusters) {
            if (evStart < cluster.end) {
                cluster.events.push({ ev, start: evStart, end: evEnd });
                cluster.end = Math.max(cluster.end, evEnd);
                added = true;
                break;
            }
        }
        if (!added) {
            clusters.push({ end: evEnd, events: [{ ev, start: evStart, end: evEnd }] });
        }
    });

    const positioned: any[] = [];
    clusters.forEach(cluster => {
        const cols: any[][] = [];
        cluster.events.forEach((item: any) => {
            let placed = false;
            for (let i = 0; i < cols.length; i++) {
                const col = cols[i];
                const last = col[col.length - 1];
                if (item.start >= last.end) {
                    col.push(item);
                    item.col = i;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                item.col = cols.length;
                cols.push([item]);
            }
        });
        
        const numCols = cols.length;
        cluster.events.forEach((item: any) => {
            const MIN_DURATION = 30;
            positioned.push({
                event: item.ev,
                top: `${item.start}px`,
                height: `${Math.max(item.end - item.start, MIN_DURATION)}px`,
                left: `calc(${(100 / numCols) * item.col}% + 4px)`,
                width: `calc(${100 / numCols}% - 8px)`
            });
        });
    });

    return positioned;
  };

  const handleMouseDown = (e: React.MouseEvent, day: Date) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.floor(y / 60);
    const min = Math.floor((y % 60) / 15) * 15;
    const time = setMinutes(setHours(day, hour), min);
    
    setIsDragging(true);
    setDragStart(time);
    setDragCurrent(time);
  };

  const handleMouseMove = (e: React.MouseEvent, day: Date) => {
    if (!isDragging || !dragStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.max(0, Math.min(e.clientY - rect.top, 1440));
    const hour = Math.floor(y / 60);
    const min = Math.floor((y % 60) / 15) * 15;
    const time = setMinutes(setHours(day, hour), min);
    setDragCurrent(time);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragCurrent) {
       const start = dragStart < dragCurrent ? dragStart : dragCurrent;
       let end = dragStart > dragCurrent ? dragStart : dragCurrent;
       if (end.getTime() - start.getTime() < 30 * 60000) {
         end = new Date(start.getTime() + 30 * 60000);
       }
       onTimeRangeSelected(start, end);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  const currentMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm overflow-hidden flex-1 min-h-0 select-none">
      
      <div className="flex border-b border-[#e0ddd5] dark:border-[#333] bg-[#f7f5f0]/50 dark:bg-[#222]/50 shrink-0">
        <div className="w-12 md:w-16 border-r border-[#e0ddd5] dark:border-[#333] shrink-0" />
        <div className="flex-1 grid divide-x divide-[#e0ddd5] dark:divide-[#333]" style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}>
          {days.map((day, i) => {
            const isTodayDate = isToday(day);
            return (
              <div key={i} className="flex flex-col items-center justify-center py-2 md:py-3 gap-1">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
                  {format(day, 'EEE')}
                </span>
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm md:text-base font-medium ${isTodayDate ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#3d3b33] dark:text-[#e0e0e0]'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {allDayEvents.length > 0 && (
         <div className="flex border-b border-[#e0ddd5] dark:border-[#333] bg-white dark:bg-[#1e1e1e] shrink-0 min-h-[30px]">
            <div className="w-12 md:w-16 border-r border-[#e0ddd5] dark:border-[#333] shrink-0 flex items-center justify-center">
               <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-[#b0ad9a]">All-day</span>
            </div>
            <div className="flex-1 grid divide-x divide-[#e0ddd5] dark:divide-[#333]" style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}>
               {days.map((day, colIdx) => {
                 const dayAllDayEvents = allDayEvents.filter(e => {
                    const sStr = format(new Date(e.start_time), 'yyyy-MM-dd');
                    const eStr = format(new Date(e.end_time), 'yyyy-MM-dd');
                    const dStr = format(day, 'yyyy-MM-dd');
                    return dStr >= sStr && dStr <= eStr;
                 });
                 return (
                   <div key={colIdx} className="p-1 flex flex-col gap-1 min-h-[30px]">
                     {dayAllDayEvents.map(e => (
                       <div key={e.id} onClick={() => onEventClick(e)} className={`px-1.5 py-1 text-[9px] font-bold rounded-md cursor-pointer truncate shadow-sm flex items-center justify-between ${eventColors[e.color] || eventColors['amber']}`}>
                         <span className="truncate pr-1">{e.title}</span>
                       </div>
                     ))}
                   </div>
                 );
               })}
            </div>
         </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar flex relative bg-[#fdfbf7] dark:bg-[#161616]">
        
        <div className="absolute top-0 right-0 left-12 md:left-16 h-[1440px] pointer-events-none z-0">
          {HOURS.map(hour => (
            <div key={hour} className="absolute w-full border-b border-[#e0ddd5] dark:border-[#2a2a2a] opacity-50" style={{ top: `${hour * 60}px` }} />
          ))}
        </div>

        <div className="w-12 md:w-16 border-r border-[#e0ddd5] dark:border-[#333] shrink-0 relative bg-white dark:bg-[#1a1a1a] z-20 h-[1440px]">
          {HOURS.map(hour => (
            <div key={hour} className="h-[60px] relative">
              {hour > 0 && (
                <span className="absolute -top-2.5 right-2 text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a]">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 relative flex z-10" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          
          {days.map((day, colIdx) => {
            const isTodayDate = isToday(day);
            const overlappingEvents = calculateOverlaps(day);

            let ghostStyle: React.CSSProperties | null = null;
            if (isDragging && dragStart && dragCurrent && isSameDay(dragStart, day)) {
               const s = dragStart < dragCurrent ? dragStart : dragCurrent;
               let e = dragStart > dragCurrent ? dragStart : dragCurrent;
               if (e.getTime() - s.getTime() < 30 * 60000) e = new Date(s.getTime() + 30 * 60000);
               ghostStyle = {
                 ...getPositionStyle(s, e, day),
                 left: "4px",
                 width: "calc(100% - 8px)"
               };
            }

            return (
              <div 
                key={colIdx} 
                className="flex-1 border-r border-[#e0ddd5] dark:border-[#333] last:border-r-0 relative h-[1440px] cursor-default" 
                onMouseDown={(e) => handleMouseDown(e, day)}
                onMouseMove={(e) => handleMouseMove(e, day)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const eventId = e.dataTransfer.getData('text/plain');
                  const grabY = parseInt(e.dataTransfer.getData('grabY') || '0', 10);
                  const ev = events.find(x => x.id === eventId);
                  if (!ev || ev.is_readonly) return;
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = Math.max(0, e.clientY - rect.top - grabY);
                  const hour = Math.floor(y / 60);
                  const min = Math.floor((y % 60) / 15) * 15;
                  
                  const duration = new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime();
                  const newStart = setMinutes(setHours(day, hour), min);
                  const newEnd = new Date(newStart.getTime() + duration);
                  
                  onEventMove(ev, newStart, newEnd);
                }}
              >
                <div 
                   className={`absolute left-0 right-0 z-30 pointer-events-none border-t-[2px] ${isTodayDate ? 'border-red-500 opacity-90' : 'border-red-500/60 opacity-60 dark:border-red-500/70 dark:opacity-40'}`} 
                   style={{ top: `${currentMins}px` }}
                >
                   {isTodayDate && <div className="absolute -left-1.5 -top-[5px] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                </div>

                {ghostStyle && (
                  <div className="absolute rounded-lg bg-[#c2956e] text-white shadow-md pointer-events-none z-40 p-1.5 overflow-hidden" style={ghostStyle}>
                    <div className="text-[10px] font-bold leading-tight">New Event</div>
                  </div>
                )}

                {overlappingEvents.map((pos: any) => {
                  const event = pos.event;
                  const colorClasses = eventColors[event.color] || eventColors['amber'];
                  const numericHeight = parseInt(pos.height.replace('px', ''));

                  const isShort = numericHeight <= 35;
                  const showLocation = !isShort && event.location && numericHeight >= 55;
                  
                  const durationMins = (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
                  const showTime = !isShort && durationMins >= 45;

                  return (
                    <div 
                      key={event.id}
                      draggable={!event.is_readonly} 
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        if (event.is_readonly) return;
                        e.dataTransfer.setData('text/plain', event.id);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const offsetY = e.clientY - rect.top;
                        e.dataTransfer.setData('grabY', offsetY.toString());
                      }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className={`absolute rounded-md md:rounded-md border ${!event.is_readonly ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} shadow-sm overflow-hidden hover:z-30 transition-transform flex flex-col ${colorClasses} z-20 border-black/5 dark:border-white/5`}
                      style={{ top: pos.top, height: pos.height, left: pos.left, width: pos.width }}
                    >
                      <div className={`flex-1 min-h-0 flex flex-col relative overflow-hidden ${isShort ? 'justify-center p-0.5 px-1' : 'p-1.5'}`}>
                        <div className={`font-bold leading-tight flex justify-between gap-1 ${isShort ? 'text-[9px] md:text-[10px] items-center' : 'text-[10px] md:text-xs items-start'}`}>
                          <span className="truncate">{event.title}</span>
                        </div>
                        
                        {showTime && (
                          <div className="text-[9px] md:text-[10px] opacity-80 mt-0.5 truncate shrink-0">
                            {formatEventTime(new Date(event.start_time))} - {formatEventTime(new Date(event.end_time))}
                          </div>
                        )}

                        {showLocation && (
                          <div className="text-[9px] opacity-90 mt-1 truncate flex items-center gap-1.5 font-medium shrink-0">
                            <MapPin size={9} className="shrink-0" /> <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}