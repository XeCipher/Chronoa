import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = 'timer' | 'stopwatch';

interface TimerState {
  mode: Mode;
  isRunning: boolean;
  startTime: number | null; // Timestamp when it was started/resumed
  accumulatedSeconds: number; // Seconds gathered from previous paused intervals
  targetMinutes: number; // For timer mode
  title: string;
  isPinned: boolean;
  
  // Actions
  setMode: (mode: Mode) => void;
  setTitle: (title: string) => void;
  setTargetMinutes: (mins: number) => void;
  togglePin: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      mode: 'stopwatch',
      isRunning: false,
      startTime: null,
      accumulatedSeconds: 0,
      targetMinutes: 25,
      title: 'Deep Work',
      isPinned: false,

      setMode: (mode) => set({ mode }),
      setTitle: (title) => set({ title }),
      setTargetMinutes: (targetMinutes) => set({ targetMinutes }),
      togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
      
      start: () => set({ isRunning: true, startTime: Date.now() }),
      
      pause: () => set((state) => {
        if (!state.startTime) return state;
        const elapsedSinceStart = Math.floor((Date.now() - state.startTime) / 1000);
        return { 
          isRunning: false, 
          startTime: null, 
          accumulatedSeconds: state.accumulatedSeconds + elapsedSinceStart 
        };
      }),
      
      reset: () => set({ isRunning: false, startTime: null, accumulatedSeconds: 0 }),
    }),
    { name: 'chronoa-timer' }
  )
);