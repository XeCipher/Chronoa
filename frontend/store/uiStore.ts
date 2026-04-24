import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  taskArchiveDelay: number;
  routineResetHour: number; // 0-23
  setTaskArchiveDelay: (delay: number) => void;
  setRoutineResetHour: (hour: number) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      taskArchiveDelay: 5,
      routineResetHour: 7, // Default to 7 AM
      setTaskArchiveDelay: (delay) => set({ taskArchiveDelay: delay }),
      setRoutineResetHour: (hour) => set({ routineResetHour: hour }),
    }),
    { name: 'chronoa-settings' }
  )
);