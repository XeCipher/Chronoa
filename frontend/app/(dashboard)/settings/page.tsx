"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Calendar } from "lucide-react";

interface CalendarLink {
  name: string;
  url: string;
}

export default function SettingsPage() {
  const { taskArchiveDelay, setTaskArchiveDelay, routineResetHour, setRoutineResetHour } = useUiStore();
  const [calendars, setCalendars] = useState<CalendarLink[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('calendar_urls, routine_reset_hour').eq('id', user.id).single();
        if (data?.calendar_urls) setCalendars(data.calendar_urls);
        if (data?.routine_reset_hour !== undefined) setRoutineResetHour(data.routine_reset_hour);
      }
    };
    fetchProfile();
  }, [setRoutineResetHour]);

  const saveCalendars = async (updatedList: CalendarLink[]) => {
    setCalendars(updatedList);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ calendar_urls: updatedList }).eq('id', user.id);
    }
  };

  const addCalendar = () => saveCalendars([...calendars, { name: "", url: "" }]);
  
  const removeCalendar = (index: number) => {
    const newList = calendars.filter((_, i) => i !== index);
    saveCalendars(newList);
  };

  const updateCalendar = (index: number, field: keyof CalendarLink, value: string) => {
    const newList = [...calendars];
    newList[index][field] = value;
    saveCalendars(newList);
  };

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-12 animate-fade-up">
      <header>
        <h1 className="text-5xl text-[#3d3b33] mb-2 font-serif italic">Settings</h1>
        <p className="text-[#888] tracking-widest text-xs uppercase font-semibold">Sanctuary Configuration</p>
      </header>

      <div className="bg-white border border-[#ebe8e2] rounded-[2rem] p-10 shadow-sm space-y-12">
        
        {/* MULTI-CALENDAR SECTION */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-xl font-medium text-[#3d3b33]">iCloud Calendars</h3>
              <p className="text-sm text-gray-400 mt-1">Add your public webcal links to sync multiple Apple calendars.</p>
            </div>
            <button 
              onClick={addCalendar}
              className="flex items-center gap-2 px-4 py-2 bg-[#f7f5f0] text-[#c2956e] rounded-xl text-xs font-bold uppercase hover:bg-[#c2956e] hover:text-white transition-all"
            >
              <Plus size={14} /> Add Calendar
            </button>
          </div>

          <div className="space-y-3">
            {calendars.map((cal, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-3 p-4 bg-[#f7f5f0]/50 border border-[#e0ddd5] rounded-2xl group">
                <input 
                  type="text" placeholder="Label (e.g. Work)" value={cal.name}
                  onChange={(e) => updateCalendar(idx, 'name', e.target.value)}
                  className="md:w-1/4 bg-white border border-[#e0ddd5] rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] text-sm"
                />
                <input 
                  type="text" placeholder="webcal://..." value={cal.url}
                  onChange={(e) => updateCalendar(idx, 'url', e.target.value)}
                  className="flex-1 bg-white border border-[#e0ddd5] rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] text-sm font-mono"
                />
                <button 
                  onClick={() => removeCalendar(idx)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {calendars.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-[#e0ddd5] rounded-2xl text-gray-400 italic text-sm">
                No calendars linked yet.
              </div>
            )}
          </div>
        </section>

        <hr className="border-[#ebe8e2]" />

        {/* Existing Delay & Reset Hour sections... (Keep them exactly as they were) */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-[#3d3b33]">Vanishing Delay</h3>
            <p className="text-sm text-gray-400">Minutes before a completed task moves to history.</p>
          </div>
          <input 
            type="number" value={taskArchiveDelay}
            onChange={(e) => setTaskArchiveDelay(parseInt(e.target.value))}
            className="w-24 bg-[#f7f5f0] border border-[#e0ddd5] rounded-xl px-4 py-2 outline-none focus:border-[#c2956e]"
          />
        </section>

        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-[#3d3b33]">Routine Reset Time</h3>
            <p className="text-sm text-gray-400">Hour (0-23) when routine tasks refresh.</p>
          </div>
          <div className="flex items-center gap-2">
             <input 
              type="number" min="0" max="23" value={routineResetHour}
              onChange={(e) => setRoutineResetHour(parseInt(e.target.value))}
              className="w-24 bg-[#f7f5f0] border border-[#e0ddd5] rounded-xl px-4 py-2 outline-none focus:border-[#c2956e]"
            />
            <span className="text-sm text-[#888] font-bold uppercase">{routineResetHour >= 12 ? 'PM' : 'AM'}</span>
          </div>
        </section>
      </div>
    </div>
  );
}