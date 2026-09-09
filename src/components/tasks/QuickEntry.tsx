import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Calendar, Clock, X, CornerDownLeft } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getTodayStr, getTomorrowStr, formatDate, formatTime } from '../../utils/dates';

interface QuickEntryProps {
  defaultDueDate?: string | null;
  placeholder?: string;
}

export function QuickEntry({ defaultDueDate = null, placeholder = 'What needs to be done?' }: QuickEntryProps) {
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(defaultDueDate);
  const [dueTime, setDueTime] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useTaskStore((s) => s.addTask);
  const addToast = useUIStore((s) => s.addToast);
  const timeFormat = useSettingsStore((s) => s.timeFormat);
  const use24h = timeFormat === '24h';

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  // Sync defaultDueDate if it changes
  useEffect(() => {
    if (defaultDueDate) {
      setDueDate(defaultDueDate);
    }
  }, [defaultDueDate]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;

      addTask(trimmed, {
        dueDate: dueDate || null,
        dueTime: dueTime || null,
      });

      setValue('');
      setDueTime(null);
      setDueDate(defaultDueDate);

      const timeMsg = dueTime ? ` at ${formatTime(dueTime, use24h)}` : '';
      const dateMsg = dueDate ? ` for ${formatDate(dueDate)}` : '';
      addToast({
        message: `Task created${dateMsg}${timeMsg}`,
        type: 'success',
        duration: 2500,
      });

      // Keep input focused for rapid multi-task entry
      inputRef.current?.focus();
    },
    [value, dueDate, dueTime, defaultDueDate, addTask, addToast, use24h]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        setValue('');
        setDueTime(null);
        setDueDate(defaultDueDate);
        setIsFocused(false);
        inputRef.current?.blur();
      }
    },
    [handleSubmit, defaultDueDate]
  );

  return (
    <div className={`quick-entry-card${isFocused || value ? ' focused' : ''}`}>
      <div className="quick-entry-main">
        <input
          ref={inputRef}
          className="quick-entry-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          aria-label="Create a new task"
          autoComplete="off"
        />

        <button
          type="button"
          className="btn btn-primary btn-sm quick-entry-submit-btn"
          onClick={() => handleSubmit()}
          disabled={!value.trim()}
          title="Add task (Enter)"
        >
          <Plus size={15} />
          <span>Add</span>
          <CornerDownLeft size={11} className="key-hint" />
        </button>
      </div>

      {/* Due Date & Time Controls - Dedicated, clean, zero clutter */}
      <div className="quick-entry-toolbar">
        <div className="quick-entry-meta-group">
          {/* Due Date Picker */}
          <div className="quick-pill-picker">
            <label
              className={`quick-meta-chip${dueDate ? ' active' : ''}`}
              title="Set due date"
            >
              <Calendar size={13} className="chip-icon" />
              <span className="chip-label">
                {dueDate ? formatDate(dueDate) : 'Due date'}
              </span>
              <input
                type="date"
                className="quick-hidden-input"
                value={dueDate || ''}
                onChange={(e) => setDueDate(e.target.value || null)}
              />
            </label>

            {/* Quick 1-click Date Presets */}
            <button
              type="button"
              className={`quick-preset-pill${dueDate === todayStr ? ' selected' : ''}`}
              onClick={() => setDueDate(dueDate === todayStr ? null : todayStr)}
            >
              Today
            </button>
            <button
              type="button"
              className={`quick-preset-pill${dueDate === tomorrowStr ? ' selected' : ''}`}
              onClick={() => setDueDate(dueDate === tomorrowStr ? null : tomorrowStr)}
            >
              Tomorrow
            </button>

            {dueDate && (
              <button
                type="button"
                className="quick-clear-btn"
                onClick={() => setDueDate(null)}
                title="Clear due date"
                aria-label="Clear due date"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="quick-toolbar-separator" />

          {/* Due Time Picker */}
          <div className="quick-pill-picker">
            <label
              className={`quick-meta-chip${dueTime ? ' active' : ''}`}
              title="Set due time"
            >
              <Clock size={13} className="chip-icon" />
              <span className="chip-label">
                {dueTime ? formatTime(dueTime, use24h) : 'Add time'}
              </span>
              <input
                type="time"
                className="quick-hidden-input"
                value={dueTime || ''}
                onChange={(e) => setDueTime(e.target.value || null)}
              />
            </label>

            {/* Quick 1-click Time Presets */}
            {!dueTime && (
              <>
                <button
                  type="button"
                  className="quick-preset-pill"
                  onClick={() => setDueTime('09:00')}
                >
                  9 AM
                </button>
                <button
                  type="button"
                  className="quick-preset-pill"
                  onClick={() => setDueTime('12:00')}
                >
                  12 PM
                </button>
                <button
                  type="button"
                  className="quick-preset-pill"
                  onClick={() => setDueTime('18:00')}
                >
                  6 PM
                </button>
              </>
            )}

            {dueTime && (
              <button
                type="button"
                className="quick-clear-btn"
                onClick={() => setDueTime(null)}
                title="Clear due time"
                aria-label="Clear due time"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="quick-entry-shortcut-hint">
          <kbd>Enter</kbd> to add
        </div>
      </div>
    </div>
  );
}
