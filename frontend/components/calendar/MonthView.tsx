// frontend/components/calendar/MonthView.tsx
"use client";

import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from "date-fns";
import { CalendarEvent } from "@/types/app.types";

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
       const startStr = e.start_time.split('T')[0];
       const endStr = e.end_time.split('T')[0];
       return dStr >= startStr && dStr <= endStr;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 w-full">
      
      {/* Month view horizontal scroll on phone */}
      <div className={`flex flex-col bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm overflow-hidden flex-1 ${isMobile ? 'h-[50vh] overflow-x-auto no-scrollbar' : 'h-full min-h-0'}`}>
        <div className={`flex flex-col h-full ${isMobile ? 'min-w-[500px]' : 'w-full'}`}>
          <div className="grid grid-cols-7 border-b border-[#e0ddd5] dark:border-[#333] bg-[#f7f5f0]/50 dark:bg-[#222]/50 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#e0ddd5] dark:bg-[#333] gap-px">
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isCurrMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div 
                  key={i} 
                  onClick={() => onDayClick(day)}
                  className={`bg-white dark:bg-[#1a1a1a] p-1.5 md:p-2 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-[#fdfbf7] dark:hover:bg-[#222] relative ${!isCurrMonth ? 'opacity-40 bg-gray-50 dark:bg-[#161616]' : ''}`}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#c2956e]/10 dark:bg-[#b0855f]/15 border-2 border-[#c2956e] dark:border-[#b0855f] rounded-xl md:rounded-2xl m-0.5 z-0 pointer-events-none" />
                  )}

                  <div className="flex justify-between items-start mb-0.5 md:mb-1 relative z-10">
                    <span className={`flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-xs md:text-sm font-medium ${isTodayDate ? 'bg-[#c2956e] text-white shadow-md' : 'text-[#3d3b33] dark:text-[#e0e0e0]'}`}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="md:hidden flex flex-wrap gap-0.5 max-w-[20px] justify-end mt-1">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${eventColors[e.color]?.split(' ')[0] || 'bg-[#c2956e]'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col gap-1 overflow-hidden flex-1 relative z-10">
                    {dayEvents.slice(0, 3).map(event => {
                      const isStart = event.start_time.split('T')[0] === format(day, 'yyyy-MM-dd');
                      const isEnd = event.end_time.split('T')[0] === format(day, 'yyyy-MM-dd');
                      const colorClasses = eventColors[event.color] || eventColors['amber'];
                      return (
                        <div 
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                          className={`px-1.5 py-0.5 text-[10px] font-semibold truncate transition-transform hover:scale-[1.02] border border-transparent shadow-sm ${colorClasses} ${isStart ? 'rounded-l-md' : 'rounded-l-none border-l-0'} ${isEnd ? 'rounded-r-md' : 'rounded-r-none border-r-0'}`}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${isMobile ? 'h-[30vh]' : 'w-80 h-full'} shrink-0 bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm flex flex-col animate-fade-in overflow-hidden`}>
        <div className="flex items-center justify-between p-5 border-b border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#f7f5f0]/30 dark:bg-[#222]/30 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] uppercase tracking-widest mb-0.5">{format(selectedDate, 'EEEE')}</div>
            <div className="font-serif text-2xl text-[#3d3b33] dark:text-white leading-none">{format(selectedDate, 'MMMM d')}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
           {selectedDayEvents.length > 0 ? selectedDayEvents.map(e => (
             <div key={e.id} onClick={() => onEventClick(e)} className={`px-4 py-3 rounded-[1rem] border cursor-pointer hover:scale-[1.02] transition-transform shadow-sm ${eventColors[e.color] || eventColors['amber']}`}>
                <div className="text-sm font-bold truncate leading-tight">{e.title}</div>
                <div className="text-[10px] opacity-80 mt-1 uppercase tracking-wider font-semibold">
                  {e.is_all_day ? 'All-day' : `${format(new Date(e.start_time), 'h:mm a')} - ${format(new Date(e.end_time), 'h:mm a')}`}
                </div>
             </div>
           )) : (
             <div className="h-full flex flex-col items-center justify-center text-[#b0ad9a] dark:text-[#7a7a7a] italic text-xs gap-2 opacity-70">
                <span>No events for this day.</span>
             </div>
           )}
        </div>
      </div>

    </div>
  );
}