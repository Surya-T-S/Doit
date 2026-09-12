import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  Check,
  Clock,
} from 'lucide-react';
import {
  format,
  isToday as isTodayFn,
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
  formatDate,
  formatTime,
  formatDuration,
  parseNaturalDateTime,
} from '../../utils/dates';
import type { Task } from '../../types';
import { IOSDatePicker } from '../common/IOSDatePicker';

export function CalendarView() {
  // New Task Dialog State (Task Name, Date, Time like iPhone)
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
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

  // Track whether modal was opened for a specific clicked calendar day
  const [isSpecificDateSelected, setIsSpecificDateSelected] = useState(false);

  const openNewTaskModal = useCallback((date?: Date) => {
    if (date) {
      setTaskDueDate(toDateStr(date));
      setIsSpecificDateSelected(true);
    } else {
      setTaskDueDate(getTodayStr());
      setIsSpecificDateSelected(false);
    }
    setTaskTitle('');
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

  const handleCreateNewTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle) return;

    const parsed = parseNaturalDateTime(trimmedTitle, parseISO(taskDueDate));
    const finalTitle = (parsed.detectedText ? parsed.cleanTitle : trimmedTitle) || trimmedTitle;
    const finalDate = taskDueDate || parsed.dueDate || getTodayStr();
    const finalTime = taskDueTime || parsed.dueTime || null;

    addTask(finalTitle, {
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
                              onChange={() => { }}
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

      {/* High-Quality iPhone Style New Task Modal */}
      {isNewTaskOpen && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setIsNewTaskOpen(false)}
        >
          <div
            className="ios-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ios-modal-header">
              <button
                type="button"
                className="ios-header-cancel-btn"
                onClick={() => setIsNewTaskOpen(false)}
              >
                Cancel
              </button>
              <h3 className="ios-header-title">New Task</h3>
              <button
                type="button"
                className="ios-header-add-btn"
                disabled={!taskTitle.trim()}
                onClick={() => handleCreateNewTask()}
              >
                Add
              </button>
            </div>

            <form onSubmit={handleCreateNewTask} className="ios-modal-body">
              {/* Task Title Input */}
              <div className="ios-title-card">
                <input
                  type="text"
                  className="ios-title-input"
                  placeholder="Task Name"
                  value={taskTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsNewTaskOpen(false);
                    if (e.key === 'Enter') handleCreateNewTask(e);
                  }}
                  autoFocus
                  required
                />
              </div>

              {/* iPhone Date and Time Selector */}
              <IOSDatePicker
                selectedDate={taskDueDate}
                onDateChange={setTaskDueDate}
                selectedTime={taskDueTime}
                onTimeChange={setTaskDueTime}
                use24h={use24h}
                showQuickPresets={!isSpecificDateSelected}
              />
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
                        onChange={() => { }}
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
