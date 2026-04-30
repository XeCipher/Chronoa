"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Trash2, MapPin, Search, Calendar, Clock, Sparkles, 
  X, Monitor, LogOut, Navigation, AlertTriangle, Keyboard, CheckCircle2 
} from "lucide-react";

interface CalendarLink {
  name: string;
  url: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { 
    taskArchiveDelay, setTaskArchiveDelay, 
    routineResetHour, setRoutineResetHour, 
    theme, setTheme,
    hotkeysEnabled, setHotkeysEnabled 
  } = useUiStore();
  
  const [calendars, setCalendars] = useState<CalendarLink[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [os, setOs] = useState<'mac' | 'windows'>('windows');

  useEffect(() => {
    // OS Detection logic
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('mac')) setOs('mac');

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
        await supabase.from('profiles').update({ weather_city: loc.name, weather_lat: loc.latitude, weather_lon: loc.longitude }).eq('id', user?.id);
        setCurrentCity(loc.name);
      } else { alert("City not found."); }
    } catch (err) { console.error(err); } 
    finally { setIsSearching(false); }
  };

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const city = data.city || data.locality || "Current Location";
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('profiles').update({ weather_city: city, weather_lat: latitude, weather_lon: longitude }).eq('id', user?.id);
          setCurrentCity(city);
          setCityInput(city);
        } catch(e) { console.error(e); }
        finally { setIsSearching(false); }
      }, () => setIsSearching(false));
    }
  };

  const removeLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({ weather_city: null, weather_lat: null, weather_lon: null }).eq('id', user?.id);
    setCurrentCity("");
    setCityInput("");
  };

  const handleResetHourChange = async (hour: number) => {
    setRoutineResetHour(hour);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { await supabase.from('profiles').update({ routine_reset_hour: hour }).eq('id', user.id); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure? This action is irreversible.")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/delete-account?user_id=${user.id}`, { method: 'DELETE' });
            await supabase.auth.signOut();
            router.push("/login");
        } catch(e) { console.error(e); }
    }
  };

  const modKey = os === 'mac' ? '⌥' : 'Alt';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-12 animate-fade-up">
      <header className="space-y-2">
        <h1 className="text-5xl md:text-6xl text-[#3d3b33] dark:text-[#f0f0f0] font-serif italic leading-none">Settings</h1>
        <p className="text-[#b0ad9a] dark:text-[#7a7a7a] tracking-[0.3em] text-[10px] font-bold uppercase">Configure your sanctuary environment</p>
      </header>

      <div className="bg-white dark:bg-[#1a1a1a] border border-[#ebe8e2] dark:border-[#2a2a2a] rounded-[2.5rem] p-6 md:p-10 shadow-sm space-y-12 transition-all">
        
        {/* Appearance Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#a882c2]">
            <Monitor size={20} />
            <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Appearance</h3>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-4">Choose the visual theme for your sanctuary.</p>
          <div className="flex bg-[#f7f5f0] dark:bg-[#121212] border border-[#e0ddd5] dark:border-[#333] p-1 rounded-2xl w-fit">
            {['system', 'light', 'dark'].map(t => (
              <button 
                key={t} onClick={() => setTheme(t as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${theme === t ? 'bg-white dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] dark:text-[#7a7a7a] hover:text-[#3d3b33] dark:hover:text-[#ccc]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />

        {/* Global Hotkeys - Responsive OS detection */}
        <section className="hidden md:block space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-[#7ca982]">
                <Keyboard size={20} />
                <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Global Hotkeys</h3>
              </div>
              <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a]">Speed up your workflow with keyboard mnemonic shortcuts.</p>
            </div>
            <button 
              onClick={() => setHotkeysEnabled(!hotkeysEnabled)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${hotkeysEnabled ? 'bg-[#7ca982] text-white' : 'bg-[#f7f5f0] dark:bg-[#252525] text-[#888]'}`}
            >
              {hotkeysEnabled ? <><CheckCircle2 size={14} /> Enabled</> : 'Disabled'}
            </button>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity duration-300 ${hotkeysEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {[
              { keys: [modKey, 'H'], desc: 'Go to Home' },
              { keys: [modKey, 'T'], desc: 'Go to Tasks' },
              { keys: [modKey, 'N'], desc: 'Go to Notes' },
              { keys: [modKey, 'J'], desc: 'Jump to Journal' },
              { keys: [modKey, 'L'], desc: 'Go to Time Log' },
              { keys: [modKey, 'A'], desc: 'Go to Analytics' },
              { keys: [modKey, 'S'], desc: 'Go to Settings' },
              { keys: ['Space'], desc: 'Play/Pause Timer & Stopwatch' },
              { keys: ['Esc'], desc: 'Collapse Sidebar' },
            ].map((hk, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl">
                <span className="text-[12px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">{hk.desc}</span>
                <div className="flex gap-1.5">
                  {hk.keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#444] rounded-lg text-[10px] font-bold text-[#b0ad9a] dark:text-[#777] shadow-sm min-w-[28px] text-center">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="hidden md:block border-[#f0ede8] dark:border-[#2a2a2a]" />

        {/* iCloud Calendars */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3 text-[#6e90c2] dark:text-[#8aaae0]">
              <Calendar size={20} />
              <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">iCloud Calendars</h3>
            </div>
            <button onClick={addCalendar} className="flex items-center gap-2 px-4 py-2 bg-[#f7f5f0] dark:bg-[#252525] text-[#c2956e] dark:text-[#d1a784] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#c2956e] hover:text-white transition-all shadow-sm">
              <Plus size={14} /> Add Feed
            </button>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-4">Sync your schedule directly into your Daily Focus view.</p>
          <div className="space-y-3">
            {calendars.map((cal, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-3 p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl group transition-all hover:border-[#c2956e]/30 dark:hover:border-[#b0855f]/50">
                <input type="text" placeholder="Label" value={cal.name} onChange={(e) => updateCalendar(idx, 'name', e.target.value)} className="md:w-1/4 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] text-[#3d3b33] dark:text-white rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] text-sm" />
                <input type="text" placeholder="webcal://..." value={cal.url} onChange={(e) => updateCalendar(idx, 'url', e.target.value)} className="flex-1 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] text-[#3d3b33] dark:text-white rounded-xl px-4 py-2 outline-none focus:border-[#c2956e] text-sm font-mono" />
                <button onClick={() => removeCalendar(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />

        {/* Weather Location */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#5b9ea0] dark:text-[#6baea0]">
            <MapPin size={20} />
            <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Weather Location</h3>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-4">Set your active city to display live weather updates.</p>
          {currentCity ? (
            <div className="flex items-center justify-between p-6 bg-[#e8f2e9] dark:bg-[#1c2921] border border-[#7ca982]/20 rounded-[2rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-[#253828] rounded-2xl flex items-center justify-center text-[#7ca982] shadow-sm"><MapPin size={24} /></div>
                <div>
                  <p className="text-[10px] text-[#7ca982] font-bold uppercase tracking-[0.2em]">Active Sanctuary</p>
                  <p className="text-2xl font-serif italic text-[#3d3b33] dark:text-[#f0f0f0]">{currentCity}</p>
                </div>
              </div>
              <button onClick={removeLocation} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1a1a1a] text-red-500 border border-red-100 dark:border-red-900/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm"><X size={14} /> Remove</button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                <input type="text" placeholder="Search City..." value={cityInput} onChange={(e) => setCityInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()} className="w-full bg-[#f7f5f0] dark:bg-[#222] text-[#3d3b33] dark:text-white border border-[#e0ddd5] rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#c2956e] transition-all" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAutoDetect} disabled={isSearching} title="Auto Detect Location" className="px-6 bg-[#f7f5f0] dark:bg-[#222] text-[#3d3b33] dark:text-white border border-[#e0ddd5] dark:border-[#333] rounded-2xl flex items-center justify-center hover:bg-[#ebe8e2] transition-all disabled:opacity-50"><Navigation size={18} /></button>
                <button onClick={handleLocationSearch} disabled={isSearching} className="flex-1 px-8 py-4 md:py-0 bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#1a1a1a] rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50">{isSearching ? "Searching..." : "Set Location"}</button>
              </div>
            </div>
          )}
        </section>

        <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />

        {/* Task & Routine Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-[#c2956e] dark:text-[#d1a784]"><Clock size={18} /><h3 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Vanishing Delay</h3></div>
            <p className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-3">Minutes before completed tasks are archived.</p>
            <input type="number" value={taskArchiveDelay} onChange={(e) => setTaskArchiveDelay(parseInt(e.target.value) || 0)} className="w-full bg-[#f7f5f0] dark:bg-[#222] border border-[#e0ddd5] rounded-xl px-4 py-3 outline-none focus:border-[#c2956e] font-bold text-[#3d3b33] dark:text-white" />
          </section>
          
          <section className="space-y-4">
             <div className="flex items-center gap-3 text-[#c2956e] dark:text-[#d1a784]"><Sparkles size={18} /><h3 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]">Routine Reset</h3></div>
            <p className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-3">Hour when your routines reset.</p>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="23" value={routineResetHour} onChange={(e) => handleResetHourChange(parseInt(e.target.value) || 0)} className="flex-1 bg-[#f7f5f0] dark:bg-[#222] border border-[#e0ddd5] rounded-xl px-4 py-3 outline-none focus:border-[#c2956e] font-bold text-[#3d3b33] dark:text-white" />
              <div className="px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] rounded-xl text-[10px] font-bold text-[#b0ad9a] uppercase tracking-widest">{routineResetHour >= 12 ? 'PM' : 'AM'}</div>
            </div>
          </section>
        </div>

        <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />

        <section className="space-y-6 pt-2">
          <div className="flex items-center gap-3 text-red-500"><AlertTriangle size={20} /><h3 className="text-xl font-medium">Danger Zone</h3></div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a]">Permanently delete your account. This is irreversible.</p>
          <div className="flex items-center gap-4">
            <button onClick={handleDeleteAccount} className="px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">Delete Account</button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#1a1a1a] text-[#888] border border-[#e0ddd5] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"><LogOut size={16} /> Sign Out</button>
          </div>
        </section>
      </div>
    </div>
  );
}