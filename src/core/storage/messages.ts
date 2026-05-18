import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from './database';
import { getSession, updateSession } from './sessions';
import type { Message, Branch } from '../../types';

const TRUNK_BRANCH = '';

export function createMessage(data: Partial<Message> & { sessionId: string; role: Message['role']; content: string }): Message {
  const message: Message = {
    id: uuidv4(),
    sessionId: data.sessionId,
    role: data.role,
    content: data.content,
    reasoningContent: data.reasoningContent,
    toolCalls: data.toolCalls,
    toolResult: data.toolResult,
    branchId: data.branchId ?? getSession(data.sessionId)?.activeBranchId ?? TRUNK_BRANCH,
    createdAt: Date.now(),
  };

  const db = getDatabase();
  db.messages.push(message);
  saveDatabase();
  return message;
}

export function listMessages(sessionId: string, branchId?: string): Message[] {
  const db = getDatabase();
  const session = getSession(sessionId);
  if (!session) return [];

  const targetBranch = branchId ?? session.activeBranchId ?? TRUNK_BRANCH;
  const all = db.messages.filter((m) => m.sessionId === sessionId);
  all.sort((a, b) => a.createdAt - b.createdAt);

  if (targetBranch === TRUNK_BRANCH) {
    return all.filter((m) => m.branchId === TRUNK_BRANCH);
  }

  const branch = session.branches.find((b: Branch) => b.id === targetBranch);
  if (!branch) return all.filter((m) => m.branchId === TRUNK_BRANCH);

  const forkMsg = all.find((m) => m.id === branch.forkMessageId);
  const forkTime = forkMsg?.createdAt ?? 0;

  return all.filter((m) => {
    if (m.branchId === targetBranch) return true;
    if (m.branchId === TRUNK_BRANCH && m.createdAt <= forkTime && m.id !== branch.forkMessageId) return true;
    return false;
  });
}

export function getMessage(id: string): Message | undefined {
  return getDatabase().messages.find((m) => m.id === id);
}

export function updateMessage(id: string, data: Partial<Message>): Message | undefined {
  const db = getDatabase();
  const index = db.messages.findIndex((m) => m.id === id);
  if (index === -1) return undefined;

  db.messages[index] = { ...db.messages[index], ...data };
  saveDatabase();
  return db.messages[index];
}

export function deleteMessage(id: string): boolean {
  const db = getDatabase();
  const index = db.messages.findIndex((m) => m.id === id);
  if (index === -1) return false;

  db.messages.splice(index, 1);
  saveDatabase();
  return true;
}

export function clearSessionMessages(sessionId: string): void {
  const db = getDatabase();
  db.messages = db.messages.filter((m) => m.sessionId !== sessionId);
  saveDatabase();
}

export function editMessage(sessionId: string, messageId: string, newContent: string): { messages: Message[]; branchId: string } {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const original = getMessage(messageId);
  if (!original) throw new Error('Message not found');
  if (original.role !== 'user') throw new Error('Can only edit user messages');

  const branchId = uuidv4().slice(0, 8);
  const branchName = String(session.branches.length + 1);

  const branch: Branch = {
    id: branchId,
    name: branchName,
    forkMessageId: messageId,
    createdAt: Date.now(),
  };

  updateSession(sessionId, {
    branches: [...(session.branches || []), branch],
    activeBranchId: branchId,
  });

  const editedMessage = createMessage({
    sessionId,
    role: 'user',
    content: newContent,
    branchId,
  });

  const messages = listMessages(sessionId, branchId);
  return { messages, branchId };
}

export function deleteMessagesAfter(sessionId: string, messageId: string): Message[] {
  const db = getDatabase();
  const sessionMessages = db.messages.filter((m) => m.sessionId === sessionId);
  const targetIndex = sessionMessages.findIndex((m) => m.id === messageId);
  if (targetIndex === -1) return [];

  const keepIds = new Set(sessionMessages.slice(0, targetIndex + 1).map((m) => m.id));
  const deleted = db.messages.filter((m) => m.sessionId === sessionId && !keepIds.has(m.id));
  db.messages = db.messages.filter((m) => m.sessionId !== sessionId || keepIds.has(m.id));
  saveDatabase();
  return deleted;
}
