import React, { useEffect, useState } from 'react';
import { Search, Menu, Command, Clock } from 'lucide-react';
import { format } from 'date-fns';
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
  } = useUIStore();

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

  const viewTitles: Record<string, string> = {
    calendar: 'Calendar',
    all: 'All Tasks',
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
        {/* Header with natural Day, Date, and Live Time placement */}
        <header className="main-header">
          <div className="main-header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="main-header-title-group">
              <h2 className="main-header-title">{viewTitles[currentView]}</h2>
              <span className="main-header-date-badge">
                {format(currentTime, 'EEEE, MMMM d')}
              </span>
            </div>
          </div>

          <div className="main-header-actions">
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
          <div className="main-body">
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
