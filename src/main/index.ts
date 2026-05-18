import { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } from 'electron';
import path from 'path';
import { createMainWindow } from './window';
import { setupIPC } from './ipc';
import { createMenu } from './menu';
import { initDatabase } from '../core/storage/database';
import { startServer } from '../core/server/index';

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  initDatabase();

  mainWindow = createMainWindow();
  createMenu(mainWindow);
  setupIPC(mainWindow);
  startServer(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});
