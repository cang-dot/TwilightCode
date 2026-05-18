import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { encrypt, decrypt } from './encrypt';

interface KeyStore {
  [providerId: string]: string[];
}

const getKeysPath = (): string => {
  return path.join(app.getPath('userData'), 'keys.enc');
};

const getConfigPath = (): string => {
  return path.join(app.getPath('userData'), 'keys.json');
};

export function parseAllAPIKeys(content: string): KeyStore {
  const lines = content.split('\n').filter((l) => l.trim());
  const result: KeyStore = {};
  let currentName = '';
  let currentUrl = '';
  let currentKeys: string[] = [];

  const flush = () => {
    if (currentKeys.length > 0) {
      const providerId = matchProvider(currentName, currentUrl, currentKeys);
      if (!result[providerId]) result[providerId] = [];
      result[providerId].push(...currentKeys);
    }
    currentKeys = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.includes('://')) {
      currentUrl = trimmed;
    } else if (/^(sk-|tp-|gsk_|sk-or-|sk-ant-|pplx-|r8_|AIza|sk-proj-)/.test(trimmed)) {
      currentKeys.push(trimmed);
    } else {
      flush();
      currentName = trimmed;
      currentUrl = '';
    }
  }
  flush();

  return result;
}

function matchProvider(name: string, url: string, keys: string[]): string {
  const urlMap: Record<string, string> = {
    'api.deepseek.com': 'deepseek',
    'xiaomimimo.com': 'xiaomi_mimo',
    'api.openai.com': 'openai',
    'api.anthropic.com': 'anthropic',
    'openrouter.ai': 'openrouter',
    'siliconflow.cn': 'siliconflow',
    'api.bocha.cn': 'bocha',
    'api.bochaai.com': 'bocha',
    'api.moonshot.cn': 'moonshot',
    'open.bigmodel.cn': 'zhipu',
    'api.doubao-ai.com': 'doubao',
    'api.lingyiwanwu.com': 'lingyiwanwu',
    'api.minimax.io': 'minimax',
    'api.groq.com': 'groq',
    'api.mistral.ai': 'mistral',
    'api.perplexity.ai': 'perplexity',
    'api.together.xyz': 'together',
    'generativelanguage.googleapis.com': 'google',
  };

  for (const [domain, id] of Object.entries(urlMap)) {
    if (url.includes(domain)) return id;
  }

  for (const key of keys) {
    if (key.startsWith('sk-or-')) return 'openrouter';
    if (key.startsWith('sk-ant-')) return 'anthropic';
    if (key.startsWith('tp-')) return 'xiaomi_mimo';
    if (key.startsWith('gsk_')) return 'groq';
    if (key.startsWith('pplx-')) return 'perplexity';
  }

  return 'custom';
}

export function saveKeysEncrypted(keys: KeyStore, password: string): void {
  const data = JSON.stringify(keys);
  const encrypted = encrypt(data, password);
  fs.writeFileSync(getKeysPath(), encrypted, 'utf-8');
}

export function loadKeysEncrypted(password: string): KeyStore | null {
  try {
    const encrypted = fs.readFileSync(getKeysPath(), 'utf-8');
    const decrypted = decrypt(encrypted, password);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

export function saveKeysPlain(keys: KeyStore): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(keys, null, 2), 'utf-8');
}

export function loadKeysPlain(): KeyStore {
  try {
    const data = fs.readFileSync(getConfigPath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function hasEncryptedKeys(): boolean {
  return fs.existsSync(getKeysPath());
}

export function getApiKey(providerId: string): string | null {
  const keys = loadKeysPlain();
  const providerKeys = keys[providerId];
  if (!providerKeys || providerKeys.length === 0) return null;
  return providerKeys[0];
}
