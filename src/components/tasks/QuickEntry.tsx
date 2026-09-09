import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Calendar, Clock, X } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatDate, formatTime, parseNaturalDateTime } from '../../utils/dates';
import { parseISO } from 'date-fns';

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

      const natural = parseNaturalDateTime(trimmed, defaultDueDate ? parseISO(defaultDueDate) : new Date());
      const finalTitle = (natural.detectedText ? natural.cleanTitle : trimmed) || trimmed;
      const finalDate = dueDate || natural.dueDate || defaultDueDate || null;
      const finalTime = dueTime || natural.dueTime || null;

      addTask(finalTitle, {
        dueDate: finalDate,
        dueTime: finalTime,
      });

      setValue('');
      setDueTime(null);
      setDueDate(defaultDueDate);

      const timeMsg = finalTime ? ` at ${formatTime(finalTime, use24h)}` : '';
      const dateMsg = finalDate ? ` for ${formatDate(finalDate)}` : '';
      addToast({
        message: `Task created${dateMsg}${timeMsg}`,
        type: 'success',
        duration: 2500,
      });

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
    <form
      className={`quick-entry-bar${isFocused || value ? ' focused' : ''}`}
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        className="quick-entry-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label="Create a new task"
        autoComplete="off"
      />

      {/* Compact Inline Date & Time Controls - No wasted space */}
      <div className="quick-entry-inline-actions">
        {/* Due Date: single compact chip */}
        <div className="quick-chip-wrapper">
          <label
            className={`quick-inline-chip${dueDate ? ' active' : ''}`}
            title={dueDate ? `Due: ${formatDate(dueDate)} (click to change)` : 'Set due date'}
          >
            <Calendar size={13} className="chip-icon" />
            <span className="chip-text">{dueDate ? formatDate(dueDate) : 'Date'}</span>
            <input
              type="date"
              className="quick-native-hidden-input"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value || null)}
            />
          </label>
          {dueDate && (
            <button
              type="button"
              className="quick-chip-clear"
              onClick={(e) => {
                e.stopPropagation();
                setDueDate(null);
              }}
              title="Clear date"
              aria-label="Clear date"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Due Time: single compact chip */}
        <div className="quick-chip-wrapper">
          <label
            className={`quick-inline-chip${dueTime ? ' active' : ''}`}
            title={dueTime ? `Time: ${formatTime(dueTime, use24h)} (click to change)` : 'Set due time'}
          >
            <Clock size={13} className="chip-icon" />
            <span className="chip-text">{dueTime ? formatTime(dueTime, use24h) : 'Time'}</span>
            <input
              type="time"
              className="quick-native-hidden-input"
              value={dueTime || ''}
              onChange={(e) => setDueTime(e.target.value || null)}
            />
          </label>
          {dueTime && (
            <button
              type="button"
              className="quick-chip-clear"
              onClick={(e) => {
                e.stopPropagation();
                setDueTime(null);
              }}
              title="Clear time"
              aria-label="Clear time"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Add task button */}
        <button
          type="submit"
          className="quick-entry-btn-add"
          disabled={!value.trim()}
          title="Add task (Enter)"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </div>
    </form>
  );
}
