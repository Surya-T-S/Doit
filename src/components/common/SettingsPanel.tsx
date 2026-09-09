import React, { useRef, useCallback, useMemo } from 'react';
import { X, Download, Upload, Trash2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore, hexToRgb, rgbToHex } from '../../stores/settingsStore';
import { useTaskStore } from '../../stores/taskStore';
import { exportData, exportCSV, importData } from '../../services/exportImport';
import { clearAllData, saveTasks, saveSettings } from '../../services/persistence';
import type { ThemeMode } from '../../types';

const PRESET_COLORS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Warm Coral', hex: '#EB5E41' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Vivid Violet', hex: '#8B5CF6' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Rose Pink', hex: '#EC4899' },
  { name: 'Cyan Teal', hex: '#06B6D4' },
  { name: 'Slate Grey', hex: '#64748B' },
];

function TaskColorPicker() {
  const settings = useSettingsStore();
  const currentColor = settings.calendarTaskColor || '#2563EB';

  const rgb = useMemo(() => hexToRgb(currentColor) || { r: 37, g: 99, b: 235 }, [currentColor]);

  const updateColor = (newHex: string) => {
    settings.updateSettings({ calendarTaskColor: newHex });
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const clamped = Math.max(0, Math.min(255, isNaN(val) ? 0 : val));
    const newR = channel === 'r' ? clamped : rgb.r;
    const newG = channel === 'g' ? clamped : rgb.g;
    const newB = channel === 'b' ? clamped : rgb.b;
    updateColor(rgbToHex(newR, newG, newB));
  };

  // Compute contrast text for live preview chip
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const previewTextColor = isDark
    ? `rgb(${Math.min(255, Math.round(rgb.r * 0.75 + 85))}, ${Math.min(255, Math.round(rgb.g * 0.75 + 85))}, ${Math.min(255, Math.round(rgb.b * 0.75 + 85))})`
    : `rgb(${Math.max(0, Math.round(rgb.r * 0.65 - 15))}, ${Math.max(0, Math.round(rgb.g * 0.65 - 15))}, ${Math.max(0, Math.round(rgb.b * 0.65 - 15))})`;

  return (
    <div className="color-picker-card">
      {/* Top Row: Color Swatch + Hex Input + Reset */}
      <div className="color-picker-top-row">
        <label
          className="color-swatch-wrapper"
          style={{ backgroundColor: currentColor }}
          title="Click to open color picker"
        >
          <input
            type="color"
            value={currentColor}
            onChange={(e) => updateColor(e.target.value)}
            className="color-native-input"
            aria-label="Pick color"
          />
        </label>

        <div className="color-hex-box">
          <span className="color-hex-label">HEX</span>
          <input
            type="text"
            className="color-hex-input"
            value={currentColor}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                updateColor(val);
              }
            }}
            placeholder="#2563EB"
            maxLength={7}
            aria-label="Hex color code"
          />
        </div>

        <button
          type="button"
          className="color-reset-btn"
          onClick={() => updateColor('#2563EB')}
          title="Reset to default theme color"
        >
          Reset
        </button>
      </div>

      {/* RGB Channel Number Inputs */}
      <div className="rgb-channels-grid">
        <div className="rgb-channel-box">
          <span className="rgb-channel-label r">R</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', parseInt(e.target.value, 10))}
            className="rgb-channel-input"
            aria-label="Red value"
          />
        </div>
        <div className="rgb-channel-box">
          <span className="rgb-channel-label g">G</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', parseInt(e.target.value, 10))}
            className="rgb-channel-input"
            aria-label="Green value"
          />
        </div>
        <div className="rgb-channel-box">
          <span className="rgb-channel-label b">B</span>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', parseInt(e.target.value, 10))}
            className="rgb-channel-input"
            aria-label="Blue value"
          />
        </div>
      </div>

      {/* RGB Range Sliders */}
      <div className="rgb-sliders-col">
        <div className="rgb-slider-row">
          <span className="rgb-slider-tag r">R</span>
          <input
            type="range"
            min={0}
            max={255}
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', parseInt(e.target.value, 10))}
            className="rgb-range-slider slider-r"
            aria-label="Red channel slider"
          />
        </div>
        <div className="rgb-slider-row">
          <span className="rgb-slider-tag g">G</span>
          <input
            type="range"
            min={0}
            max={255}
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', parseInt(e.target.value, 10))}
            className="rgb-range-slider slider-g"
            aria-label="Green channel slider"
          />
        </div>
        <div className="rgb-slider-row">
          <span className="rgb-slider-tag b">B</span>
          <input
            type="range"
            min={0}
            max={255}
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', parseInt(e.target.value, 10))}
            className="rgb-range-slider slider-b"
            aria-label="Blue channel slider"
          />
        </div>
      </div>

      {/* Quick Color Presets */}
      <div className="color-presets-row">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            className={`color-preset-dot${currentColor.toLowerCase() === preset.hex.toLowerCase() ? ' active' : ''}`}
            style={{ backgroundColor: preset.hex }}
            onClick={() => updateColor(preset.hex)}
            title={preset.name}
            aria-label={preset.name}
          />
        ))}
      </div>

      {/* Live Calendar Task Preview */}
      <div className="color-live-preview-box">
        <span className="color-live-preview-title">Calendar Task Live Preview</span>
        <div
          className="color-live-preview-chip"
          style={{
            borderLeft: `3px solid ${currentColor}`,
            backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
            color: previewTextColor,
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.85 }}>09:30</span>
          <span>Sample Calendar Task</span>
        </div>
      </div>
    </div>
  );
}

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

            {/* Calendar Task Color with RGB Color Picker */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div>
                <div className="settings-row-label">Calendar task color</div>
                <div className="settings-row-description">
                  Customize the color of tasks displayed across month and week calendar views
                </div>
              </div>
              <TaskColorPicker />
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

          {/* Storage & Privacy */}
          <div className="settings-section">
            <h3 className="settings-section-title">Storage & Privacy</h3>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
              {typeof window !== 'undefined' && window.electronAPI?.isDesktop
                ? 'Desktop Mode: All data is saved directly on your Windows hard drive in %APPDATA%\\Doit\\doit-data.json. Clearing browser cache has zero effect on your data.'
                : 'All your data is stored locally on this device. Doit does not send any data to external servers. No analytics, no tracking.'}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section">
            <h3 className="settings-section-title" style={{ color: 'var(--danger)' }}>Danger Zone</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Factory Reset (Wipe All Data)</div>
                <div className="settings-row-description">
                  Permanently erase all tasks, settings, and local database files
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleClearData}>
                <Trash2 size={14} /> Wipe All Data
              </button>
            </div>

            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 'var(--space-1)' }}>Complete Application Removal</strong>
              {typeof window !== 'undefined' && window.electronAPI?.isDesktop ? (
                <>To completely delete Doit from this computer: Open Windows <strong>Settings &gt; Apps &gt; Installed apps</strong>, search for <strong>Doit</strong>, and click <strong>Uninstall</strong>. When prompted, choose <strong>Yes</strong> to remove all personal data and configuration files.</>
              ) : (
                <>To remove Doit completely from your browser: Click <strong>Wipe All Data</strong> above and clear this site's offline storage in your browser settings.</>
              )}
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
