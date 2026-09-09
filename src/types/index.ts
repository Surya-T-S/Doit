// ============================================================
// Doit — Type Definitions
// ============================================================

// --- Task Model ---

export type TaskStatus = 'pending' | 'completed';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceFrequency = 'daily' | 'weekday' | 'weekly' | 'monthly' | 'custom';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Reminder {
  id: string;
  type: 'due' | 'scheduled' | 'custom';
  time: string; // ISO 8601
  notified: boolean;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  count?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  completedAt: string | null;
  dueDate: string | null; // YYYY-MM-DD
  dueTime: string | null; // HH:MM
  priority: TaskPriority;
  tags: string[];
  category: string;
  notes: string;
  subtasks: Subtask[];
  reminders: Reminder[];
  recurrence: RecurrenceRule | null;
  estimatedDuration: number | null; // minutes
  actualDuration: number | null; // minutes
  customOrder: number;
  links: string[];
  calendarEventId: string | null;
  parentId: string | null;
  dependsOn: string[];
  relatedTo: string[];
  metadata: Record<string, unknown>;
}

// --- Sort & Filter ---

export type SortMode = 'custom' | 'alphabetical' | 'created' | 'dueDate' | 'priority';
export type SortDirection = 'asc' | 'desc';

export type FilterPreset =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'overdue'
  | 'thisWeek'
  | 'highPriority'
  | 'tagged'
  | 'scheduled'
  | 'noDueDate';

// --- User Settings ---

export type ThemeMode = 'light' | 'dark' | 'system';
export type ViewType = 'calendar' | 'all';
export type TimeFormat = '12h' | '24h';

export interface UserSettings {
  theme: ThemeMode;
  dailyCapacityMinutes: number;
  defaultView: ViewType;
  sortMode: SortMode;
  sortDirection: SortDirection;
  showCompletedTasks: boolean;
  weekStartsOn: 0 | 1;
  timeFormat: TimeFormat;
  reducedMotion: boolean;
  calendarTaskColor?: string;
}

// --- Export/Import ---

export interface DoitExport {
  version: number;
  exportedAt: string;
  tasks: Task[];
  settings: UserSettings;
}

// --- UI State ---

export interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  category?: string;
  action: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// --- Desktop Electron API ---

export interface ElectronAPI {
  isDesktop: boolean;
  getData: () => Promise<string | null>;
  saveData: (data: string) => Promise<boolean>;
  getDataPath: () => Promise<string>;
  getVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

