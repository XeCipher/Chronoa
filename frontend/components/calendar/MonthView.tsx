// frontend/components/calendar/MonthView.tsx
"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  addDays,
  differenceInCalendarDays,
} from "date-fns";
import { CalendarEvent } from "@/types/app.types";
import { MapPin, Video } from "lucide-react";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  onEventMove?: (event: CalendarEvent, newStart: Date, newEnd: Date, newIsAllDay?: boolean) => void;
  eventColors: Record<string, string>;
  selectedDate: Date;
  isMobile: boolean;
  openAddModal: (start: Date) => void;
}

const formatEventTime = (d: Date) => (d.getMinutes() === 0 ? format(d, "h a") : format(d, "h:mm a"));

const getVisualEnd = (start: Date, end: Date, isAllDay: boolean) => {
  if (
    !isAllDay &&
    end > start &&
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0
  ) {
    return new Date(end.getTime() - 1);
  }
  return end;
};

const DOT_COLORS: Record<string, string> = {
  amber: "bg-[#c2956e] dark:bg-[#b0855f]",
  blue: "bg-blue-500 dark:bg-blue-400",
  purple: "bg-purple-500 dark:bg-purple-400",
  rose: "bg-rose-500 dark:bg-rose-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  sage: "bg-[#7ca982] dark:bg-[#6a9a70]",
};

export default function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
  onEventMove,
  eventColors,
  selectedDate,
  isMobile: isMobileProp,
}: Props) {
  const rightPanelScrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [dragOverDayIdx, setDragOverDayIdx] = useState<number | null>(null);

  const [isMobile, setIsMobile] = useState(isMobileProp);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const getEventsForDay = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    return events
      .filter((e) => {
        const start = new Date(e.start_time);
        const visualEnd = getVisualEnd(start, new Date(e.end_time), e.is_all_day);
        const startStr = format(start, "yyyy-MM-dd");
        const endStr = format(visualEnd, "yyyy-MM-dd");
        return dStr >= startStr && dStr <= endStr;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const selectedDayEvents = getEventsForDay(selectedDate);
  const rowsCount = days.length / 7;

  useEffect(() => {
    if (isUserScrolling || !isToday(selectedDate)) return;

    const timer = setTimeout(() => {
      if (selectedDayEvents.length > 0 && rightPanelScrollRef.current) {
        const container = rightPanelScrollRef.current;
        const now = new Date();

        const firstFutureIndex = selectedDayEvents.findIndex((e) => new Date(e.end_time) > now);

        if (firstFutureIndex !== -1) {
          const eventNodes = container.querySelectorAll(".month-event-card");
          if (eventNodes[firstFutureIndex]) {
            const targetEl = eventNodes[firstFutureIndex] as HTMLElement;
            const offsetTop = targetEl.offsetTop - 16;
            container.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
          }
        } else {
          container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedDate, selectedDayEvents, isUserScrolling]);

  return (
    <div
      className={`flex flex-col lg:flex-row gap-4 h-full w-full overflow-y-auto lg:overflow-hidden no-scrollbar ${
        isMobile ? "pb-[calc(6.125rem+1rem+env(safe-area-inset-bottom))]" : ""
      }`}
    >
      <div
        className={`flex flex-col bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm overflow-hidden shrink-0 lg:flex-1 ${
          isMobile ? "h-[50vh] min-h-[350px]" : "h-full min-h-0"
        }`}
      >
        <div className="flex flex-col h-full w-full">
          <div className="grid grid-cols-7 border-b border-[#e0ddd5] dark:border-[#333] bg-[#f7f5f0]/50 dark:bg-[#222]/50 shrink-0 w-full">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-2 md:py-3 text-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]"
              >
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
                  onDragOver={(e) => {
                    if (onEventMove) {
                      e.preventDefault();
                      setDragOverDayIdx(i);
                    }
                  }}
                  onDragLeave={() => setDragOverDayIdx((prev) => (prev === i ? null : prev))}
                  onDrop={(e) => {
                    setDragOverDayIdx(null);
                    if (!onEventMove) return;
                    e.preventDefault();

                    const eventId = e.dataTransfer.getData("text/plain");
                    const sourceDayStr = e.dataTransfer.getData("sourceDay");
                    const ev = events.find((x) => x.id === eventId);
                    if (!ev || ev.is_readonly) return;

                    const sourceDate = sourceDayStr
                      ? new Date(`${sourceDayStr}T00:00:00`)
                      : startOfDay(new Date(ev.start_time));
                    const dayDiff = differenceInCalendarDays(startOfDay(day), startOfDay(sourceDate));
                    if (dayDiff === 0) return;

                    const newStart = addDays(new Date(ev.start_time), dayDiff);
                    const newEnd = addDays(new Date(ev.end_time), dayDiff);
                    onEventMove(ev, newStart, newEnd, ev.is_all_day);
                  }}
                  className={`bg-white dark:bg-[#1a1a1a] p-1 md:p-2 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-[#fdfbf7] dark:hover:bg-[#222] relative ${
                    i === days.length - 7 || i === days.length - 1 ? "overflow-visible" : "overflow-hidden"
                  } ${!isCurrMonth ? "opacity-40 bg-gray-50 dark:bg-[#161616]" : ""}`}
                >
                  {isSelected &&
                    (() => {
                      const isBottomLeft = i === days.length - 7;
                      const isBottomRight = i === days.length - 1;
                      const cornerClass = [
                        isBottomLeft ? "rounded-bl-[2rem]" : "",
                        isBottomRight ? "rounded-br-[2rem]" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <div
                          className={`absolute inset-0 bg-[#c2956e]/10 dark:bg-[#b0855f]/15 border-[1.5px] md:border-2 border-[#c2956e] dark:border-[#b0855f] z-0 pointer-events-none ${cornerClass}`}
                        />
                      );
                    })()}

                  {dragOverDayIdx === i && !isSelected && (
                    <div className="absolute inset-0 bg-[#c2956e]/10 dark:bg-[#b0855f]/15 ring-1 ring-inset ring-[#c2956e]/50 z-0 pointer-events-none" />
                  )}

                  <div className="flex justify-between items-start mb-0.5 md:mb-1 relative z-10 shrink-0">
                    <span
                      className={`flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full text-[10px] md:text-sm font-medium ${
                        isTodayDate && !isSelected
                          ? "text-[#c2956e] font-bold"
                          : isSelected && isTodayDate
                          ? "bg-[#c2956e] text-white shadow-md"
                          : "text-[#3d3b33] dark:text-[#e0e0e0]"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="hidden lg:flex flex-wrap gap-1 max-w-[40px] justify-end mt-1">
                      {Array.from(new Set(dayEvents.map((e) => e.color))).map((color, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[color] || DOT_COLORS["amber"]}`} />
                      ))}
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col gap-1 flex-1 min-h-0 overflow-hidden relative z-10">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {visibleEvents.map((event) => {
                        const start = new Date(event.start_time);
                        const visualEnd = getVisualEnd(start, new Date(event.end_time), event.is_all_day);
                        const isStart = format(start, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
                        const isEnd = format(visualEnd, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
                        const colorClasses = eventColors[event.color] || eventColors["amber"];

                        const durationMins =
                          (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
                        const showTime = durationMins >= 45;
                        const canDrag = !event.is_readonly && Boolean(onEventMove);

                        return (
                          <div
                            key={event.id}
                            draggable={canDrag}
                            onDragStart={(e) => {
                              if (!canDrag) return;
                              e.stopPropagation();
                              e.dataTransfer.setData("text/plain", event.id);
                              e.dataTransfer.setData("sourceDay", format(day, "yyyy-MM-dd"));
                            }}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold flex items-center border border-transparent shadow-sm shrink-0 ${
                              canDrag ? "cursor-grab active:cursor-grabbing" : ""
                            } ${colorClasses} ${isStart ? "rounded-md md:rounded-md" : "rounded-none border-l-0"} ${
                              isEnd ? "rounded-md md:rounded-md" : "rounded-none border-r-0"
                            }`}
                          >
                            <div className="flex-1 truncate min-w-0 pr-1">{event.title}</div>
                            {!event.is_all_day && showTime && (
                              <div className="opacity-70 text-[8px] font-bold tracking-wider shrink-0 hidden md:block text-right">
                                <span>{formatEventTime(new Date(event.start_time))}</span>
                                <span className="hidden xl:inline"> - {formatEventTime(new Date(event.end_time))}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {extraCount > 0 && (
                      <div className="px-1.5 py-0.5 text-[9px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] bg-[#f0ede8] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-md mt-auto text-center transition-colors shadow-sm shrink-0 pointer-events-none">
                        And more
                      </div>
                    )}
                  </div>

                  <div className="lg:hidden flex flex-wrap gap-1 justify-start mt-auto relative z-10 mb-0.5 ml-0.5 pointer-events-none">
                    {dayEvents.map((e, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[e.color] || DOT_COLORS["amber"]}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={`shrink-0 lg:w-80 bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-[#e0ddd5] dark:border-[#333] shadow-sm flex flex-col animate-fade-in overflow-hidden ${
          isMobile ? "flex-1 min-h-[400px]" : "h-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#e0ddd5] dark:border-[#2a2a2a] bg-[#f7f5f0]/30 dark:bg-[#222]/30 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] uppercase tracking-widest mb-0.5">
              {format(selectedDate, "EEEE")}
            </div>
            <div className="font-serif text-2xl text-[#3d3b33] dark:text-white leading-none">
              {format(selectedDate, "MMMM d")}
            </div>
          </div>
        </div>

        <div
          ref={rightPanelScrollRef}
          onWheel={handleUserScroll}
          onTouchMove={handleUserScroll}
          className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-4 space-y-2"
        >
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((e) => {
              const now = new Date();
              const isPast = isToday(selectedDate) && new Date(e.end_time) < now;
              const isHappeningNow =
                isToday(selectedDate) && new Date(e.start_time) <= now && new Date(e.end_time) >= now;

              const activeBorder = isHappeningNow
                ? "ring-1 ring-offset-1 ring-offset-transparent ring-[#c2956e] dark:ring-[#b0855f]"
                : "border border-[#e0ddd5] dark:border-[#333]";
              const dimClass = isPast ? "opacity-40 grayscale-[20%]" : "opacity-100";
              const canDrag = !e.is_readonly && Boolean(onEventMove);

              return (
                <div
                  key={e.id}
                  draggable={canDrag}
                  onDragStart={(ev) => {
                    if (!canDrag) return;
                    ev.stopPropagation();
                    ev.dataTransfer.setData("text/plain", e.id);
                    ev.dataTransfer.setData("sourceDay", format(selectedDate, "yyyy-MM-dd"));
                  }}
                  onClick={() => onEventClick(e)}
                  className={`month-event-card px-4 py-3 rounded-[1rem] ${
                    canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                  } hover:scale-[1.02] transition-all shadow-sm flex justify-between items-center ${
                    eventColors[e.color] || eventColors["amber"]
                  } ${activeBorder} ${dimClass}`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="text-sm font-bold truncate leading-tight flex items-center gap-1.5">{e.title}</div>
                    <div className="text-[10px] opacity-80 mt-1 uppercase tracking-wider font-semibold flex items-center gap-2">
                      {e.is_all_day && "All-day"}
                      {!e.is_all_day &&
                        `${formatEventTime(new Date(e.start_time))} - ${formatEventTime(new Date(e.end_time))}`}
                      {e.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin size={10} /> {e.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {e.meeting_url && (
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (e.meeting_url) window.open(e.meeting_url, "_blank");
                      }}
                      className="bg-[#c2956e] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center w-max gap-1.5 transition-colors hover:bg-[#b0855f] shadow-sm shrink-0"
                    >
                      <Video size={12} /> Join
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#b0ad9a] dark:text-[#7a7a7a] italic text-xs gap-2 opacity-70">
              <span>No events for this day.</span>
            </div>
          )}
        </div>
      </div>

      {isMobile && <div className="h-[calc(env(safe-area-inset-bottom))] w-full shrink-0 lg:hidden pointer-events-none" />}
    </div>
  );
}