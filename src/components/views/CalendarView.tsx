import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  Check,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  format,
  isToday as isTodayFn,
  isSameDay,
  addWeeks,
  parseISO,
} from 'date-fns';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  getCalendarDays,
  getWeekDays,
  toDateStr,
  getTodayStr,
  getTomorrowStr,
  formatDate,
  formatTime,
  formatDuration,
  parseNaturalDateTime,
} from '../../utils/dates';
import type { Task } from '../../types';

const TIME_SELECTION_OPTIONS = [
  { label12: '9:00 AM', time: '09:00' },
  { label12: '12:00 PM', time: '12:00' },
  { label12: '3:00 PM', time: '15:00' },
  { label12: '6:00 PM', time: '18:00' },
  { label12: '9:00 PM', time: '21:00' },
];

export function CalendarView() {
  // New Task Dialog State (Task Name, Description, Date, Time - all selection based)
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<string>(getTodayStr());
  const [taskDueTime, setTaskDueTime] = useState<string | null>(null);

  // Optional: Day schedule popover when clicking "+X more"
  const [viewingDayTasks, setViewingDayTasks] = useState<Date | null>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const { openDetailPanel, addToast, calendarDate, calendarViewMode } = useUIStore();
  const { weekStartsOn, timeFormat } = useSettingsStore();

  const use24h = timeFormat === '24h';
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const openNewTaskModal = useCallback((date?: Date) => {
    const targetDate = date || new Date();
    setTaskDueDate(toDateStr(targetDate));
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueTime(null);
    setIsNewTaskOpen(true);
    setViewingDayTasks(null);
  }, []);

  // Listen for external trigger to open calendar task creation modal (shortcut 'N' or header button)
  useEffect(() => {
    const handleOpenCreator = (e: Event) => {
      const customEvent = e as CustomEvent<{ date?: Date }>;
      openNewTaskModal(customEvent.detail?.date);
    };
    window.addEventListener('open-calendar-new-task', handleOpenCreator);
    return () => window.removeEventListener('open-calendar-new-task', handleOpenCreator);
  }, [openNewTaskModal]);

  // Calendar month days
  const calendarDays = useMemo(
    () => getCalendarDays(year, month, weekStartsOn),
    [year, month, weekStartsOn]
  );

  const weeksCount = useMemo(
    () => Math.max(Math.ceil(calendarDays.length / 7), 5),
    [calendarDays]
  );

  // Week days
  const weekDays = useMemo(
    () => getWeekDays(calendarDate, weekStartsOn),
    [calendarDate, weekStartsOn]
  );

  // Map tasks by dueDate
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        if (!map[task.dueDate]) map[task.dueDate] = [];
        map[task.dueDate].push(task);
      }
    });
    return map;
  }, [tasks]);

  // Headers (Mon, Tue, etc.)
  const dayHeaders = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (weekStartsOn === 0) {
      days.unshift(days.pop()!);
    }
    return days;
  }, [weekStartsOn]);

  // Task creation for a specific day
  const handleCreateTaskForDay = useCallback(
    (date: Date, title: string, time?: string | null) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const dateStr = toDateStr(date);
      addTask(trimmed, {
        dueDate: dateStr,
        dueTime: time || null,
      });
      const timeStr = time ? ` at ${formatTime(time, use24h)}` : '';
      addToast({
        message: `Task scheduled for ${format(date, 'MMM d')}${timeStr}`,
        type: 'success',
        duration: 2500,
      });
    },
    [addTask, addToast, use24h]
  );

  // Auto-detect date & time silently in background as user types title
  const handleTitleChange = (val: string) => {
    setTaskTitle(val);
    if (val.trim()) {
      const parsed = parseNaturalDateTime(val, parseISO(taskDueDate));
      if (parsed.dueDate) {
        setTaskDueDate(parsed.dueDate);
      }
      if (parsed.dueTime) {
        setTaskDueTime(parsed.dueTime);
      }
    }
  };

  const handleCreateNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle) return;

    const parsed = parseNaturalDateTime(trimmedTitle, parseISO(taskDueDate));
    const finalTitle = (parsed.detectedText ? parsed.cleanTitle : trimmedTitle) || trimmedTitle;
    const finalDate = taskDueDate || parsed.dueDate || getTodayStr();
    const finalTime = taskDueTime || parsed.dueTime || null;

    addTask(finalTitle, {
      description: taskDescription.trim(),
      dueDate: finalDate,
      dueTime: finalTime,
    });

    const timeStr = finalTime ? ` at ${formatTime(finalTime, use24h)}` : '';
    addToast({
      message: `Task scheduled for ${formatDate(finalDate)}${timeStr}`,
      type: 'success',
      duration: 2500,
    });

    setIsNewTaskOpen(false);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueTime(null);
  };

  return (
    <div className="calendar-container">
      {/* View Mode: Month */}
      {calendarViewMode === 'month' && (
        <div
          className="calendar-grid"
          role="grid"
          aria-label="Calendar"
          style={{ gridTemplateRows: `26px repeat(${weeksCount}, 1fr)` }}
        >
          {dayHeaders.map((day) => (
            <div key={day} className="calendar-day-header" role="columnheader">
              {day}
            </div>
          ))}

          {calendarDays.map((day, i) => {
            const dateStr = toDateStr(day);
            const dayTasks = tasksByDate[dateStr] || [];
            const isCurrentMonth = day.getMonth() === month;
            const isToday = isTodayFn(day);
            const isFirstDay = day.getDate() === 1;
            const maxVisible = 3;

            return (
              <div
                key={i}
                className={`calendar-day${!isCurrentMonth ? ' outside-month' : ''}`}
                role="gridcell"
                aria-label={format(day, 'MMMM d, yyyy')}
                onClick={() => openNewTaskModal(day)}
              >
                <div className="calendar-day-header-row">
                  {isToday ? (
                    <span className="calendar-today-badge">{day.getDate()}</span>
                  ) : (
                    <span
                      className={`calendar-day-num${isFirstDay ? ' month-start' : ''}`}
                    >
                      {isFirstDay ? format(day, 'MMM 1') : day.getDate()}
                    </span>
                  )}

                  <button
                    className="calendar-quick-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openNewTaskModal(day);
                    }}
                    title={`Add task for ${format(day, 'MMM d')}`}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="calendar-day-tasks">
                  {dayTasks.slice(0, maxVisible).map((task) => {
                    const isCompleted = task.status === 'completed';
                    const priorityClass =
                      task.priority === 'urgent'
                        ? 'urgent'
                        : task.priority === 'high'
                        ? 'high'
                        : isCompleted
                        ? 'completed'
                        : 'normal';

                    return (
                      <div
                        key={task.id}
                        className={`calendar-event-chip ${priorityClass}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailPanel(task.id);
                        }}
                        title={task.title}
                      >
                        {task.dueTime && (
                          <span className="calendar-event-time">
                            {formatTime(task.dueTime, use24h)}
                          </span>
                        )}
                        <span className="calendar-event-title">
                          {task.title}
                        </span>
                      </div>
                    );
                  })}

                  {dayTasks.length > maxVisible && (
                    <button
                      className="calendar-more-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDayTasks(day);
                      }}
                    >
                      +{dayTasks.length - maxVisible} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode: Week */}
      {calendarViewMode === 'week' && (
        <div className="calendar-week-grid" role="grid" aria-label="Week View">
          {weekDays.map((day, idx) => {
            const dateStr = toDateStr(day);
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = isTodayFn(day);

            return (
              <div
                key={idx}
                className={`calendar-week-col${isToday ? ' today' : ''}`}
                role="gridcell"
              >
                <div className="calendar-week-col-header">
                  <span className="calendar-week-col-name">
                    {format(day, 'EEE')}
                  </span>
                  {isToday ? (
                    <span className="calendar-today-badge">{day.getDate()}</span>
                  ) : (
                    <span className="calendar-day-num" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {day.getDate()}
                    </span>
                  )}
                </div>

                <div className="calendar-week-col-tasks">
                  {dayTasks.map((task) => {
                    const isCompleted = task.status === 'completed';

                    return (
                      <div
                        key={task.id}
                        className={`calendar-week-card${isCompleted ? ' completed' : ''}`}
                        onClick={() => openDetailPanel(task.id)}
                      >
                        <div className="calendar-week-card-top">
                          <div
                            className="task-checkbox"
                            style={{ width: 16, height: 16 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCompleted) uncompleteTask(task.id);
                              else completeTask(task.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => {}}
                              tabIndex={-1}
                            />
                            <div className="task-checkbox-visual" style={{ width: 16, height: 16 }}>
                              <Check size={10} className="check-icon" />
                            </div>
                          </div>
                          <span className="calendar-week-card-title">
                            {task.title}
                          </span>
                        </div>

                        {(task.dueTime || task.estimatedDuration) && (
                          <div className="calendar-week-card-meta">
                            {task.dueTime && (
                              <span>{formatTime(task.dueTime, use24h)}</span>
                            )}
                            {task.estimatedDuration && (
                              <span>{formatDuration(task.estimatedDuration)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    className="calendar-week-quick-add"
                    onClick={() => openNewTaskModal(day)}
                  >
                    <Plus size={14} />
                    <span>Add task</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Minimal New Task Modal — Only Task Name, Description, Date, Time (selection-based, matching theme, no emojis) */}
      {isNewTaskOpen && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setIsNewTaskOpen(false)}
        >
          <div
            className="new-task-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="new-task-modal-header">
              <h3 className="new-task-modal-title">New Task</h3>
              <button
                type="button"
                className="calendar-modal-close"
                onClick={() => setIsNewTaskOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTask} className="new-task-form">
              <div className="new-task-form-body">
                {/* 1. Task Name */}
                <div className="new-task-field">
                  <label className="new-task-label">Task Name</label>
                  <input
                    type="text"
                    className="new-task-input"
                    placeholder="What needs to be done?"
                    value={taskTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsNewTaskOpen(false);
                    }}
                    autoFocus
                    required
                  />
                </div>

                {/* 2. Description */}
                <div className="new-task-field">
                  <label className="new-task-label">Description</label>
                  <textarea
                    className="new-task-textarea"
                    placeholder="Add description (optional)..."
                    rows={2}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsNewTaskOpen(false);
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleCreateNewTask(e);
                      }
                    }}
                  />
                </div>

                {/* 3. Date (Selection Based, no emojis) */}
                <div className="new-task-field">
                  <label className="new-task-label">Date</label>
                  <div className="new-task-selection-row">
                    <button
                      type="button"
                      className={`new-task-chip${taskDueDate === getTodayStr() ? ' active' : ''}`}
                      onClick={() => setTaskDueDate(getTodayStr())}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`new-task-chip${taskDueDate === getTomorrowStr() ? ' active' : ''}`}
                      onClick={() => setTaskDueDate(getTomorrowStr())}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      className={`new-task-chip${taskDueDate === toDateStr(addWeeks(new Date(), 1)) ? ' active' : ''}`}
                      onClick={() => setTaskDueDate(toDateStr(addWeeks(new Date(), 1)))}
                    >
                      Next Week
                    </button>

                    <div
                      className={`new-task-picker-chip${
                        taskDueDate &&
                        taskDueDate !== getTodayStr() &&
                        taskDueDate !== getTomorrowStr() &&
                        taskDueDate !== toDateStr(addWeeks(new Date(), 1))
                          ? ' active'
                          : ''
                      }`}
                      title="Choose specific date"
                    >
                      <CalendarIcon size={12} className="picker-icon" />
                      <input
                        type="date"
                        className="new-task-picker-input"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value || getTodayStr())}
                        aria-label="Select date"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Time (Selection Based, NO emojis) */}
                <div className="new-task-field">
                  <label className="new-task-label">Time</label>
                  <div className="new-task-selection-row">
                    {TIME_SELECTION_OPTIONS.map((opt) => {
                      const isSelected = taskDueTime === opt.time;
                      return (
                        <button
                          key={opt.time}
                          type="button"
                          className={`new-task-chip${isSelected ? ' active' : ''}`}
                          onClick={() => setTaskDueTime(isSelected ? null : opt.time)}
                        >
                          {use24h ? opt.time : opt.label12}
                        </button>
                      );
                    })}

                    <div
                      className={`new-task-picker-chip${
                        taskDueTime && !TIME_SELECTION_OPTIONS.some((o) => o.time === taskDueTime)
                          ? ' active'
                          : ''
                      }`}
                      title="Custom time"
                    >
                      <Clock size={12} className="picker-icon" />
                      <input
                        type="time"
                        className="new-task-picker-input"
                        value={taskDueTime || ''}
                        onChange={(e) => setTaskDueTime(e.target.value || null)}
                        aria-label="Select custom time"
                      />
                    </div>

                    {taskDueTime && (
                      <button
                        type="button"
                        className="new-task-chip chip-clear"
                        onClick={() => setTaskDueTime(null)}
                        title="Clear time"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="new-task-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsNewTaskOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!taskTitle.trim()}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day Schedule View (Only when clicking "+X more" on a busy month day) */}
      {viewingDayTasks && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setViewingDayTasks(null)}
        >
          <div
            className="calendar-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="calendar-modal-header">
              <div>
                <h3 className="calendar-modal-title">
                  {format(viewingDayTasks, 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="calendar-modal-subtitle">
                  {(tasksByDate[toDateStr(viewingDayTasks)] || []).length} scheduled
                </p>
              </div>
              <button
                className="calendar-modal-close"
                onClick={() => setViewingDayTasks(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="calendar-modal-body">
              {(tasksByDate[toDateStr(viewingDayTasks)] || []).map((task) => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`task-row${isCompleted ? ' completed' : ''}`}
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                    onClick={() => {
                      setViewingDayTasks(null);
                      openDetailPanel(task.id);
                    }}
                  >
                    <div
                      className="task-checkbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCompleted) uncompleteTask(task.id);
                        else completeTask(task.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => {}}
                        tabIndex={-1}
                      />
                      <div className="task-checkbox-visual">
                        <Check className="check-icon" />
                      </div>
                    </div>

                    <div className="task-content">
                      <span className="task-title">{task.title}</span>
                      {task.dueTime && (
                        <div className="task-meta">
                          <span className="task-meta-item">
                            <Clock size={11} className="meta-icon" />
                            {formatTime(task.dueTime, use24h)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="calendar-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openNewTaskModal(viewingDayTasks)}
              >
                <Plus size={14} style={{ marginRight: 4 }} />
                New Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
