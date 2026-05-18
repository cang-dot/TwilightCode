import { BrowserWindow, nativeImage } from 'electron';
import path from 'path';

export function createMainWindow(): BrowserWindow {
  const logoPath = path.join(__dirname, '../renderer/assets/logo.png');
  const icon = nativeImage.createFromPath(logoPath);

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon,
    title: 'TwilightCode',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  return mainWindow;
}
