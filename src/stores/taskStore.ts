import { create } from 'zustand';
import type { Task, Subtask, TaskPriority, SortMode, SortDirection, FilterPreset } from '../types';
import { generateId } from '../utils/id';
import { nowISO } from '../utils/dates';
import { loadTasks, saveTask, saveTasks, deleteTask as deleteTaskFromDB } from '../services/persistence';
import { sortTasks } from '../services/sort';
import { filterTasks } from '../services/filter';
import { searchTasks } from '../services/search';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  addTask: (title: string, overrides?: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;

  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Derived data
  getPendingTasks: (sortMode: SortMode, sortDirection: SortDirection, filter: FilterPreset, search: string) => Task[];
  getCompletedTasks: (search: string) => Task[];
  getTaskById: (id: string) => Task | undefined;
  getTasksForDate: (dateStr: string) => Task[];
  getTotalEstimatedMinutes: () => number;
  getCompletedEstimatedMinutes: () => number;
}

function createDefaultTask(title: string, order: number): Task {
  const now = nowISO();
  return {
    id: generateId(),
    title,
    description: '',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    dueDate: null,
    dueTime: null,
    priority: 'none',
    tags: [],
    category: '',
    notes: '',
    subtasks: [],
    reminders: [],
    recurrence: null,
    estimatedDuration: null,
    actualDuration: null,
    customOrder: order,
    links: [],
    calendarEventId: null,
    parentId: null,
    dependsOn: [],
    relatedTo: [],
    metadata: {},
  };
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: true,

  initialize: async () => {
    const tasks = await loadTasks();
    set({ tasks, isLoading: false });
  },

  addTask: (title: string, overrides?: Partial<Task>) => {
    const { tasks } = get();
    const maxOrder = tasks.length > 0
      ? Math.max(...tasks.map((t) => t.customOrder))
      : 0;
    const newTask: Task = {
      ...createDefaultTask(title.trim(), maxOrder + 1),
      ...overrides,
    };

    set((state) => ({ tasks: [...state.tasks, newTask] }));
    saveTask(newTask);
    return newTask;
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, ...updates, updatedAt: nowISO() }
          : t
      ),
    }));

    const task = get().tasks.find((t) => t.id === id);
    if (task) saveTask(task);
  },

  deleteTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
    deleteTaskFromDB(id);
  },

  completeTask: (id: string) => {
    const now = nowISO();
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'completed' as const, completedAt: now, updatedAt: now }
          : t
      ),
    }));
    const task = get().tasks.find((t) => t.id === id);
    if (task) saveTask(task);
  },

  uncompleteTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'pending' as const, completedAt: null, updatedAt: nowISO() }
          : t
      ),
    }));
    const task = get().tasks.find((t) => t.id === id);
    if (task) saveTask(task);
  },

  reorderTasks: (activeId: string, overId: string) => {
    const { tasks } = get();
    const pendingTasks = tasks
      .filter((t) => t.status === 'pending')
      .sort((a, b) => a.customOrder - b.customOrder);

    const activeIndex = pendingTasks.findIndex((t) => t.id === activeId);
    const overIndex = pendingTasks.findIndex((t) => t.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    // Remove the active item and insert at the new position
    const reordered = [...pendingTasks];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    // Assign new customOrder values
    const updatedTasks = reordered.map((t, i) => ({
      ...t,
      customOrder: i + 1,
      updatedAt: nowISO(),
    }));

    // Merge updated pending tasks back with completed tasks
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const newTasks = [...updatedTasks, ...completedTasks];

    set({ tasks: newTasks });
    saveTasks(updatedTasks);
  },

  // --- Subtask actions ---

  addSubtask: (taskId: string, title: string) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const maxOrder = task.subtasks.length > 0
      ? Math.max(...task.subtasks.map((s) => s.order))
      : 0;

    const newSubtask: Subtask = {
      id: generateId(),
      title: title.trim(),
      completed: false,
      order: maxOrder + 1,
    };

    const updatedTask = {
      ...task,
      subtasks: [...task.subtasks, newSubtask],
      updatedAt: nowISO(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));
    saveTask(updatedTask);
  },

  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      subtasks: task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, ...updates } : s
      ),
      updatedAt: nowISO(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));
    saveTask(updatedTask);
  },

  deleteSubtask: (taskId: string, subtaskId: string) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
      updatedAt: nowISO(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));
    saveTask(updatedTask);
  },

  toggleSubtask: (taskId: string, subtaskId: string) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    get().updateSubtask(taskId, subtaskId, { completed: !subtask.completed });
  },

  // --- Derived data ---

  getPendingTasks: (sortMode, sortDirection, filter, search) => {
    let tasks = get().tasks.filter((t) => t.status === 'pending');
    if (filter !== 'all') tasks = filterTasks(tasks, filter);
    if (search) tasks = searchTasks(tasks, search);
    return sortTasks(tasks, sortMode, sortDirection);
  },

  getCompletedTasks: (search) => {
    let tasks = get().tasks.filter((t) => t.status === 'completed');
    if (search) tasks = searchTasks(tasks, search);
    // Sort completed by completedAt (most recent first)
    return tasks.sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime()
    );
  },

  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id);
  },

  getTasksForDate: (dateStr) => {
    return get().tasks.filter((t) => t.dueDate === dateStr);
  },

  getTotalEstimatedMinutes: () => {
    return get()
      .tasks.filter((t) => t.status === 'pending' && t.estimatedDuration)
      .reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
  },

  getCompletedEstimatedMinutes: () => {
    const today = new Date().toISOString().split('T')[0];
    return get()
      .tasks.filter(
        (t) =>
          t.status === 'completed' &&
          t.completedAt &&
          t.completedAt.startsWith(today) &&
          t.estimatedDuration
      )
      .reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
  },
}));
