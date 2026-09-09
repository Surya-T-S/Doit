import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

export function useKeyboardShortcuts() {
  const {
    setView,
    setCommandPaletteOpen,
    commandPaletteOpen,
    setSearchOpen,
    searchOpen,
    detailPanelOpen,
    closeDetailPanel,
    settingsOpen,
    setSettingsOpen,
  } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // Escape: close modals/panels
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (searchOpen) {
          setSearchOpen(false);
          return;
        }
        if (detailPanelOpen) {
          closeDetailPanel();
          return;
        }
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        return;
      }

      // Don't trigger shortcuts when typing in inputs
      if (isInput) return;

      switch (e.key) {
        case 'n':
          e.preventDefault();
          setView('calendar');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-calendar-new-task', { detail: { date: new Date() } }));
          }, 50);
          break;
        case '/':
          e.preventDefault();
          setSearchOpen(true);
          break;
        case 'c':
        case '1':
          e.preventDefault();
          setView('calendar');
          break;
        case 'a':
        case '2':
          e.preventDefault();
          setView('all');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    commandPaletteOpen,
    searchOpen,
    detailPanelOpen,
    settingsOpen,
    setView,
    setCommandPaletteOpen,
    setSearchOpen,
    closeDetailPanel,
    setSettingsOpen,
  ]);
}
