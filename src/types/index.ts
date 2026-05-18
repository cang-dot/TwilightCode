// ===== Branch =====
export interface Branch {
  id: string;
  name: string;
  forkMessageId: string;
  createdAt: number;
}

// ===== Session & Messages =====
export interface Session {
  id: string;
  name: string;
  mode: AiMode;
  modelId: string;
  providerId: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  parentId?: string;
  forkMessageId?: string;
  branches: Branch[];
  activeBranchId: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  reasoningContent?: string;
  toolCalls?: ToolCall[];
  toolResult?: string;
  usage?: Usage;
  branchId: string;
  createdAt: number;
}

// ===== AI Engine =====
export type AiMode = 'chat' | 'plan' | 'action';
export type ThinkingLevel = 'low' | 'medium' | 'high';

export interface ChatRequest {
  model: string;
  messages: Message[];
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: ThinkingLevel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: ToolDef[];
}

export interface ChatResponse {
  content: string;
  reasoningContent?: string;
  toolCalls?: ToolCall[];
  usage: { promptTokens: number; completionTokens: number };
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
}

export interface StreamChunk {
  delta?: string;
  reasoningDelta?: string;
  toolCalls?: ToolCall[];
  usage?: Usage;
  done: boolean;
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolCallStartEvent {
  sessionId: string;
  callId: string;
  toolName: string;
  args: string;
}

export interface ToolCallEndEvent {
  sessionId: string;
  callId: string;
  success: boolean;
  result: string;
}

// ===== Provider =====
export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyFormat: string;
  keyObtainUrl: string;
  docsUrl: string;
  models: string[];
  chatEndpoint: string;
  authHeader: string;
  apiFormat: 'openai' | 'anthropic' | 'custom';
  type: 'chat' | 'search';
  supportsThinking?: boolean;
  multimodal?: boolean;
}

export interface ProviderSaveData {
  apiKey?: string;
  baseUrl?: string;
  models?: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  contextLength?: number;
  maxOutput?: number;
  supportsThinking?: boolean;
  multimodal?: boolean;
}

// ===== Theme =====
export interface Theme {
  id: string;
  name: string;
  background: string;
  backgroundPanel: string;
  backgroundElement: string;
  backgroundHover: string;
  backgroundActive: string;
  sidebarBg: string;
  border: string;
  borderSubtle: string;
  borderActive: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentHover: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  diffAdded: string;
  diffRemoved: string;
  shadow: string;
  radius: string;
  radiusSm: string;
}

// ===== Sounds =====
export type SoundScene = 'confirm' | 'error' | 'complete' | 'message';

// ===== File Snapshots =====
export interface FileSnapshot {
  id: string;
  sessionId: string;
  filePath: string;
  version: number;
  timestamp: number;
  content: string;
  diff?: string;
}

// ===== File Tree =====
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: number;
}

export interface FileTree {
  path: string;
  items: FileItem[];
}

// ===== MCP =====
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  connected: boolean;
  tools?: ToolDef[];
}

// ===== Search =====
export interface SearchResult {
  sessions: Session[];
  files: FileItem[];
  settings: string[];
}

// ===== Config =====
export interface AppConfig {
  currentDirectory: string;
  currentSessionId: string | null;
  themeId: string;
  language: string;
  autoAcceptPermissions: boolean;
  showReasoningSummary: boolean;
  expandShellTools: boolean;
  expandEditTools: boolean;
  showProgressBar: boolean;
  soundEnabled: boolean;
  soundVolume: number;
}

// ===== Export/Import =====
export interface ExportData {
  version: string;
  exportedAt: number;
  session: Session;
  messages: Message[];
}

// ===== Clawbot =====
export interface ClawbotInbound {
  session_id: string;
  message: {
    text: string;
    kind: string;
  };
}

export interface ClawbotOutbound {
  reply: string;
  status: 'ok' | 'processing';
}

// ===== IPC Channels =====
export const IPC_CHANNELS = {
  // Session
  SESSION_CREATE: 'session:create',
  SESSION_LIST: 'session:list',
  SESSION_UPDATE: 'session:update',
  SESSION_DELETE: 'session:delete',
  SESSION_ARCHIVE: 'session:archive',
  SESSION_FORK: 'session:fork',
  SESSION_RENAME: 'session:rename',
  SESSION_SEARCH: 'session:search',

  // Message
  MESSAGE_SEND: 'message:send',
  MESSAGE_LIST: 'message:list',
  MESSAGE_EDIT: 'message:edit',

  // Branch
  BRANCH_SWITCH: 'branch:switch',

  // AI
  AI_CHAT: 'ai:chat',
  AI_CANCEL: 'ai:cancel',
  AI_SET_MODE: 'ai:set-mode',
  AI_SET_MODEL: 'ai:set-model',
  AI_SET_THINKING: 'ai:set-thinking',

  // Events (main -> renderer)
  SESSION_CREATED: 'session:created',
  SESSION_UPDATED: 'session:updated',
  SESSION_DELETED: 'session:deleted',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  AI_STREAM_CHUNK: 'ai:stream-chunk',
  AI_STREAM_DONE: 'ai:stream-done',
  AI_ERROR: 'ai:error',
  TOOL_CALL_START: 'tool:call-start',
  TOOL_CALL_END: 'tool:call-end',

  // File
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_EDIT: 'file:edit',
  FILE_DELETE: 'file:delete',
  FILE_LIST: 'file:list',
  FILE_TREE: 'file:tree',

  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_IMPORT_KEYS: 'config:import-keys',
  CONFIG_ENCRYPT_KEYS: 'config:encrypt-keys',
  CONFIG_DECRYPT_KEYS: 'config:decrypt-keys',

  // Provider
  PROVIDER_LIST: 'provider:list',
  PROVIDER_TEST: 'provider:test',
  PROVIDER_SAVE: 'provider:save',
  PROVIDER_REMOVE: 'provider:remove',

  // Theme
  THEME_GET: 'theme:get',
  THEME_SET: 'theme:set',
  THEME_SAVE: 'theme:save',

  // Sound
  SOUND_PLAY: 'sound:play',
  SOUND_SET: 'sound:set',

  // MCP
  MCP_LIST: 'mcp:list',
  MCP_ADD: 'mcp:add',
  MCP_REMOVE: 'mcp:remove',
  MCP_CONNECT: 'mcp:connect',
  MCP_DISCONNECT: 'mcp:disconnect',

  // Snapshot
  SNAPSHOT_LIST: 'snapshot:list',
  SNAPSHOT_ROLLBACK: 'snapshot:rollback',
  SNAPSHOT_DIFF: 'snapshot:diff',

  // Export/Import
  EXPORT_SESSION: 'export:session',
  IMPORT_SESSION: 'import:session',

  // Dialog
  DIALOG_OPEN_FILE: 'dialog:open-file',
  DIALOG_SAVE_FILE: 'dialog:save-file',
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // App
  APP_GET_VERSION: 'app:get-version',
  APP_GET_PATH: 'app:get-path',
} as const;
