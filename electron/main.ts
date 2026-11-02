import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Linux: make the window class deterministic so the desktop environment can match the
// running window to doit.desktop (otherwise the dock shows a generic gray gear icon).
// X11 uses WM_CLASS (--class); Wayland uses the app_id derived from "desktopName" in package.json.
// Both resolve to "doit", matching StartupWMClass=doit in the installed .desktop file.
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('class', 'doit');
}

// Persistent database path on user's hard drive (cross-platform)
// Windows: %APPDATA%\Doit\doit-data.json
// macOS: ~/Library/Application Support/Doit/doit-data.json
// Linux: ~/.config/Doit/doit-data.json
function getStoragePath(): string {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'doit-data.json');
}

function createWindow(): void {
  const isMac = process.platform === 'darwin';
  const iconPath = app.isPackaged ? (fs.existsSync(path.join(process.resourcesPath, 'public/logo.png')) ? path.join(process.resourcesPath, 'public/logo.png') : path.join(__dirname, '../public/logo.png')) : path.join(__dirname, '../public/logo.png');
  const hasIcon = fs.existsSync(iconPath);

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 920,
    minHeight: 620,
    title: 'Doit',
    backgroundColor: '#FAFAF9',
    autoHideMenuBar: true,
    icon: hasIcon ? iconPath : undefined,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 16, y: 16 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // In development, load from Vite dev server; in production, load local dist/index.html
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register IPC handlers for persistent local file storage
function setupStorageIPC(): void {
  const filePath = getStoragePath();

  // Read stored data
  ipcMain.handle('desktop:getData', async () => {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      return null;
    } catch (err) {
      console.error('[Electron Storage] Failed to read data:', err);
      return null;
    }
  });

  // Save data atomically
  ipcMain.handle('desktop:saveData', async (_event, dataString: string) => {
    try {
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, dataString, 'utf-8');
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (err) {
      console.error('[Electron Storage] Failed to write data:', err);
      return false;
    }
  });

  // Get local file path for display in settings
  ipcMain.handle('desktop:getPath', () => filePath);

  // Get platform
  ipcMain.handle('desktop:getPlatform', () => process.platform);

  // Get version
  ipcMain.handle('desktop:getVersion', () => app.getVersion());
}

app.whenReady().then(() => {
  setupStorageIPC();

  // Set macOS dock icon if available
  const iconPath = app.isPackaged ? (fs.existsSync(path.join(process.resourcesPath, 'public/logo.png')) ? path.join(process.resourcesPath, 'public/logo.png') : path.join(__dirname, '../public/logo.png')) : path.join(__dirname, '../public/logo.png');
  if (process.platform === 'darwin' && fs.existsSync(iconPath) && app.dock) {
    app.dock.setIcon(iconPath);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
