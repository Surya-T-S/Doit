import React from 'react';
import { Sun, Calendar, ListTodo, Settings, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { ViewType, ThemeMode } from '../../types';

export function Navigation() {
  const { currentView, setView, setSettingsOpen, sidebarOpen, setSidebarOpen } = useUIStore();
  const tasks = useTaskStore((s) => s.tasks);
  const { theme, setTheme } = useSettingsStore();

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = tasks.filter(
    (t) => t.status === 'pending' && t.dueDate === todayStr
  ).length;

  const navItems: { view: ViewType; label: string; icon: React.ReactNode; count?: number }[] = [
    { view: 'today', label: 'Today', icon: <Sun size={16} />, count: todayCount || undefined },
    { view: 'all', label: 'All Tasks', icon: <ListTodo size={16} />, count: pendingCount || undefined },
    { view: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
  ];

  const handleNavClick = (view: ViewType) => {
    setView(view);
    setSidebarOpen(false);
  };

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(theme);
    setTheme(modes[(currentIndex + 1) % modes.length]);
  };

  const themeIcon = theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />;

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="sidebar-brand">
        <h1>Doit</h1>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Views</div>
        {navItems.map(({ view, label, icon, count }) => (
          <button
            key={view}
            className={`sidebar-nav-item${currentView === view ? ' active' : ''}`}
            onClick={() => handleNavClick(view)}
            aria-current={currentView === view ? 'page' : undefined}
          >
            <span className="nav-icon">{icon}</span>
            {label}
            {count !== undefined && <span className="nav-count">{count}</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button className="sidebar-bottom-btn" onClick={cycleTheme}>
          {themeIcon}
          <span>{theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}</span>
        </button>
        <button
          className="sidebar-bottom-btn"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
