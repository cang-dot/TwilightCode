import { v4 as uuidv4 } from 'uuid';
import * as diff from 'diff';
import { getDatabase, saveDatabase } from './database';
import type { FileSnapshot } from '../../types';

export function createSnapshot(sessionId: string, filePath: string, content: string): FileSnapshot {
  const db = getDatabase();
  const existing = db.snapshots.filter((s) => s.sessionId === sessionId && s.filePath === filePath);
  const version = existing.length + 1;

  const previousSnapshot = existing[existing.length - 1];
  const diffResult = previousSnapshot
    ? diff.createPatch(filePath, previousSnapshot.content, content)
    : undefined;

  const snapshot: FileSnapshot = {
    id: uuidv4(),
    sessionId,
    filePath,
    version,
    timestamp: Date.now(),
    content,
    diff: diffResult,
  };

  db.snapshots.push(snapshot);
  saveDatabase();
  return snapshot;
}

export function listSnapshots(sessionId: string): FileSnapshot[] {
  return getDatabase().snapshots.filter((s) => s.sessionId === sessionId);
}

export function getSnapshot(id: string): FileSnapshot | undefined {
  return getDatabase().snapshots.find((s) => s.id === id);
}

export function rollbackSnapshot(id: string): string | null {
  const snapshot = getSnapshot(id);
  if (!snapshot) return null;
  return snapshot.content;
}

export function getSnapshotDiff(id: string): string | null {
  const snapshot = getSnapshot(id);
  if (!snapshot) return null;

  const db = getDatabase();
  const previous = db.snapshots
    .filter((s) => s.sessionId === snapshot.sessionId && s.filePath === snapshot.filePath && s.version < snapshot.version)
    .sort((a, b) => b.version - a.version)[0];

  if (!previous) return diff.createPatch(snapshot.filePath, '', snapshot.content);
  return diff.createPatch(snapshot.filePath, previous.content, snapshot.content);
}
