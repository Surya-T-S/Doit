import React, { useRef, useCallback } from 'react';
import { X, Download, Upload, Trash2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTaskStore } from '../../stores/taskStore';
import { exportData, exportCSV, importData } from '../../services/exportImport';
import { clearAllData, saveTasks, saveSettings } from '../../services/persistence';
import type { ThemeMode } from '../../types';

export function SettingsPanel() {
  const { setSettingsOpen, addToast } = useUIStore();
  const settings = useSettingsStore();
  const { tasks, initialize: reinitialize } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const close = () => setSettingsOpen(false);

  const handleExportJSON = () => {
    const { isLoaded, initialize, updateSettings, setTheme: _, resetSettings, ...s } = settings;
    exportData(tasks, s as any);
    addToast({ message: 'Data exported', type: 'success', duration: 2000 });
  };

  const handleExportCSV = () => {
    exportCSV(tasks);
    addToast({ message: 'CSV exported', type: 'success', duration: 2000 });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = await importData(file);
      if (result) {
        await clearAllData();
        await saveTasks(result.tasks);
        if (result.settings) {
          await saveSettings(result.settings);
        }
        // Reinitialize stores
        await reinitialize();
        await settings.initialize();
        addToast({
          message: `Imported ${result.tasks.length} tasks`,
          type: 'success',
          duration: 3000,
        });
      } else {
        addToast({
          message: 'Failed to import. Check file format.',
          type: 'error',
          duration: 4000,
        });
      }
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [reinitialize, settings, addToast]
  );

  const handleClearData = async () => {
    if (window.confirm('This will delete all tasks and settings. Are you sure?')) {
      await clearAllData();
      await reinitialize();
      await settings.initialize();
      addToast({ message: 'All data cleared', type: 'info', duration: 3000 });
      close();
    }
  };

  return (
    <div className="settings-overlay" onClick={close} role="dialog" aria-label="Settings" aria-modal="true">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="detail-panel-close" onClick={close} aria-label="Close settings">
            <X size={16} />
          </button>
        </div>

        <div className="settings-body">
          {/* Appearance */}
          <div className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Theme</div>
              </div>
              <div className="theme-selector">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`theme-option${settings.theme === mode ? ' active' : ''}`}
                    onClick={() => settings.setTheme(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Planning */}
          <div className="settings-section">
            <h3 className="settings-section-title">Planning</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Daily capacity</div>
                <div className="settings-row-description">
                  How many hours of planned work per day
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  className="detail-input"
                  type="number"
                  min={1}
                  max={24}
                  value={settings.dailyCapacityMinutes / 60}
                  onChange={(e) =>
                    settings.updateSettings({
                      dailyCapacityMinutes: Math.max(60, parseInt(e.target.value) * 60 || 480),
                    })
                  }
                  style={{ width: 60 }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>hours</span>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-label">Week starts on</div>
              </div>
              <div className="theme-selector">
                <button
                  className={`theme-option${settings.weekStartsOn === 1 ? ' active' : ''}`}
                  onClick={() => settings.updateSettings({ weekStartsOn: 1 })}
                >
                  Monday
                </button>
                <button
                  className={`theme-option${settings.weekStartsOn === 0 ? ' active' : ''}`}
                  onClick={() => settings.updateSettings({ weekStartsOn: 0 })}
                >
                  Sunday
                </button>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-label">Time format</div>
              </div>
              <div className="theme-selector">
                <button
                  className={`theme-option${settings.timeFormat === '12h' ? ' active' : ''}`}
                  onClick={() => settings.updateSettings({ timeFormat: '12h' })}
                >
                  12h
                </button>
                <button
                  className={`theme-option${settings.timeFormat === '24h' ? ' active' : ''}`}
                  onClick={() => settings.updateSettings({ timeFormat: '24h' })}
                >
                  24h
                </button>
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="settings-section">
            <h3 className="settings-section-title">Data</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Export backup</div>
                <div className="settings-row-description">
                  Download all data as JSON
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
                <Download size={14} /> JSON
              </button>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Export CSV</div>
                <div className="settings-row-description">
                  Download tasks as spreadsheet
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                <Download size={14} /> CSV
              </button>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Import backup</div>
                <div className="settings-row-description">
                  Restore from a JSON backup file
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleImport}>
                <Upload size={14} /> Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="settings-section">
            <h3 className="settings-section-title">Privacy</h3>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              All your data is stored locally on this device. Doit does not send any data to external servers. No analytics, no tracking.
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section">
            <h3 className="settings-section-title" style={{ color: 'var(--danger)' }}>Danger Zone</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Clear all data</div>
                <div className="settings-row-description">
                  Permanently delete all tasks and settings
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleClearData}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Doit v1.0 · Local-first · Privacy-first
          </span>
          <button className="btn btn-ghost btn-sm" onClick={close}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
