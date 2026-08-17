const { app, BrowserWindow, session, shell, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { fork, spawn, exec } = require('child_process');

// Completely disable disk cache locks and GPU conflicts to eliminate Windows cache error
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

// Isolate user data to unique runtime folder
try {
  const uniqueDataDir = path.join(os.tmpdir(), 'jarvis-hud-session-' + Date.now());
  app.setPath('userData', uniqueDataDir);
} catch (e) {
  // ignore
}

let mainWindow;
let backendProcess = null;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend', 'server.js');
  console.log('[Electron] Ensuring backend server is running from:', backendPath);
  try {
    backendProcess = fork(backendPath, [], {
      cwd: path.join(__dirname, '..', 'backend'),
      stdio: 'inherit'
    });
    backendProcess.on('error', (err) => console.error('[Electron] Backend error:', err));
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
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // Grant microphone & media permissions automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // Always load the fast built production dist/index.html first, fallback to dev server
  const distPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(distPath).catch(() => {
    console.log('[Electron] Fallback loading http://localhost:5173...');
    mainWindow.loadURL('http://localhost:5173');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler to guarantee external URLs open directly on the user's desktop browser
ipcMain.handle('open-url', async (event, url) => {
  console.log('[Electron IPC] Opening external URL:', url);
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    console.error('[Electron IPC] Failed to open URL:', err);
    return { success: false, error: err.message };
  }
});

// IPC handler to guarantee native desktop apps open directly in front of the user
ipcMain.handle('launch-app', async (event, appTarget) => {
  console.log('[Electron IPC] Launching native app:', appTarget);
  try {
    if (process.platform === 'win32') {
      const ps = spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process '${appTarget}'`], {
        stdio: 'ignore',
        detached: true
      });
      ps.unref();
      return { success: true };
    }
    exec(`open "${appTarget}"`, (err) => {});
    return { success: true };
  } catch (err) {
    console.error('[Electron IPC] Failed to launch app:', err);
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
