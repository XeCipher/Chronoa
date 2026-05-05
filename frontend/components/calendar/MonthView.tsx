// frontend/components/calendar/MonthView.tsx
"use client";

import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from "date-fns";
import { CalendarEvent } from "@/types/app.types";
import { MapPin, Video } from "lucide-react";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  eventColors: Record<string, string>;
  selectedDate: Date;
  isMobile: boolean;
  openAddModal: (start: Date) => void;
}

const formatEventTime = (d: Date) => d.getMinutes() === 0 ? format(d, 'h a') : format(d, 'h:mm a');

export default function MonthView({ currentDate, events, onEventClick, onDayClick, eventColors, selectedDate, isMobile }: Props) {
  
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const getEventsForDay = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => {
       const startStr = format(new Date(e.start_time), 'yyyy-MM-dd');
       const endStr = format(new Date(e.end_time), 'yyyy-MM-dd');
       return dStr >= startStr && dStr <= endStr;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const selectedDayEvents = getEventsForDay(selectedDate);
  const rowsCount = days.length / 7;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full w-full overflow-y-auto lg:overflow-hidden no-scrollbar">
      
      <div className={`flex flex-col bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm overflow-hidden shrink-0 lg:flex-1 ${isMobile ? 'h-[50vh] min-h-[350px]' : 'h-full min-h-0'}`}>
        <div className="flex flex-col h-full w-full">
          <div className="grid grid-cols-7 border-b border-[#e0ddd5] dark:border-[#333] bg-[#f7f5f0]/50 dark:bg-[#222]/50 shrink-0 w-full">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 md:py-3 text-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
                {isMobile ? day.charAt(0) : day}
              </div>
            ))}
          </div>

          <div 
            className="flex-1 grid grid-cols-7 bg-[#e0ddd5] dark:bg-[#333] gap-px min-h-0 w-full"
            style={{ gridTemplateRows: `repeat(${rowsCount}, minmax(0, 1fr))` }}
          >
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isCurrMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSelected = isSameDay(day, selectedDate);

              const maxVisible = 3;
              const visibleEvents = dayEvents.slice(0, maxVisible);
              const extraCount = dayEvents.length - maxVisible;

              return (
                <div 
                  key={i} 
                  onClick={() => onDayClick(day)}
                  className={`bg-white dark:bg-[#1a1a1a] p-1 md:p-2 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-[#fdfbf7] dark:hover:bg-[#222] relative ${(i === days.length - 7 || i === days.length - 1) ? 'overflow-visible' : 'overflow-hidden'} ${!isCurrMonth ? 'opacity-40 bg-gray-50 dark:bg-[#161616]' : ''}`}
                >
                  {/* Gracefully rounded floating selection border to perfectly bypass any container clipping */}
                  {isSelected && (() => {
                    const isBottomLeft  = i === days.length - 7;
                    const isBottomRight = i === days.length - 1;
                    const cornerClass = [
                      isBottomLeft  ? 'rounded-bl-[2rem]' : '',
                      isBottomRight ? 'rounded-br-[2rem]' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <div className={`absolute inset-0 bg-[#c2956e]/10 dark:bg-[#b0855f]/15 border-[1.5px] md:border-2 border-[#c2956e] dark:border-[#b0855f] z-0 pointer-events-none ${cornerClass}`} />
                    );
                  })()}

                  <div className="flex justify-between items-start mb-0.5 md:mb-1 relative z-10 shrink-0">
                    <span className={`flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full text-[10px] md:text-sm font-medium ${
                      isTodayDate && !isSelected 
                        ? 'text-[#c2956e] font-bold' 
                        : isSelected && isTodayDate
                          ? 'bg-[#c2956e] text-white shadow-md'
                          : 'text-[#3d3b33] dark:text-[#e0e0e0]'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="hidden lg:flex flex-wrap gap-1 max-w-[40px] justify-end mt-1">
                      {Array.from(new Set(dayEvents.map(e => e.color))).map((color, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${eventColors[color]?.split(' ')[0] || 'bg-[#c2956e]'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col gap-1 flex-1 min-h-0 overflow-hidden relative z-10">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {visibleEvents.map(event => {
                        const isStart = format(new Date(event.start_time), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                        const isEnd = format(new Date(event.end_time), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                        const colorClasses = eventColors[event.color] || eventColors['amber'];
                        
                        const durationMins = (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
                        const showTime = durationMins >= 45;

                        return (
                          <div 
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold flex justify-between items-center transition-transform hover:scale-[1.02] border border-transparent shadow-sm shrink-0 ${colorClasses} ${isStart ? 'rounded-md md:rounded-md' : 'rounded-none border-l-0'} ${isEnd ? 'rounded-md md:rounded-md' : 'rounded-none border-r-0'}`}
                          >
                            <div className="truncate flex items-center min-w-0 pr-1">
                              <span className="truncate">{event.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!event.is_all_day && showTime && (
                                 <span className="opacity-70 text-[8px] font-bold tracking-wider">{formatEventTime(new Date(event.start_time))} - {formatEventTime(new Date(event.end_time))}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {extraCount > 0 && (
                      <div className="px-1.5 py-0.5 text-[9px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] bg-[#f0ede8] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-md mt-auto text-center transition-colors shadow-sm shrink-0">
                        And more
                      </div>
                    )}
                  </div>

                  <div className="lg:hidden flex flex-wrap gap-1 justify-start mt-auto relative z-10 mb-0.5 ml-0.5">
                    {dayEvents.map((e, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${eventColors[e.color]?.split(' ')[0] || 'bg-[#c2956e]'}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`shrink-0 lg:w-80 bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm flex flex-col animate-fade-in overflow-hidden ${isMobile ? 'flex-1 min-h-[400px]' : 'h-full'}`}>
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#f7f5f0]/30 dark:bg-[#222]/30 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] uppercase tracking-widest mb-0.5">{format(selectedDate, 'EEEE')}</div>
            <div className="font-serif text-2xl text-[#3d3b33] dark:text-white leading-none">{format(selectedDate, 'MMMM d')}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-4 space-y-2">
           {selectedDayEvents.length > 0 ? selectedDayEvents.map(e => {
             const durationMins = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000;
             const showTime = durationMins >= 45;
             const now = new Date();
             const isHappeningNow = new Date(e.start_time) <= now && new Date(e.end_time) >= now;
             
             const activeBorder = isHappeningNow ? 'ring-1 ring-offset-1 ring-offset-transparent ring-[#c2956e] dark:ring-[#b0855f]' : 'border border-[#e0ddd5] dark:border-[#333]';

             return (
               <div key={e.id} onClick={() => onEventClick(e)} className={`px-4 py-3 rounded-[1rem] cursor-pointer hover:scale-[1.02] transition-all shadow-sm flex justify-between items-center ${eventColors[e.color] || eventColors['amber']} ${activeBorder}`}>
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className={`text-sm font-bold truncate leading-tight flex items-center gap-1.5`}>
                       {e.title}
                    </div>
                    <div className="text-[10px] opacity-80 mt-1 uppercase tracking-wider font-semibold flex items-center gap-2">
                      {e.is_all_day && 'All-day'}
                      {!e.is_all_day && showTime && `${formatEventTime(new Date(e.start_time))} - ${formatEventTime(new Date(e.end_time))}`}
                      {e.location && <span className="flex items-center gap-0.5"><MapPin size={10}/> {e.location}</span>}
                    </div>
                  </div>

                  {e.meeting_url && (
                    <button onClick={(ev) => { ev.stopPropagation(); if (e.meeting_url) window.open(e.meeting_url, '_blank'); }} className="bg-[#c2956e] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center w-max gap-1.5 transition-colors hover:bg-[#b0855f] shadow-sm shrink-0">
                       <Video size={12} /> Join
                    </button>
                  )}
               </div>
             );
           }) : (
             <div className="h-full flex flex-col items-center justify-center text-[#b0ad9a] dark:text-[#7a7a7a] italic text-xs gap-2 opacity-70">
                <span>No events for this day.</span>
             </div>
           )}
        </div>
      </div>

    </div>
  );
}