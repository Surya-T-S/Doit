import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  format,
  isToday as isTodayFn,
  isSameDay,
  addDays,
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
  formatDate,
  formatTime,
  formatDuration,
  parseNaturalDateTime,
} from '../../utils/dates';
import type { Task } from '../../types';

const QUICK_TIME_PRESETS = [
  { label12: '9:00 AM', time: '09:00', emoji: '☀️', desc: 'Morning' },
  { label12: '1:00 PM', time: '13:00', emoji: '🌤️', desc: 'Afternoon' },
  { label12: '3:00 PM', time: '15:00', emoji: '☕', desc: 'Late Afternoon' },
  { label12: '6:00 PM', time: '18:00', emoji: '🌙', desc: 'Evening' },
  { label12: '9:00 PM', time: '21:00', emoji: '🌌', desc: 'Night' },
];

export function CalendarView() {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState<string | null>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const { openDetailPanel, addToast, calendarDate, calendarViewMode } = useUIStore();
  const { weekStartsOn, timeFormat } = useSettingsStore();

  const use24h = timeFormat === '24h';
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  // Listen for external trigger to open calendar task creation modal (shortcut 'N' or header button)
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

  // Live natural language parser for minimal date & time input
  const naturalDetected = useMemo(() => {
    if (!quickTaskTitle.trim()) return null;
    const parsed = parseNaturalDateTime(quickTaskTitle, selectedDay || new Date());
    if (parsed.dueDate || parsed.dueTime) {
      return parsed;
    }
    return null;
  }, [quickTaskTitle, selectedDay]);

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !quickTaskTitle.trim()) return;

    const natural = parseNaturalDateTime(quickTaskTitle, selectedDay);
    const finalTitle = (natural.detectedText ? natural.cleanTitle : quickTaskTitle).trim() || quickTaskTitle.trim();
    const finalTime = quickTaskTime || natural.dueTime || null;
    const finalDate = natural.dueDate ? parseISO(natural.dueDate) : selectedDay;

    handleCreateTaskForDay(finalDate, finalTitle, finalTime);
    setQuickTaskTitle('');
    setQuickTaskTime(null);
  };

  // Tasks for currently opened day modal
  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const str = toDateStr(selectedDay);
    return tasksByDate[str] || [];
  }, [selectedDay, tasksByDate]);

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
              {/* Natural Language Live Detection Pill */}
              {naturalDetected && (
                <div className="calendar-modal-detected-badge" role="status" aria-live="polite">
                  <div className="detected-badge-left">
                    <Sparkles size={13} className="detected-badge-icon" />
                    <span className="detected-badge-label">Detected:</span>
                    {naturalDetected.dueDate && (
                      <span className="detected-badge-tag">
                        📅 {formatDate(naturalDetected.dueDate)}
                      </span>
                    )}
                    {naturalDetected.dueTime && (
                      <span className="detected-badge-tag">
                        ⏰ {formatTime(naturalDetected.dueTime, use24h)}
                      </span>
                    )}
                  </div>
                  {naturalDetected.cleanTitle !== quickTaskTitle.trim() && (
                    <span className="detected-badge-taskname" title={`Clean title: "${naturalDetected.cleanTitle}"`}>
                      "{naturalDetected.cleanTitle}"
                    </span>
                  )}
                </div>
              )}

              <form
                className="calendar-modal-input-form"
                onSubmit={handleModalSubmit}
              >
                <input
                  type="text"
                  className="calendar-modal-input"
                  placeholder={`Add a task (e.g., "Meeting tomorrow 3pm")...`}
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSelectedDay(null);
                      setQuickTaskTitle('');
                      setQuickTaskTime(null);
                    }
                  }}
                  autoFocus
                />
                <div
                  className={`calendar-modal-time-chip${(quickTaskTime || naturalDetected?.dueTime) ? ' active' : ''}`}
                  title="Completion time"
                >
                  <Clock size={13} className="time-chip-icon" />
                  <input
                    type="time"
                    className="calendar-modal-time-input"
                    value={quickTaskTime || naturalDetected?.dueTime || ''}
                    onChange={(e) => setQuickTaskTime(e.target.value || null)}
                    aria-label="Completion time"
                  />
                  {(quickTaskTime || naturalDetected?.dueTime) && (
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

              {/* Minimal 1-Click Quick Time & Date Presets */}
              <div className="calendar-modal-presets-bar">
                {/* 1-Click Time Presets */}
                <div className="calendar-preset-section">
                  <span className="calendar-preset-label">Quick Time:</span>
                  <div className="calendar-preset-chips-scroll">
                    {QUICK_TIME_PRESETS.map((preset) => {
                      const isSelected =
                        quickTaskTime === preset.time ||
                        (!quickTaskTime && naturalDetected?.dueTime === preset.time);
                      return (
                        <button
                          key={preset.time}
                          type="button"
                          className={`calendar-preset-chip${isSelected ? ' active' : ''}`}
                          onClick={() => {
                            if (quickTaskTime === preset.time) {
                              setQuickTaskTime(null);
                            } else {
                              setQuickTaskTime(preset.time);
                            }
                          }}
                          title={`${preset.desc} (${preset.label12})`}
                        >
                          <span className="preset-chip-emoji">{preset.emoji}</span>
                          <span>{use24h ? preset.time : preset.label12}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1-Click Date Shift Chips */}
                <div className="calendar-preset-section">
                  <span className="calendar-preset-label">Day:</span>
                  <div className="calendar-preset-chips-scroll">
                    <button
                      type="button"
                      className={`calendar-preset-chip${isTodayFn(selectedDay) ? ' active' : ''}`}
                      onClick={() => setSelectedDay(new Date())}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`calendar-preset-chip${isSameDay(selectedDay, addDays(new Date(), 1)) ? ' active' : ''}`}
                      onClick={() => setSelectedDay(addDays(new Date(), 1))}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      className={`calendar-preset-chip${isSameDay(selectedDay, addDays(new Date(), 2)) ? ' active' : ''}`}
                      onClick={() => setSelectedDay(addDays(new Date(), 2))}
                    >
                      +2 Days
                    </button>
                    <button
                      type="button"
                      className={`calendar-preset-chip${isSameDay(selectedDay, addWeeks(new Date(), 1)) ? ' active' : ''}`}
                      onClick={() => setSelectedDay(addWeeks(new Date(), 1))}
                    >
                      Next Week
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
