// frontend/app/(dashboard)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/uiStore";
import { supabase } from "@/lib/supabase";
import { 
  MapPin, Search, Clock, Sparkles, 
  X, Monitor, LogOut, Navigation, AlertTriangle, Keyboard, CheckCircle2, Settings as SettingsIcon,
  Info, Mail, ArrowLeft, Star
} from "lucide-react";

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const HighlightText = ({ text, query, highlightClass }: { text: string, query: string, highlightClass?: string }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className={`bg-[#c2956e]/40 dark:bg-[#b0855f]/50 text-[#3d3b33] dark:text-white rounded-[4px] px-[2px] font-semibold ${highlightClass || ''}`}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const GitHubIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function SettingsPage() {
  const router = useRouter();
  const { 
    taskArchiveDelay, setTaskArchiveDelay, 
    routineResetHour, setRoutineResetHour, 
    theme, setTheme,
    hotkeysEnabled, setHotkeysEnabled,
    disabledHotkeys, setDisabledHotkeys,
    moveCompletedToBottom, setMoveCompletedToBottom,
    keepParentTaskAlive, setKeepParentTaskAlive,
    addTaskAtTop, setAddTaskAtTop,
    showHomeTaskProgress, setShowHomeTaskProgress,
    showConfirmDialog
  } = useUiStore();
  
  const [cityInput, setCityInput] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [os, setOs] = useState<'mac' | 'windows'>('windows');
  
  const [searchQuery, setSearchQuery] = useState("");

  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubCountdown, setGithubCountdown] = useState(-1);

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('mac')) setOs('mac');

    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('routine_reset_hour, weather_city, disabled_hotkeys')
          .eq('id', user.id)
          .single();
        
        if (data?.routine_reset_hour !== undefined) setRoutineResetHour(data.routine_reset_hour);
        if (data?.disabled_hotkeys) setDisabledHotkeys(data.disabled_hotkeys);
        if (data?.weather_city) {
          setCityInput(data.weather_city);
          setCurrentCity(data.weather_city);
        }
      }
    };
    fetchProfile();
  }, [setRoutineResetHour, setDisabledHotkeys]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showGithubModal && githubCountdown > 0) {
      timer = setTimeout(() => setGithubCountdown(githubCountdown - 1), 1000);
    } else if (showGithubModal && githubCountdown === 0) {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone);
      if (isStandalone) {
        window.location.href = "https://github.com/XeCipher/Chronoa";
      } else {
        window.open("https://github.com/XeCipher/Chronoa", "_blank");
      }
      setShowGithubModal(false);
      setGithubCountdown(-1);
    }
    return () => clearTimeout(timer);
  }, [showGithubModal, githubCountdown]);

  const updateRemoteSetting = async (key: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ [key]: value }).eq('id', user.id);
    }
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
      } else {
        // Replaced window.alert with custom showConfirmDialog
        showConfirmDialog({
          title: "City Not Found",
          message: `We couldn't find any results for "${cityInput}". Please double-check the spelling and try again.`,
          confirmText: "Understood",
          onConfirm: () => {}
        });
      }
    } catch (err) {
      console.error(err);
      showConfirmDialog({
        title: "Search Error",
        message: "There was a problem connecting to the weather service. Please try again in a few moments.",
        confirmText: "Dismiss",
        onConfirm: () => {}
      });
    } 
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
      }, () => {
        setIsSearching(false);
        showConfirmDialog({
          title: "Permission Denied",
          message: "We couldn't access your location. Please check your browser settings or search for your city manually.",
          confirmText: "Dismiss",
          onConfirm: () => {}
        });
      });
    }
  };

  const removeLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({ weather_city: null, weather_lat: null, weather_lon: null }).eq('id', user?.id);
    setCurrentCity("");
    setCityInput("");
    localStorage.removeItem('chronoa_cache_weather');
    localStorage.removeItem('chronoa_cache_weather_city');
  };

  const handleResetHourChange = async (hour: number) => {
    setRoutineResetHour(hour);
    updateRemoteSetting('routine_reset_hour', hour);
  };

  const toggleHotkey = (id: string) => {
    const newDisabled = disabledHotkeys.includes(id) 
      ? disabledHotkeys.filter(k => k !== id) 
      : [...disabledHotkeys, id];
    setDisabledHotkeys(newDisabled);
    updateRemoteSetting('disabled_hotkeys', newDisabled);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = () => {
    showConfirmDialog({
      title: "Delete Account",
      message: "Are you absolutely sure you want to delete your entire Chronoa account? This action is completely irreversible.",
      isDestructive: true,
      onConfirm: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/delete-account?user_id=${user.id}`, { method: 'DELETE' });
                await supabase.auth.signOut();
                router.push("/login");
            } catch(e) { console.error(e); }
        }
      }
    });
  };

  const handleGithubClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowGithubModal(true);
    setGithubCountdown(3);
  };

  const altKeyDisplay = os === 'mac' ? '⌥' : 'Alt';
  const ctrlKeyDisplay = os === 'mac' ? '⌘' : 'Ctrl';

  const isVisible = (keys: string[]) => {
    if (!searchQuery.trim()) return true;
    return keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const sections = [
    {
      id: 'appearance',
      keys: ['appearance', 'theme', 'dark', 'light', 'system', 'visual', 'color'],
      className: '',
      render: () => (
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#a882c2]">
            <Monitor size={20} />
            <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">
              <HighlightText text="Appearance" query={searchQuery} />
            </h3>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-4">
            <HighlightText text="Choose the visual theme for your workspace." query={searchQuery} />
          </p>
          <div className="flex bg-[#ebe8e2]/50 dark:bg-[#1a1a1a] p-1.5 rounded-[1.25rem] border border-[#e0ddd5] dark:border-[#333] shadow-inner w-fit shrink-0">
            {['system', 'light', 'dark'].map(t => (
              <button 
                key={t} onClick={() => { setTheme(t as any); updateRemoteSetting('theme', t); }}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${theme === t ? 'bg-white dark:bg-[#2a2a2a] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] md:hover:text-[#3d3b33] md:dark:hover:text-white'}`}
              >
                <HighlightText text={t} query={searchQuery} />
              </button>
            ))}
          </div>
        </section>
      )
    },
    {
      id: 'hotkeys',
      keys: ['global hotkeys', 'keyboard', 'shortcuts', 'navigation'],
      className: 'hidden md:flex flex-col',
      render: () => (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-[#7ca982]">
                <Keyboard size={20} />
                <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">
                  <HighlightText text="Global Hotkeys" query={searchQuery} />
                </h3>
              </div>
              <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a]">
                <HighlightText text="Speed up your workflow with keyboard mnemonic shortcuts." query={searchQuery} />
              </p>
            </div>
            <button 
              onClick={() => { setHotkeysEnabled(!hotkeysEnabled); updateRemoteSetting('hotkeys_enabled', !hotkeysEnabled); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${hotkeysEnabled ? 'bg-[#7ca982] text-white' : 'bg-[#f7f5f0] dark:bg-[#252525] text-[#888]'}`}
            >
              {hotkeysEnabled ? <><CheckCircle2 size={14} /> Enabled</> : 'Disabled'}
            </button>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity duration-300 ${hotkeysEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {[
              { id: 'home', keys: [altKeyDisplay, 'H'], desc: 'Go to Home' },
              { id: 'tasks', keys: [altKeyDisplay, 'T'], desc: 'Go to Tasks' },
              { id: 'notes', keys: [altKeyDisplay, 'N'], desc: 'Go to Notes' },
              { id: 'calendar', keys: [altKeyDisplay, 'C'], desc: 'Go to Calendar' },
              { id: 'analytics', keys: [altKeyDisplay, 'A'], desc: 'Go to Analytics' },
              { id: 'settings', keys: [altKeyDisplay, 'S'], desc: 'Go to Settings' },
              { id: 'up', keys: [altKeyDisplay, '↑'], desc: 'Move Task Up' },
              { id: 'down', keys: [altKeyDisplay, '↓'], desc: 'Move Task Down' },
              { id: 'indent', keys: ['Tab'], desc: 'Indent Task' },
              { id: 'unindent', keys: ['Shift', 'Tab'], desc: 'Unindent Task' },
              { id: 'new_sibling', keys: [ctrlKeyDisplay, 'Enter'], desc: 'New Sibling Task' },
              { id: 'space', keys: ['Space'], desc: 'Play/Pause Timer' },
              { id: 'escape', keys: ['Esc'], desc: 'Collapse Sidebar' },
            ].map((hk) => {
              const isDisabled = disabledHotkeys?.includes(hk.id);
              return (
                <div 
                  key={hk.id} 
                  onClick={() => toggleHotkey(hk.id)}
                  className={`flex items-center justify-between p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl cursor-pointer transition-all hover:border-[#c2956e]/50 dark:hover:border-[#b0855f]/50 ${isDisabled ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!isDisabled ? 'bg-[#7ca982] border-[#7ca982]' : 'bg-transparent border-[#c4c0b8] dark:border-[#555]'}`}>
                      {!isDisabled && <CheckCircle2 size={10} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className="text-[12px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium select-none">
                      <HighlightText text={hk.desc} query={searchQuery} />
                    </span>
                  </div>
                  <div className="flex gap-1.5 pointer-events-none">
                    {hk.keys.map(k => (
                      <kbd key={k} className="px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#444] rounded-lg text-[10px] font-bold text-[#b0ad9a] dark:text-[#777] shadow-sm min-w-[28px] text-center">
                        <HighlightText text={k} query={searchQuery} />
                      </kbd>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )
    },
    {
      id: 'tasks',
      keys: ['task layout behavior', 'completed tasks', 'bottom', 'keep parent', 'add task top', 'home page progress'],
      className: '',
      render: () => (
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#6e90c2] dark:text-[#8aaae0]">
            <CheckCircle2 size={20} />
            <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">
              <HighlightText text="Task Layout Behavior" query={searchQuery} />
            </h3>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-4">
            <HighlightText text="Control how tasks respond automatically in your lists." query={searchQuery} />
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl cursor-pointer" onClick={() => { setMoveCompletedToBottom(!moveCompletedToBottom); updateRemoteSetting('move_completed_to_bottom', !moveCompletedToBottom); }}>
              <div className="space-y-1 pr-4">
                <span className="text-[13px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">
                  <HighlightText text="Glide Completed Tasks" query={searchQuery} />
                </span>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] leading-tight">
                  <HighlightText text="Move to the bottom instantly." query={searchQuery} />
                </p>
              </div>
              <button className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${moveCompletedToBottom ? 'bg-[#7ca982] dark:bg-[#6a9a70]' : 'bg-[#e0ddd5] dark:bg-[#444]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${moveCompletedToBottom ? 'translate-x-5' : 'translate-x-0.5 shadow-sm'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl cursor-pointer" onClick={() => { setKeepParentTaskAlive(!keepParentTaskAlive); updateRemoteSetting('keep_parent_task_alive', !keepParentTaskAlive); }}>
              <div className="space-y-1 pr-4">
                <span className="text-[13px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">
                  <HighlightText text="Keep Parent Tasks" query={searchQuery} />
                </span>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] leading-tight">
                  <HighlightText text="Don't auto-complete when children finish." query={searchQuery} />
                </p>
              </div>
              <button className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${keepParentTaskAlive ? 'bg-[#7ca982] dark:bg-[#6a9a70]' : 'bg-[#e0ddd5] dark:bg-[#444]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${keepParentTaskAlive ? 'translate-x-5' : 'translate-x-0.5 shadow-sm'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl cursor-pointer" onClick={() => { setAddTaskAtTop(!addTaskAtTop); updateRemoteSetting('add_task_at_top', !addTaskAtTop); }}>
              <div className="space-y-1 pr-4">
                <span className="text-[13px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">
                  <HighlightText text="Add New Tasks to Top" query={searchQuery} />
                </span>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] leading-tight">
                  <HighlightText text="New tasks appear at the top." query={searchQuery} />
                </p>
              </div>
              <button className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${addTaskAtTop ? 'bg-[#7ca982] dark:bg-[#6a9a70]' : 'bg-[#e0ddd5] dark:bg-[#444]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${addTaskAtTop ? 'translate-x-5' : 'translate-x-0.5 shadow-sm'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#f7f5f0]/50 dark:bg-[#222] border border-[#e0ddd5] dark:border-[#333] rounded-2xl cursor-pointer" onClick={() => { setShowHomeTaskProgress(!showHomeTaskProgress); updateRemoteSetting('show_home_task_progress', !showHomeTaskProgress); }}>
              <div className="space-y-1 pr-4">
                <span className="text-[13px] text-[#3d3b33] dark:text-[#f0f0f0] font-medium">
                  <HighlightText text="Home Page Progress" query={searchQuery} />
                </span>
                <p className="text-[10px] text-[#b0ad9a] dark:text-[#7a7a7a] leading-tight">
                  <HighlightText text="Show task analytics gracefully on the home screen." query={searchQuery} />
                </p>
              </div>
              <button className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${showHomeTaskProgress ? 'bg-[#7ca982] dark:bg-[#6a9a70]' : 'bg-[#e0ddd5] dark:bg-[#444]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${showHomeTaskProgress ? 'translate-x-5' : 'translate-x-0.5 shadow-sm'}`} />
              </button>
            </div>
          </div>
        </section>
      )
    },
    {
      id: 'weather',
      keys: ['weather location', 'city', 'detect', 'map pin'],
      className: 'hidden md:flex flex-col',
      render: () => (
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#5b9ea0] dark:text-[#6baea0]">
            <MapPin size={20} />
            <h3 className="text-xl font-medium text-[#3d3b33] dark:text-[#f0f0f0]">
              <HighlightText text="Weather Location" query={searchQuery} />
            </h3>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-4">
            <HighlightText text="Set your active city to display live weather updates." query={searchQuery} />
          </p>
          {currentCity ? (
            <div className="flex items-center justify-between p-6 bg-[#e8f2e9] dark:bg-[#1c2921] border border-[#7ca982]/20 rounded-[2rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-[#253828] rounded-2xl flex items-center justify-center text-[#7ca982] shadow-sm"><MapPin size={24} /></div>
                <div>
                  <p className="text-[10px] text-[#7ca982] font-bold uppercase tracking-[0.2em]">Active Location</p>
                  <p className="text-2xl font-serif text-[#3d3b33] dark:text-[#f0f0f0]">{currentCity}</p>
                </div>
              </div>
              <button onClick={removeLocation} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1a1a1a] text-red-500 border border-red-100 dark:border-red-900/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm"><X size={14} /> Remove</button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 w-full shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
                <input type="text" placeholder="Search City..." value={cityInput} onChange={(e) => setCityInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()} spellCheck={false} className="w-full bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-sm text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm transition-all" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAutoDetect} disabled={isSearching} data-tooltip-id="global-tooltip" data-tooltip-content="Auto Detect Location" className="px-6 bg-[#f7f5f0] dark:bg-[#252525] text-[#3d3b33] dark:text-white border border-[#e0ddd5] dark:border-[#333] rounded-xl flex items-center justify-center hover:bg-[#ebe8e2] dark:hover:bg-[#333] transition-all disabled:opacity-50 shadow-sm"><Navigation size={18} /></button>
                <button onClick={handleLocationSearch} disabled={isSearching} className="flex-1 px-8 py-3 bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#1a1a1a] rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 shadow-md">{isSearching ? "Searching..." : "Set Location"}</button>
              </div>
            </div>
          )}
        </section>
      )
    },
    {
      id: 'timing',
      keys: ['vanishing delay', 'minutes', 'routine reset', 'hour', 'time'],
      className: '',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-[#c2956e] dark:text-[#d1a784]"><Clock size={18} />
              <h3 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]"><HighlightText text="Vanishing Delay" query={searchQuery} /></h3>
            </div>
            <p className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-3">
              <HighlightText text="Minutes before completed tasks are archived." query={searchQuery} />
            </p>
            <input type="number" value={taskArchiveDelay} onChange={(e) => { const v = parseInt(e.target.value) || 0; setTaskArchiveDelay(v); updateRemoteSetting('task_archive_delay', v); }} className="w-full bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm transition-all font-bold" />
          </section>
          
          <section className="space-y-4">
             <div className="flex items-center gap-3 text-[#c2956e] dark:text-[#d1a784]"><Sparkles size={18} />
               <h3 className="text-lg font-medium text-[#3d3b33] dark:text-[#f0f0f0]"><HighlightText text="Routine Reset" query={searchQuery} /></h3>
             </div>
            <p className="text-[11px] text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-3">
              <HighlightText text="Hour when your routines reset." query={searchQuery} />
            </p>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="23" value={routineResetHour} onChange={(e) => handleResetHourChange(parseInt(e.target.value) || 0)} className="flex-1 bg-[#f7f5f0] dark:bg-[#252525] border border-[#e0ddd5] dark:border-[#333] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm transition-all font-bold" />
              <div className="px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl text-[10px] font-bold text-[#b0ad9a] uppercase tracking-widest shadow-sm">{routineResetHour >= 12 ? 'PM' : 'AM'}</div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'about',
      keys: ['developer & source', 'github', 'email', 'open-source', 'chronoa'],
      className: '',
      render: () => (
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#3d3b33] dark:text-[#f0f0f0]">
             <Info size={20} className="text-[#c2956e] dark:text-[#d1a784]" />
             <h3 className="text-xl font-medium">
               <HighlightText text="Developer & Source" query={searchQuery} />
             </h3>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a] mt-1 mb-4">
            <HighlightText text="Chronoa is an open-source workspace built for deep focus. Feel free to reach out, report issues, or contribute." query={searchQuery} />
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:chaitanyapatil.xe@gmail.com" className="flex items-center gap-2 px-5 py-3 bg-[#f7f5f0] dark:bg-[#252525] text-[#888] dark:text-[#a0a0a0] border border-[#e0ddd5] dark:border-[#333] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-[#c2956e] transition-all shadow-sm">
              <Mail size={16} /> Email
            </a>
            <button onClick={handleGithubClick} className="flex items-center gap-2 px-5 py-3 bg-[#f7f5f0] dark:bg-[#252525] text-[#888] dark:text-[#a0a0a0] border border-[#e0ddd5] dark:border-[#333] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-[#c2956e] transition-all shadow-sm">
              <GitHubIcon size={16} /> GitHub
            </button>
          </div>
        </section>
      )
    },
    {
      id: 'danger',
      keys: ['danger zone', 'delete account', 'sign out', 'logout', 'remove'],
      className: '',
      render: () => (
        <section className="space-y-6 pt-2">
          <div className="flex items-center gap-3 text-red-500"><AlertTriangle size={20} />
            <h3 className="text-xl font-medium"><HighlightText text="Danger Zone" query={searchQuery} /></h3>
          </div>
          <p className="text-xs text-[#b0ad9a] dark:text-[#7a7a7a]">
            <HighlightText text="Permanently delete your account. This is irreversible." query={searchQuery} />
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button onClick={handleDeleteAccount} className="w-full sm:w-auto px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-200 dark:border-red-900/50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">Delete Account</button>
            <button onClick={handleLogout} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#f7f5f0] dark:bg-[#252525] text-[#888] border border-[#e0ddd5] dark:border-[#333] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"><LogOut size={16} /> Sign Out</button>
          </div>
        </section>
      )
    }
  ];

  const visibleSections = sections.filter(s => isVisible(s.keys));

  return (
    <div className="max-w-4xl w-full min-h-full mx-auto p-4 md:p-8 lg:p-10 pb-32 md:pb-12 flex flex-col gap-8">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center justify-center p-2.5 md:p-3 bg-white dark:bg-[#1a1a1a] text-[#888] rounded-xl border border-[#e0ddd5] dark:border-[#333] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] transition-all shadow-sm">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5 text-[#3d3b33] dark:text-[#f0f0f0]">
            <SettingsIcon size={24} className="text-[#c2956e]" />
            <h1 className="text-2xl md:text-4xl font-serif font-medium tracking-tight">Settings</h1>
          </div>
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9a]" size={16} />
          <input 
            type="text" placeholder="Search settings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            spellCheck={false}
            className="w-full bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-full md:rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] text-sm text-[#3d3b33] dark:text-[#f0f0f0] shadow-sm transition-all"
          />
        </div>
      </header>

      <div className="bg-white dark:bg-[#1a1a1a] border border-[#ebe8e2] dark:border-[#2a2a2a] rounded-[2.5rem] p-6 md:p-10 shadow-sm flex flex-col gap-10 transition-all">
        {visibleSections.map((sec, i) => (
          <div key={sec.id} className={`flex flex-col gap-10 ${sec.className}`}>
             {sec.render()}
             {i < visibleSections.length - 1 && <hr className="border-[#f0ede8] dark:border-[#2a2a2a]" />}
          </div>
        ))}
        {visibleSections.length === 0 && (
          <div className="text-center py-12 text-[#b0ad9a] dark:text-[#7a7a7a] italic text-sm">
            No settings match your search.
          </div>
        )}
      </div>

      {showGithubModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in transition-all">
          <div className="bg-[#f7f5f0] dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-fade-up flex flex-col items-center text-center relative">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 bg-[#c2956e]/20 text-[#c2956e] dark:bg-[#b0855f]/20 dark:text-[#d1a784]">
              <Star size={28} className="fill-current" />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif text-[#3d3b33] dark:text-[#f0f0f0] mb-2 leading-tight">
              Let's grow together
            </h3>
            <p className="text-[13px] text-[#888] dark:text-[#7a7a7a] mb-6 leading-relaxed px-2">
              If you value this workspace, consider starring us on GitHub.
            </p>
            <div className="w-full flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a]">
              Redirecting in <span className="text-[#c2956e] text-sm tabular-nums">{githubCountdown}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}