import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday as isTodayFn,
  isSameDay,
  parseISO,
} from 'date-fns';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  getCalendarDays,
  getWeekDays,
  toDateStr,
  formatTime,
  formatDuration,
} from '../../utils/dates';
import type { Task } from '../../types';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState<string | null>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const { openDetailPanel, addToast } = useUIStore();
  const { weekStartsOn, timeFormat } = useSettingsStore();

  const use24h = timeFormat === '24h';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Listen for external trigger to open calendar task creation modal (shortcut 'N' or Command Palette)
  useEffect(() => {
    const handleOpenCreator = (e: Event) => {
      const customEvent = e as CustomEvent<{ date?: Date }>;
      setSelectedDay(customEvent.detail?.date || new Date());
    };
    window.addEventListener('open-calendar-new-task', handleOpenCreator);
    return () => window.removeEventListener('open-calendar-new-task', handleOpenCreator);
  }, []);

  // Calendar month days
  const calendarDays = useMemo(
    () => getCalendarDays(year, month, weekStartsOn),
    [year, month, weekStartsOn]
  );

  // Week days
  const weekDays = useMemo(
    () => getWeekDays(currentDate, weekStartsOn),
    [currentDate, weekStartsOn]
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

  // Navigation handlers
  const goToPrev = () => {
    if (viewMode === 'month') {
      setCurrentDate((d) => subMonths(d, 1));
    } else {
      setCurrentDate((d) => subWeeks(d, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate((d) => addMonths(d, 1));
    } else {
      setCurrentDate((d) => addWeeks(d, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

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

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !quickTaskTitle.trim()) return;
    handleCreateTaskForDay(selectedDay, quickTaskTitle, quickTaskTime);
    setQuickTaskTitle('');
    setQuickTaskTime(null);
  };

  // Title display
  const titleText = useMemo(() => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    const startStr = format(weekDays[0], 'MMM d');
    const endStr = isSameDay(weekDays[0], weekDays[6])
      ? ''
      : format(weekDays[6], 'MMM d, yyyy');
    return `${startStr} – ${endStr}`;
  }, [viewMode, currentDate, weekDays]);

  // Tasks for currently opened day modal
  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const str = toDateStr(selectedDay);
    return tasksByDate[str] || [];
  }, [selectedDay, tasksByDate]);

  return (
    <div className="content-area calendar-container">
      {/* Google Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-header-left">
          <button className="calendar-today-btn" onClick={goToToday}>
            Today
          </button>
          <div className="calendar-nav-group">
            <button
              className="calendar-nav-btn"
              onClick={goToPrev}
              aria-label={viewMode === 'month' ? 'Previous month' : 'Previous week'}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="calendar-nav-btn"
              onClick={goToNext}
              aria-label={viewMode === 'month' ? 'Next month' : 'Next week'}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="calendar-month-title">{titleText}</h2>
        </div>

        <div className="calendar-header-right">
          <div className="calendar-view-toggle">
            <button
              className={`calendar-toggle-btn${viewMode === 'month' ? ' active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`calendar-toggle-btn${viewMode === 'week' ? ' active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>

          <button
            className="calendar-primary-add-btn"
            onClick={() => setSelectedDay(new Date())}
            title="Schedule a new task (N)"
            aria-label="Schedule a new task"
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* View Mode: Month */}
      {viewMode === 'month' && (
        <div className="calendar-grid" role="grid" aria-label="Calendar">
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
                onClick={() => setSelectedDay(day)}
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
                      setSelectedDay(day);
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
                        setSelectedDay(day);
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
      {viewMode === 'week' && (
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
                    onClick={() => setSelectedDay(day)}
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

      {/* Google Calendar Day Dialog / Popover */}
      {selectedDay && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setSelectedDay(null)}
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
                  {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="calendar-modal-subtitle">
                  {selectedDayTasks.length}{' '}
                  {selectedDayTasks.length === 1 ? 'task' : 'tasks'} scheduled
                </p>
              </div>
              <button
                className="calendar-modal-close"
                onClick={() => setSelectedDay(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="calendar-modal-body">
              {selectedDayTasks.length === 0 ? (
                <div
                  style={{
                    padding: 'var(--space-6) 0',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  No tasks scheduled for this day.
                </div>
              ) : (
                selectedDayTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`task-row${isCompleted ? ' completed' : ''}`}
                      style={{ padding: 'var(--space-2) var(--space-3)' }}
                      onClick={() => {
                        setSelectedDay(null);
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
                        {(task.dueTime || task.estimatedDuration) && (
                          <div className="task-meta">
                            {task.dueTime && (
                              <span className="task-meta-item">
                                <Clock size={11} className="meta-icon" />
                                {formatTime(task.dueTime, use24h)}
                              </span>
                            )}
                            {task.estimatedDuration && (
                              <span className="task-meta-item">
                                {formatDuration(task.estimatedDuration)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="calendar-modal-footer">
              <form
                className="calendar-modal-input-form"
                onSubmit={handleModalSubmit}
              >
                <input
                  type="text"
                  className="calendar-modal-input"
                  placeholder={`Add a task for ${format(selectedDay, 'MMM d')}...`}
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  autoFocus
                />
                <div className="calendar-modal-time-chip" title="Set optional due time">
                  <Clock size={13} className="time-chip-icon" />
                  <input
                    type="time"
                    className="calendar-modal-time-input"
                    value={quickTaskTime || ''}
                    onChange={(e) => setQuickTaskTime(e.target.value || null)}
                    aria-label="Due time"
                  />
                  {quickTaskTime && (
                    <button
                      type="button"
                      className="time-chip-clear"
                      onClick={() => setQuickTaskTime(null)}
                      title="Clear time"
                      aria-label="Clear time"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!quickTaskTitle.trim()}
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
