import fs from 'node:fs';
import path from 'node:path';
import { decryptPayload, encryptPayload } from './security.js';
import type { AppState, JournalEntry } from './types.js';

export function dataDir(): string {
  return path.join(process.cwd(), 'data');
}

export function ensureDataDirectory(): void {
  const dir = dataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function filePath(name: string): string {
  return path.join(dataDir(), name);
}

export function writeJsonFile<T>(fileName: string, data: T): void {
  const fullPath = filePath(fileName);
  const tempPath = `${fullPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, fullPath);
}

export function readJsonFile<T>(fileName: string): T | null {
  const fullPath = filePath(fileName);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

export function writeJsonAtomic<T>(fileName: string, data: T, masterKey: string): void {
  const fullPath = filePath(fileName);
  const tempPath = `${fullPath}.tmp`;
  const serialized = JSON.stringify(data, null, 2);
  const encrypted = encryptPayload(serialized, masterKey);
  fs.writeFileSync(tempPath, encrypted, 'utf8');
  fs.renameSync(tempPath, fullPath);
}

export function readJsonEncrypted<T>(fileName: string, masterKey: string): T | null {
  const fullPath = filePath(fileName);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const encrypted = fs.readFileSync(fullPath, 'utf8');
  const decrypted = decryptPayload(encrypted, masterKey);
  return JSON.parse(decrypted) as T;
}

export function appendJournalEntry(entry: JournalEntry, masterKey: string): void {
  ensureDataDirectory();
  const journalPath = filePath('journal.log.enc');
  const current = fs.existsSync(journalPath)
    ? readEncryptedLines(journalPath, masterKey)
    : [];

  current.push(JSON.stringify(entry));
  const content = current.join('\n');
  const encrypted = encryptPayload(content, masterKey);
  const tempPath = `${journalPath}.tmp`;
  fs.writeFileSync(tempPath, encrypted, 'utf8');
  fs.renameSync(tempPath, journalPath);

  rotateJournalIfNeeded(masterKey);
}

export function readJournalEntries(masterKey: string): JournalEntry[] {
  const journalPath = filePath('journal.log.enc');
  if (!fs.existsSync(journalPath)) {
    return [];
  }

  const content = readEncryptedLines(journalPath, masterKey);
  return content.filter(Boolean).map((item) => JSON.parse(item) as JournalEntry);
}

export function readEncryptedLines(filePathValue: string, masterKey: string): string[] {
  const encrypted = fs.readFileSync(filePathValue, 'utf8');
  const decrypted = decryptPayload(encrypted, masterKey);
  if (!decrypted.trim()) {
    return [];
  }
  return decrypted.split('\n').filter((line) => line.length > 0);
}

export function rotateJournalIfNeeded(masterKey: string): void {
  const journalPath = filePath('journal.log.enc');
  if (!fs.existsSync(journalPath)) {
    return;
  }

  const stats = fs.statSync(journalPath);
  const maxSize = 10 * 1024 * 1024;
  if (stats.size <= maxSize) {
    return;
  }

  const rotated = filePath(`journal-${Date.now()}.log.enc`);
  fs.renameSync(journalPath, rotated);

  const entries = readJournalEntries(masterKey).filter((entry) => {
    const ageDays = (Date.now() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 180;
  });

  const content = entries.map((entry) => JSON.stringify(entry)).join('\n');
  const encrypted = encryptPayload(content, masterKey);
  fs.writeFileSync(journalPath, encrypted, 'utf8');
}

export function initializeStateIfNeeded(): AppState {
  ensureDataDirectory();
  return {
    config: {
      masterKey: '',
      createdAt: new Date().toISOString(),
      firstAdmin: ''
    },
    users: [],
    organizations: [],
    batches: [],
    equipment: [],
    movements: [],
    journal: []
  };
}
