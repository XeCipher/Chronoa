// frontend/store/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TasksView = 'focus' | 'archive' | 'trash';
type NotesTab = 'notes' | 'journal' | 'trash';
type SessionsFilter = 'all' | 'timer' | 'stopwatch';

interface UiState {
  taskArchiveDelay: number;
  routineResetHour: number;
  journalZoom: number;
  isSidebarPinned: boolean;
  theme: 'system' | 'light' | 'dark';
  isMobileMenuOpen: boolean;
  mobileNoteOpen: boolean;
  lastVisitedPage: string;
  tasksView: TasksView;
  notesTab: NotesTab;
  sessionsFilter: SessionsFilter;
  hotkeysEnabled: boolean;
  moveCompletedToBottom: boolean;
  keepParentTaskAlive: boolean;
  addTaskAtTop: boolean;
  activeTaskIdWithMenu: string | null;
  // NEW: Archive specific layout settings
  archiveLayout: 'nested' | 'list';
  archiveSort: 'newest' | 'oldest';
  
  setTaskArchiveDelay: (delay: number) => void;
  setRoutineResetHour: (hour: number) => void;
  setJournalZoom: (zoom: number) => void;
  toggleSidebarPin: () => void;
  setTheme: (theme: 'system' | 'light' | 'dark') => void;
  toggleMobileMenu: () => void;
  setMobileNoteOpen: (val: boolean) => void;
  setLastVisitedPage: (page: string) => void;
  setTasksView: (view: TasksView) => void;
  setNotesTab: (tab: NotesTab) => void;
  setSessionsFilter: (filter: SessionsFilter) => void;
  setHotkeysEnabled: (enabled: boolean) => void;
  setMoveCompletedToBottom: (val: boolean) => void;
  setKeepParentTaskAlive: (val: boolean) => void;
  setAddTaskAtTop: (val: boolean) => void;
  setActiveTaskIdWithMenu: (id: string | null) => void;
  setArchiveLayout: (layout: 'nested' | 'list') => void;
  setArchiveSort: (sort: 'newest' | 'oldest') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      taskArchiveDelay: 5,
      routineResetHour: 7,
      journalZoom: 100,
      isSidebarPinned: false,
      theme: 'system',
      isMobileMenuOpen: false,
      mobileNoteOpen: false,
      lastVisitedPage: '/',
      tasksView: 'focus',
      notesTab: 'notes',
      sessionsFilter: 'all',
      hotkeysEnabled: true,
      moveCompletedToBottom: true,
      keepParentTaskAlive: false,
      addTaskAtTop: false,
      activeTaskIdWithMenu: null,
      archiveLayout: 'nested',
      archiveSort: 'newest',

      setTaskArchiveDelay: (delay) => set({ taskArchiveDelay: delay }),
      setRoutineResetHour: (hour) => set({ routineResetHour: hour }),
      setJournalZoom: (zoom) => set({ journalZoom: zoom }),
      toggleSidebarPin: () => set((state) => ({ isSidebarPinned: !state.isSidebarPinned })),
      setTheme: (theme) => set({ theme }),
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      setMobileNoteOpen: (val) => set({ mobileNoteOpen: val }),
      setLastVisitedPage: (page) => set({ lastVisitedPage: page }),
      setTasksView: (view) => set({ tasksView: view }),
      setNotesTab: (tab) => set({ notesTab: tab }),
      setSessionsFilter: (filter) => set({ sessionsFilter: filter }),
      setHotkeysEnabled: (hotkeysEnabled) => set({ hotkeysEnabled }),
      setMoveCompletedToBottom: (val) => set({ moveCompletedToBottom: val }),
      setKeepParentTaskAlive: (val) => set({ keepParentTaskAlive: val }),
      setAddTaskAtTop: (val) => set({ addTaskAtTop: val }),
      setActiveTaskIdWithMenu: (id) => set({ activeTaskIdWithMenu: id }),
      setArchiveLayout: (archiveLayout) => set({ archiveLayout }),
      setArchiveSort: (archiveSort) => set({ archiveSort }),
    }),
    { 
      name: 'chronoa-settings',
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => !['activeTaskIdWithMenu', 'mobileNoteOpen'].includes(key))
      ),
    }
  )
);