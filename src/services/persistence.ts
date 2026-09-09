import { db } from './db';
import type { Task, UserSettings } from '../types';

interface DesktopDataStore {
  version: number;
  tasks: Task[];
  settings: UserSettings | null;
}

let desktopMemoryCache: DesktopDataStore | null = null;

function isDesktopMode(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isDesktop);
}

async function getDesktopStore(): Promise<DesktopDataStore> {
  if (desktopMemoryCache) return desktopMemoryCache;

  if (window.electronAPI) {
    try {
      const raw = await window.electronAPI.getData();
      if (raw) {
        desktopMemoryCache = JSON.parse(raw);
        return desktopMemoryCache!;
      }
    } catch (e) {
      console.error('[Persistence] Failed to parse desktop data:', e);
    }
  }

  // First run in desktop: check if IndexedDB has data to migrate
  let initialTasks: Task[] = [];
  let initialSettings: UserSettings | null = null;
  try {
    initialTasks = await db.tasks.toArray();
    const storedSettings = await db.settings.get('user-settings');
    if (storedSettings) {
      const { id: _, ...rest } = storedSettings;
      initialSettings = rest as UserSettings;
    }
  } catch {
    // Ignore migration errors
  }

  desktopMemoryCache = {
    version: 1,
    tasks: initialTasks,
    settings: initialSettings,
  };

  // Persist initial desktop store
  if (window.electronAPI) {
    await window.electronAPI.saveData(JSON.stringify(desktopMemoryCache, null, 2));
  }

  return desktopMemoryCache;
}

async function persistDesktopStore(): Promise<void> {
  if (!desktopMemoryCache || !window.electronAPI) return;
  try {
    await window.electronAPI.saveData(JSON.stringify(desktopMemoryCache, null, 2));
  } catch (err) {
    console.error('[Persistence] Failed to write desktop file:', err);
  }
}

/**
 * Load all tasks (Dual-Mode: Desktop AppData or Browser IndexedDB)
 */
export async function loadTasks(): Promise<Task[]> {
  if (isDesktopMode()) {
    const store = await getDesktopStore();
    return store.tasks || [];
  }

  try {
    return await db.tasks.toArray();
  } catch (error) {
    console.error('[Persistence] Failed to load tasks from IndexedDB:', error);
    return [];
  }
}

/**
 * Save a single task (upsert)
 */
export async function saveTask(task: Task): Promise<void> {
  if (isDesktopMode()) {
    const store = await getDesktopStore();
    const idx = store.tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      store.tasks[idx] = task;
    } else {
      store.tasks.push(task);
    }
    await persistDesktopStore();
    return;
  }

  try {
    await db.tasks.put(task);
  } catch (error) {
    console.error('[Persistence] Failed to save task in IndexedDB:', error);
  }
}

/**
 * Save multiple tasks (bulk upsert)
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  if (isDesktopMode()) {
    const store = await getDesktopStore();
    const map = new Map(store.tasks.map((t) => [t.id, t]));
    for (const t of tasks) {
      map.set(t.id, t);
    }
    store.tasks = Array.from(map.values());
    await persistDesktopStore();
    return;
  }

  try {
    await db.tasks.bulkPut(tasks);
  } catch (error) {
    console.error('[Persistence] Failed to save tasks in IndexedDB:', error);
  }
}

/**
 * Delete a task by ID
 */
export async function deleteTask(taskId: string): Promise<void> {
  if (isDesktopMode()) {
    const store = await getDesktopStore();
    store.tasks = store.tasks.filter((t) => t.id !== taskId);
    await persistDesktopStore();
    return;
  }

  try {
    await db.tasks.delete(taskId);
  } catch (error) {
    console.error('[Persistence] Failed to delete task in IndexedDB:', error);
  }
}

/**
 * Delete multiple tasks
 */
export async function deleteTasks(taskIds: string[]): Promise<void> {
  if (isDesktopMode()) {
    const store = await getDesktopStore();
    const set = new Set(taskIds);
    store.tasks = store.tasks.filter((t) => !set.has(t.id));
    await persistDesktopStore();
    return;
  }

  try {
    await db.tasks.bulkDelete(taskIds);
  } catch (error) {
    console.error('[Persistence] Failed to delete tasks in IndexedDB:', error);
  }
}

/**
 * Load user settings
 */
export async function loadSettings(): Promise<UserSettings | null> {
  if (isDesktopMode()) {
    const store = await getDesktopStore();
    return store.settings;
  }

  try {
    const settings = await db.settings.get('user-settings');
    if (settings) {
      const { id: _, ...rest } = settings;
      return rest as UserSettings;
    }
    return null;
  } catch (error) {
    console.error('[Persistence] Failed to load settings from IndexedDB:', error);
    return null;
  }
}

/**
 * Save user settings
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  if (isDesktopMode()) {
    const store = await getDesktopStore();
    store.settings = settings;
    await persistDesktopStore();
    return;
  }

  try {
    await db.settings.put({ ...settings, id: 'user-settings' });
  } catch (error) {
    console.error('[Persistence] Failed to save settings in IndexedDB:', error);
  }
}

/**
 * Clear all data (factory reset)
 */
export async function clearAllData(): Promise<void> {
  if (isDesktopMode()) {
    desktopMemoryCache = {
      version: 1,
      tasks: [],
      settings: null,
    };
    await persistDesktopStore();
    return;
  }

  try {
    await db.tasks.clear();
    await db.settings.clear();
  } catch (error) {
    console.error('[Persistence] Failed to clear data:', error);
  }
}
