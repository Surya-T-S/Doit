import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowDownAZ, ArrowUpZA, Calendar, Clock, Flag, GripVertical, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { SortMode, FilterPreset } from '../../types';
import { SORT_LABELS, FILTER_LABELS } from '../../utils/constants';

export function SortToolbar() {
  const {
    sortMode,
    sortDirection,
    setSortMode,
    setSortDirection,
    activeFilter,
    setActiveFilter,
  } = useUIStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const sortOptions: { mode: SortMode; icon: React.ReactNode }[] = [
    { mode: 'custom', icon: <GripVertical size={14} /> },
    { mode: 'alphabetical', icon: <ArrowDownAZ size={14} /> },
    { mode: 'created', icon: <Clock size={14} /> },
    { mode: 'dueDate', icon: <Calendar size={14} /> },
    { mode: 'priority', icon: <Flag size={14} /> },
  ];

  const filterOptions: FilterPreset[] = [
    'all', 'today', 'tomorrow', 'overdue', 'thisWeek',
    'highPriority', 'tagged', 'scheduled', 'noDueDate',
  ];

  return (
    <div className="sort-toolbar">
      {/* Sort dropdown */}
      <div className="dropdown" ref={sortRef}>
        <button
          className={`sort-btn${showSortMenu ? ' active' : ''}`}
          onClick={() => setShowSortMenu(!showSortMenu)}
          aria-label="Sort tasks"
          aria-expanded={showSortMenu}
        >
          <ArrowUpDown size={12} className="sort-icon" />
          {SORT_LABELS[sortMode]}
          <ChevronDown size={10} />
        </button>

        {showSortMenu && (
          <div className="dropdown-menu" style={{ left: 0, right: 'auto' }}>
            {sortOptions.map(({ mode, icon }) => (
              <button
                key={mode}
                className={`dropdown-item${sortMode === mode ? ' active' : ''}`}
                onClick={() => {
                  if (sortMode === mode && mode !== 'custom') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortMode(mode);
                    setSortDirection('asc');
                  }
                  setShowSortMenu(false);
                }}
              >
                <span className="dropdown-icon">{icon}</span>
                {SORT_LABELS[mode]}
                {sortMode === mode && mode !== 'custom' && (
                  <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter dropdown */}
      <div className="dropdown" ref={filterRef}>
        <button
          className={`filter-btn${activeFilter !== 'all' ? ' active' : ''}`}
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          aria-label="Filter tasks"
          aria-expanded={showFilterMenu}
        >
          <SlidersHorizontal size={12} />
          {FILTER_LABELS[activeFilter]}
          <ChevronDown size={10} />
        </button>

        {showFilterMenu && (
          <div className="dropdown-menu" style={{ left: 0, right: 'auto' }}>
            {filterOptions.map((filter) => (
              <button
                key={filter}
                className={`dropdown-item${activeFilter === filter ? ' active' : ''}`}
                onClick={() => {
                  setActiveFilter(filter);
                  setShowFilterMenu(false);
                }}
              >
                {FILTER_LABELS[filter]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
