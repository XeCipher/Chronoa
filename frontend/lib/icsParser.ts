// frontend/lib/icsParser.ts
import { CalendarEvent } from "@/types/app.types";
import { supabase } from "@/lib/supabase";

const unescapeICSText = (value: string) =>
  value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");

export function parseICS(icsText: string, color: string, userId: string, sourceId: string): Partial<CalendarEvent>[] {
  const events: Partial<CalendarEvent>[] = [];

  // Unfold lines wrapped across multiple lines (CRLF+Space or CRLF+Tab are standard in RFC 5545)
  const unfolded = icsText.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  let currentEvent: any = null;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const twoYearsFuture = new Date();
  twoYearsFuture.setFullYear(twoYearsFuture.getFullYear() + 2);

  const parseDate = (line: string, isAllDay: boolean) => {
    const parts = line.split(":");
    const rawDate = parts[parts.length - 1];
    const str = rawDate.replace(/[^0-9TZ]/g, "");

    if (str.length >= 8) {
      const y = parseInt(str.substring(0, 4), 10);
      const m = parseInt(str.substring(4, 6), 10) - 1;
      const d = parseInt(str.substring(6, 8), 10);

      const tIdx = str.indexOf("T");

      // All-day events MUST be parsed in local time midnight to prevent timezone shifting
      if (isAllDay || tIdx === -1) {
        return new Date(y, m, d, 0, 0, 0);
      }

      if (tIdx !== -1 && str.length >= tIdx + 7) {
        const h = parseInt(str.substring(tIdx + 1, tIdx + 3), 10);
        const min = parseInt(str.substring(tIdx + 3, tIdx + 5), 10);
        const s = parseInt(str.substring(tIdx + 5, tIdx + 7), 10);

        if (str.endsWith("Z")) {
          return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
      }
    }
    return new Date();
  };

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      currentEvent = { color, is_all_day: false, is_readonly: true, user_id: userId, source_id: sourceId };
    } else if (line.startsWith("END:VEVENT") && currentEvent) {
      if (currentEvent.start_time) {
        if (!currentEvent.end_time) {
          const end = new Date(currentEvent.start_time);
          if (currentEvent.is_all_day) end.setDate(end.getDate() + 1);
          else end.setHours(end.getHours() + 1);
          currentEvent.end_time = end;
        }

        if (currentEvent.start_time >= oneYearAgo && currentEvent.start_time <= twoYearsFuture) {
          events.push({
            ...currentEvent,
            title: currentEvent.title || "Busy",
            start_time: currentEvent.start_time.toISOString(),
            end_time: currentEvent.end_time.toISOString(),
          });
        }
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const keyRaw = line.substring(0, colonIndex);
      const val = line.substring(colonIndex + 1).trim();
      const key = keyRaw.split(";")[0];

      if (key === "SUMMARY") currentEvent.title = unescapeICSText(val);
      else if (key === "DESCRIPTION") currentEvent.description = unescapeICSText(val);
      else if (key === "LOCATION") currentEvent.location = unescapeICSText(val);
      else if (key === "DTSTART") {
        const isAllDay = keyRaw.includes("VALUE=DATE") || val.indexOf("T") === -1;
        if (isAllDay) currentEvent.is_all_day = true;
        currentEvent.start_time = parseDate(line, isAllDay);
      } else if (key === "DTEND") {
        const isAllDay = keyRaw.includes("VALUE=DATE") || val.indexOf("T") === -1;
        currentEvent.end_time = parseDate(line, isAllDay);
        // ICS all-day end dates are exclusive (next day midnight). Adjust back 1 ms so it stays on the right day.
        if (isAllDay && currentEvent.end_time) {
          currentEvent.end_time = new Date(currentEvent.end_time.getTime() - 1);
        }
      }
    }
  }
  return events;
}

export function exportICS(events: CalendarEvent[]): string {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Chronoa//EN\n";

  const formatDate = (date: Date, isAllDay: boolean) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    if (isAllDay) return `${y}${m}${d}`;
    const h = String(date.getUTCHours()).padStart(2, "0");
    const min = String(date.getUTCMinutes()).padStart(2, "0");
    const s = String(date.getUTCSeconds()).padStart(2, "0");
    return `${y}${m}${d}T${h}${min}${s}Z`;
  };

  for (const e of events) {
    ics += "BEGIN:VEVENT\n";
    ics += `UID:${e.id}\n`;
    ics += `DTSTAMP:${formatDate(new Date(), false)}\n`;

    const start = new Date(e.start_time);
    const end = new Date(e.end_time);

    if (e.is_all_day) {
      ics += `DTSTART;VALUE=DATE:${formatDate(start, true)}\n`;
      ics += `DTEND;VALUE=DATE:${formatDate(end, true)}\n`;
    } else {
      ics += `DTSTART:${formatDate(start, false)}\n`;
      ics += `DTEND:${formatDate(end, false)}\n`;
    }

    if (e.title) ics += `SUMMARY:${e.title}\n`;
    if (e.description) ics += `DESCRIPTION:${e.description.replace(/\n/g, "\\n")}\n`;
    if (e.location) ics += `LOCATION:${e.location}\n`;

    ics += "END:VEVENT\n";
  }

  ics += "END:VCALENDAR";
  return ics;
}

// In-memory locks and caches to prevent repetitive fetching & UI clears
const syncRecord: Record<string, number> = {};
const syncErrorsCache: Record<string, string[]> = {};
let isSyncing = false;

export async function syncExternalCalendars(userId: string, force: boolean = false): Promise<string[]> {
  const failedSources: string[] = [];
  if (isSyncing) return syncErrorsCache[userId] || [];

  const now = Date.now();
  if (!force && syncRecord[userId] && now - syncRecord[userId] < 30 * 1000) {
    return syncErrorsCache[userId] || [];
  }

  isSyncing = true;

  try {
    const { data: sources } = await supabase
      .from("calendar_sources")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "link")
      .eq("is_active", true);

    if (!sources || sources.length === 0) {
      syncErrorsCache[userId] = [];
      return [];
    }

    for (const source of sources) {
      if (!source.url) continue;
      try {
        const res = await fetch(`/api/calendar/fetch-ics?url=${encodeURIComponent(source.url)}`);
        if (!res.ok) {
          failedSources.push(source.name || "Unnamed Calendar");
          continue;
        }

        const icsText = await res.text();
        const events = parseICS(icsText, source.color, userId, source.id);

        const { data: existingData } = await supabase
          .from("calendar_events")
          .select("id, title, start_time, end_time, location, description, is_all_day")
          .eq("source_id", source.id);

        const existingByBaseKey = new Map<string, any[]>();
        if (existingData) {
          existingData.forEach((e: any) => {
            const startEpoch = new Date(e.start_time).getTime();
            const baseKey = `${startEpoch}_${e.title}_${e.is_all_day}`;
            const list = existingByBaseKey.get(baseKey) || [];
            list.push(e);
            existingByBaseKey.set(baseKey, list);
          });
        }

        const toInsert: any[] = [];
        const toUpdate: any[] = [];

        events.forEach((newEvent) => {
          const startEpoch = new Date(newEvent.start_time!).getTime();
          const baseKey = `${startEpoch}_${newEvent.title}_${newEvent.is_all_day}`;
          const matches = existingByBaseKey.get(baseKey);

          if (matches && matches.length > 0) {
            const existing = matches.shift()!;
            if (matches.length === 0) {
              existingByBaseKey.delete(baseKey);
            }

            if (
              new Date(existing.end_time).getTime() !== new Date(newEvent.end_time!).getTime() ||
              existing.location !== newEvent.location ||
              existing.description !== newEvent.description
            ) {
              toUpdate.push({
                ...newEvent,
                id: existing.id,
              });
            }
          } else {
            toInsert.push(newEvent);
          }
        });

        const toDeleteIds = Array.from(existingByBaseKey.values())
          .flat()
          .map((e) => e.id);

        if (toDeleteIds.length > 0) {
          const chunkSize = 200;
          for (let i = 0; i < toDeleteIds.length; i += chunkSize) {
            await supabase.from("calendar_events").delete().in("id", toDeleteIds.slice(i, i + chunkSize));
          }
        }

        if (toUpdate.length > 0) {
          const chunkSize = 200;
          for (let i = 0; i < toUpdate.length; i += chunkSize) {
            await supabase.from("calendar_events").upsert(toUpdate.slice(i, i + chunkSize));
          }
        }

        if (toInsert.length > 0) {
          const chunkSize = 200;
          for (let i = 0; i < toInsert.length; i += chunkSize) {
            await supabase.from("calendar_events").insert(toInsert.slice(i, i + chunkSize));
          }
        }
      } catch (e) {
        console.error(`Failed to background sync source ${source.name}`, e);
        failedSources.push(source.name || "Unnamed Calendar");
      }
    }

    syncRecord[userId] = Date.now();
  } catch (e) {
    console.error("Failed background calendar sync", e);
  } finally {
    isSyncing = false;
    syncErrorsCache[userId] = failedSources;
  }

  return failedSources;
}