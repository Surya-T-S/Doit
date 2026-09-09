import type { Task } from '../types';

/**
 * Search tasks by query string across all text fields.
 * Returns matching tasks sorted by relevance (title matches first).
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = tasks
    .map((task) => {
      let score = 0;
      const title = task.title.toLowerCase();
      const description = task.description.toLowerCase();
      const notes = task.notes.toLowerCase();
      const tags = task.tags.map((t) => t.toLowerCase());
      const category = task.category.toLowerCase();

      for (const term of terms) {
        // Title matches (highest weight)
        if (title.includes(term)) {
          score += title.startsWith(term) ? 100 : 50;
        }
        // Tag matches (high weight)
        if (tags.some((tag) => tag.includes(term))) {
          score += 40;
        }
        // Category matches
        if (category.includes(term)) {
          score += 30;
        }
        // Description matches
        if (description.includes(term)) {
          score += 20;
        }
        // Notes matches
        if (notes.includes(term)) {
          score += 10;
        }
        // Subtask title matches
        if (task.subtasks.some((s) => s.title.toLowerCase().includes(term))) {
          score += 15;
        }
      }

      return { task, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.task);
}
