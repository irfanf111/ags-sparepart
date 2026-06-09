const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dbCall: (table, action, data = null, id = null) => ipcRenderer.invoke('db-call', { table, action, data, id }),
  backupDB: () => ipcRenderer.invoke('backup-db'),
  restoreDB: () => ipcRenderer.invoke('restore-db'),
  focusWindow: () => ipcRenderer.invoke('focus-window'),
  setZoomFactor: (factor) => {
    try {
      webFrame.setZoomFactor(factor);
    } catch (e) {
      console.error('Failed to set zoom factor:', e);
    }
  },
  getZoomFactor: () => {
    try {
      return webFrame.getZoomFactor();
    } catch (e) {
      return 1.0;
    }
  }
});
