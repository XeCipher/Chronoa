// frontend/components/home/ProductivityWidgets.tsx
"use client";

import { useEffect, useState } from "react";
import { useTimerStore, EngineInstance } from "@/store/timerStore";
import { supabase } from "@/lib/supabase";
import { Play, Pause, Square, Pin, PinOff, Plus, Trash2, History } from "lucide-react";
import { useRouter } from "next/navigation";

// Feature 4: Custom Web Audio Chime Function (Singing Bowl / Zen style)
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

    // Construct a multi-frequency relaxing chime
    playSine(523.25, 4, 0.4, 0);       // C5 Root
    playSine(1046.50, 3, 0.15, 0.05);  // C6 Octave
    playSine(1569.75, 2, 0.05, 0.1);   // G6 Harmonic
  } catch (e) {
    console.error("Audio API not supported", e);
  }
};

function EngineCard({ engine, tab }: { engine: EngineInstance, tab: 'timer' | 'stopwatch' }) {
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

  // Timer auto-stop feature with Chime & Notification
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
    <div className="relative shrink-0 w-[24rem] max-w-[85vw] bg-white/20 dark:bg-black/30 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2.5rem] p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] flex flex-col gap-5 transition-colors snap-center group">
      
      <button 
        onClick={() => store.removeInstance(tab, engine.id)} 
        className="absolute top-5 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex items-center justify-between px-2 pt-2">
        <div className="text-[3.5rem] sm:text-[4rem] leading-none text-[#3d3b33] dark:text-[#f0f0f0] font-mono tracking-tighter font-light drop-shadow-sm transition-colors">
          {formatTime(currentDisplaySeconds)}
        </div>
        <div className="flex items-center gap-3">
          {(engine.accumulatedSeconds > 0 || engine.isRunning) && (
            <button onClick={() => handleStopAndSave()} className="w-12 h-12 flex items-center justify-center bg-white/60 dark:bg-black/60 border border-white/80 dark:border-white/10 text-red-500 rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm hover:bg-white dark:hover:bg-black">
              <Square size={18} fill="currentColor" />
            </button>
          )}
          <button 
            onClick={() => {
              if (engine.isRunning) {
                store.pause(tab, engine.id);
              } else {
                // Request notification permission smoothly upon user initiation
                if (tab === 'timer' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                  Notification.requestPermission();
                }
                store.start(tab, engine.id);
              }
            }}
            className="w-14 h-14 flex items-center justify-center bg-[#3d3b33] dark:bg-[#f0f0f0] text-white dark:text-[#121212] rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-black dark:hover:bg-white"
          >
            {engine.isRunning ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input 
          type="text" value={engine.title} onChange={(e) => store.setTitle(tab, engine.id, e.target.value)}
          className="flex-1 bg-white/40 dark:bg-black/40 border border-transparent rounded-2xl px-5 py-3 text-sm font-medium text-[#3d3b33] dark:text-white outline-none focus:bg-white/70 dark:focus:bg-black/60 focus:border-white dark:focus:border-white/20 transition-all placeholder:text-[#888] dark:placeholder:text-[#aaa] placeholder:font-normal shadow-inner shadow-black/5"
          placeholder="What are you focusing on?"
        />
        {tab === 'timer' && (
          <input 
            type="number" 
            min="1"
            value={engine.targetMinutes || 1} 
            onChange={(e) => {
              // Ensure value is at least 1 and handle empty/NaN cases
              const val = Math.max(1, parseInt(e.target.value) || 1);
              store.setTargetMinutes(engine.id, val);
            }}
            // LOCK INPUT if running OR if progress has already been made (paused state)
            disabled={engine.isRunning || engine.accumulatedSeconds > 0} 
            className={`w-20 bg-white/40 dark:bg-black/40 border border-transparent rounded-2xl px-2 py-3 text-center text-sm font-bold text-[#3d3b33] dark:text-white outline-none focus:bg-white/70 dark:focus:bg-black/60 focus:border-white dark:focus:border-white/20 transition-all shadow-inner shadow-black/5 ${
              (engine.isRunning || engine.accumulatedSeconds > 0) 
                ? 'opacity-40 cursor-not-allowed select-none' 
                : ''
            }`}
            placeholder="Min"
          />
        )}
      </div>
    </div>
  );
}

export default function ProductivityWidgets({ isVisible }: { isVisible: boolean }) {
  const store = useTimerStore();
  const router = useRouter();
  const activeList = store.activeTab === 'timer' ? store.timers : store.stopwatches;

  const isAnyRunning = (tab: 'timer' | 'stopwatch') => {
    const list = tab === 'timer' ? store.timers : store.stopwatches;
    return list?.some(i => i.isRunning);
  };

  if (!activeList) return null;

  return (
    <div 
      className="transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] w-full flex flex-col items-center"
      style={{ transform: isVisible ? 'translateY(0)' : 'translateY(130%)', opacity: isVisible ? 1 : 0 }}
    >
      <div className="flex justify-between items-center w-[24rem] max-w-[85vw] mb-4">
        <div className="flex bg-white/30 dark:bg-black/30 p-1 rounded-full border border-white/20 dark:border-white/5 backdrop-blur-md shadow-sm">
          {(['stopwatch', 'timer'] as const).map(tab => (
            <button 
              key={tab} onClick={() => store.setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${store.activeTab === tab ? 'bg-white dark:bg-[#222] text-[#c2956e] dark:text-[#d1a784] shadow-sm' : 'text-[#888] dark:text-[#a0a0a0] hover:text-[#3d3b33] dark:hover:text-[#f0f0f0]'}`}
            >
              {tab} {isAnyRunning(tab) && <span className="w-1.5 h-1.5 bg-[#c2956e] dark:bg-[#b0855f] rounded-full animate-ping"/>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/sessions')} className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/50 transition-colors text-[#3d3b33] dark:text-[#a0a0a0] bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/5 shadow-sm`}>
            <History size={15} />
          </button>
          <button onClick={store.togglePin} className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/50 transition-colors ${store.isPinned ? 'text-[#c2956e] dark:text-[#d1a784] bg-white/80 dark:bg-black/60 shadow-sm border border-white/30 dark:border-white/10' : 'text-[#3d3b33] dark:text-[#a0a0a0] bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/5'}`}>
            {store.isPinned ? <Pin size={15} /> : <PinOff size={15} />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex justify-start md:justify-center px-4 pb-8 -mb-8">
        <div className="flex gap-4 w-max px-[max(0px,calc(50vw-13rem))] md:px-0">
          {activeList.map(engine => (
            <EngineCard key={engine.id} engine={engine} tab={store.activeTab} />
          ))}
          
          <button 
            onClick={() => store.addInstance(store.activeTab)} 
            className="shrink-0 w-[6rem] sm:w-[8rem] bg-white/10 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 transition-colors snap-center cursor-pointer shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)]"
          >
            <Plus size={28} className="text-[#3d3b33] dark:text-[#f0f0f0]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#3d3b33] dark:text-[#f0f0f0]">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}