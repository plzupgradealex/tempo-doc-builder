/**
 * Persistence layer: IndexedDB for saved agendas + JSON file import/export.
 */

import type { Agenda, KnowledgeDomain } from './types';

const DB_NAME = 'tempo';
const DB_VERSION = 1;

const STORES = {
  agendas: 'agendas',
  domains: 'domains',
} as const;

// ─── Database Connection ───

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.agendas)) {
        db.createObjectStore(STORES.agendas, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.domains)) {
        db.createObjectStore(STORES.domains, { keyPath: 'id' });
      }
    };
  });
}

// ─── Generic CRUD Helpers ───

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function put<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Agenda Operations ───

export async function saveAgenda(agenda: Agenda): Promise<void> {
  await put(STORES.agendas, agenda);
}

export async function loadAgenda(id: string): Promise<Agenda | undefined> {
  const all = await getAll<Agenda>(STORES.agendas);
  return all.find((a) => a.id === id);
}

export async function listAgendas(): Promise<Agenda[]> {
  return getAll<Agenda>(STORES.agendas);
}

export async function deleteAgenda(id: string): Promise<void> {
  await remove(STORES.agendas, id);
}

// ─── Domain Operations ───

export async function saveCustomDomains(domains: KnowledgeDomain[]): Promise<void> {
  await clearStore(STORES.domains);
  for (const d of domains) {
    await put(STORES.domains, d);
  }
}

export async function loadCustomDomains(): Promise<KnowledgeDomain[]> {
  return getAll<KnowledgeDomain>(STORES.domains);
}

// ─── JSON File Export / Import ───

export function exportAgendaToJSON(agenda: Agenda): void {
  const blob = new Blob([JSON.stringify(agenda, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tempo-agenda-${agenda.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Draft (localStorage) ───

const DRAFT_KEY = 'tempo-draft';

export function saveDraft(agenda: Agenda): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(agenda));
  } catch { /* quota exceeded — silently ignore */ }
}

export function loadDraft(): Agenda | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const agenda = JSON.parse(raw) as Agenda;
    if (!agenda.id || !agenda.days) return null;
    return agenda;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function importAgendaFromJSON(file: File): Promise<Agenda> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const agenda = JSON.parse(reader.result as string) as Agenda;
        if (!agenda.id || !agenda.days) {
          throw new Error('Invalid agenda file');
        }
        resolve(agenda);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
