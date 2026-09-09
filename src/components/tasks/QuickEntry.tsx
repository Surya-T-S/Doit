import React, { useState, useCallback } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';

export function QuickEntry() {
  const [value, setValue] = useState('');
  const addTask = useTaskStore((s) => s.addTask);
  const addToast = useUIStore((s) => s.addToast);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;

      addTask(trimmed);
      setValue('');
      addToast({ message: 'Task created', type: 'success', duration: 2000 });
    },
    [value, addTask, addToast]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setValue('');
        (e.target as HTMLInputElement).blur();
      }
    },
    []
  );

  return (
    <form className="quick-entry" onSubmit={handleSubmit}>
      <input
        className="quick-entry-input"
        type="text"
        placeholder="What needs to be done?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Create a new task"
        autoComplete="off"
      />
      <div className="quick-entry-hint">
        Press <kbd style={{ padding: '1px 4px', fontSize: '11px', background: 'var(--bg-tertiary)', borderRadius: '3px', border: '1px solid var(--border-default)' }}>Enter</kbd> to add  ·  <kbd style={{ padding: '1px 4px', fontSize: '11px', background: 'var(--bg-tertiary)', borderRadius: '3px', border: '1px solid var(--border-default)' }}>N</kbd> to focus
      </div>
    </form>
  );
}
