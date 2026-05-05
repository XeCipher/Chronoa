// frontend/app/(dashboard)/calendar/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarEvent } from "@/types/app.types";
import { useUiStore } from "@/store/uiStore";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { format, addMonths, subMonths, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks, addYears, subYears, isSameDay, startOfMonth, isToday } from "date-fns";

import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import EventModal from "@/components/calendar/EventModal";

const EVENT_COLORS: Record<string, string> = {
  amber: 'bg-[#c2956e]/20 dark:bg-[#c2956e]/20 text-[#9e7653] dark:text-[#d1a784] border-[#c2956e]/30',
  blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  sage: 'bg-[#7ca982]/20 dark:bg-[#7ca982]/20 text-[#5a8060] dark:text-[#8cbd92] border-[#7ca982]/30',
};

export default function CalendarPage() {
  const { calendarView, setCalendarView, showConfirmDialog } = useUiStore();
  
  const [referenceDate, setReferenceDate] = useState(startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const [targetScrollTime, setTargetScrollTime] = useState<string | null>(null);

  // Used to cleanly inform the views to smoothly scroll down to the current time red-line
  const [scrollToNowTrigger, setScrollToNowTrigger] = useState(0);

  // Date Picker States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(startOfMonth(referenceDate));
  const datePickerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dragTimeRange, setDragTimeRange] = useState<{ start: Date, end: Date } | null>(null);
  const [defaultBaseDate, setDefaultBaseDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPickerMonth(startOfMonth(referenceDate));
  }, [referenceDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isSearchOpen &&
        (!mobileSearchRef.current || !mobileSearchRef.current.contains(target)) &&
        (!desktopSearchRef.current || !desktopSearchRef.current.contains(target))
      ) {
        setIsSearchOpen(false);
      }
      if (
        isDatePickerOpen &&
        datePickerRef.current && !datePickerRef.current.contains(target) &&
        titleRef.current && !titleRef.current.contains(target)
      ) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen, isDatePickerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isDatePickerOpen) setIsDatePickerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, isDatePickerOpen]);

  // Load from cache instantly on mount
  useEffect(() => {
    const cached = localStorage.getItem('chronoa_cache_calendar_main');
    if (cached) {
      try {
        setEvents(JSON.parse(cached));
        setIsLoading(false);
      } catch(e) {}
    }
  }, []);

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const start = new Date(referenceDate);
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date(referenceDate);
    end.setFullYear(end.getFullYear() + 2);

    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString());

    if (data) {
      setEvents(data as CalendarEvent[]);
      localStorage.setItem('chronoa_cache_calendar_main', JSON.stringify(data));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    const channel = supabase.channel('calendar_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchEvents).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [referenceDate]);

  const handlePrev = () => {
    if (calendarView === 'month') setReferenceDate(subMonths(referenceDate, 1));
    else if (calendarView === 'week') {
      if (referenceDate.getDay() !== 0) setReferenceDate(startOfWeek(referenceDate));
      else setReferenceDate(addDays(referenceDate, -7));
    }
    else if (calendarView === '2-day') setReferenceDate(addDays(referenceDate, -1));
    else setReferenceDate(addDays(referenceDate, -1));
  };

  const handleNext = () => {
    if (calendarView === 'month') setReferenceDate(addMonths(referenceDate, 1));
    else if (calendarView === 'week') setReferenceDate(addDays(referenceDate, 7));
    else if (calendarView === '2-day') setReferenceDate(addDays(referenceDate, 1));
    else setReferenceDate(addDays(referenceDate, 1));
  };

  const handleToday = () => {
    setReferenceDate(startOfDay(new Date()));
    setScrollToNowTrigger(Date.now());
  };

  const getDefaultAddDate = () => {
    const now = new Date();
    if (calendarView === 'month') {
      return isSameDay(referenceDate, now) ? now : referenceDate;
    } else if (calendarView === 'week') {
      const end = addDays(referenceDate, 6);
      if (now >= startOfDay(referenceDate) && now <= endOfDay(end)) return now;
      return referenceDate;
    } else if (calendarView === '2-day') {
      const end = addDays(referenceDate, 1);
      if (now >= startOfDay(referenceDate) && now <= endOfDay(end)) return now;
      return referenceDate;
    } else {
      return isSameDay(referenceDate, now) ? now : referenceDate;
    }
  };

  const openAddModal = (start?: Date, end?: Date) => {
    setSelectedEvent(null);
    if (start && end) {
      setDragTimeRange({ start, end });
      setDefaultBaseDate(null);
    } else {
      setDragTimeRange(null);
      setDefaultBaseDate(getDefaultAddDate());
    }
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDragTimeRange(null);
    setIsModalOpen(true);
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

    setEvents(prev => [...prev, ...instances]);
    await supabase.from('calendar_events').insert(instances);
  };

  const handleSaveEvent = async (updates: Partial<CalendarEvent>, updateMode: 'this' | 'future', originalEventObj?: CalendarEvent | null) => {
    const referenceEvent = originalEventObj || selectedEvent;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const baseEvent = { ...updates, user_id: user.id };

    if (updates.id) {
      const isUpgradingToSeries = !referenceEvent?.series_id && updates.repeat_pattern && updates.repeat_pattern !== 'none';

      if (isUpgradingToSeries) {
        const newSeriesId = crypto.randomUUID();
        const upgradedEvent = { ...baseEvent, series_id: newSeriesId } as CalendarEvent;
        
        setEvents(prev => prev.map(e => e.id === updates.id ? { ...upgradedEvent } : e));
        await supabase.from('calendar_events').update({ ...upgradedEvent }).eq('id', updates.id);
        
        await generateRecurringEvents(upgradedEvent, newSeriesId);
      } else if (updateMode === 'this' || !updates.series_id) {
        setEvents(prev => prev.map(e => e.id === updates.id ? { ...e, ...updates, series_id: null } as CalendarEvent : e));
        await supabase.from('calendar_events').update({ ...updates, series_id: null }).eq('id', updates.id);
      } else {
        const currentStartTime = new Date(referenceEvent?.start_time || updates.start_time!);
        setEvents(prev => prev.filter(e => !(e.series_id === updates.series_id && new Date(e.start_time) >= currentStartTime)));
        await supabase.from('calendar_events').delete().eq('series_id', updates.series_id).gte('start_time', currentStartTime.toISOString());
        
        const newInstanceId = crypto.randomUUID();
        const isNowStandalone = !updates.repeat_pattern || updates.repeat_pattern === 'none';

        const updatedCurrent = { 
          ...baseEvent, 
          id: newInstanceId,
          series_id: isNowStandalone ? null : updates.series_id 
        } as CalendarEvent;
        
        setEvents(prev => [...prev, updatedCurrent]);
        await supabase.from('calendar_events').insert(updatedCurrent);

        if (!isNowStandalone && updatedCurrent.series_id) {
          await generateRecurringEvents(updatedCurrent, updates.series_id);
        }
      }
    } else {
      if (updates.repeat_pattern && updates.repeat_pattern !== 'none') {
        const seriesId = crypto.randomUUID();
        const firstInstanceId = crypto.randomUUID();
        const firstInstance = { ...baseEvent, id: firstInstanceId, series_id: seriesId } as CalendarEvent;
        
        setEvents(prev => [...prev, firstInstance]);
        await supabase.from('calendar_events').insert(firstInstance);
        await generateRecurringEvents(firstInstance, seriesId);
      } else {
        const tempId = crypto.randomUUID();
        const newEvent = { ...baseEvent, id: tempId } as CalendarEvent;
        setEvents(prev => [...prev, newEvent]);
        await supabase.from('calendar_events').insert(newEvent);
      }
    }
    // Update cache after save
    setTimeout(() => { fetchEvents() }, 500);
  };

  const handleDeleteEvent = async (event: CalendarEvent, deleteMode: 'this' | 'future') => {
    if (deleteMode === 'this' || !event.series_id) {
      setEvents(prev => prev.filter(e => e.id !== event.id));
      await supabase.from('calendar_events').delete().eq('id', event.id);
    } else {
      const currentStartTime = new Date(event.start_time);
      setEvents(prev => prev.filter(e => !(e.series_id === event.series_id && new Date(e.start_time) >= currentStartTime)));
      await supabase.from('calendar_events').delete().eq('series_id', event.series_id).gte('start_time', currentStartTime.toISOString());
    }
    setTimeout(() => { fetchEvents() }, 500);
  };

  const handleEventMove = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    const updates = {
      ...event,
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString()
    };

    if (event.series_id) {
      showConfirmDialog({
        title: "Update Series",
        message: "Do you want to move just this event, or this and all future events?",
        confirmText: "All Future Events",
        cancelText: "Cancel",
        secondaryAction: {
          text: "Only This Event",
          onClick: () => handleSaveEvent(updates, 'this', event)
        },
        onConfirm: () => handleSaveEvent(updates, 'future', event)
      });
    } else {
      handleSaveEvent(updates, 'this', event);
    }
  };

  const handleSearchResultClick = (e: CalendarEvent) => {
    setReferenceDate(new Date(e.start_time));
    setCalendarView('day');
    setTargetScrollTime(e.start_time);
    setIsSearchOpen(false);
  };

  const filteredEvents = searchQuery 
    ? events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const displayTitle = () => {
    if (calendarView === 'month') return format(referenceDate, 'MMMM yyyy');
    if (calendarView === 'week') return `${format(referenceDate, 'MMM d')} - ${format(addDays(referenceDate, 6), 'MMM d, yyyy')}`;
    if (calendarView === '2-day') return `${format(referenceDate, 'MMM d')} - ${format(addDays(referenceDate, 1), 'MMM d, yyyy')}`;
    return format(referenceDate, 'MMMM d, yyyy');
  };

  const renderHighlightedText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-[#c2956e]/40 dark:bg-[#b0855f]/50 text-[#3d3b33] dark:text-white rounded-[4px] px-[2px] font-bold">{part}</span>
      ) : part
    );
  };

  const renderDatePicker = () => {
    if (calendarView === 'month') {
      return (
        <div ref={datePickerRef} className="absolute top-[calc(100%+8px)] left-0 w-[240px] bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[1.5rem] shadow-xl z-[200] p-4 animate-fade-up cursor-default" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <button onClick={(e) => { e.stopPropagation(); setReferenceDate(subYears(referenceDate, 1)); }} className="p-1.5 text-[#888] bg-[#f7f5f0] dark:bg-[#252525] rounded-lg hover:text-[#c2956e] transition-colors"><ChevronLeft size={16}/></button>
            <span className="text-sm font-bold text-[#3d3b33] dark:text-[#f0f0f0] uppercase tracking-widest">{format(referenceDate, 'yyyy')}</span>
            <button onClick={(e) => { e.stopPropagation(); setReferenceDate(addYears(referenceDate, 1)); }} className="p-1.5 text-[#888] bg-[#f7f5f0] dark:bg-[#252525] rounded-lg hover:text-[#c2956e] transition-colors"><ChevronRight size={16}/></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
              const isSelected = referenceDate.getMonth() === i;
              return (
                <button 
                  key={m} 
                  onClick={(e) => { 
                    e.stopPropagation();
                    const d = new Date(referenceDate); 
                    d.setMonth(i); 
                    setReferenceDate(d); 
                    setIsDatePickerOpen(false); 
                  }}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${isSelected ? 'bg-[#c2956e] text-white shadow-md' : 'hover:bg-[#f0ede8] dark:hover:bg-[#333] text-[#3d3b33] dark:text-[#f0f0f0]'}`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      );
    }

    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const gridDays = (Array.from({ length: firstDay }, () => null) as (Date | null)[]).concat(
        Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
    );

    const isSelectedFn = (d: Date) => {
      if (calendarView === 'week') {
        const start = startOfWeek(referenceDate);
        const end = endOfWeek(referenceDate);
        return d >= start && d <= end;
      } else if (calendarView === '2-day') {
        const end = addDays(referenceDate, 1);
        return d >= startOfDay(referenceDate) && d <= endOfDay(end);
      } else {
        return isSameDay(d, referenceDate);
      }
    };

    return (
        <div ref={datePickerRef} className="absolute top-[calc(100%+8px)] left-0 w-[280px] bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[1.5rem] shadow-xl z-[200] p-4 animate-fade-up cursor-default" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-4">
              <button onClick={(e) => { e.stopPropagation(); setPickerMonth(subMonths(pickerMonth, 1)); }} className="p-1.5 text-[#888] bg-[#f7f5f0] dark:bg-[#252525] rounded-lg hover:text-[#c2956e] transition-colors"><ChevronLeft size={16}/></button>
              <span className="text-sm font-bold text-[#3d3b33] dark:text-[#f0f0f0] uppercase tracking-widest">{format(pickerMonth, 'MMM yyyy')}</span>
              <button onClick={(e) => { e.stopPropagation(); setPickerMonth(addMonths(pickerMonth, 1)); }} className="p-1.5 text-[#888] bg-[#f7f5f0] dark:bg-[#252525] rounded-lg hover:text-[#c2956e] transition-colors"><ChevronRight size={16}/></button>
           </div>
           <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S','M','T','W','T','F','S'].map((d, i) => <span key={i} className="text-[9px] font-bold text-[#b0ad9a]">{d}</span>)}
           </div>
           <div className="grid grid-cols-7 gap-1">
              {gridDays.map((d, i) => {
                 if (!d) return <div key={i} />;
                 const isSelected = isSelectedFn(d);
                 const isTodayDate = isToday(d);
                 return (
                    <button 
                       key={i} 
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         if (calendarView === 'week') setReferenceDate(startOfWeek(d));
                         else setReferenceDate(d); 
                         setIsDatePickerOpen(false); 
                       }}
                       className={`h-8 rounded-lg text-xs font-medium transition-colors ${isSelected ? 'bg-[#c2956e] text-white shadow-md' : isTodayDate ? 'text-[#c2956e] font-bold bg-[#c2956e]/10' : 'hover:bg-[#f0ede8] dark:hover:bg-[#333] text-[#3d3b33] dark:text-white'}`}
                    >
                       {format(d, 'd')}
                    </button>
                 );
              })}
           </div>
        </div>
    );
  };

  const isCurrentDateToday = isSameDay(referenceDate, new Date());

  return (
    <div className={`absolute inset-0 flex flex-col pt-[max(1.5rem,calc(1rem+env(safe-area-inset-top)))] md:pt-[max(3.5rem,calc(2.5rem+env(safe-area-inset-top)))] px-4 md:p-8 lg:p-10 min-w-0 bg-[#f7f5f0] dark:bg-[#121212] overflow-hidden ${calendarView === 'month' ? 'pb-0 md:pb-8' : 'pb-[calc(6.125rem+env(safe-area-inset-bottom))] md:pb-8'}`}>
      
      <div className="flex-1 flex flex-col relative z-10 min-w-0 min-h-0 max-w-full w-full h-full">
        <header className="mb-6 lg:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-50">
          
          <div className="flex items-center justify-between w-full md:w-auto relative">
            <div 
              ref={titleRef}
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0] min-w-0 pr-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <CalendarDays size={24} className="text-[#c2956e] shrink-0" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-2xl md:text-4xl font-serif font-medium tracking-tight leading-normal truncate pb-0.5 select-none">{displayTitle()}</h1>
              </div>
            </div>
            
            {isDatePickerOpen && renderDatePicker()}

            <div className="md:hidden relative shrink-0" ref={mobileSearchRef}>
              <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors shadow-sm border ${isSearchOpen ? 'bg-[#c2956e] text-white border-[#c2956e]' : 'bg-white dark:bg-[#1a1a1a] text-[#888] hover:text-[#c2956e] border-[#e0ddd5] dark:border-[#333]'}`}
                >
                  <Search size={16} />
              </button>

              {isSearchOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[1.5rem] shadow-xl z-[100] p-4 animate-fade-up">
                  <div className="relative w-full mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                    <input 
                      autoFocus
                      value={searchInput} 
                      onChange={e => setSearchInput(e.target.value)} 
                      placeholder="Search events..." spellCheck={false}
                      className="w-full bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#444] rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#c2956e] text-sm text-[#3d3b33] dark:text-[#f0f0f0] transition-all shadow-sm" 
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                    {searchQuery ? (
                      filteredEvents.length > 0 ? filteredEvents.map(e => (
                        <div 
                          key={e.id} onClick={() => handleSearchResultClick(e)}
                          className="p-3 rounded-xl hover:bg-[#f7f5f0] dark:hover:bg-[#222] cursor-pointer transition-colors border border-transparent hover:border-[#e0ddd5] dark:hover:border-[#333]"
                        >
                          <div className="text-sm font-semibold truncate text-[#3d3b33] dark:text-white">{renderHighlightedText(e.title)}</div>
                          <div className="text-[10px] text-[#b0ad9a] mt-1">{format(new Date(e.start_time), 'MMM d, yyyy • h:mm a')}</div>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-xs italic text-[#b0ad9a]">No events found.</div>
                      )
                    ) : (
                      <div className="text-center py-4 text-xs italic text-[#b0ad9a]">Type to search...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto shrink-0">
            <div className="hidden md:block relative shrink-0 h-10" ref={desktopSearchRef}>
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`h-full aspect-square rounded-full border transition-colors shadow-sm flex items-center justify-center ${isSearchOpen ? 'bg-[#c2956e] border-[#c2956e] text-white' : 'bg-white dark:bg-[#1a1a1a] border-[#e0ddd5] dark:border-[#333] text-[#888] hover:text-[#c2956e]'}`}
              >
                <Search size={16} />
              </button>
              {isSearchOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[300px] bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[1.5rem] shadow-xl z-[100] p-4 animate-fade-up">
                  <div className="relative w-full mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                    <input 
                      autoFocus
                      value={searchInput} 
                      onChange={e => setSearchInput(e.target.value)} 
                      placeholder="Search events..." spellCheck={false}
                      className="w-full bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#444] rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#c2956e] text-sm text-[#3d3b33] dark:text-[#f0f0f0] transition-all shadow-sm" 
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                    {searchQuery ? (
                      filteredEvents.length > 0 ? filteredEvents.map(e => (
                        <div 
                          key={e.id} onClick={() => handleSearchResultClick(e)}
                          className="p-3 rounded-xl hover:bg-[#f7f5f0] dark:hover:bg-[#222] cursor-pointer transition-colors border border-transparent hover:border-[#e0ddd5] dark:hover:border-[#333]"
                        >
                          <div className="text-sm font-semibold truncate text-[#3d3b33] dark:text-white">{renderHighlightedText(e.title)}</div>
                          <div className="text-[10px] text-[#b0ad9a] mt-1">{format(new Date(e.start_time), 'MMM d, yyyy • h:mm a')}</div>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-xs italic text-[#b0ad9a]">No events found.</div>
                      )
                    ) : (
                      <div className="text-center py-4 text-xs italic text-[#b0ad9a]">Type to search...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-3 w-full md:w-auto h-10 md:h-10">
              <div className="flex items-center bg-white dark:bg-[#1a1a1a] rounded-full p-0.5 border border-[#e0ddd5] dark:border-[#333] shadow-sm w-full md:w-auto h-full">
                <button onClick={handlePrev} className="flex-1 md:flex-none px-3 text-[#888] hover:text-[#3d3b33] dark:hover:text-white transition-colors h-full flex items-center justify-center rounded-l-full"><ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" /></button>
                <button onClick={handleToday} className={`flex-1 md:flex-none px-2 md:px-4 text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-colors h-full flex items-center justify-center ${isCurrentDateToday ? 'text-[#c2956e] dark:text-[#b0855f]' : 'text-[#3d3b33] dark:text-[#f0f0f0] hover:text-[#c2956e]'}`}>Today</button>
                <button onClick={handleNext} className="flex-1 md:flex-none px-3 text-[#888] hover:text-[#3d3b33] dark:hover:text-white transition-colors h-full flex items-center justify-center rounded-r-full"><ChevronRight size={16} className="md:w-[18px] md:h-[18px]" /></button>
              </div>

              <div className="flex bg-[#ebe8e2]/50 dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] shadow-inner p-1 rounded-full w-full md:w-auto h-full">
                {(['day', '2-day', 'week', 'month'] as const).map(v => (
                  <button 
                    key={v} onClick={() => setCalendarView(v)}
                    className={`flex-1 md:flex-none px-2 md:px-4 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all h-full flex items-center justify-center ${v === 'week' ? 'hidden md:flex' : 'flex'} ${calendarView === v ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] dark:text-[#7a7a7a] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`}
                  >
                    {v === '2-day' ? '2D' : v}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => openAddModal()} className="hidden md:flex h-10 aspect-square items-center justify-center bg-[#c2956e] dark:bg-[#b0855f] text-white rounded-full md:hover:scale-105 transition-all shadow-lg shrink-0">
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 w-full flex flex-col relative z-10">
          {calendarView === 'month' && (
            <MonthView 
              currentDate={referenceDate} 
              events={events}
              onEventClick={openEditModal} 
              onDayClick={(d) => setReferenceDate(d)}
              eventColors={EVENT_COLORS}
              selectedDate={referenceDate}
              isMobile={isMobile}
              openAddModal={openAddModal}
            />
          )}
          {calendarView === 'week' && <WeekView targetScrollTime={targetScrollTime} currentDate={referenceDate} events={events} onEventClick={openEditModal} onTimeRangeSelected={openAddModal} onEventMove={handleEventMove} eventColors={EVENT_COLORS} daysCount={7} scrollToNowTrigger={scrollToNowTrigger} />}
          {calendarView === '2-day' && <WeekView targetScrollTime={targetScrollTime} currentDate={referenceDate} events={events} onEventClick={openEditModal} onTimeRangeSelected={openAddModal} onEventMove={handleEventMove} eventColors={EVENT_COLORS} daysCount={2} scrollToNowTrigger={scrollToNowTrigger} />}
          {calendarView === 'day' && <DayView targetScrollTime={targetScrollTime} currentDate={referenceDate} events={events} onEventClick={openEditModal} onTimeRangeSelected={openAddModal} onEventMove={handleEventMove} eventColors={EVENT_COLORS} scrollToNowTrigger={scrollToNowTrigger} />}
        </div>
      </div>

      {isMobile && (
        <button 
          onClick={() => openAddModal()}
          className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 z-50 w-14 h-14 bg-[#c2956e] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent} 
        onDelete={handleDeleteEvent}
        initialEvent={selectedEvent} 
        dragTimeRange={dragTimeRange}
        defaultBaseDate={defaultBaseDate}
      />
    </div>
  );
}