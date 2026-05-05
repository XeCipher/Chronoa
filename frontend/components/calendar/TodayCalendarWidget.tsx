// frontend/components/calendar/TodayCalendarWidget.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarEvent } from "@/types/app.types";
import { format, isSameDay, addYears, addDays, addWeeks, addMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, Video } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import EventModal from "./EventModal";
import { syncExternalCalendars } from "@/lib/icsParser";

const EVENT_COLORS: Record<string, string> = {
  amber: 'bg-[#c2956e]/20 text-[#9e7653] dark:bg-[#c2956e]/20 dark:text-[#d1a784]',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  sage: 'bg-[#7ca982]/20 text-[#5a8060] dark:bg-[#7ca982]/20 dark:text-[#8cbd92]',
};

interface Props {
  variant: 'home' | 'tasks';
  searchQuery?: string;
}

const formatTimeStr = (d: Date) => d.getMinutes() === 0 ? format(d, 'h a') : format(d, 'h:mm a');

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function TodayCalendarWidget({ variant, searchQuery = '' }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { calendarWidgetCollapsed, setCalendarWidgetCollapsed } = useUiStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const handleUserScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 10000);
  };

  const fetchTodayEvents = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Background sync on mount for external widgets
    syncExternalCalendars(user.id).then(() => {
      supabase.from('calendar_events').select('*').eq('user_id', user.id).then(({ data }) => {
        if (data) {
          const todayEvents = (data as CalendarEvent[]).filter(e => {
            return isSameDay(new Date(e.start_time), new Date()) || (new Date(e.start_time) <= new Date(new Date().setHours(23, 59, 59, 999)) && new Date(e.end_time) >= new Date(new Date().setHours(0, 0, 0, 0)));
          }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
          setEvents(todayEvents);
          localStorage.setItem('chronoa_cache_calendar_today', JSON.stringify(todayEvents));
        }
      });
    });

    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('end_time', start.toISOString())
      .lte('start_time', end.toISOString());

    if (data) {
      const todayEvents = (data as CalendarEvent[]).filter(e => {
        return isSameDay(new Date(e.start_time), today) || (new Date(e.start_time) <= end && new Date(e.end_time) >= start);
      }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      
      setEvents(todayEvents);
      localStorage.setItem('chronoa_cache_calendar_today', JSON.stringify(todayEvents));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('chronoa_cache_calendar_today');
    if (cached) {
      try {
        setEvents(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    }
    
    fetchTodayEvents();
    
    const channel = supabase.channel('calendar_today')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchTodayEvents)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [fetchTodayEvents]);

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || (e.location && e.location.toLowerCase().includes(q)) || (e.description && e.description.toLowerCase().includes(q));
  });

  const isCollapsed = variant === 'tasks' ? calendarWidgetCollapsed : false;

  useEffect(() => {
    if (isUserScrolling) return;

    const timer = setTimeout(() => {
      if (!loading && filteredEvents.length > 0 && scrollRef.current && !isCollapsed) {
        const container = scrollRef.current;
        const now = new Date();
        
        const firstFutureIndex = filteredEvents.findIndex(e => new Date(e.start_time) > now);
        
        if (firstFutureIndex !== -1) {
          const eventNodes = container.querySelectorAll('.event-card');
          if (eventNodes[firstFutureIndex]) {
             const targetEl = eventNodes[firstFutureIndex] as HTMLElement;
             const offsetTop = targetEl.offsetTop - 16;
             container.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
          }
        } else {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [loading, filteredEvents, isCollapsed, isUserScrolling]);

  const renderHighlightedText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-[#c2956e]/40 dark:bg-[#b0855f]/50 text-[#3d3b33] dark:text-white rounded-[4px] px-[2px] font-semibold">{part}</span>
      ) : part
    );
  };

  const handleEventClick = (e: CalendarEvent) => {
    if (variant === 'tasks') {
      setSelectedEvent(e);
      setIsModalOpen(true);
    }
  };

  const generateRecurringEvents = async (base: CalendarEvent, seriesId: string) => {
    const instances: any[] = [];
    let currentStart = new Date(base.start_time);
    let currentEnd = new Date(base.end_time);
    const limitDate = addYears(new Date(base.start_time), 1);
    
    while (currentStart < limitDate) {
      if (base.repeat_pattern === 'daily') {
        currentStart = addDays(currentStart, 1);
        currentEnd = addDays(currentEnd, 1);
        instances.push({ ...base, id: crypto.randomUUID(), series_id: seriesId, start_time: currentStart.toISOString(), end_time: currentEnd.toISOString() });
      } else if (base.repeat_pattern === 'weekly') {
        currentStart = addWeeks(currentStart, 1);
        currentEnd = addWeeks(currentEnd, 1);
        instances.push({ ...base, id: crypto.randomUUID(), series_id: seriesId, start_time: currentStart.toISOString(), end_time: currentEnd.toISOString() });
      } else if (base.repeat_pattern === 'monthly') {
        currentStart = addMonths(currentStart, 1);
        currentEnd = addMonths(currentEnd, 1);
        instances.push({ ...base, id: crypto.randomUUID(), series_id: seriesId, start_time: currentStart.toISOString(), end_time: currentEnd.toISOString() });
      } else if (base.repeat_pattern === 'yearly') {
        currentStart = addYears(currentStart, 1);
        currentEnd = addYears(currentEnd, 1);
        instances.push({ ...base, id: crypto.randomUUID(), series_id: seriesId, start_time: currentStart.toISOString(), end_time: currentEnd.toISOString() });
      } else if (base.repeat_pattern?.startsWith('custom:')) {
        currentStart = addDays(currentStart, 1);
        currentEnd = addDays(currentEnd, 1);
        const activeDays = base.repeat_pattern.split(':')[1].split(',').map(Number);
        if (activeDays.includes(currentStart.getDay())) {
          instances.push({ ...base, id: crypto.randomUUID(), series_id: seriesId, start_time: currentStart.toISOString(), end_time: currentEnd.toISOString() });
        }
      } else break;
    }
    await supabase.from('calendar_events').insert(instances);
  };

  const handleSaveEvent = async (updates: Partial<CalendarEvent>, updateMode: 'this' | 'future', originalEventObj?: CalendarEvent | null) => {
    const referenceEvent = originalEventObj || selectedEvent;
    
    // Refresh fetching immediately if it was an external color update
    if (referenceEvent?.is_readonly) {
       await fetchTodayEvents();
       return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const baseEvent = { ...updates, user_id: user.id };

    if (updates.id) {
      const isUpgradingToSeries = !referenceEvent?.series_id && updates.repeat_pattern && updates.repeat_pattern !== 'none';

      if (isUpgradingToSeries) {
        const newSeriesId = crypto.randomUUID();
        const upgradedEvent = { ...baseEvent, series_id: newSeriesId } as CalendarEvent;
        await supabase.from('calendar_events').update({ ...upgradedEvent }).eq('id', updates.id);
        await generateRecurringEvents(upgradedEvent, newSeriesId);
      } else if (updateMode === 'this' || !updates.series_id) {
        await supabase.from('calendar_events').update({ ...updates, series_id: null }).eq('id', updates.id);
      } else {
        const currentStartTime = new Date(referenceEvent?.start_time || updates.start_time!);
        await supabase.from('calendar_events').delete().eq('series_id', updates.series_id).gte('start_time', currentStartTime.toISOString());
        
        const newInstanceId = crypto.randomUUID();
        const isNowStandalone = !updates.repeat_pattern || updates.repeat_pattern === 'none';

        const updatedCurrent = { 
          ...baseEvent, 
          id: newInstanceId,
          series_id: isNowStandalone ? null : updates.series_id 
        } as CalendarEvent;
        
        await supabase.from('calendar_events').insert(updatedCurrent);
        if (!isNowStandalone && updatedCurrent.series_id) {
          await generateRecurringEvents(updatedCurrent, updates.series_id);
        }
      }
    }
    await fetchTodayEvents();
  };

  const handleDeleteEvent = async (event: CalendarEvent, deleteMode: 'this' | 'future') => {
    if (deleteMode === 'this' || !event.series_id) {
      await supabase.from('calendar_events').delete().eq('id', event.id);
    } else {
      const currentStartTime = new Date(event.start_time);
      await supabase.from('calendar_events').delete().eq('series_id', event.series_id).gte('start_time', currentStartTime.toISOString());
    }
    await fetchTodayEvents();
  };

  const containerClasses = variant === 'home' 
    ? 'w-[280px] bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden transition-all duration-500'
    : 'w-full bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#ebe8e2] dark:border-[#333] rounded-[28px] overflow-hidden shadow-[0_2px_16px_rgba(44,43,39,0.05)] transition-all duration-300';

  const headerClasses = variant === 'home'
    ? 'px-5 py-4 flex items-center justify-between text-[#3d3b33] dark:text-white'
    : `px-5 md:px-8 py-5 flex items-center justify-between transition-colors duration-300 border-b ${!isCollapsed ? 'border-[#f0ede8] dark:border-[#2a2a2a]' : 'border-transparent'}`;

  return (
    <>
      <div className={containerClasses}>
        <div className={headerClasses}>
          <div className="flex items-center gap-2">
            <CalendarIcon size={variant === 'home' ? 16 : 22} className={variant === 'home' ? 'text-[#3d3b33] dark:text-white' : 'text-[#c2956e]'} />
            <h3 className={`font-serif font-medium leading-none tracking-tight ${variant === 'home' ? 'text-lg mt-0.5' : 'text-[22px] md:text-[26px] text-[#3d3b33] dark:text-[#f0f0f0]'}`}>
              {variant === 'home' ? "Schedule" : "Today's Schedule"}
            </h3>
          </div>
          {variant === 'tasks' && (
            <button 
              onClick={() => setCalendarWidgetCollapsed(!calendarWidgetCollapsed)}
              className="p-1.5 -mr-1.5 text-[#b0ad9a] dark:text-[#7a7a7a] active:bg-gray-100 dark:active:bg-[#333] rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          )}
        </div>

        <div className={`grid w-full transition-all duration-300 ease-in-out ${!isCollapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden w-full">
            <div 
              ref={scrollRef}
              onWheel={handleUserScroll}
              onTouchMove={handleUserScroll}
              className={`relative flex flex-col overflow-y-auto no-scrollbar scroll-smooth w-full ${variant === 'home' ? 'gap-2 px-4 pt-2 pb-4 max-h-[140px]' : 'gap-3 px-5 md:px-8 pt-4 pb-5 max-h-[180px]'}`}
            >
              {loading ? (
                <div className="animate-pulse flex flex-col gap-2">
                  <div className="h-10 bg-black/10 dark:bg-white/10 rounded-xl w-full" />
                  <div className="h-10 bg-black/10 dark:bg-white/10 rounded-xl w-full" />
                </div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map(e => {
                  const colorClass = EVENT_COLORS[e.color] || EVENT_COLORS['amber'];
                  const now = new Date();
                  const isPast = new Date(e.end_time) < now;
                  const isHappeningNow = new Date(e.start_time) <= now && new Date(e.end_time) >= now;
                  
                  const timeStr = e.is_all_day ? 'All-day' : `${formatTimeStr(new Date(e.start_time))} - ${formatTimeStr(new Date(e.end_time))}`;
                  
                  const activeBorder = isHappeningNow ? 'ring-1 ring-offset-1 ring-offset-transparent ring-[#c2956e] dark:ring-[#b0855f] z-10' : 'border border-black/5 dark:border-white/5';

                  return (
                    <div 
                      key={e.id}
                      onClick={() => handleEventClick(e)}
                      className={`event-card flex items-center justify-between p-3 md:p-3.5 rounded-xl shadow-sm transition-all duration-300 ${variant === 'tasks' ? 'cursor-pointer hover:scale-[1.02]' : ''} ${variant === 'home' ? 'bg-white/60 dark:bg-black/40' : colorClass} ${isPast ? 'opacity-40 grayscale-[20%]' : 'event-active opacity-100'} ${isHappeningNow ? 'event-happening-now' : ''} ${activeBorder}`}
                    >
                       <div className="flex flex-col min-w-0 pr-2">
                         <span className={`font-semibold text-sm truncate ${variant === 'home' ? 'text-[#3d3b33] dark:text-[#e0e0e0]' : ''}`}>
                           {renderHighlightedText(e.title)}
                         </span>
                         <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${variant === 'home' ? 'text-[#c2956e] dark:text-[#d1a784]' : 'opacity-80'}`}>
                           {timeStr}
                         </span>
                       </div>
                       {e.meeting_url && (
                          <button 
                            onClick={(ev) => { ev.stopPropagation(); window.open(e.meeting_url!, '_blank'); }}
                            className="shrink-0 bg-[#c2956e] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#b0855f] shadow-sm transition-colors ml-2"
                          >
                            <Video size={12} /> Join
                          </button>
                       )}
                    </div>
                  )
                })
              ) : (
                <div className={`pb-2 text-center text-xs font-medium italic ${variant === 'home' ? 'text-[#3d3b33]/60 dark:text-white/50' : 'text-[#b0ad9a] dark:text-[#7a7a7a]'}`}>
                  {searchQuery ? "No matching events found." : "No events scheduled today."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent} 
        onDelete={handleDeleteEvent}
        initialEvent={selectedEvent} 
      />
    </>
  );
}