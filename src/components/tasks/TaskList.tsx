import React, { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ChevronDown } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { TaskRow } from './TaskRow';
import { EmptyState } from './EmptyState';

export function TaskList() {
  const {
    sortMode,
    sortDirection,
    activeFilter,
    searchQuery,
    showCompleted,
    toggleShowCompleted,
  } = useUIStore();

  const getPendingTasks = useTaskStore((s) => s.getPendingTasks);
  const getCompletedTasks = useTaskStore((s) => s.getCompletedTasks);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const pendingTasks = useMemo(
    () => getPendingTasks(sortMode, sortDirection, activeFilter, searchQuery),
    [getPendingTasks, sortMode, sortDirection, activeFilter, searchQuery]
  );

  const completedTasks = useMemo(
    () => getCompletedTasks(searchQuery),
    [getCompletedTasks, searchQuery]
  );

  const isDraggable = sortMode === 'custom' && activeFilter === 'all' && !searchQuery;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        reorderTasks(active.id as string, over.id as string);
      }
    },
    [reorderTasks]
  );

  const pendingIds = useMemo(
    () => pendingTasks.map((t) => t.id),
    [pendingTasks]
  );

  return (
    <div>
      {/* Pending Tasks */}
      <div className="task-section">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <EmptyState type="pending" />
        ) : pendingTasks.length === 0 ? (
          <EmptyState type="filtered" />
        ) : isDraggable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={pendingIds} strategy={verticalListSortingStrategy}>
              <div className="task-list" role="list" aria-label="Pending tasks">
                {pendingTasks.map((task) => (
                  <TaskRow key={task.id} task={task} isDraggable />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="task-list" role="list" aria-label="Pending tasks">
            {pendingTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="task-section">
          <div
            className="task-section-header"
            onClick={toggleShowCompleted}
            role="button"
            tabIndex={0}
            aria-expanded={showCompleted}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleShowCompleted();
              }
            }}
          >
            <ChevronDown
              size={16}
              className={`task-section-toggle${!showCompleted ? ' collapsed' : ''}`}
            />
            <span className="task-section-title">Completed</span>
            <span className="task-section-count">{completedTasks.length}</span>
          </div>

          {showCompleted && (
            <div className="task-list" role="list" aria-label="Completed tasks">
              {completedTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
