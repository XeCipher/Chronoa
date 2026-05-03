// frontend/store/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TasksView = 'focus' | 'archive' | 'trash';
type NotesTab = 'notes' | 'journal' | 'trash';
type SessionsFilter = 'all' | 'timer' | 'stopwatch';
type CalendarView = 'month' | 'week' | '2-day' | 'day';

export type ConfirmDialogState = {
  title: string;
  message: string;
  onConfirm: () => void;
  isDestructive?: boolean;
  confirmText?: string;
  cancelText?: string;
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
};

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
  calendarView: CalendarView;
  hotkeysEnabled: boolean;
  disabledHotkeys: string[];
  moveCompletedToBottom: boolean;
  keepParentTaskAlive: boolean;
  addTaskAtTop: boolean;
  showHomeTaskProgress: boolean;
  activeTaskIdWithMenu: string | null;
  archiveLayout: 'nested' | 'list';
  archiveSort: 'newest' | 'oldest';
  
  mobileRoutineCollapsed: boolean;
  mobileTasksCollapsed: boolean;

  confirmDialog: ConfirmDialogState | null;
  isGlobalTimeWidgetExpanded: boolean;
  
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
  setCalendarView: (view: CalendarView) => void;
  setHotkeysEnabled: (enabled: boolean) => void;
  setDisabledHotkeys: (keys: string[]) => void;
  setMoveCompletedToBottom: (val: boolean) => void;
  setKeepParentTaskAlive: (val: boolean) => void;
  setAddTaskAtTop: (val: boolean) => void;
  setShowHomeTaskProgress: (val: boolean) => void;
  setActiveTaskIdWithMenu: (id: string | null) => void;
  setArchiveLayout: (layout: 'nested' | 'list') => void;
  setArchiveSort: (sort: 'newest' | 'oldest') => void;
  
  setMobileRoutineCollapsed: (val: boolean) => void;
  setMobileTasksCollapsed: (val: boolean) => void;

  showConfirmDialog: (options: ConfirmDialogState) => void;
  closeConfirmDialog: () => void;
  setGlobalTimeWidgetExpanded: (val: boolean) => void;
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
      calendarView: 'month',
      hotkeysEnabled: true,
      disabledHotkeys: [],
      moveCompletedToBottom: true,
      keepParentTaskAlive: false,
      addTaskAtTop: false,
      showHomeTaskProgress: true,
      activeTaskIdWithMenu: null,
      archiveLayout: 'nested',
      archiveSort: 'newest',
      mobileRoutineCollapsed: false,
      mobileTasksCollapsed: false,
      
      confirmDialog: null,
      isGlobalTimeWidgetExpanded: false,

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
      setCalendarView: (view) => set({ calendarView: view }),
      setHotkeysEnabled: (hotkeysEnabled) => set({ hotkeysEnabled }),
      setDisabledHotkeys: (keys) => set({ disabledHotkeys: keys }),
      setMoveCompletedToBottom: (val) => set({ moveCompletedToBottom: val }),
      setKeepParentTaskAlive: (val) => set({ keepParentTaskAlive: val }),
      setAddTaskAtTop: (val) => set({ addTaskAtTop: val }),
      setShowHomeTaskProgress: (val) => set({ showHomeTaskProgress: val }),
      setActiveTaskIdWithMenu: (id) => set({ activeTaskIdWithMenu: id }),
      setArchiveLayout: (archiveLayout) => set({ archiveLayout }),
      setArchiveSort: (archiveSort) => set({ archiveSort }),
      setMobileRoutineCollapsed: (val) => set({ mobileRoutineCollapsed: val }),
      setMobileTasksCollapsed: (val) => set({ mobileTasksCollapsed: val }),

      showConfirmDialog: (options) => set({ confirmDialog: options }),
      closeConfirmDialog: () => set({ confirmDialog: null }),
      setGlobalTimeWidgetExpanded: (val) => set({ isGlobalTimeWidgetExpanded: val }),
    }),
    { 
      name: 'chronoa-settings',
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => !['activeTaskIdWithMenu', 'mobileNoteOpen', 'confirmDialog', 'isGlobalTimeWidgetExpanded'].includes(key))
      ),
    }
  )
);