import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from './database';
import type { Session } from '../../types';

export function createSession(data: Partial<Session> = {}): Session {
  const session: Session = {
    id: uuidv4(),
    name: data.name || 'New Chat',
    mode: data.mode || 'chat',
    modelId: data.modelId || 'deepseek-v4-flash',
    providerId: data.providerId || 'deepseek',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    archived: false,
    branches: [
      { id: '', name: '1', forkMessageId: '', createdAt: Date.now() },
    ],
    activeBranchId: '',
    ...data,
  };

  const db = getDatabase();
  db.sessions.unshift(session);
  saveDatabase();
  return session;
}

export function listSessions(): Session[] {
  return getDatabase().sessions;
}

export function getSession(id: string): Session | undefined {
  return getDatabase().sessions.find((s) => s.id === id);
}

export function updateSession(id: string, data: Partial<Session>): Session | undefined {
  const db = getDatabase();
  const index = db.sessions.findIndex((s) => s.id === id);
  if (index === -1) return undefined;

  db.sessions[index] = { ...db.sessions[index], ...data, updatedAt: Date.now() };
  saveDatabase();
  return db.sessions[index];
}

export function deleteSession(id: string): boolean {
  const db = getDatabase();
  const index = db.sessions.findIndex((s) => s.id === id);
  if (index === -1) return false;

  db.sessions.splice(index, 1);
  db.messages = db.messages.filter((m) => m.sessionId !== id);
  saveDatabase();
  return true;
}

export function archiveSession(id: string): Session | undefined {
  return updateSession(id, { archived: true });
}

export function renameSession(id: string, name: string): Session | undefined {
  return updateSession(id, { name });
}

export function forkSession(parentId: string, messageId: string): Session | undefined {
  const parent = getSession(parentId);
  if (!parent) return undefined;

  return createSession({
    name: `${parent.name} (fork)`,
    mode: parent.mode,
    modelId: parent.modelId,
    providerId: parent.providerId,
    parentId,
    forkMessageId: messageId,
  });
}

export function searchSessions(query: string): Session[] {
  const lower = query.toLowerCase();
  return getDatabase().sessions.filter(
    (s) => s.name.toLowerCase().includes(lower) && !s.archived
  );
}
