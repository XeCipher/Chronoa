// frontend/components/ui/GlobalTimeWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTimerStore, EngineInstance } from "@/store/timerStore";
import { supabase } from "@/lib/supabase";
import { Play, Pause, Square, Trash2, Plus, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/uiStore";

const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();

    const playSine = (freq: number, duration: number, vol: number, delay: number = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    playSine(523.25, 4, 0.4, 0);       // C5 Root
    playSine(1046.50, 3, 0.15, 0.05);  // C6 Octave
    playSine(1569.75, 2, 0.05, 0.1);   // G6 Harmonic
  } catch (e) {
    console.error("Audio API not supported", e);
  }
};

function MiniEngineCard({ engine, tab }: { engine: EngineInstance, tab: 'timer' | 'stopwatch' }) {
  const store = useTimerStore();
  const [liveSeconds, setLiveSeconds] = useState(engine.accumulatedSeconds);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (engine.isRunning && engine.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - engine.startTime!) / 1000);
        setLiveSeconds(engine.accumulatedSeconds + elapsed);
      }, 500);
    } else {
      setLiveSeconds(engine.accumulatedSeconds);
    }
    return () => clearInterval(interval);
  }, [engine.isRunning, engine.startTime, engine.accumulatedSeconds]);

  const handleStopAndSave = async (forceSaveSeconds?: number) => {
    store.pause(tab, engine.id);
    const finalSeconds = forceSaveSeconds ?? (engine.isRunning && engine.startTime 
      ? engine.accumulatedSeconds + Math.floor((Date.now() - engine.startTime) / 1000)
      : engine.accumulatedSeconds);

    if (finalSeconds > 10) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('time_sessions').insert({
        user_id: user?.id, session_type: tab, title: engine.title || 'Focus Session', duration_seconds: finalSeconds
      });
    }
    store.removeInstance(tab, engine.id);
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (tab === 'timer' && engine.targetMinutes && engine.isRunning) {
      const targetSecs = engine.targetMinutes * 60;
      if (liveSeconds >= targetSecs) {
        store.pause(tab, engine.id);
        
        playChime();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Chronoa', {
            body: `Timer complete: ${engine.title || 'Timer'}`,
            icon: '/apple-icon.png'
          });
        }
        
        timeout = setTimeout(() => handleStopAndSave(targetSecs), 2000);
      }
    }
    return () => clearTimeout(timeout);
  }, [liveSeconds, engine.isRunning, engine.targetMinutes, tab]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDisplaySeconds = tab === 'timer' 
    ? Math.max(0, ((engine.targetMinutes || 0) * 60) - liveSeconds)
    : liveSeconds;

  return (
    <div className="bg-[#f7f5f0]/50 dark:bg-[#222]/50 border border-[#e0ddd5] dark:border-[#444] rounded-[1.5rem] p-5 flex flex-col gap-3 group relative transition-colors hover:border-[#c2956e]/50 dark:hover:border-[#b0855f]/50 shadow-sm shrink-0">
      <button 
        onClick={() => store.removeInstance(tab, engine.id)}
        className="absolute top-4 right-4 text-[#b0ad9a] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={16} />
      </button>

      <div className="flex justify-between items-center mt-1 px-1">
        <div className="text-4xl text-[#3d3b33] dark:text-[#f0f0f0] font-mono tracking-tighter font-light drop-shadow-sm">
          {formatTime(currentDisplaySeconds)}
        </div>
        <div className="flex items-center gap-2">
          {(engine.accumulatedSeconds > 0 || engine.isRunning) && (
            <button onClick={() => handleStopAndSave()} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#333] text-red-500 rounded-full shadow-sm hover:scale-105 transition-transform border border-[#e0ddd5] dark:border-[#444]">
              <Square size={14} fill="currentColor" />
            </button>
          )}
          <button
            onClick={() => {
              if (engine.isRunning) store.pause(tab, engine.id);
              else {
                if (tab === 'timer' && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
                store.start(tab, engine.id);
              }
            }} 
            className="w-12 h-12 flex items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#1a1a1a] rounded-full shadow-md hover:scale-105 transition-transform"
          >
            {engine.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input 
          className="flex-1 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] transition-colors placeholder:text-[#b0ad9a] dark:placeholder:text-[#7a7a7a] shadow-inner shadow-black/5" 
          value={engine.title} 
          onChange={e => store.setTitle(tab, engine.id, e.target.value)} 
          placeholder="What are you focusing on?" 
          spellCheck={false} 
        />
        {tab === 'timer' && (
          <input 
            type="number" min="1" 
            className={`w-16 bg-white dark:bg-[#1a1a1a] border border-[#e0ddd5] dark:border-[#333] rounded-xl px-2 py-2.5 text-sm text-center font-bold outline-none focus:border-[#c2956e] dark:focus:border-[#b0855f] transition-colors shadow-inner shadow-black/5 ${engine.isRunning || engine.accumulatedSeconds > 0 ? 'opacity-40 cursor-not-allowed select-none' : ''}`} 
            value={engine.targetMinutes || 1} 
            onChange={e => store.setTargetMinutes(engine.id, Math.max(1, parseInt(e.target.value)||1))} 
            disabled={engine.isRunning || engine.accumulatedSeconds > 0} 
            placeholder="Min"
          />
        )}
      </div>
    </div>
  );
}

export default function GlobalTimeWidget() {
  const [time, setTime] = useState<Date | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { isGlobalTimeWidgetExpanded, setGlobalTimeWidgetExpanded } = useUiStore();
  
  const pathname = usePathname();
  const store = useTimerStore();
  const router = useRouter();

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time || pathname === '/') return null;

  const isAnyRunning = (tab: 'timer' | 'stopwatch') => {
    const list = tab === 'timer' ? store.timers : store.stopwatches;
    return list?.some(i => i.isRunning);
  };

  const hasRunning = isAnyRunning('timer') || isAnyRunning('stopwatch');
  const activeList = store.activeTab === 'timer' ? store.timers : store.stopwatches;
  const isExpanded = isHovered || isGlobalTimeWidgetExpanded;

  return (
    <div 
      className="hidden md:flex fixed bottom-8 right-10 z-[150] flex-col items-end group"
      onMouseEnter={() => { setIsHovered(true); setGlobalTimeWidgetExpanded(false); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute bottom-full right-0 w-full h-[15%] bg-transparent z-[-1]" />

      <div className={`absolute bottom-[110%] right-0 w-[400px] bg-white/90 dark:bg-[#161616]/95 backdrop-blur-2xl border border-[#e0ddd5] dark:border-[#333] rounded-[2rem] p-6 shadow-2xl transition-all duration-400 origin-bottom-right flex flex-col gap-5 ${isExpanded ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'}`}>
        
        <div className="flex flex-col items-center border-b border-[#e0ddd5] dark:border-[#333] pb-6 pt-2">
          <div className="text-[3.25rem] text-[#3d3b33] dark:text-[#f0f0f0] font-mono font-light tracking-tighter flex items-baseline gap-1 leading-none">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
            <span className="text-2xl text-[#c2956e] dark:text-[#b0855f] mb-1">:{time.getSeconds().toString().padStart(2, '0')}</span>
            <span className="text-xl text-[#b0ad9a] dark:text-[#7a7a7a] ml-1">{time.getHours() >= 12 ? 'PM' : 'AM'}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b0ad9a] dark:text-[#7a7a7a] mt-3">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex justify-between items-center w-full">
          {/* Sleek Segmented Control Tab Switcher */}
          <div className="relative flex bg-[#ebe8e2]/50 dark:bg-[#1a1a1a] p-1.5 rounded-[1.25rem] border border-[#e0ddd5] dark:border-[#333] w-full max-w-[240px] shadow-inner">
            {(['stopwatch', 'timer'] as const).map(tab => {
              const isActive = store.activeTab === tab;
              return (
                <button 
                  key={tab} 
                  onClick={() => store.setActiveTab(tab)}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 z-10
                    ${isActive 
                      ? 'text-[#3d3b33] dark:text-[#f0f0f0]' 
                      : 'text-[#888] hover:text-[#3d3b33] dark:hover:text-[#ccc]'}`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-[#f0ede8] dark:border-[#3a3a3a] -z-10 transition-all duration-300" />
                  )}
                  <span className={`transition-colors duration-300 ${isActive ? 'text-[#c2956e] dark:text-[#d1a784]' : ''}`}>
                    {tab}
                  </span>
                  {isAnyRunning(tab) && <span className="w-1.5 h-1.5 bg-[#c2956e] dark:bg-[#b0855f] rounded-full animate-ping shadow-[0_0_4px_#c2956e]"/>}
                </button>
              );
            })}
          </div>
          
          <button onClick={() => router.push('/sessions')} className="w-10 h-10 flex items-center justify-center rounded-[1rem] hover:bg-[#ebe8e2]/50 dark:hover:bg-[#222] transition-colors text-[#b0ad9a] dark:text-[#888] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0] border border-[#e0ddd5] dark:border-[#333] shadow-sm">
            <History size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[42vh] overflow-y-auto no-scrollbar px-1 -mx-1">
          {activeList && activeList.map(engine => (
            <MiniEngineCard key={engine.id} engine={engine} tab={store.activeTab} />
          ))}
          
          {/* Prevent cut-off issue with shrink-0 and adding a spacer block */}
          <button onClick={() => store.addInstance(store.activeTab)} className="w-full shrink-0 flex items-center justify-center gap-2 py-4 border border-dashed border-[#d4d0c8] dark:border-[#444] rounded-[1.25rem] text-[11px] font-bold uppercase tracking-widest text-[#b0ad9a] dark:text-[#7a7a7a] hover:text-[#c2956e] dark:hover:text-[#b0855f] hover:border-[#c2956e] dark:hover:border-[#b0855f] transition-colors hover:bg-white/50 dark:hover:bg-[#222]/50">
            <Plus size={16} /> Add {store.activeTab}
          </button>
          
          {/* Extra spacer at bottom to ensure completely smooth scrolling to bottom edge */}
          <div className="h-2 w-full shrink-0 pointer-events-none" />
        </div>

      </div>

      <div className={`relative flex items-center gap-3 bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#e0ddd5] dark:border-[#333] rounded-2xl px-6 py-3.5 transition-all duration-400 ease-out cursor-default overflow-hidden ${isExpanded ? 'shadow-[0_8px_30px_rgba(194,149,110,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] border-[#c2956e] dark:border-[#b0855f] scale-105' : 'shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-md hover:scale-[1.02]'}`}>
        <div className={`absolute inset-0 bg-gradient-to-r from-[#c2956e]/0 via-[#c2956e]/5 dark:via-[#c2956e]/10 to-[#c2956e]/0 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`} />
        
        <span className="relative z-10 text-[#3d3b33] dark:text-[#f0f0f0] font-serif text-xl leading-none">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        
        <div className={`relative z-10 rounded-full transition-all duration-500 ${hasRunning ? 'w-2.5 h-2.5 bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'w-[3px] h-3.5 bg-[#c2956e] dark:bg-[#b0855f]'}`} />
        
        <span className="relative z-10 text-[#b0ad9a] dark:text-[#888] font-bold text-[10px] uppercase tracking-[0.2em] leading-none mt-0.5">
          {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

    </div>
  );
}