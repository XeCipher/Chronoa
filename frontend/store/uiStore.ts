import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  taskArchiveDelay: number;
  routineResetHour: number;
  journalZoom: number;
  isSidebarPinned: boolean; // NEW: true = always open, false = hover to open
  setTaskArchiveDelay: (delay: number) => void;
  setRoutineResetHour: (hour: number) => void;
  setJournalZoom: (zoom: number) => void;
  toggleSidebarPin: () => void; // NEW: action to change the state
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      taskArchiveDelay: 5,
      routineResetHour: 7,
      journalZoom: 100,
      isSidebarPinned: false, // Default to collapsed (logo-only)
      setTaskArchiveDelay: (delay) => set({ taskArchiveDelay: delay }),
      setRoutineResetHour: (hour) => set({ routineResetHour: hour }),
      setJournalZoom: (zoom) => set({ journalZoom: zoom }),
      toggleSidebarPin: () => set((state) => ({ isSidebarPinned: !state.isSidebarPinned })),
    }),
    { name: 'chronoa-settings' }
  )
);