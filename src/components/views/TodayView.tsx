import React, { useMemo } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getTodayTasks } from '../../services/filter';
import { TaskRow } from '../tasks/TaskRow';
import { QuickEntry } from '../tasks/QuickEntry';
import { EmptyState } from '../tasks/EmptyState';
import { formatDuration } from '../../utils/dates';

export function TodayView() {
  const tasks = useTaskStore((s) => s.tasks);
  const dailyCapacity = useSettingsStore((s) => s.dailyCapacityMinutes);

  const todayStr = new Date().toISOString().split('T')[0];

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

  const capacityPct = dailyCapacity > 0 ? Math.min((totalEstimated / dailyCapacity) * 100, 100) : 0;
  const isOverloaded = totalEstimated > dailyCapacity;

  return (
    <div className="content-area">
      {/* Sleek compact toolbar: task count, overdue, done, and inline capacity */}
      <div className="today-metrics-bar">
        <div className="today-metrics-pills">
          <span className="today-metric-pill">
            <strong>{allTodayTasks.length}</strong> {allTodayTasks.length === 1 ? 'task' : 'tasks'}
          </span>
          {overdue.length > 0 && (
            <span className="today-metric-pill overdue">
              <strong>{overdue.length}</strong> overdue
            </span>
          )}
          {completedToday.length > 0 && (
            <span className="today-metric-pill completed">
              <strong>{completedToday.length}</strong> done
            </span>
          )}
        </div>

        {totalEstimated > 0 && (
          <div
            className={`today-capacity-compact${isOverloaded ? ' overloaded' : ''}`}
            title={`${formatDuration(totalEstimated)} planned of ${formatDuration(dailyCapacity)} available`}
          >
            <span className="capacity-text">
              {formatDuration(totalEstimated)}
              <span className="capacity-max"> / {formatDuration(dailyCapacity)}</span>
            </span>
            <div className="capacity-mini-bar">
              <div
                className={`capacity-mini-fill${isOverloaded ? ' danger' : ''}`}
                style={{ width: `${Math.min(capacityPct, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Entry */}
      <QuickEntry defaultDueDate={todayStr} placeholder="Add a task for today..." />

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="today-section">
          <div className="today-section-title">
            <span>Overdue</span>
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
        <div className="today-section-title">
          <span>Today</span>
          {today.length > 0 && <span className="today-count-badge">{today.length}</span>}
        </div>
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
        <div className="today-section completed-section">
          <div className="today-section-title">
            <span>Completed Today</span>
            <span className="completed-badge">{completedToday.length}</span>
          </div>
          <div className="task-list" role="list">
            {completedToday.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
