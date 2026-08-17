const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvisDesktop', {
  isElectron: true,
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  launchApp: (appName) => ipcRenderer.invoke('launch-app', appName)
});
