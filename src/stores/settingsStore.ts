import { create } from 'zustand';
import type { UserSettings, ThemeMode } from '../types';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { loadSettings, saveSettings } from '../services/persistence';

interface SettingsState extends UserSettings {
  isLoaded: boolean;
  initialize: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  initialize: async () => {
    const stored = await loadSettings();
    if (stored) {
      set({ ...stored, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
    // Apply theme on init
    applyTheme(get().theme);
  },

  updateSettings: (updates) => {
    set((state) => {
      const newState = { ...state, ...updates };
      // Persist
      const {
        isLoaded: _,
        initialize: __,
        updateSettings: ___,
        setTheme: ____,
        resetSettings: _____,
        ...settings
      } = newState;
      saveSettings(settings as UserSettings);
      return updates;
    });
  },

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    const state = get();
    const {
      isLoaded: _,
      initialize: __,
      updateSettings: ___,
      setTheme: ____,
      resetSettings: _____,
      ...settings
    } = state;
    saveSettings(settings as UserSettings);
  },

  resetSettings: () => {
    set({ ...DEFAULT_SETTINGS });
    saveSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
  },
}));

/**
 * Apply theme to the document
 */
function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { theme } = useSettingsStore.getState();
      if (theme === 'system') {
        applyTheme('system');
      }
    });
}
