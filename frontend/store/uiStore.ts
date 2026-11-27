// frontend/store/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HomeClockStyle } from '@/lib/clockStyles';

type TasksView = 'focus' | 'archive' | 'trash';
type NotesTab = 'notes' | 'journal' | 'trash';
type SessionsFilter = 'all' | 'timer' | 'stopwatch';
type CalendarView = 'month' | 'week' | '2-day' | 'day';

export interface EditorCursorState {
  from: number;
  to: number;
  scrollTop: number;
  restoreFocus: boolean;
}

export type ConfirmDialogState = {
  title: string;
  message: string;
  onConfirm: (val?: string) => void;
  isDestructive?: boolean;
  confirmText?: string;
  cancelText?: string;
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  isPrompt?: boolean;
  promptPlaceholder?: string;
  promptDefaultValue?: string;
};

interface UiState {
  taskArchiveDelay: number;
  routineResetHour: number;
  journalZoom: number;
  isSidebarPinned: boolean;
  isSidebarIconPinned: boolean;
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
  showHomeSeconds: boolean;
  showHome24Hour: boolean;
  homeClockStyle: HomeClockStyle;
  activeTaskIdWithMenu: string | null;
  archiveLayout: 'nested' | 'list';
  archiveSort: 'newest' | 'oldest';
  collapseHintCount: number;

  mobileRoutineCollapsed: boolean;
  mobileTasksCollapsed: boolean;
  calendarWidgetCollapsed: boolean;

  notesFolderId: string | null;
  notesSelectedId: string | null;
  journalSelectedId: string | null;
  notesListVisible: boolean;
  journalListVisible: boolean;
  notesTrashOpen: boolean;
  notesLibraryScrollTop: number;
  editorCursorStates: Record<string, EditorCursorState>;

  confirmDialog: ConfirmDialogState | null;
  isGlobalTimeWidgetExpanded: boolean;
  isEditorFullscreen: boolean;
  isAiChatOpen: boolean;
  hasDashboardMounted: boolean;

  setTaskArchiveDelay: (delay: number) => void;
  setRoutineResetHour: (hour: number) => void;
  setJournalZoom: (zoom: number) => void;
  toggleSidebarPin: () => void;
  toggleSidebarIconPin: () => void;
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
  setShowHomeSeconds: (val: boolean) => void;
  setShowHome24Hour: (val: boolean) => void;
  setHomeClockStyle: (style: HomeClockStyle) => void;
  setActiveTaskIdWithMenu: (id: string | null) => void;
  setArchiveLayout: (layout: 'nested' | 'list') => void;
  setArchiveSort: (sort: 'newest' | 'oldest') => void;
  incrementCollapseHintCount: () => void;
  dismissCollapseHint: () => void;

  setMobileRoutineCollapsed: (val: boolean) => void;
  setMobileTasksCollapsed: (val: boolean) => void;
  setCalendarWidgetCollapsed: (val: boolean) => void;

  setNotesFolderId: (id: string | null) => void;
  setNotesSelectedId: (id: string | null) => void;
  setJournalSelectedId: (id: string | null) => void;
  setNotesListVisible: (val: boolean) => void;
  setJournalListVisible: (val: boolean) => void;
  setNotesTrashOpen: (val: boolean) => void;
  setNotesLibraryScrollTop: (val: number) => void;
  setEditorCursorState: (key: string, cursorState: EditorCursorState) => void;
  resetNotesWorkspace: () => void;

  showConfirmDialog: (options: ConfirmDialogState) => void;
  closeConfirmDialog: () => void;
  setGlobalTimeWidgetExpanded: (val: boolean) => void;
  toggleEditorFullscreen: () => void;
  setEditorFullscreen: (val: boolean) => void;
  toggleAiChat: () => void;
  setAiChatOpen: (val: boolean) => void;
  setHasDashboardMounted: (val: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      taskArchiveDelay: 5,
      routineResetHour: 7,
      journalZoom: 100,
      isSidebarPinned: false,
      isSidebarIconPinned: false,
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
      showHomeSeconds: false,
      showHome24Hour: false,
      homeClockStyle: 'editorial',
      activeTaskIdWithMenu: null,
      archiveLayout: 'nested',
      archiveSort: 'newest',
      collapseHintCount: 0,
      mobileRoutineCollapsed: true,
      mobileTasksCollapsed: false,
      calendarWidgetCollapsed: false,

      notesFolderId: null,
      notesSelectedId: null,
      journalSelectedId: null,
      notesListVisible: true,
      journalListVisible: true,
      notesTrashOpen: false,
      notesLibraryScrollTop: 0,
      editorCursorStates: {},

      confirmDialog: null,
      isGlobalTimeWidgetExpanded: false,
      isEditorFullscreen: false,
      isAiChatOpen: false,
      hasDashboardMounted: false,

      setTaskArchiveDelay: (delay) => set({ taskArchiveDelay: delay }),
      setRoutineResetHour: (hour) => set({ routineResetHour: hour }),
      setJournalZoom: (zoom) => set({ journalZoom: zoom }),

      // Mutually exclusive pin states
      toggleSidebarPin: () => set((state) => {
        const next = !state.isSidebarPinned;
        return { isSidebarPinned: next, isSidebarIconPinned: next ? false : state.isSidebarIconPinned };
      }),
      toggleSidebarIconPin: () => set((state) => {
        const next = !state.isSidebarIconPinned;
        return { isSidebarIconPinned: next, isSidebarPinned: next ? false : state.isSidebarPinned };
      }),

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
      setShowHomeSeconds: (val) => set({ showHomeSeconds: val }),
      setShowHome24Hour: (val) => set({ showHome24Hour: val }),
      setHomeClockStyle: (style) => set({ homeClockStyle: style }),
      setActiveTaskIdWithMenu: (id) => set({ activeTaskIdWithMenu: id }),
      setArchiveLayout: (archiveLayout) => set({ archiveLayout }),
      setArchiveSort: (archiveSort) => set({ archiveSort }),
      incrementCollapseHintCount: () =>
        set((state) => ({ collapseHintCount: Math.min(3, state.collapseHintCount + 1) })),
      dismissCollapseHint: () => set({ collapseHintCount: 3 }),
      setMobileRoutineCollapsed: (val) => set({ mobileRoutineCollapsed: val }),
      setMobileTasksCollapsed: (val) => set({ mobileTasksCollapsed: val }),
      setCalendarWidgetCollapsed: (val) => set({ calendarWidgetCollapsed: val }),

      setNotesFolderId: (notesFolderId) => set({ notesFolderId }),
      setNotesSelectedId: (notesSelectedId) => set({ notesSelectedId }),
      setJournalSelectedId: (journalSelectedId) => set({ journalSelectedId }),
      setNotesListVisible: (notesListVisible) => set({ notesListVisible }),
      setJournalListVisible: (journalListVisible) => set({ journalListVisible }),
      setNotesTrashOpen: (notesTrashOpen) => set({ notesTrashOpen }),
      setNotesLibraryScrollTop: (notesLibraryScrollTop) => set({ notesLibraryScrollTop }),
      setEditorCursorState: (key, cursorState) =>
        set((state) => ({
          editorCursorStates: { ...state.editorCursorStates, [key]: cursorState },
        })),
      resetNotesWorkspace: () =>
        set({
          notesFolderId: null,
          notesSelectedId: null,
          journalSelectedId: null,
          notesListVisible: true,
          journalListVisible: true,
          notesTrashOpen: false,
          notesLibraryScrollTop: 0,
          editorCursorStates: {},
        }),

      showConfirmDialog: (options) => set({ confirmDialog: options }),
      closeConfirmDialog: () => set({ confirmDialog: null }),
      setGlobalTimeWidgetExpanded: (val) => set({ isGlobalTimeWidgetExpanded: val }),
      toggleEditorFullscreen: () => set((state) => ({ isEditorFullscreen: !state.isEditorFullscreen })),
      setEditorFullscreen: (val) => set({ isEditorFullscreen: val }),
      toggleAiChat: () => set((state) => ({ isAiChatOpen: !state.isAiChatOpen })),
      setAiChatOpen: (val) => set({ isAiChatOpen: val }),
      setHasDashboardMounted: (val) => set({ hasDashboardMounted: val }),
    }),
    {
      name: 'chronoa-settings',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              ![
                'activeTaskIdWithMenu',
                'mobileNoteOpen',
                'confirmDialog',
                'isGlobalTimeWidgetExpanded',
                'isEditorFullscreen',
                'isAiChatOpen',
                'hasDashboardMounted',
                'notesTrashOpen',
                'notesListVisible',
                'journalListVisible',
                'notesLibraryScrollTop',
                'editorCursorStates',
              ].includes(key)
          )
        ),
    }
  )
);