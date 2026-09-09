import type { Task, SortMode, SortDirection } from '../types';
import { PRIORITY_ORDER } from '../utils/constants';

/**
 * Sort tasks by the given mode and direction.
 */
export function sortTasks(
  tasks: Task[],
  mode: SortMode,
  direction: SortDirection
): Task[] {
  const sorted = [...tasks];

  switch (mode) {
    case 'custom':
      sorted.sort((a, b) => a.customOrder - b.customOrder);
      break;

    case 'alphabetical':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;

    case 'created':
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      break;

    case 'dueDate':
      sorted.sort((a, b) => {
        // Tasks without due date go to end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      break;

    case 'priority':
      sorted.sort((a, b) => {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      });
      break;
  }

  if (direction === 'desc' && mode !== 'custom') {
    sorted.reverse();
  }

  return sorted;
}
