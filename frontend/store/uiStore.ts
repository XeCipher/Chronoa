import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  taskArchiveDelay: number;
  routineResetHour: number;
  journalZoom: number; // Percentage (e.g., 100 for default)
  setTaskArchiveDelay: (delay: number) => void;
  setRoutineResetHour: (hour: number) => void;
  setJournalZoom: (zoom: number) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      taskArchiveDelay: 5,
      routineResetHour: 7,
      journalZoom: 100, // Default to 100% zoom
      setTaskArchiveDelay: (delay) => set({ taskArchiveDelay: delay }),
      setRoutineResetHour: (hour) => set({ routineResetHour: hour }),
      setJournalZoom: (zoom) => set({ journalZoom: zoom }),
    }),
    { name: 'chronoa-settings' }
  )
);