import { create } from 'zustand';
import type { ViewType, FilterPreset, SortMode, SortDirection, ToastMessage } from '../types';

interface UIState {
  // Navigation
  currentView: ViewType;
  setView: (view: ViewType) => void;

  // Task selection
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  // Detail panel
  detailPanelOpen: boolean;
  openDetailPanel: (taskId: string) => void;
  closeDetailPanel: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Filter
  activeFilter: FilterPreset;
  setActiveFilter: (filter: FilterPreset) => void;

  // Sort
  sortMode: SortMode;
  sortDirection: SortDirection;
  setSortMode: (mode: SortMode) => void;
  setSortDirection: (direction: SortDirection) => void;

  // Completed section
  showCompleted: boolean;
  toggleShowCompleted: () => void;

  // Settings panel
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Mobile sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Calendar navigation
  calendarDate: Date;
  setCalendarDate: (date: Date | ((prev: Date) => Date)) => void;
  calendarViewMode: 'month' | 'week';
  setCalendarViewMode: (mode: 'month' | 'week') => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  currentView: 'calendar',
  setView: (view) =>
    set({
      currentView: view,
      sidebarOpen: false,
      // Search is only available in All Tasks; clear it when leaving
      ...(view !== 'all' ? { searchOpen: false, searchQuery: '' } : {}),
    }),

  calendarDate: new Date(),
  setCalendarDate: (date) =>
    set((state) => ({
      calendarDate: typeof date === 'function' ? date(state.calendarDate) : date,
    })),
  calendarViewMode: 'month',
  setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),

  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  detailPanelOpen: false,
  openDetailPanel: (taskId) =>
    set({ detailPanelOpen: true, selectedTaskId: taskId }),
  closeDetailPanel: () =>
    set({ detailPanelOpen: false, selectedTaskId: null }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchOpen: false,
  // Opening search always switches to All Tasks (search lives only there)
  setSearchOpen: (open) =>
    set(
      open
        ? { searchOpen: true, searchQuery: '', currentView: 'all' }
        : { searchOpen: false, searchQuery: '' }
    ),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  activeFilter: 'all',
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  sortMode: 'dueDate',
  sortDirection: 'asc',
  setSortMode: (mode) => set({ sortMode: mode }),
  setSortDirection: (direction) => set({ sortDirection: direction }),

  showCompleted: false,
  toggleShowCompleted: () =>
    set((state) => ({ showCompleted: !state.showCompleted })),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-remove after duration
    const duration = toast.duration || 3000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
