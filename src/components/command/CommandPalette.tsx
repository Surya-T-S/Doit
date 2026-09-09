import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Sun,
  Calendar,
  ListTodo,
  ArrowUpDown,
  CheckCircle2,
  Settings,
  Download,
  Upload,
  Moon,
  Trash2,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { exportData, exportCSV } from '../../services/exportImport';
import type { CommandAction } from '../../types';

export function CommandPalette() {
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    setCommandPaletteOpen,
    setView,
    setSettingsOpen,
    setSearchOpen,
    setActiveFilter,
    setSortMode,
  } = useUIStore();

  const { tasks } = useTaskStore();
  const settings = useSettingsStore();

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery('');
  }, [setCommandPaletteOpen]);

  const actions: CommandAction[] = useMemo(() => [
    {
      id: 'new-task',
      label: 'New task (Calendar)',
      shortcut: 'N',
      icon: 'plus',
      category: 'Actions',
      action: () => {
        close();
        setView('calendar');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-calendar-new-task', { detail: { date: new Date() } }));
        }, 50);
      },
    },
    {
      id: 'search',
      label: 'Search tasks',
      shortcut: '/',
      icon: 'search',
      category: 'Actions',
      action: () => {
        close();
        setSearchOpen(true);
      },
    },
    {
      id: 'view-calendar',
      label: 'Go to Calendar',
      shortcut: 'C',
      icon: 'calendar',
      category: 'Navigation',
      action: () => { close(); setView('calendar'); },
    },
    {
      id: 'view-all',
      label: 'Go to All Tasks',
      shortcut: 'A',
      icon: 'list',
      category: 'Navigation',
      action: () => { close(); setView('all'); },
    },
    {
      id: 'filter-overdue',
      label: 'Show overdue tasks',
      category: 'Filters',
      action: () => { close(); setView('all'); setActiveFilter('overdue'); },
    },
    {
      id: 'filter-high-priority',
      label: 'Show high priority tasks',
      category: 'Filters',
      action: () => { close(); setView('all'); setActiveFilter('highPriority'); },
    },
    {
      id: 'filter-today',
      label: 'Show today\'s tasks',
      category: 'Filters',
      action: () => { close(); setView('all'); setActiveFilter('today'); },
    },
    {
      id: 'filter-all',
      label: 'Clear filters',
      category: 'Filters',
      action: () => { close(); setActiveFilter('all'); },
    },
    {
      id: 'sort-alphabetical',
      label: 'Sort alphabetically',
      category: 'Sort',
      action: () => { close(); setSortMode('alphabetical'); },
    },
    {
      id: 'sort-due-date',
      label: 'Sort by due date',
      category: 'Sort',
      action: () => { close(); setSortMode('dueDate'); },
    },
    {
      id: 'sort-priority',
      label: 'Sort by priority',
      category: 'Sort',
      action: () => { close(); setSortMode('priority'); },
    },
    {
      id: 'sort-custom',
      label: 'Custom order',
      category: 'Sort',
      action: () => { close(); setSortMode('custom'); },
    },
    {
      id: 'export-json',
      label: 'Export data (JSON)',
      category: 'Data',
      action: () => {
        close();
        const { isLoaded, initialize, updateSettings, setTheme: _, resetSettings, ...s } = settings;
        exportData(tasks, s as any);
      },
    },
    {
      id: 'export-csv',
      label: 'Export tasks (CSV)',
      category: 'Data',
      action: () => { close(); exportCSV(tasks); },
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: 'settings',
      category: 'App',
      action: () => { close(); setSettingsOpen(true); },
    },
    {
      id: 'theme-toggle',
      label: `Theme: ${settings.theme === 'dark' ? 'Switch to Light' : settings.theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}`,
      category: 'App',
      action: () => {
        close();
        settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark');
      },
    },
  ], [close, setView, setSettingsOpen, setSearchOpen, setActiveFilter, setSortMode, tasks, settings]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        (a.category && a.category.toLowerCase().includes(q))
    );
  }, [actions, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    for (const action of filteredActions) {
      const cat = action.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(action);
    }
    return groups;
  }, [filteredActions]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setFocusedIndex(0);
  }, [query]);

  // Scroll focused item into view
  useEffect(() => {
    const items = resultsRef.current?.querySelectorAll('.command-item');
    items?.[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((i) => Math.min(i + 1, filteredActions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[focusedIndex]) {
            filteredActions[focusedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [filteredActions, focusedIndex, close]
  );

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'plus': return <Plus size={16} />;
      case 'search': return <Search size={16} />;
      case 'sun': return <Sun size={16} />;
      case 'list': return <ListTodo size={16} />;
      case 'calendar': return <Calendar size={16} />;
      case 'settings': return <Settings size={16} />;
      default: return null;
    }
  };

  let flatIndex = 0;

  return (
    <div className="command-overlay" onClick={close} role="dialog" aria-label="Command palette" aria-modal="true">
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            className="command-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            aria-label="Search commands"
          />
        </div>

        <div className="command-results" ref={resultsRef}>
          {filteredActions.length === 0 ? (
            <div className="command-empty">No matching commands</div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="command-group-label">{category}</div>
                {items.map((action) => {
                  const idx = flatIndex++;
                  return (
                    <div
                      key={action.id}
                      className={`command-item${idx === focusedIndex ? ' focused' : ''}`}
                      onClick={() => action.action()}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      role="option"
                      aria-selected={idx === focusedIndex}
                    >
                      {action.icon && (
                        <span className="command-item-icon">{getIcon(action.icon)}</span>
                      )}
                      <span className="command-item-label">{action.label}</span>
                      {action.shortcut && (
                        <span className="command-item-shortcut">
                          <kbd>{action.shortcut}</kbd>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
