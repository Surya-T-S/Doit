import type { TaskPriority, UserSettings } from '../types';

// --- App Constants ---

export const APP_NAME = 'Doit';
export const APP_VERSION = '1.0.0';
export const DATA_VERSION = 1;

// --- Default Settings ---

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  dailyCapacityMinutes: 480, // 8 hours
  defaultView: 'today',
  sortMode: 'custom',
  sortDirection: 'asc',
  showCompletedTasks: true,
  weekStartsOn: 1,
  timeFormat: '12h',
  reducedMotion: false,
};

// --- Priority Config ---

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// --- Keyboard Shortcuts ---

export const SHORTCUTS = {
  NEW_TASK: 'n',
  EDIT_TASK: 'e',
  COMPLETE_TASK: ' ', // Space
  DELETE_TASK: 'Delete',
  SEARCH: '/',
  TODAY_VIEW: 't',
  CALENDAR_VIEW: 'c',
  FOCUS_MODE: 'f',
  COMMAND_PALETTE: 'k', // With Cmd/Ctrl
  ESCAPE: 'Escape',
} as const;

// --- Sort Mode Labels ---

export const SORT_LABELS = {
  custom: 'Custom',
  alphabetical: 'Alphabetical',
  created: 'Date Created',
  dueDate: 'Due Date',
  priority: 'Priority',
} as const;

// --- Filter Labels ---

export const FILTER_LABELS = {
  all: 'All Tasks',
  today: 'Today',
  tomorrow: 'Tomorrow',
  overdue: 'Overdue',
  thisWeek: 'This Week',
  highPriority: 'High Priority',
  tagged: 'Tagged',
  scheduled: 'Scheduled',
  noDueDate: 'No Due Date',
} as const;

// --- Animation Durations ---

export const ANIMATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;
