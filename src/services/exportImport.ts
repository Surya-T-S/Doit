import type { Task, UserSettings, DoitExport } from '../types';
import { DATA_VERSION, APP_VERSION } from '../utils/constants';

/**
 * Export all data to a downloadable JSON file
 */
export function exportData(tasks: Task[], settings: UserSettings): void {
  const data: DoitExport = {
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    tasks,
    settings,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `doit-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON file
 */
export async function importData(
  file: File
): Promise<{ tasks: Task[]; settings: UserSettings } | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as DoitExport;

    // Validate structure
    if (!data.version || !Array.isArray(data.tasks)) {
      throw new Error('Invalid Doit backup file format');
    }

    // Version migration placeholder
    if (data.version > DATA_VERSION) {
      throw new Error(
        `This backup was created with a newer version of Doit (v${data.version}). ` +
          `Please update Doit to import this file.`
      );
    }

    // Validate tasks have required fields
    const validTasks = data.tasks.filter(
      (t) => t.id && t.title && t.status
    );

    return {
      tasks: validTasks,
      settings: data.settings,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('[Import] Invalid JSON file');
    } else {
      console.error('[Import] Error:', error);
    }
    return null;
  }
}

/**
 * Export data as CSV (tasks only)
 */
export function exportCSV(tasks: Task[]): void {
  const headers = [
    'Title',
    'Status',
    'Priority',
    'Due Date',
    'Due Time',
    'Tags',
    'Category',
    'Description',
    'Created',
    'Completed',
    'Estimated Duration (min)',
  ];

  const rows = tasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.dueDate || '',
    t.dueTime || '',
    t.tags.join('; '),
    t.category,
    `"${t.description.replace(/"/g, '""')}"`,
    t.createdAt,
    t.completedAt || '',
    t.estimatedDuration?.toString() || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `doit-tasks-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
