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
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  currentView: 'today',
  setView: (view) => set({ currentView: view, sidebarOpen: false }),

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
  setSearchOpen: (open) => set({ searchOpen: open, searchQuery: open ? '' : '' }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  activeFilter: 'all',
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  sortMode: 'custom',
  sortDirection: 'asc',
  setSortMode: (mode) => set({ sortMode: mode }),
  setSortDirection: (direction) => set({ sortDirection: direction }),

  showCompleted: true,
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
