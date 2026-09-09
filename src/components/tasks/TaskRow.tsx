import React, { useCallback } from 'react';
import { Check, GripVertical, Trash2, Calendar, Clock, Tag } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import type { Task } from '../../types';
import { formatDate, isOverdue, isDueToday } from '../../utils/dates';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskRowProps {
  task: Task;
  isDraggable?: boolean;
}

export function TaskRow({ task, isDraggable = false }: TaskRowProps) {
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const { selectedTaskId, openDetailPanel } = useUIStore();
  const addToast = useUIStore((s) => s.addToast);

  const isCompleted = task.status === 'completed';
  const isSelected = selectedTaskId === task.id;
  const taskOverdue = !isCompleted && isOverdue(task.dueDate);
  const taskDueToday = !isCompleted && isDueToday(task.dueDate);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !isDraggable,
  });

  const style = isDraggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCompleted) {
        uncompleteTask(task.id);
        addToast({ message: 'Task restored', type: 'info', duration: 2000 });
      } else {
        completeTask(task.id);
        addToast({
          message: 'Task completed',
          type: 'success',
          duration: 3000,
          action: {
            label: 'Undo',
            onClick: () => uncompleteTask(task.id),
          },
        });
      }
    },
    [isCompleted, task.id, completeTask, uncompleteTask, addToast]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteTask(task.id);
      addToast({ message: 'Task deleted', type: 'info', duration: 2000 });
    },
    [task.id, deleteTask, addToast]
  );

  const handleClick = useCallback(() => {
    openDetailPanel(task.id);
  }, [task.id, openDetailPanel]);

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-row${isCompleted ? ' completed' : ''}${isSelected ? ' selected' : ''}${isDragging ? ' dragging' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}${isCompleted ? ' (completed)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (e.key === ' ') handleToggle(e as unknown as React.MouseEvent);
          else handleClick();
        }
      }}
    >
      {isDraggable && (
        <div
          className="task-drag-handle"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </div>
      )}

      <div className="task-checkbox" onClick={handleToggle}>
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="task-checkbox-visual">
          <Check className="check-icon" />
        </div>
      </div>

      {task.priority !== 'none' && (
        <div className={`task-priority-dot ${task.priority}`} aria-label={`Priority: ${task.priority}`} />
      )}

      <div className="task-content">
        <span className="task-title">{task.title}</span>
        <div className="task-meta">
          {task.dueDate && (
            <span className={`task-meta-item${taskOverdue ? ' overdue' : ''}${taskDueToday ? ' due-today' : ''}`}>
              <Calendar size={12} className="meta-icon" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.estimatedDuration && (
            <span className="task-meta-item">
              <Clock size={12} className="meta-icon" />
              {task.estimatedDuration}m
            </span>
          )}
          {task.tags.length > 0 && (
            <span className="task-meta-item">
              <Tag size={12} className="meta-icon" />
              {task.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="task-tag">{tag}</span>
              ))}
              {task.tags.length > 2 && (
                <span className="task-tag">+{task.tags.length - 2}</span>
              )}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className="task-subtask-progress">
              <div className="subtask-bar">
                <div
                  className="subtask-bar-fill"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button
          className="task-action-btn danger"
          onClick={handleDelete}
          aria-label="Delete task"
          title="Delete"
        >
          <Trash2 className="action-icon" />
        </button>
      </div>
    </div>
  );
}
