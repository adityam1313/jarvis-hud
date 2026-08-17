const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const os = require('os');

// Configure custom isolated cache directory to prevent Windows cache permission locks
try {
  const cacheDir = path.join(os.tmpdir(), 'jarvis-hud-desktop-data');
  app.setPath('userData', cacheDir);
} catch (e) {
  // fallback to default
}

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');

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
    show: false, // show after ready-to-show to prevent white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // allows local websocket & media streams
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Grant microphone & media permissions automatically for voice commands
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'audioCapture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(true);
    }
  });

  // Load Vite dev server with fallback
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
