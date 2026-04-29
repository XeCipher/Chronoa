"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, MapPin, Search, Calendar, Clock, Sparkles, X, Monitor } from "lucide-react";

interface CalendarLink {
  name: string;
  url: string;
}

export default function SettingsPage() {
  const { taskArchiveDelay, setTaskArchiveDelay, routineResetHour, setRoutineResetHour, theme, setTheme } = useUiStore();
  
  const [calendars, setCalendars] = useState<CalendarLink[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('calendar_urls, routine_reset_hour, weather_city')
          .eq('id', user.id)
          .single();
        
        if (data?.calendar_urls) setCalendars(data.calendar_urls);
        if (data?.routine_reset_hour !== undefined) setRoutineResetHour(data.routine_reset_hour);
        if (data?.weather_city) {
          setCityInput(data.weather_city);
          setCurrentCity(data.weather_city);
        }
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
  const removeCalendar = (index: number) => saveCalendars(calendars.filter((_, i) => i !== index));
  const updateCalendar = (index: number, field: keyof CalendarLink, value: string) => {
    const newList = [...calendars];
    newList[index][field] = value;
    saveCalendars(newList);
  };

  const handleLocationSearch = async () => {
    if (!cityInput.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=en&format=json`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const loc = data.results[0];
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('profiles').update({
          weather_city: loc.name,
          weather_lat: loc.latitude,
          weather_lon: loc.longitude
        }).eq('id', user?.id);
        
        setCurrentCity(loc.name);
      } else {
        alert("City not found.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const removeLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({
      weather_city: null,
      weather_lat: null,
      weather_lon: null
    }).eq('id', user?.id);
    setCurrentCity("");
    setCityInput("");
  };

  const handleResetHourChange = async (hour: number) => {
    setRoutineResetHour(hour);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ routine_reset_hour: hour }).eq('id', user.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-12 animate-fade-up">
      <header className="space-y-2">
        <h1 className="text-5xl md:text-6xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif italic leading-none">Settings</h1>
        <p className="text-[#b0ad9a] dark:text-[#7a7a7a] tracking-[0.3em] text-[10px] font-bold uppercase">Configure your sanctuary environment</p>
      </header>

      <div className="bg-white dark:bg-[#1a1a1a] border border-[#ebe8e2] dark:border-[#2a2a2a] rounded-[2.5rem] p-6 md:p-10 shadow-sm space-y-12 transition-all">
        
        {/* Appearance Settings */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[#a882c2]">
            <Monitor size={20} />
            <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Appearance</h3>
          </div>
          <div className="flex bg-[#f7f5f0] dark:bg-[#121212] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl w-fit">
            {['system', 'light', 'dark'].map(t => (
              <button 
                key={t} 
                onClick={() => setTheme(t as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${theme === t ? 'bg-white dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] dark:text-[#7a7a7a] hover:text-[#3d3b33] dark:hover:text-[#ccc]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />

        {/* 1. Multi-Calendar Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3 text-[#6e90c2] dark:text-[#8aaae0]">
              <Calendar size={20} />
              <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">iCloud Calendars</h3>
            </div>
            <button onClick={addCalendar} className="flex items-center gap-2 px-4 py-2 bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#c2956e] dark:hover:bg-[#b0855f] hover:text-white transition-all shadow-sm">
              <Plus size={14} /> Add Feed
            </button>
          </div>
          <div className="space-y-3">
            {calendars.map((cal, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-3 p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl group transition-all hover:border-[#c2956e]/30 dark:hover:border-[#b0855f]/50">
                <input type="text" placeholder="Label" value={cal.name} onChange={(e) => updateCalendar(idx, 'name', e.target.value)} className="md:w-1/4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#3d3b33] dark:text-white rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-sm" />
                <input type="text" placeholder="webcal://..." value={cal.url} onChange={(e) => updateCalendar(idx, 'url', e.target.value)} className="flex-1 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] text-[#3d3b33] dark:text-white rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-sm font-mono" />
                <button onClick={() => removeCalendar(idx)} className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />

        {/* 2. Weather Location Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[#5b9ea0] dark:text-[#6baea0]">
            <MapPin size={20} />
            <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Weather Location</h3>
          </div>
          
          {currentCity ? (
            <div className="flex items-center justify-between p-6 bg-[#e8f2e9] dark:bg-[#1c2921] border border-[#7ca982]/20 dark:border-[#6a9a70]/30 rounded-[2rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-[#253828] rounded-2xl flex items-center justify-center text-[#7ca982] dark:text-[#8cbd92] shadow-sm">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-[#7ca982] dark:text-[#8cbd92] font-bold uppercase tracking-[0.2em]">Active Sanctuary</p>
                  <p className="text-2xl font-serif italic text-[#3d3b33] dark:text-[#f0f0f0]">{currentCity}</p>
                </div>
              </div>
              <button onClick={removeLocation} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1a1a1a] text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-all shadow-sm">
                <X size={14} /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a] dark:text-[#7a7a7a]" size={16} />
                <input 
                  type="text" placeholder="Search City (e.g. Mumbai, Tokyo...)" value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                  className="w-full bg-[#f7f5f0] dark:bg-[#222] text-[#3d3b33] dark:text-white border border-[#e0ddd5] dark:border-[#333] rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] transition-all"
                />
              </div>
              <button onClick={handleLocationSearch} disabled={isSearching} className="px-8 py-4 md:py-0 bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#1a1a1a] rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-white transition-all disabled:opacity-50">
                {isSearching ? "Searching..." : "Set Location"}
              </button>
            </div>
          )}
        </section>

        <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />

        {/* 3. Task & Routine Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-[#c2956e] dark:text-[#d1a784]"><Clock size={18} /><h3 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Vanishing Delay</h3></div>
            <input type="number" value={taskArchiveDelay} onChange={(e) => setTaskArchiveDelay(parseInt(e.target.value))} className="w-full bg-[#f7f5f0] dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-xl px-4 py-3 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] font-bold text-[#3d3b33] dark:text-white" />
          </section>
          <section className="space-y-4">
             <div className="flex items-center gap-3 text-[#c2956e] dark:text-[#d1a784]"><Sparkles size={18} /><h3 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Routine Reset</h3></div>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="23" value={routineResetHour} onChange={(e) => handleResetHourChange(parseInt(e.target.value))} className="flex-1 bg-[#f7f5f0] dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-xl px-4 py-3 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] font-bold text-[#3d3b33] dark:text-white" />
              <div className="px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl text-[10px] font-bold text-[#b0ad9a] dark:text-[#7a7a7a] uppercase tracking-widest">{routineResetHour >= 12 ? 'PM' : 'AM'}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}