import React, { useEffect } from 'react';
import { Search, Menu, Command } from 'lucide-react';
import { useTaskStore } from './stores/taskStore';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore } from './stores/settingsStore';
import { initializeDB } from './services/db';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Layout
import { Navigation } from './components/layout/Navigation';

// Views
import { TodayView } from './components/views/TodayView';
import { AllTasksView } from './components/views/AllTasksView';
import { CalendarView } from './components/views/CalendarView';

// Task detail
import { TaskDetail } from './components/tasks/TaskDetail';

// Command palette
import { CommandPalette } from './components/command/CommandPalette';

// Common
import { SettingsPanel } from './components/common/SettingsPanel';
import { ToastContainer } from './components/common/ToastContainer';

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
      case 'today':
        return <TodayView />;
      case 'all':
        return <AllTasksView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <TodayView />;
    }
  };

  const viewTitles: Record<string, string> = {
    today: 'Today',
    all: 'All Tasks',
    calendar: 'Calendar',
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
        {/* Header */}
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="main-header-title">{viewTitles[currentView]}</h2>
          </div>

          <div className="main-header-actions">
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
            {renderView()}
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
