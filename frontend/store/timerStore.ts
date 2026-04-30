// frontend/store/timerStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SessionType = 'timer' | 'stopwatch';

export interface EngineInstance {
  id: string;
  isRunning: boolean;
  startTime: number | null;
  accumulatedSeconds: number;
  title: string;
  targetMinutes?: number;
}

interface TimerState {
  activeTab: SessionType;
  isPinned: boolean;
  forceShowWidgets: boolean;
  timers: EngineInstance[];
  stopwatches: EngineInstance[];

  setActiveTab: (tab: SessionType) => void;
  togglePin: () => void;
  setForceShowWidgets: (val: boolean) => void;
  addInstance: (tab: SessionType) => string;
  removeInstance: (tab: SessionType, id: string) => void;
  setTitle: (tab: SessionType, id: string, title: string) => void;
  setTargetMinutes: (id: string, mins: number) => void;
  start: (tab: SessionType, id: string) => void;
  pause: (tab: SessionType, id: string) => void;
  reset: (tab: SessionType, id: string) => void;
  toggleFirstActive: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultTimer = (): EngineInstance => ({
  id: generateId(),
  isRunning: false,
  startTime: null,
  accumulatedSeconds: 0,
  title: 'Focus Task',
  targetMinutes: 25
});

const createDefaultStopwatch = (): EngineInstance => ({
  id: generateId(),
  isRunning: false,
  startTime: null,
  accumulatedSeconds: 0,
  title: 'Focus Task'
});

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTab: 'stopwatch',
      isPinned: false,
      forceShowWidgets: false,
      timers: [createDefaultTimer()],
      stopwatches: [createDefaultStopwatch()],

      setActiveTab: (activeTab) => set({ activeTab }),
      togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
      setForceShowWidgets: (val) => set({ forceShowWidgets: val }),

      addInstance: (tab) => {
        const newId = generateId();
        set((state) => {
          const listName = tab === 'timer' ? 'timers' : 'stopwatches';
          const newInst = tab === 'timer' ? createDefaultTimer() : createDefaultStopwatch();
          newInst.id = newId;
          return { [listName]: [...state[listName], newInst] };
        });
        return newId;
      },

      removeInstance: (tab, id) => set((state) => {
        const listName = tab === 'timer' ? 'timers' : 'stopwatches';
        let newList = state[listName].filter((i) => i.id !== id);
        if (newList.length === 0) {
          newList = [tab === 'timer' ? createDefaultTimer() : createDefaultStopwatch()];
        }
        return { [listName]: newList };
      }),

      setTitle: (tab, id, title) => set((state) => {
        const listName = tab === 'timer' ? 'timers' : 'stopwatches';
        return { [listName]: state[listName].map((i) => i.id === id ? { ...i, title } : i) };
      }),

      setTargetMinutes: (id, targetMinutes) => set((state) => ({
        timers: state.timers.map((i) => i.id === id ? { ...i, targetMinutes } : i)
      })),

      start: (tab, id) => set((state) => {
        const listName = tab === 'timer' ? 'timers' : 'stopwatches';
        return { [listName]: state[listName].map((i) => i.id === id ? { ...i, isRunning: true, startTime: Date.now() } : i) };
      }),

      pause: (tab, id) => set((state) => {
        const listName = tab === 'timer' ? 'timers' : 'stopwatches';
        return {
          [listName]: state[listName].map((i) => {
            if (i.id === id && i.startTime) {
              const elapsed = Math.floor((Date.now() - i.startTime) / 1000);
              return { ...i, isRunning: false, startTime: null, accumulatedSeconds: i.accumulatedSeconds + elapsed };
            }
            return i;
          })
        };
      }),

      reset: (tab, id) => set((state) => {
        const listName = tab === 'timer' ? 'timers' : 'stopwatches';
        return { [listName]: state[listName].map((i) => i.id === id ? { ...i, isRunning: false, startTime: null, accumulatedSeconds: 0 } : i) };
      }),

      toggleFirstActive: () => {
        const state = get();
        const tab = state.activeTab;
        const list = tab === 'timer' ? state.timers : state.stopwatches;
        const running = list.find(i => i.isRunning);
        if (running) {
          state.pause(tab, running.id);
        } else {
          state.start(tab, list[0].id);
        }
      }
    }),
    { name: 'chronoa-multi-timer-v2' }
  )
);