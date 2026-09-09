import React, { useEffect, useState, useMemo } from 'react';
import { Search, Menu, Command, Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, subMonths, addMonths, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { getWeekDays } from './utils/dates';
import { useTaskStore } from './stores/taskStore';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore } from './stores/settingsStore';
import { initializeDB } from './services/db';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Layout
import { Navigation } from './components/layout/Navigation';

// Views
import { AllTasksView } from './components/views/AllTasksView';
import { CalendarView } from './components/views/CalendarView';

// Task detail
import { TaskDetail } from './components/tasks/TaskDetail';

// Command palette
import { CommandPalette } from './components/command/CommandPalette';

// Common
import { SettingsPanel } from './components/common/SettingsPanel';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  const initTasks = useTaskStore((s) => s.initialize);
  const isLoading = useTaskStore((s) => s.isLoading);
  const initSettings = useSettingsStore((s) => s.initialize);

  const {
    currentView,
    detailPanelOpen,
    commandPaletteOpen,
    settingsOpen,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    setCommandPaletteOpen,
    sidebarOpen,
    setSidebarOpen,
    calendarDate,
    setCalendarDate,
    calendarViewMode,
    setCalendarViewMode,
  } = useUIStore();

  const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);

  // Calendar title computation
  const calendarTitle = useMemo(() => {
    if (calendarViewMode === 'month') {
      return format(calendarDate, 'MMMM yyyy');
    }
    const weekDays = getWeekDays(calendarDate, weekStartsOn);
    const startStr = format(weekDays[0], 'MMM d');
    const endStr = isSameDay(weekDays[0], weekDays[6])
      ? ''
      : format(weekDays[6], 'MMM d, yyyy');
    return `${startStr} – ${endStr}`;
  }, [calendarViewMode, calendarDate, weekStartsOn]);

  const handlePrevCalendar = () => {
    setCalendarDate((d) => (calendarViewMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  };

  const handleNextCalendar = () => {
    setCalendarDate((d) => (calendarViewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  };

  const handleTodayCalendar = () => {
    setCalendarDate(new Date());
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initializeDB();
      await initSettings();
      await initTasks();
    };
    init();
  }, [initTasks, initSettings]);

  const timeFormat = useSettingsStore((s) => s.timeFormat);
  const use24h = timeFormat === '24h';
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep live time updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts();

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Loading...
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'all':
        return <AllTasksView />;
      case 'calendar':
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="app-shell">
      {/* Mobile sidebar backdrop */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="main-content">
        {/* Unified Top Header - Clean, zero clutter */}
        <header className="main-header">
          {currentView === 'calendar' ? (
            <div className="main-header-calendar-left">
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <button
                className="calendar-today-btn"
                onClick={handleTodayCalendar}
              >
                Today
              </button>
              <div className="calendar-nav-group">
                <button
                  className="calendar-nav-btn"
                  onClick={handlePrevCalendar}
                  aria-label="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="calendar-nav-btn"
                  onClick={handleNextCalendar}
                  aria-label="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <h2 className="main-header-calendar-title">{calendarTitle}</h2>
            </div>
          ) : (
            <div className="main-header-left">
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div className="main-header-title-group">
                <h2 className="main-header-title">All Tasks</h2>
                <span className="main-header-date-badge">
                  {format(currentTime, 'EEEE, MMMM d')}
                </span>
              </div>
            </div>
          )}

          <div className="main-header-actions">
            {currentView === 'calendar' && (
              <>
                <div className="calendar-view-toggle">
                  <button
                    className={`calendar-toggle-btn${calendarViewMode === 'month' ? ' active' : ''}`}
                    onClick={() => setCalendarViewMode('month')}
                  >
                    Month
                  </button>
                  <button
                    className={`calendar-toggle-btn${calendarViewMode === 'week' ? ' active' : ''}`}
                    onClick={() => setCalendarViewMode('week')}
                  >
                    Week
                  </button>
                </div>

                <button
                  className="calendar-primary-add-btn"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('open-calendar-new-task', {
                        detail: { date: calendarDate },
                      })
                    )
                  }
                  title="Schedule a new task (N)"
                  aria-label="Schedule a new task"
                >
                  <Plus size={14} />
                  <span>New Task</span>
                </button>
              </>
            )}

            {/* Live Clock pill */}
            <div
              className="main-header-clock"
              title={`Current time: ${format(currentTime, use24h ? 'HH:mm:ss' : 'h:mm:ss a')}`}
            >
              <Clock size={12} className="header-clock-icon" />
              <span className="header-clock-text">
                {format(currentTime, use24h ? 'HH:mm' : 'h:mm a')}
              </span>
            </div>

            {/* Search */}
            {searchOpen ? (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)' }} />
                <input
                  autoFocus
                  className="detail-input"
                  style={{ paddingLeft: 30, width: 200 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search tasks..."
                  aria-label="Search tasks"
                />
              </div>
            ) : (
              <button
                className="icon-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                title="Search (/)"
              >
                <Search className="icon" />
              </button>
            )}

            {/* Command palette trigger */}
            <button
              className="icon-btn"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Command palette"
              title="Command palette (⌘K)"
            >
              <Command className="icon" />
            </button>
          </div>
        </header>

        {/* Content with optional detail panel */}
        <div className="content-with-panel">
          <div className={`main-body${currentView === 'calendar' ? ' calendar-view-body' : ''}`}>
            <ErrorBoundary>
              {renderView()}
            </ErrorBoundary>
          </div>

          {detailPanelOpen && <TaskDetail />}
        </div>
      </div>

      {/* Modals & Overlays */}
      {commandPaletteOpen && <CommandPalette />}
      {settingsOpen && <SettingsPanel />}

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}

export default App;
