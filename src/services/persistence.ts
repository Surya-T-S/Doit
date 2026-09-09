import { db } from './db';
import type { Task, UserSettings } from '../types';

/**
 * Load all tasks from IndexedDB
 */
export async function loadTasks(): Promise<Task[]> {
  try {
    return await db.tasks.toArray();
  } catch (error) {
    console.error('[Persistence] Failed to load tasks:', error);
    return [];
  }
}

/**
 * Save a single task (upsert)
 */
export async function saveTask(task: Task): Promise<void> {
  try {
    await db.tasks.put(task);
  } catch (error) {
    console.error('[Persistence] Failed to save task:', error);
  }
}

/**
 * Save multiple tasks (bulk upsert)
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await db.tasks.bulkPut(tasks);
  } catch (error) {
    console.error('[Persistence] Failed to save tasks:', error);
  }
}

/**
 * Delete a task by ID
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    await db.tasks.delete(taskId);
  } catch (error) {
    console.error('[Persistence] Failed to delete task:', error);
  }
}

/**
 * Delete multiple tasks
 */
export async function deleteTasks(taskIds: string[]): Promise<void> {
  try {
    await db.tasks.bulkDelete(taskIds);
  } catch (error) {
    console.error('[Persistence] Failed to delete tasks:', error);
  }
}

/**
 * Load user settings
 */
export async function loadSettings(): Promise<UserSettings | null> {
  try {
    const settings = await db.settings.get('user-settings');
    if (settings) {
      // Remove the internal id field before returning
      const { id: _, ...rest } = settings;
      return rest as UserSettings;
    }
    return null;
  } catch (error) {
    console.error('[Persistence] Failed to load settings:', error);
    return null;
  }
}

/**
 * Save user settings
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    await db.settings.put({ ...settings, id: 'user-settings' });
  } catch (error) {
    console.error('[Persistence] Failed to save settings:', error);
  }
}

/**
 * Clear all data (factory reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    await db.tasks.clear();
    await db.settings.clear();
  } catch (error) {
    console.error('[Persistence] Failed to clear data:', error);
  }
}
