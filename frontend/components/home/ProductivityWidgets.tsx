"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/timerStore";
import { supabase } from "@/lib/supabase";
import { Play, Pause, Square, Pin, PinOff } from "lucide-react";

export default function ProductivityWidgets({ isVisible }: { isVisible: boolean }) {
  const store = useTimerStore();
  const activeEngine = store[store.activeTab];
  const [liveSeconds, setLiveSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEngine.isRunning && activeEngine.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeEngine.startTime!) / 1000);
        setLiveSeconds(activeEngine.accumulatedSeconds + elapsed);
      }, 500);
    } else {
      setLiveSeconds(activeEngine.accumulatedSeconds);
    }
    return () => clearInterval(interval);
  }, [activeEngine.isRunning, activeEngine.startTime, activeEngine.accumulatedSeconds, store.activeTab]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDisplaySeconds = store.activeTab === 'timer' 
    ? Math.max(0, ((activeEngine.targetMinutes || 0) * 60) - liveSeconds)
    : liveSeconds;

  const handleStopAndSave = async () => {
    const tab = store.activeTab;
    store.pause(tab);
    const currentEngine = useTimerStore.getState()[tab];
    if (currentEngine.accumulatedSeconds > 10) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('time_sessions').insert({
        user_id: user?.id, 
        session_type: tab, 
        title: currentEngine.title || 'Focus Session', 
        duration_seconds: currentEngine.accumulatedSeconds
      });
    }
    store.reset(tab);
  };

  return (
    <div 
      className="transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ 
        transform: isVisible ? 'translateY(0)' : 'translateY(130%)',
        opacity: isVisible ? 1 : 0
      }}
    >
      {/* Premium Glassmorphic Container */}
      <div className="w-[26rem] bg-white/20 backdrop-blur-3xl border border-white/40 rounded-[2.5rem] p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] flex flex-col gap-5">
        
        {/* Top: Tabs & Pin */}
        <div className="flex justify-between items-center">
          <div className="flex bg-black/5 p-1 rounded-full border border-white/20">
            {(['stopwatch', 'timer'] as const).map(tab => (
              <button 
                key={tab} onClick={() => store.setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${store.activeTab === tab ? 'bg-white text-[#c2956e] shadow-sm' : 'text-[#888] hover:text-[#3d3b33]'}`}
              >
                {tab} {store[tab].isRunning && <span className="w-1.5 h-1.5 bg-[#c2956e] rounded-full animate-ping"/>}
              </button>
            ))}
          </div>
          <button onClick={store.togglePin} className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors ${store.isPinned ? 'text-[#c2956e] bg-white/60 shadow-sm' : 'text-[#b0ad9a]'}`}>
            {store.isPinned ? <Pin size={15} /> : <PinOff size={15} />}
          </button>
        </div>

        {/* Middle: Time Display & Controls (Side-by-Side for compactness) */}
        <div className="flex items-center justify-between px-2">
          <div className="text-[4rem] leading-none text-[#3d3b33] font-mono tracking-tighter font-light drop-shadow-sm">
            {formatTime(currentDisplaySeconds)}
          </div>
          
          <div className="flex items-center gap-3">
            {(activeEngine.accumulatedSeconds > 0 || activeEngine.isRunning) && (
              <button onClick={handleStopAndSave} className="w-12 h-12 flex items-center justify-center bg-white/60 border border-white/80 text-red-500 rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm hover:bg-white">
                <Square size={18} fill="currentColor" />
              </button>
            )}
            <button 
              onClick={() => activeEngine.isRunning ? store.pause(store.activeTab) : store.start(store.activeTab)}
              className="w-14 h-14 flex items-center justify-center bg-[#3d3b33] text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-black"
            >
              {activeEngine.isRunning ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
            </button>
          </div>
        </div>

        {/* Bottom: Ghost Inputs */}
        <div className="flex gap-2">
          <input 
            type="text" value={activeEngine.title} onChange={(e) => store.setTitle(store.activeTab, e.target.value)}
            className="flex-1 bg-white/40 border border-transparent rounded-2xl px-5 py-3 text-sm font-medium text-[#3d3b33] outline-none focus:bg-white/70 focus:border-white transition-all placeholder:text-[#888] placeholder:font-normal shadow-inner shadow-black/5"
            placeholder="What are you focusing on?"
          />
          {store.activeTab === 'timer' && (
            <input 
              type="number" value={activeEngine.targetMinutes || 0} onChange={(e) => store.setTargetMinutes(parseInt(e.target.value) || 0)}
              className="w-20 bg-white/40 border border-transparent rounded-2xl px-2 py-3 text-center text-sm font-bold text-[#3d3b33] outline-none focus:bg-white/70 focus:border-white transition-all shadow-inner shadow-black/5"
              placeholder="Min"
            />
          )}
        </div>

      </div>
    </div>
  );
}