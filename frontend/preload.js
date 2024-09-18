const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer
});

window.addEventListener('DOMContentLoaded', () => {
    window.ipcRenderer = ipcRenderer;
});
