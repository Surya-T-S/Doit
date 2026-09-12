import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, X, Plus, Trash2, Calendar, Clock, Tag, Link as LinkIcon } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import type { TaskPriority } from '../../types';
import { PRIORITY_LABELS } from '../../utils/constants';
import { formatDate, getTodayStr, getTomorrowStr, toDateStr } from '../../utils/dates';
import { addWeeks } from 'date-fns';

export function TaskDetail() {
  const { selectedTaskId, closeDetailPanel, addToast } = useUIStore();
  const task = useTaskStore((s) => s.getTaskById(selectedTaskId || ''));
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const deleteSubtask = useTaskStore((s) => s.deleteSubtask);

  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newLink, setNewLink] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSubtaskInput && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [showSubtaskInput]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (task) updateTask(task.id, { title: e.target.value });
    },
    [task, updateTask]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (task) updateTask(task.id, { description: e.target.value });
    },
    [task, updateTask]
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (task) updateTask(task.id, { notes: e.target.value });
    },
    [task, updateTask]
  );

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (task) updateTask(task.id, { priority: e.target.value as TaskPriority });
    },
    [task, updateTask]
  );

  const handleDueDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (task) updateTask(task.id, { dueDate: e.target.value || null });
    },
    [task, updateTask]
  );

  const handleDueTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (task) updateTask(task.id, { dueTime: e.target.value || null });
    },
    [task, updateTask]
  );

  const handleDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (task) {
        const val = parseInt(e.target.value);
        updateTask(task.id, { estimatedDuration: isNaN(val) ? null : val });
      }
    },
    [task, updateTask]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (task) updateTask(task.id, { category: e.target.value });
    },
    [task, updateTask]
  );

  const handleAddSubtask = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (task && newSubtask.trim()) {
        addSubtask(task.id, newSubtask.trim());
        setNewSubtask('');
      }
    },
    [task, newSubtask, addSubtask]
  );

  const handleAddTag = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && task && newTag.trim()) {
        e.preventDefault();
        if (!task.tags.includes(newTag.trim())) {
          updateTask(task.id, { tags: [...task.tags, newTag.trim()] });
        }
        setNewTag('');
      }
    },
    [task, newTag, updateTask]
  );

  const handleRemoveTag = useCallback(
    (tag: string) => {
      if (task) {
        updateTask(task.id, { tags: task.tags.filter((t) => t !== tag) });
      }
    },
    [task, updateTask]
  );

  const handleAddLink = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && task && newLink.trim()) {
        e.preventDefault();
        updateTask(task.id, { links: [...task.links, newLink.trim()] });
        setNewLink('');
      }
    },
    [task, newLink, updateTask]
  );

  const handleRemoveLink = useCallback(
    (index: number) => {
      if (task) {
        updateTask(task.id, { links: task.links.filter((_, i) => i !== index) });
      }
    },
    [task, updateTask]
  );

  const handleDelete = useCallback(() => {
    if (task) {
      deleteTask(task.id);
      closeDetailPanel();
      addToast({ message: 'Task deleted', type: 'info', duration: 2000 });
    }
  }, [task, deleteTask, closeDetailPanel, addToast]);

  if (!task) return null;

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  return (
    <div className="detail-panel" role="complementary" aria-label="Task details">
      <div className="detail-panel-header">
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
          {task.status === 'completed' ? '✓ Completed' : 'Editing'}
        </span>
        <button
          className="detail-panel-close"
          onClick={closeDetailPanel}
          aria-label="Close detail panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="detail-panel-body">
        {/* Title */}
        <div className="detail-field">
          <input
            className="detail-title-input"
            value={task.title}
            onChange={handleTitleChange}
            placeholder="Task title"
            aria-label="Task title"
          />
        </div>

        {/* Description */}
        <div className="detail-field">
          <label className="detail-field-label">Description</label>
          <textarea
            className="detail-textarea"
            value={task.description}
            onChange={handleDescriptionChange}
            placeholder="Add a description..."
            rows={3}
          />
        </div>

        {/* Due Date & Time */}
        <div className="detail-row">
          <div className="detail-field">
            <label className="detail-field-label">
              <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Due Date
            </label>
            <input
              className="detail-input"
              type="date"
              value={task.dueDate || ''}
              onChange={handleDueDateChange}
            />
          </div>
          <div className="detail-field">
            <label className="detail-field-label">
              <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Time
            </label>
            <input
              className="detail-input"
              type="time"
              value={task.dueTime || ''}
              onChange={handleDueTimeChange}
            />
          </div>
        </div>

        {/* Minimal 1-Click Date & Time Presets */}
        <div className="detail-quick-presets">
          <div className="detail-preset-row">
            <span className="detail-preset-label">Date:</span>
            <button
              type="button"
              className={`detail-preset-chip${task.dueDate === getTodayStr() ? ' active' : ''}`}
              onClick={() => updateTask(task.id, { dueDate: getTodayStr() })}
            >
              Today
            </button>
            <button
              type="button"
              className={`detail-preset-chip${task.dueDate === getTomorrowStr() ? ' active' : ''}`}
              onClick={() => updateTask(task.id, { dueDate: getTomorrowStr() })}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className={`detail-preset-chip${task.dueDate === toDateStr(addWeeks(new Date(), 1)) ? ' active' : ''}`}
              onClick={() => updateTask(task.id, { dueDate: toDateStr(addWeeks(new Date(), 1)) })}
            >
              Next Week
            </button>
            {task.dueDate && (
              <button
                type="button"
                className="detail-preset-chip chip-clear"
                onClick={() => updateTask(task.id, { dueDate: null })}
                title="Remove due date"
              >
                Clear
              </button>
            )}
          </div>

          <div className="detail-preset-row">
            <span className="detail-preset-label">Time:</span>
            {[
              { label: '9 AM', time: '09:00' },
              { label: '1 PM', time: '13:00' },
              { label: '3 PM', time: '15:00' },
              { label: '6 PM', time: '18:00' },
            ].map((p) => (
              <button
                key={p.time}
                type="button"
                className={`detail-preset-chip${task.dueTime === p.time ? ' active' : ''}`}
                onClick={() => updateTask(task.id, { dueTime: task.dueTime === p.time ? null : p.time })}
              >
                {p.label}
              </button>
            ))}
            {task.dueTime && (
              <button
                type="button"
                className="detail-preset-chip chip-clear"
                onClick={() => updateTask(task.id, { dueTime: null })}
                title="Remove due time"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Priority & Duration */}
        <div className="detail-row">
          <div className="detail-field">
            <label className="detail-field-label">Priority</label>
            <select
              className="detail-select"
              value={task.priority}
              onChange={handlePriorityChange}
            >
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="detail-field">
            <label className="detail-field-label">Est. Duration (min)</label>
            <input
              className="detail-input"
              type="number"
              min={0}
              step={5}
              value={task.estimatedDuration ?? ''}
              onChange={handleDurationChange}
              placeholder="e.g. 30"
            />
          </div>
        </div>

        {/* Category */}
        <div className="detail-field">
          <label className="detail-field-label">Category</label>
          <input
            className="detail-input"
            value={task.category}
            onChange={handleCategoryChange}
            placeholder="e.g. Work, Personal"
          />
        </div>

        {/* Tags */}
        <div className="detail-field">
          <label className="detail-field-label">
            <Tag size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Tags
          </label>
          <div className="tags-container">
            {task.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button
                  className="tag-chip-remove"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              className="tag-input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag..."
              aria-label="Add a tag"
            />
          </div>
        </div>

        {/* Subtasks */}
        <div className="detail-field">
          <label className="detail-field-label">
            Subtasks
            {task.subtasks.length > 0 && (
              <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>
                {completedSubtasks}/{task.subtasks.length}
              </span>
            )}
          </label>
          <div className="subtask-list">
            {task.subtasks
              .sort((a, b) => a.order - b.order)
              .map((subtask) => (
                <div
                  key={subtask.id}
                  className={`subtask-row${subtask.completed ? ' completed' : ''}`}
                >
                  <div
                    className="subtask-checkbox"
                    onClick={() => toggleSubtask(task.id, subtask.id)}
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => { }}
                      tabIndex={-1}
                    />
                    <div className="subtask-checkbox-visual">
                      <Check className="check-icon" />
                    </div>
                  </div>
                  <span className="subtask-title">{subtask.title}</span>
                  <button
                    className="subtask-delete"
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                    aria-label={`Delete subtask: ${subtask.title}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

            {showSubtaskInput ? (
              <form
                onSubmit={handleAddSubtask}
                style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}
              >
                <input
                  ref={subtaskInputRef}
                  className="subtask-add-input"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onBlur={() => {
                    if (!newSubtask.trim()) setShowSubtaskInput(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setNewSubtask('');
                      setShowSubtaskInput(false);
                    }
                  }}
                  placeholder="Add subtask..."
                />
              </form>
            ) : (
              <button
                className="subtask-add"
                onClick={() => setShowSubtaskInput(true)}
              >
                <Plus size={14} /> Add subtask
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="detail-field">
          <label className="detail-field-label">Notes</label>
          <textarea
            className="detail-textarea"
            value={task.notes}
            onChange={handleNotesChange}
            placeholder="Add notes..."
            rows={4}
          />
        </div>

        {/* Links */}
        <div className="detail-field">
          <label className="detail-field-label">
            <LinkIcon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Links
          </label>
          <div className="links-list">
            {task.links.map((link, i) => (
              <div key={i} className="link-row">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--accent)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link}
                </a>
                <button
                  className="subtask-delete"
                  onClick={() => handleRemoveLink(i)}
                  style={{ opacity: 1 }}
                  aria-label="Remove link"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <input
              className="detail-input"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={handleAddLink}
              placeholder="Add link (press Enter)..."
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="detail-field" style={{ marginTop: 'var(--space-8)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
            {task.completedAt && (
              <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="detail-panel-footer">
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
          <Trash2 size={12} /> Delete task
        </button>
      </div>
    </div>
  );
}
