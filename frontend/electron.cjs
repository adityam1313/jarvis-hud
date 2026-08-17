const { app, BrowserWindow, session, shell, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { fork, exec } = require('child_process');

// Enforce single instance lock to prevent duplicate apps and audio streams
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Disable cache locks and GPU conflicts
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow = null;
let backendProcess = null;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend', 'server.js');
  console.log('[Electron] Starting JARVIS backend from:', backendPath);
  try {
    backendProcess = fork(backendPath, [], {
      cwd: path.join(__dirname, '..', 'backend'),
      stdio: 'inherit'
    });
    backendProcess.on('error', (err) => console.error('[Electron] Backend process error:', err));
  } catch (err) {
    console.error('[Electron] Failed to start backend:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#050508',
    title: 'J.A.R.V.I.S. — AI Command Interface',
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // Grant microphone & media permissions automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // Load built static dist/index.html
  const distPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(distPath).catch(() => {
    console.log('[Electron] Loading http://localhost:5173...');
    mainWindow.loadURL('http://localhost:5173');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle second instance attempt: focus current window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// IPC handler for external URLs
ipcMain.handle('open-url', async (event, url) => {
  console.log('[Electron IPC] Opening external URL:', url);
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    console.error('[Electron IPC] openExternal error:', err);
    exec(`start "" "${url}"`, (cmdErr) => {});
    return { success: true };
  }
});

// IPC handler for native applications
ipcMain.handle('launch-app', async (event, appTarget) => {
  console.log('[Electron IPC] Launching native app:', appTarget);
  const targetMap = {
    'notepad': 'notepad',
    'notepad++': 'notepad++',
    'calc': 'calc',
    'calculator': 'calc',
    'paint': 'mspaint',
    'mspaint': 'mspaint',
    'terminal': 'powershell',
    'powershell': 'powershell',
    'cmd': 'cmd',
    'command prompt': 'cmd',
    'explorer': 'explorer',
    'files': 'explorer',
    'file explorer': 'explorer',
    'taskmanager': 'taskmgr',
    'task manager': 'taskmgr',
    'taskmgr': 'taskmgr',
    'settings': 'start ms-settings:',
    'system settings': 'start ms-settings:',
    'vscode': 'code',
    'code': 'code',
    'vs code': 'code',
    'visual studio code': 'code',
    'chrome': 'chrome',
    'google chrome': 'chrome',
    'edge': 'msedge',
    'microsoft edge': 'msedge',
    'brave': 'brave',
    'firefox': 'firefox',
    'word': 'winword',
    'excel': 'excel',
    'powerpoint': 'powerpnt',
    'discord': 'discord',
    'steam': 'steam',
    'camera': 'start microsoft.windows.camera:',
    'control panel': 'control'
  };

  const clean = (appTarget || '').toLowerCase().trim();
  const winCmd = targetMap[clean] || targetMap[clean.replace(/\s+/g, '')] || clean;

  try {
    exec(`powershell.exe -NoProfile -Command "Start-Process '${winCmd}'"`, (err) => {
      if (err) {
        exec(`start ${winCmd}`, (startErr) => {});
      }
    });
    return { success: true };
  } catch (err) {
    console.error('[Electron IPC] launch-app error:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
