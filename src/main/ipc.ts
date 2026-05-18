import { BrowserWindow, ipcMain, dialog, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { IPC_CHANNELS } from '../types';
import * as sessions from '../core/storage/sessions';
import * as messages from '../core/storage/messages';
import * as snapshots from '../core/storage/snapshots';
import * as configStore from '../core/storage/config';
import { getDatabase } from '../core/storage/database';
import { parseAllAPIKeys, saveKeysPlain, loadKeysPlain } from '../core/config/keys';
import { PROVIDER_DEFAULTS } from '../core/config/defaults';
import { AIEngine } from '../core/ai/engine';

let aiEngine: AIEngine | null = null;

export function setupIPC(mainWindow: BrowserWindow): void {
  aiEngine = new AIEngine(mainWindow);

  // Window controls
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow.minimize());
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow.close());

  // App info
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => app.getVersion());
  ipcMain.handle(IPC_CHANNELS.APP_GET_PATH, (_, name: string) => app.getPath(name as any));

  // Session handlers
  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, (_, data) => sessions.createSession(data));
  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, () => sessions.listSessions());
  ipcMain.handle(IPC_CHANNELS.SESSION_UPDATE, (_, id, data) => sessions.updateSession(id, data));
  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, (_, id) => sessions.deleteSession(id));
  ipcMain.handle(IPC_CHANNELS.SESSION_ARCHIVE, (_, id) => sessions.archiveSession(id));
  ipcMain.handle(IPC_CHANNELS.SESSION_FORK, (_, id, messageId) => sessions.forkSession(id, messageId));
  ipcMain.handle(IPC_CHANNELS.SESSION_RENAME, (_, id, name) => sessions.renameSession(id, name));
  ipcMain.handle(IPC_CHANNELS.SESSION_SEARCH, (_, query) => sessions.searchSessions(query));

  // Message handlers
  ipcMain.handle(IPC_CHANNELS.MESSAGE_SEND, (_, sessionId, content) => {
    return messages.createMessage({ sessionId, role: 'user', content });
  });
  ipcMain.handle(IPC_CHANNELS.MESSAGE_LIST, (_, sessionId) => messages.listMessages(sessionId));
  ipcMain.handle(IPC_CHANNELS.MESSAGE_EDIT, (_, sessionId, messageId, newContent) => {
    return messages.editMessage(sessionId, messageId, newContent);
  });

  // Branch handlers
  ipcMain.handle(IPC_CHANNELS.BRANCH_SWITCH, (_, sessionId, branchId) => {
    sessions.updateSession(sessionId, { activeBranchId: branchId });
    return messages.listMessages(sessionId, branchId);
  });

  // AI handlers
  ipcMain.handle(IPC_CHANNELS.AI_CHAT, async (_, sessionId, content) => {
    if (!aiEngine) throw new Error('AI Engine not initialized');
    await aiEngine.chat(sessionId, content);
  });
  ipcMain.handle(IPC_CHANNELS.AI_CANCEL, async (_, sessionId) => {
    if (!aiEngine) throw new Error('AI Engine not initialized');
    await aiEngine.cancelChat(sessionId);
  });
  ipcMain.handle(IPC_CHANNELS.AI_SET_MODE, (_, sessionId, mode) => {
    sessions.updateSession(sessionId, { mode });
  });
  ipcMain.handle(IPC_CHANNELS.AI_SET_MODEL, (_, sessionId, providerId, modelId) => {
    sessions.updateSession(sessionId, { providerId, modelId });
  });
  ipcMain.handle(IPC_CHANNELS.AI_SET_THINKING, (_, sessionId, level) => {
    // Store thinking level in session config
  });

  // File handlers
  ipcMain.handle(IPC_CHANNELS.FILE_READ, (_, filePath) => {
    try {
      return fs.readFileSync(path.resolve(filePath), 'utf-8');
    } catch (err: any) {
      throw new Error(`Failed to read file: ${err.message}`);
    }
  });
  ipcMain.handle(IPC_CHANNELS.FILE_WRITE, (_, filePath, content) => {
    try {
      const dir = path.dirname(path.resolve(filePath));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.resolve(filePath), content, 'utf-8');
      return true;
    } catch (err: any) {
      throw new Error(`Failed to write file: ${err.message}`);
    }
  });
  ipcMain.handle(IPC_CHANNELS.FILE_EDIT, (_, filePath, oldText, newText) => {
    try {
      const resolved = path.resolve(filePath);
      const content = fs.readFileSync(resolved, 'utf-8');
      const newContent = content.replace(oldText, newText);
      fs.writeFileSync(resolved, newContent, 'utf-8');
      return true;
    } catch (err: any) {
      throw new Error(`Failed to edit file: ${err.message}`);
    }
  });
  ipcMain.handle(IPC_CHANNELS.FILE_DELETE, (_, filePath) => {
    try {
      fs.unlinkSync(path.resolve(filePath));
      return true;
    } catch (err: any) {
      throw new Error(`Failed to delete file: ${err.message}`);
    }
  });
  ipcMain.handle(IPC_CHANNELS.FILE_LIST, (_, dirPath) => {
    try {
      const resolved = path.resolve(dirPath);
      const items = fs.readdirSync(resolved, { withFileTypes: true });
      return items.map((item) => ({
        name: item.name,
        path: path.join(resolved, item.name),
        isDirectory: item.isDirectory(),
      }));
    } catch (err: any) {
      throw new Error(`Failed to list files: ${err.message}`);
    }
  });
  ipcMain.handle(IPC_CHANNELS.FILE_TREE, (_, dirPath) => {
    try {
      const resolved = path.resolve(dirPath);
      const items = fs.readdirSync(resolved, { withFileTypes: true });
      return {
        path: resolved,
        items: items.map((item) => ({
          name: item.name,
          path: path.join(resolved, item.name),
          isDirectory: item.isDirectory(),
        })),
      };
    } catch (err: any) {
      throw new Error(`Failed to get file tree: ${err.message}`);
    }
  });

  // Config handlers
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, () => configStore.getConfig());
  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, (_, key, value) => configStore.setConfig(key, value));
  ipcMain.handle(IPC_CHANNELS.CONFIG_IMPORT_KEYS, (_, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const keys = parseAllAPIKeys(content);
      saveKeysPlain(keys);
      return keys;
    } catch (err: any) {
      throw new Error(`Failed to import keys: ${err.message}`);
    }
  });
  ipcMain.handle(IPC_CHANNELS.CONFIG_ENCRYPT_KEYS, (_, password) => {
    // Encrypt keys with password
  });
  ipcMain.handle(IPC_CHANNELS.CONFIG_DECRYPT_KEYS, (_, password) => {
    // Decrypt keys with password
  });

  // Provider handlers
  ipcMain.handle(IPC_CHANNELS.PROVIDER_LIST, () => {
    const keys = loadKeysPlain();
    return Object.entries(PROVIDER_DEFAULTS).map(([id, config]) => ({
      ...config,
      hasKey: !!(keys[id] && keys[id].length > 0),
      keyCount: keys[id]?.length || 0,
    }));
  });
  ipcMain.handle(IPC_CHANNELS.PROVIDER_TEST, async (_, providerId) => {
    // Test provider connection
    return { ok: true, latencyMs: 0 };
  });
  ipcMain.handle(IPC_CHANNELS.PROVIDER_SAVE, (_, providerId, data) => {
    if (data.apiKey) {
      const keys = loadKeysPlain();
      keys[providerId] = [data.apiKey];
      saveKeysPlain(keys);
    }
  });
  ipcMain.handle(IPC_CHANNELS.PROVIDER_REMOVE, (_, providerId) => {
    const keys = loadKeysPlain();
    delete keys[providerId];
    saveKeysPlain(keys);
  });

  // Model listing handlers
  ipcMain.handle('models:list', async (_, providerId) => {
    const { listModelsForProvider } = await import('../core/ai/providers');
    return listModelsForProvider(providerId);
  });
  ipcMain.handle('models:listAll', async () => {
    const { listAllModels } = await import('../core/ai/providers');
    return listAllModels();
  });

  // Theme handlers
  ipcMain.handle(IPC_CHANNELS.THEME_GET, () => configStore.getConfig().themeId);
  ipcMain.handle(IPC_CHANNELS.THEME_SET, (_, themeId) => configStore.setConfig('themeId', themeId));
  ipcMain.handle(IPC_CHANNELS.THEME_SAVE, (_, theme) => {
    // Save custom theme
  });

  // Sound handlers
  ipcMain.handle(IPC_CHANNELS.SOUND_PLAY, (_, scene) => {
    // Play sound
  });
  ipcMain.handle(IPC_CHANNELS.SOUND_SET, (_, scene, filePath) => {
    // Set custom sound
  });

  // MCP handlers
  ipcMain.handle(IPC_CHANNELS.MCP_LIST, () => getDatabase().mcpServers);
  ipcMain.handle(IPC_CHANNELS.MCP_ADD, (_, server) => {
    const db = getDatabase();
    db.mcpServers.push(server);
  });
  ipcMain.handle(IPC_CHANNELS.MCP_REMOVE, (_, id) => {
    const db = getDatabase();
    db.mcpServers = db.mcpServers.filter((s) => s.id !== id);
  });
  ipcMain.handle(IPC_CHANNELS.MCP_CONNECT, (_, id) => {
    // Connect to MCP server
  });
  ipcMain.handle(IPC_CHANNELS.MCP_DISCONNECT, (_, id) => {
    // Disconnect from MCP server
  });

  // Snapshot handlers
  ipcMain.handle(IPC_CHANNELS.SNAPSHOT_LIST, (_, sessionId) => snapshots.listSnapshots(sessionId));
  ipcMain.handle(IPC_CHANNELS.SNAPSHOT_ROLLBACK, (_, snapshotId) => snapshots.rollbackSnapshot(snapshotId));
  ipcMain.handle(IPC_CHANNELS.SNAPSHOT_DIFF, (_, snapshotId) => snapshots.getSnapshotDiff(snapshotId));

  // Export/Import handlers
  ipcMain.handle(IPC_CHANNELS.EXPORT_SESSION, async (_, sessionId, format) => {
    const session = sessions.getSession(sessionId);
    const msgs = messages.listMessages(sessionId);
    if (!session) throw new Error('Session not found');

    if (format === 'json') {
      return JSON.stringify({ session, messages: msgs }, null, 2);
    } else {
      let md = `# ${session.name}\n\n`;
      for (const msg of msgs) {
        md += `## ${msg.role}\n\n${msg.content}\n\n`;
      }
      return md;
    }
  });
  ipcMain.handle(IPC_CHANNELS.IMPORT_SESSION, (_, filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  });

  // Dialog handlers
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (_, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters,
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: options?.filters,
    });
    return result.canceled ? null : result.filePath;
  });
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
}
