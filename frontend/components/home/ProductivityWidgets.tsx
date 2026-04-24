"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/timerStore";
import { supabase } from "@/lib/supabase";
import { Play, Pause, Square, Pin, PinOff, Clock } from "lucide-react";

export default function ProductivityWidgets() {
  const store = useTimerStore();
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Tick the live UI every 500ms for smoothness
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.isRunning && store.startTime) {
      interval = setInterval(() => {
        const elapsedNow = Math.floor((Date.now() - store.startTime!) / 1000);
        setLiveSeconds(store.accumulatedSeconds + elapsedNow);
      }, 500);
    } else {
      setLiveSeconds(store.accumulatedSeconds);
    }
    return () => clearInterval(interval);
  }, [store.isRunning, store.startTime, store.accumulatedSeconds]);

  // Format MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDisplaySeconds = store.mode === 'timer' 
    ? Math.max(0, (store.targetMinutes * 60) - liveSeconds)
    : liveSeconds;

  // Calculate Projected End Time for Stopwatch
  const getProjectedEndTime = () => {
    // If nothing is happening, don't show anything
    if (!store.isRunning && store.accumulatedSeconds === 0) return null;

    const now = new Date();

    if (store.mode === 'timer') {
      // Calculate when the timer will hit 00:00
      const remainingMs = currentDisplaySeconds * 1000;
      const endTime = new Date(now.getTime() + remainingMs);
      return `Ends at ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (store.mode === 'stopwatch' && store.isRunning) {
      return `Session in progress`;
    }

    return null;
  };

  const handleStopAndSave = async () => {
    store.pause();
    const totalDuration = store.accumulatedSeconds + (store.startTime ? Math.floor((Date.now() - store.startTime) / 1000) : 0);
    
    if (totalDuration > 10) { // Only save if more than 10 seconds
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('time_sessions').insert({
          user_id: user.id,
          session_type: store.mode,
          title: store.title,
          duration_seconds: totalDuration
        });
      }
    }
    store.reset();
  };

  const showWidget = isHovered || store.isPinned || store.isRunning;

  return (
    <div 
      className="relative mt-12 flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible hover trigger area */}
      <div className="absolute -inset-10 z-0" />

      <div className={`
        relative z-10 w-80 bg-white/40 backdrop-blur-md border border-white/50 
        rounded-3xl p-6 shadow-lg transition-all duration-500 ease-out
        ${showWidget ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        {/* Header: Mode Switch & Pin */}
        <div className="flex justify-between items-center mb-4 text-[#888]">
          <div className="flex gap-3 text-xs uppercase tracking-widest font-bold">
            <button 
              onClick={() => { store.setMode('stopwatch'); store.reset(); }}
              className={`transition-colors ${store.mode === 'stopwatch' ? 'text-[#c2956e]' : 'hover:text-[#3d3b33]'}`}
            >
              Stopwatch
            </button>
            <button 
              onClick={() => { store.setMode('timer'); store.reset(); }}
              className={`transition-colors ${store.mode === 'timer' ? 'text-[#c2956e]' : 'hover:text-[#3d3b33]'}`}
            >
              Timer
            </button>
          </div>
          <button onClick={store.togglePin} className={`hover:text-[#3d3b33] transition-colors ${store.isPinned ? 'text-[#c2956e]' : ''}`}>
            {store.isPinned ? <Pin size={16} /> : <PinOff size={16} />}
          </button>
        </div>

        {/* Inputs */}
        <div className="flex gap-2 mb-2">
          <input 
            type="text" 
            value={store.title} 
            onChange={(e) => store.setTitle(e.target.value)}
            disabled={store.isRunning}
            className="flex-1 bg-transparent border-b border-[#e0ddd5] text-center text-[#3d3b33] text-sm outline-none pb-1 disabled:opacity-50"
            placeholder="What are you focusing on?"
          />
          {store.mode === 'timer' && (
            <input 
              type="number" 
              value={store.targetMinutes} 
              onChange={(e) => store.setTargetMinutes(parseInt(e.target.value) || 0)}
              disabled={store.isRunning}
              className="w-16 bg-transparent border-b border-[#e0ddd5] text-center text-[#3d3b33] text-sm outline-none pb-1 disabled:opacity-50"
              placeholder="Min"
            />
          )}
        </div>

        {/* Time Display */}
        <div className="text-5xl text-[#3d3b33] font-mono text-center my-6 tracking-tight font-light">
          {formatTime(currentDisplaySeconds)}
        </div>

        {/* Projected End Time */}
        <div className="h-4 flex items-center justify-center text-xs text-[#888] font-medium tracking-wide mb-6">
          {store.mode === 'timer' && store.isRunning && (
            <span className="flex items-center gap-1"><Clock size={12}/> {getProjectedEndTime()}</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button 
            onClick={store.isRunning ? store.pause : store.start}
            className="w-12 h-12 flex items-center justify-center bg-[#f7f5f0] text-[#c2956e] rounded-full hover:bg-white transition-all shadow-sm"
          >
            {store.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          
          {(store.accumulatedSeconds > 0 || store.isRunning) && (
            <button 
              onClick={handleStopAndSave}
              className="w-12 h-12 flex items-center justify-center bg-[#f7f5f0] text-red-400 rounded-full hover:bg-white transition-all shadow-sm"
            >
              <Square size={18} fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}