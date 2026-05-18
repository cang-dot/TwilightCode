import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const getDbPath = (): string => {
  const userData = app.getPath('userData');
  return path.join(userData, 'twilightcode.json');
};

interface DbData {
  sessions: any[];
  messages: any[];
  config: Record<string, any>;
  providers: Record<string, any>;
  themes: Record<string, any>;
  mcpServers: any[];
  snapshots: any[];
}

const defaultData: DbData = {
  sessions: [],
  messages: [],
  config: {},
  providers: {},
  themes: {},
  mcpServers: [],
  snapshots: [],
};

let data: DbData = { ...defaultData };
let dbPath: string = '';

export function initDatabase(): void {
  dbPath = getDbPath();
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      data = { ...defaultData, ...JSON.parse(raw) };
    } else {
      saveDatabase();
    }
  } catch {
    data = { ...defaultData };
    saveDatabase();
  }
}

export function saveDatabase(): void {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

export function getDatabase(): DbData {
  return data;
}

export function getCollection<K extends keyof DbData>(name: K): DbData[K] {
  return data[name];
}

export function setCollection<K extends keyof DbData>(name: K, value: DbData[K]): void {
  data[name] = value;
  saveDatabase();
}
