import Dexie, { type Table } from 'dexie';
import type { Task, UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/constants';

export class DoitDatabase extends Dexie {
  tasks!: Table<Task, string>;
  settings!: Table<UserSettings & { id: string }, string>;

  constructor() {
    super('DoitDB');

    // Version 1 schema
    this.version(1).stores({
      tasks: 'id, status, dueDate, priority, createdAt, updatedAt, customOrder, *tags, category',
      settings: 'id',
    });
  }
}

export const db = new DoitDatabase();

// Initialize default settings if none exist
export async function initializeDB(): Promise<void> {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put({ ...DEFAULT_SETTINGS, id: 'user-settings' });
  }
}
