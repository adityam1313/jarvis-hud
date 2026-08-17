const { app, BrowserWindow, session, shell, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// Completely disable disk cache locks and GPU conflicts to eliminate Windows cache error
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

// Isolate user data to unique runtime folder
try {
  const uniqueDataDir = path.join(os.tmpdir(), 'jarvis-hud-session-' + process.pid);
  app.setPath('userData', uniqueDataDir);
} catch (e) {
  // ignore
}

let mainWindow;

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
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // Grant microphone & media permissions automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // Load Vite dev server or built dist/index.html
  const devUrl = 'http://localhost:5173';
  mainWindow.loadURL(devUrl).catch(() => {
    console.log('[Electron] Loading static dist/index.html...');
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
