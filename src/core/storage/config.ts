import { getDatabase, saveDatabase } from './database';
import type { AppConfig } from '../../types';

const defaultConfig: AppConfig = {
  currentDirectory: process.env.HOME || process.env.USERPROFILE || '',
  currentSessionId: null,
  themeId: 'dark',
  language: 'zh-CN',
  autoAcceptPermissions: false,
  showReasoningSummary: true,
  expandShellTools: false,
  expandEditTools: false,
  showProgressBar: true,
  soundEnabled: true,
  soundVolume: 0.5,
};

export function getConfig(): AppConfig {
  const db = getDatabase();
  return { ...defaultConfig, ...db.config };
}

export function setConfig(key: string, value: any): void {
  const db = getDatabase();
  db.config[key] = value;
  saveDatabase();
}

export function setConfigBulk(config: Partial<AppConfig>): void {
  const db = getDatabase();
  db.config = { ...db.config, ...config };
  saveDatabase();
}

export function resetConfig(): void {
  const db = getDatabase();
  db.config = { ...defaultConfig };
  saveDatabase();
}
