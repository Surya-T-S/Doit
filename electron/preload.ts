import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getData: () => ipcRenderer.invoke('desktop:getData'),
  saveData: (data: string) => ipcRenderer.invoke('desktop:saveData', data),
  getDataPath: () => ipcRenderer.invoke('desktop:getPath'),
  getVersion: () => ipcRenderer.invoke('desktop:getVersion'),
});
