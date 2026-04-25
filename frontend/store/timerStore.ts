import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SessionType = 'timer' | 'stopwatch';

interface EngineState {
  isRunning: boolean;
  startTime: number | null;
  accumulatedSeconds: number;
  title: string;
  targetMinutes?: number; // Only for timer
}

interface TimerState {
  activeTab: SessionType;
  isPinned: boolean;
  timer: EngineState;
  stopwatch: EngineState;

  setActiveTab: (tab: SessionType) => void;
  togglePin: () => void;
  setTitle: (tab: SessionType, title: string) => void;
  setTargetMinutes: (mins: number) => void;
  start: (tab: SessionType) => void;
  pause: (tab: SessionType) => void;
  reset: (tab: SessionType) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      activeTab: 'stopwatch',
      isPinned: false,
      timer: { isRunning: false, startTime: null, accumulatedSeconds: 0, title: 'Focus Task', targetMinutes: 25 },
      stopwatch: { isRunning: false, startTime: null, accumulatedSeconds: 0, title: 'Focus Task' },

      setActiveTab: (activeTab) => set({ activeTab }),
      togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
      
      setTitle: (tab, title) => set((state) => ({ 
        [tab]: { ...state[tab], title } 
      })),
      
      setTargetMinutes: (targetMinutes) => set((state) => ({ 
        timer: { ...state.timer, targetMinutes } 
      })),
      
      start: (tab) => set((state) => ({ 
        [tab]: { ...state[tab], isRunning: true, startTime: Date.now() } 
      })),
      
      pause: (tab) => set((state) => {
        const engine = state[tab];
        if (!engine.startTime) return state;
        const elapsed = Math.floor((Date.now() - engine.startTime) / 1000);
        return { 
          [tab]: { ...engine, isRunning: false, startTime: null, accumulatedSeconds: engine.accumulatedSeconds + elapsed } 
        };
      }),
      
      reset: (tab) => set((state) => ({ 
        [tab]: { ...state[tab], isRunning: false, startTime: null, accumulatedSeconds: 0 } 
      })),
    }),
    { name: 'chronoa-dual-timer' }
  )
);