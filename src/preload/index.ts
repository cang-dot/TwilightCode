import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../types';

const api = {
  // Window
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

  // App
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  getPath: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PATH, name),

  // Session
  createSession: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE),
  listSessions: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),
  updateSession: (id: string, data: any) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_UPDATE, id, data),
  deleteSession: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, id),
  archiveSession: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_ARCHIVE, id),
  forkSession: (id: string, messageId: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_FORK, id, messageId),
  renameSession: (id: string, name: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_RENAME, id, name),
  searchSession: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_SEARCH, query),

  // Message
  sendMessage: (sessionId: string, content: string) => ipcRenderer.invoke(IPC_CHANNELS.MESSAGE_SEND, sessionId, content),
  listMessages: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.MESSAGE_LIST, sessionId),
  editMessage: (sessionId: string, messageId: string, newContent: string) => ipcRenderer.invoke(IPC_CHANNELS.MESSAGE_EDIT, sessionId, messageId, newContent),

  // Branch
  switchBranch: (sessionId: string, branchId: string) => ipcRenderer.invoke(IPC_CHANNELS.BRANCH_SWITCH, sessionId, branchId),

  // AI
  chat: (sessionId: string, content: string) => ipcRenderer.invoke(IPC_CHANNELS.AI_CHAT, sessionId, content),
  cancelChat: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.AI_CANCEL, sessionId),
  setMode: (sessionId: string, mode: string) => ipcRenderer.invoke(IPC_CHANNELS.AI_SET_MODE, sessionId, mode),
  setModel: (sessionId: string, providerId: string, modelId: string) => ipcRenderer.invoke(IPC_CHANNELS.AI_SET_MODEL, sessionId, providerId, modelId),
  setThinking: (sessionId: string, level: string) => ipcRenderer.invoke(IPC_CHANNELS.AI_SET_THINKING, sessionId, level),

  // File
  readFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_READ, filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_WRITE, filePath, content),
  editFile: (filePath: string, old: string, newContent: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_EDIT, filePath, old, newContent),
  deleteFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_DELETE, filePath),
  listFiles: (dirPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_LIST, dirPath),
  fileTree: (dirPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_TREE, dirPath),

  // Config
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
  setConfig: (key: string, value: any) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, key, value),
  importKeys: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_IMPORT_KEYS, filePath),
  encryptKeys: (password: string) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_ENCRYPT_KEYS, password),
  decryptKeys: (password: string) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_DECRYPT_KEYS, password),

  // Provider
  listProviders: () => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_LIST),
  testProvider: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_TEST, id),
  saveProvider: (id: string, data: any) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_SAVE, id, data),
  removeProvider: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_REMOVE, id),

  // Models
  listModels: (providerId: string) => ipcRenderer.invoke('models:list', providerId),
  listAllModels: () => ipcRenderer.invoke('models:listAll'),

  // Theme
  getTheme: () => ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),
  setTheme: (themeId: string) => ipcRenderer.invoke(IPC_CHANNELS.THEME_SET, themeId),
  saveTheme: (theme: any) => ipcRenderer.invoke(IPC_CHANNELS.THEME_SAVE, theme),

  // Sound
  playSound: (scene: string) => ipcRenderer.invoke(IPC_CHANNELS.SOUND_PLAY, scene),
  setSound: (scene: string, filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.SOUND_SET, scene, filePath),

  // MCP
  listMCP: () => ipcRenderer.invoke(IPC_CHANNELS.MCP_LIST),
  addMCP: (server: any) => ipcRenderer.invoke(IPC_CHANNELS.MCP_ADD, server),
  removeMCP: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MCP_REMOVE, id),
  connectMCP: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MCP_CONNECT, id),
  disconnectMCP: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MCP_DISCONNECT, id),

  // Snapshot
  listSnapshots: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.SNAPSHOT_LIST, sessionId),
  rollbackSnapshot: (snapshotId: string) => ipcRenderer.invoke(IPC_CHANNELS.SNAPSHOT_ROLLBACK, snapshotId),
  diffSnapshot: (snapshotId: string) => ipcRenderer.invoke(IPC_CHANNELS.SNAPSHOT_DIFF, snapshotId),

  // Export/Import
  exportSession: (sessionId: string, format: string) => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_SESSION, sessionId, format),
  importSession: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.IMPORT_SESSION, filePath),

  // Dialog
  openFile: (options?: any) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
  saveFile: (options?: any) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, options),
  openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),

  // Event listeners
  onSessionCreated: (callback: (session: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SESSION_CREATED, (_, session) => callback(session));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.SESSION_CREATED);
  },
  onSessionUpdated: (callback: (session: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SESSION_UPDATED, (_, session) => callback(session));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.SESSION_UPDATED);
  },
  onSessionDeleted: (callback: (id: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SESSION_DELETED, (_, id) => callback(id));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.SESSION_DELETED);
  },
  onMessageNew: (callback: (message: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.MESSAGE_NEW, (_, message) => callback(message));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.MESSAGE_NEW);
  },
  onMessageUpdated: (callback: (message: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.MESSAGE_UPDATED, (_, message) => callback(message));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.MESSAGE_UPDATED);
  },
  onStreamChunk: (callback: (sessionId: string, chunk: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.AI_STREAM_CHUNK, (_, sessionId, chunk) => callback(sessionId, chunk));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.AI_STREAM_CHUNK);
  },
  onStreamDone: (callback: (sessionId: string, response: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.AI_STREAM_DONE, (_, sessionId, response) => callback(sessionId, response));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.AI_STREAM_DONE);
  },
  onError: (callback: (sessionId: string, error: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.AI_ERROR, (_, sessionId, error) => callback(sessionId, error));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.AI_ERROR);
  },
  onThemeChanged: (callback: (theme: any) => void) => {
    ipcRenderer.on('theme:changed', (_, theme) => callback(theme));
    return () => ipcRenderer.removeAllListeners('theme:changed');
  },
  onConfigUpdated: (callback: (config: any) => void) => {
    ipcRenderer.on('config:updated', (_, config) => callback(config));
    return () => ipcRenderer.removeAllListeners('config:updated');
  },
  onToolCallStart: (callback: (data: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TOOL_CALL_START, (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.TOOL_CALL_START);
  },
  onToolCallEnd: (callback: (data: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TOOL_CALL_END, (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.TOOL_CALL_END);
  },
};

contextBridge.exposeInMainWorld('api', api);

export type TwilightAPI = typeof api;
