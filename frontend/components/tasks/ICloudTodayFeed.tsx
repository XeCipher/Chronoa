// frontend/components/tasks/ICloudTodayFeed.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ICAL from "ical.js";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";

export default function ICloudTodayFeed() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const fetchAllCalendars = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('calendar_urls').eq('id', user.id).single();
      const calendarLinks = profile?.calendar_urls || [];
      if (!Array.isArray(calendarLinks) || calendarLinks.length === 0) return setLoading(false);

      let masterEvents: any[] = [];
      let currentErrors = 0;

      for (const cal of calendarLinks) {
        if (!cal.url) continue;
        try {
          const res = await fetch(`/api/calendar?url=${encodeURIComponent(cal.url)}`);
          if (!res.ok) throw new Error("Fetch failed");
          const icsText = await res.text();
          if (!icsText || icsText.includes('<!DOCTYPE html>')) { currentErrors++; continue; }
          const jcalData = ICAL.parse(icsText);
          const vcalendar = new ICAL.Component(jcalData);
          if (vcalendar.name !== 'vcalendar') continue;

          const vevents = vcalendar.getAllSubcomponents('vevent');
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

          const processedEvents = vevents.map(vevent => {
            try {
              const event = new ICAL.Event(vevent);
              const startDate = event.startDate.toJSDate();
              if (startDate >= today && startDate < tomorrow) {
                return { title: event.summary || "Untitled Event", start: startDate, end: event.endDate.toJSDate(), isAllDay: event.startDate.isDate, calendarName: cal.name };
              }
              return null;
            } catch { return null; }
          }).filter((e): e is any => e !== null);

          masterEvents = [...masterEvents, ...processedEvents];
        } catch (err) { currentErrors++; }
      }
      setEvents(masterEvents.sort((a, b) => a.start.getTime() - b.start.getTime()));
      setErrorCount(currentErrors);
      setLoading(false);
    };
    fetchAllCalendars();
  }, []);

  if (loading) return (
    <div className="mb-10 flex items-center gap-3 text-[#b0ad9a] dark:text-[#7a7a7a] animate-pulse px-2">
      <CalendarIcon size={18} className="animate-bounce" />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Syncing Master Schedule...</span>
    </div>
  );

  if (events.length === 0 && errorCount === 0) return null;

  return (
    <div className="mb-12 animate-fade-up">
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2 text-[#6e90c2] dark:text-[#8aaae0]">
          <CalendarIcon size={18} strokeWidth={2.5} />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em]">Today's Schedule</h3>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5 text-red-400 text-[9px] font-bold uppercase tracking-widest bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 px-2.5 py-1 rounded-full">
            <AlertCircle size={10} /> {errorCount} Feed(s) Offline
          </div>
        )}
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <div key={i} className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-[#ebe8e2] dark:border-[#333] p-4 rounded-2xl flex items-start gap-4 md:hover:border-[#6e90c2]/30 md:dark:hover:border-[#8aaae0]/40 transition-all group shadow-sm">
              <div className="w-1.5 h-10 bg-[#6e90c2]/40 dark:bg-[#8aaae0]/40 rounded-full shrink-0 mt-0.5 md:group-hover:bg-[#6e90c2] md:dark:group-hover:bg-[#8aaae0] transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="text-[#3d3b33] dark:text-[#f0f0f0] font-semibold text-[14px] leading-tight truncate">{event.title}</p>
                  {event.calendarName && (
                    <span className="shrink-0 text-[8px] bg-[#6e90c2]/10 dark:bg-[#8aaae0]/10 text-[#6e90c2] dark:text-[#8aaae0] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                      {event.calendarName}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#888] font-bold uppercase flex items-center gap-1.5">
                  <Clock size={11} />
                  {event.isAllDay ? "All Day" : `${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] italic px-2">No events scheduled for today.</p>
      )}
    </div>
  );
}