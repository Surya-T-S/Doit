import type { Task, FilterPreset } from '../types';
import { isOverdue, isDueToday, isDueThisWeek, getTomorrowStr } from '../utils/dates';

/**
 * Filter tasks by preset filter
 */
export function filterTasks(tasks: Task[], filter: FilterPreset): Task[] {
  switch (filter) {
    case 'all':
      return tasks;

    case 'today':
      return tasks.filter((t) => isDueToday(t.dueDate));

    case 'tomorrow':
      return tasks.filter((t) => t.dueDate === getTomorrowStr());

    case 'overdue':
      return tasks.filter((t) => isOverdue(t.dueDate));

    case 'thisWeek':
      return tasks.filter((t) => isDueThisWeek(t.dueDate));

    case 'highPriority':
      return tasks.filter(
        (t) => t.priority === 'high' || t.priority === 'urgent'
      );

    case 'tagged':
      return tasks.filter((t) => t.tags.length > 0);

    case 'scheduled':
      return tasks.filter((t) => t.dueDate !== null);

    case 'noDueDate':
      return tasks.filter((t) => t.dueDate === null);

    default:
      return tasks;
  }
}

/**
 * Get tasks for a specific date
 */
export function getTasksForDate(tasks: Task[], dateStr: string): Task[] {
  return tasks.filter((t) => t.dueDate === dateStr);
}

/**
 * Get overdue tasks (pending only)
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => t.status === 'pending' && isOverdue(t.dueDate)
  );
}

/**
 * Get today's tasks including overdue
 */
export function getTodayTasks(tasks: Task[]): {
  today: Task[];
  overdue: Task[];
  noDue: Task[];
} {
  const pending = tasks.filter((t) => t.status === 'pending');
  return {
    today: pending.filter((t) => isDueToday(t.dueDate)),
    overdue: pending.filter((t) => isOverdue(t.dueDate)),
    noDue: pending.filter((t) => !t.dueDate),
  };
}
