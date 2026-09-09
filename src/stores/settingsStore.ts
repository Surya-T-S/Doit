import { create } from 'zustand';
import type { UserSettings, ThemeMode } from '../types';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { loadSettings, saveSettings } from '../services/persistence';

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function applyCalendarTaskColor(color: string): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const rgb = hexToRgb(color);
  if (!rgb) return;
  const { r, g, b } = rgb;

  root.style.setProperty('--calendar-task-color', color);
  root.style.setProperty('--calendar-task-bg', `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty('--calendar-task-bg-hover', `rgba(${r}, ${g}, ${b}, 0.24)`);

  const isDark = root.getAttribute('data-theme') === 'dark';
  if (isDark) {
    root.style.setProperty(
      '--calendar-task-text',
      `rgb(${Math.min(255, Math.round(r * 0.75 + 85))}, ${Math.min(255, Math.round(g * 0.75 + 85))}, ${Math.min(255, Math.round(b * 0.75 + 85))})`
    );
  } else {
    root.style.setProperty(
      '--calendar-task-text',
      `rgb(${Math.max(0, Math.round(r * 0.65 - 15))}, ${Math.max(0, Math.round(g * 0.65 - 15))}, ${Math.max(0, Math.round(b * 0.65 - 15))})`
    );
  }
}

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
    // Apply theme and custom calendar task color on init
    const current = get();
    applyTheme(current.theme);
    applyCalendarTaskColor(current.calendarTaskColor || DEFAULT_SETTINGS.calendarTaskColor || '#2563EB');
  },

  updateSettings: (updates) => {
    set((state) => {
      const newState = { ...state, ...updates };
      if (updates.calendarTaskColor) {
        applyCalendarTaskColor(updates.calendarTaskColor);
      }
      if (updates.theme) {
        applyTheme(updates.theme);
        applyCalendarTaskColor(newState.calendarTaskColor || '#2563EB');
      }
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
    applyCalendarTaskColor(get().calendarTaskColor || '#2563EB');
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
    applyCalendarTaskColor(DEFAULT_SETTINGS.calendarTaskColor || '#2563EB');
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
      const { theme, calendarTaskColor } = useSettingsStore.getState();
      if (theme === 'system') {
        applyTheme('system');
        applyCalendarTaskColor(calendarTaskColor || '#2563EB');
      }
    });
}
