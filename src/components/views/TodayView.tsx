import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useTaskStore } from '../../stores/taskStore';
import { getTodayTasks } from '../../services/filter';
import { TaskRow } from '../tasks/TaskRow';
import { QuickEntry } from '../tasks/QuickEntry';
import { DayCapacityBar } from '../layout/DayCapacityBar';
import { EmptyState } from '../tasks/EmptyState';
import { formatDuration, isOverdue, isDueToday } from '../../utils/dates';

export function TodayView() {
  const tasks = useTaskStore((s) => s.tasks);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayName = format(new Date(), 'EEEE');
  const dateStr = format(new Date(), 'MMMM d, yyyy');

  const { today, overdue } = useMemo(() => getTodayTasks(tasks), [tasks]);

  const completedToday = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === 'completed' &&
          t.completedAt &&
          t.completedAt.startsWith(todayStr)
      ),
    [tasks, todayStr]
  );

  const allTodayTasks = [...overdue, ...today];
  const totalEstimated = allTodayTasks.reduce(
    (sum, t) => sum + (t.estimatedDuration || 0),
    0
  );

  return (
    <div className="content-area">
      {/* Greeting */}
      <div className="today-greeting">
        <p className="today-date">{dateStr}</p>
        <h2 className="today-title">{dayName}</h2>
      </div>

      {/* Summary Stats */}
      <div className="today-summary">
        <div className="today-stat">
          <span className="today-stat-value">{allTodayTasks.length}</span>
          <span className="today-stat-label">tasks</span>
        </div>
        {overdue.length > 0 && (
          <div className="today-stat">
            <span className="today-stat-value" style={{ color: 'var(--danger)' }}>
              {overdue.length}
            </span>
            <span className="today-stat-label">overdue</span>
          </div>
        )}
        <div className="today-stat">
          <span className="today-stat-value">{completedToday.length}</span>
          <span className="today-stat-label">done</span>
        </div>
        {totalEstimated > 0 && (
          <div className="today-stat">
            <span className="today-stat-value">{formatDuration(totalEstimated)}</span>
            <span className="today-stat-label">planned</span>
          </div>
        )}
      </div>

      {/* Quick Entry */}
      <QuickEntry />

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="today-section">
          <div className="today-section-title">
            Overdue
            <span className="overdue-badge">{overdue.length}</span>
          </div>
          <div className="task-list" role="list">
            {overdue.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="today-section">
        <div className="today-section-title">Today</div>
        {today.length === 0 && overdue.length === 0 ? (
          <EmptyState type="today" />
        ) : today.length === 0 ? null : (
          <div className="task-list" role="list">
            {today.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Today */}
      {completedToday.length > 0 && (
        <div className="today-section">
          <div className="today-section-title">
            Completed Today
            <span style={{ color: 'var(--success)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>
              {completedToday.length}
            </span>
          </div>
          <div className="task-list" role="list">
            {completedToday.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Day Capacity */}
      <DayCapacityBar />
    </div>
  );
}
