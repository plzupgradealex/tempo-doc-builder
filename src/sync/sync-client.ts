/**
 * Sync client — pushes and pulls the full agenda library to/from CF KV
 * via the tempo-sync Worker.  All data is keyed by a SHA-256 hash of
 * the user's passphrase, so there are no accounts and no passwords.
 *
 * Merge strategy: union of agendas by id; newest updatedAt wins.
 */

import type { Agenda, KnowledgeDomain } from '../types';
import { listAgendas, saveAgenda, loadCustomDomains, saveCustomDomains } from '../storage';
import { hashPhrase, getSavedPhrase } from './passphrase';
import { encrypt, decrypt } from './crypto';
import { emit } from '../bus';

/** The worker base URL — set via env or fall back to production. */
const API = (import.meta as unknown as { env: Record<string, string> }).env
  ?.VITE_SYNC_API ?? 'https://tempo-sync.alex-31f.workers.dev';

interface SyncPayload {
  agendas: Agenda[];
  domains: KnowledgeDomain[];
  syncedAt: string;
}

/* ─── Push (upload local → KV) ─── */

export async function pushLibrary(): Promise<void> {
  const phrase = getSavedPhrase();
  if (!phrase) return;

  const key = await hashPhrase(phrase);
  const agendas = await listAgendas();
  const domains = await loadCustomDomains();

  const payload: SyncPayload = {
    agendas,
    domains,
    syncedAt: new Date().toISOString(),
  };

  const encrypted = await encrypt(JSON.stringify(payload), phrase);

  const res = await fetch(`${API}/api/sync`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Sync-Key': key,
    },
    body: JSON.stringify({ encrypted }),
  });

  if (!res.ok) throw new Error(`Sync push failed: ${res.status}`);
  emit('sync-status', { status: 'pushed' });
}

/* ─── Pull (download KV → merge into local) ─── */

export async function pullLibrary(): Promise<{ merged: number }> {
  const phrase = getSavedPhrase();
  if (!phrase) return { merged: 0 };

  const key = await hashPhrase(phrase);
  const res = await fetch(`${API}/api/sync`, {
    method: 'GET',
    headers: { 'X-Sync-Key': key },
  });

  if (!res.ok) throw new Error(`Sync pull failed: ${res.status}`);

  const raw = await res.json();

  // Support both encrypted and legacy unencrypted payloads
  let remote: SyncPayload;
  if (raw.encrypted) {
    const decrypted = await decrypt(raw.encrypted, phrase);
    remote = JSON.parse(decrypted) as SyncPayload;
  } else {
    remote = raw as SyncPayload;
  }

  const localAgendas = await listAgendas();

  // Merge: union by id, newest updatedAt wins
  const localMap = new Map(localAgendas.map((a) => [a.id, a]));
  let merged = 0;

  for (const remoteAgenda of remote.agendas) {
    const local = localMap.get(remoteAgenda.id);
    if (!local || remoteAgenda.updatedAt > local.updatedAt) {
      await saveAgenda(remoteAgenda);
      merged++;
    }
  }

  // Merge domains: if remote has custom domains and local doesn't, use remote
  const localDomains = await loadCustomDomains();
  if (remote.domains.length > 0 && localDomains.length === 0) {
    await saveCustomDomains(remote.domains);
  }

  emit('sync-status', { status: 'pulled', merged });
  return { merged };
}

/* ─── Full bi-directional sync ─── */

export async function syncLibrary(): Promise<{ merged: number }> {
  emit('sync-status', { status: 'syncing' });
  try {
    const result = await pullLibrary();
    await pushLibrary();
    emit('sync-status', { status: 'done', merged: result.merged });
    return result;
  } catch (err) {
    emit('sync-status', { status: 'error', error: String(err) });
    throw err;
  }
}

/** True when a sync phrase is configured. */
export function isSyncEnabled(): boolean {
  return getSavedPhrase() !== null;
}

/** Get the worker API base URL (useful for room connections). */
export function getApiUrl(): string {
  return API;
}
