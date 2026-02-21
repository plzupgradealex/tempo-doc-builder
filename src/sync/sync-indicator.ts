/**
 * Sync Status Indicator — LCARS bottom-bar integration.
 *
 * Listens to sync-status bus events and updates the bottom-bar
 * indicator with state, glow, and label.  Also runs a periodic
 * health-check ping to the worker to confirm connectivity.
 */

import { on } from '../bus';
import { t } from '../i18n';
import { isSyncEnabled } from './sync-client';

const API = (import.meta as unknown as { env: Record<string, string> }).env
  ?.VITE_SYNC_API ?? 'https://tempo-sync.alex-31f.workers.dev';

type SyncState = 'offline' | 'online' | 'syncing' | 'error' | 'done';

let currentState: SyncState = 'offline';
let healthTimer: ReturnType<typeof setInterval> | null = null;

function getElements(): { segment: HTMLElement | null; dot: HTMLElement | null; label: HTMLElement | null } {
  return {
    segment: document.getElementById('sync-indicator'),
    dot: document.getElementById('sync-dot'),
    label: document.getElementById('sync-label'),
  };
}

function labelFor(state: SyncState): string {
  switch (state) {
    case 'offline':  return t('syncBarOffline');
    case 'online':   return t('syncBarOnline');
    case 'syncing':  return t('syncBarSyncing');
    case 'error':    return t('syncBarError');
    case 'done':     return t('syncBarOnline');   // after done flash, show linked
  }
}

function setState(state: SyncState): void {
  currentState = state;
  const { segment, label } = getElements();
  if (!segment) return;

  segment.setAttribute('data-sync', state);
  if (label) label.textContent = labelFor(state);

  // After "done" flash, revert to "online" after a brief delay
  if (state === 'done') {
    setTimeout(() => {
      if (currentState === 'done') setState('online');
    }, 2400);
  }
}

/** Ping the worker to check connectivity. */
async function healthCheck(): Promise<boolean> {
  if (!isSyncEnabled()) {
    setState('offline');
    return false;
  }
  try {
    const res = await fetch(`${API}/api/sync`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    // 401/403 is fine — means worker is alive but no key provided
    return res.ok || res.status === 401 || res.status === 403 || res.status === 405;
  } catch {
    return false;
  }
}

async function runHealthCheck(): Promise<void> {
  if (!isSyncEnabled()) {
    setState('offline');
    return;
  }
  // Don't overwrite active syncing/done states with a health check
  const s = currentState as string;
  if (s === 'syncing' || s === 'done') return;

  const ok = await healthCheck();
  const s2 = currentState as string;
  if (s2 === 'syncing' || s2 === 'done') return; // may have changed while awaiting
  setState(ok ? 'online' : 'error');
}

/** Initialise sync indicator — call from main.ts boot(). */
export function initSyncIndicator(): void {
  // Set initial state
  if (isSyncEnabled()) {
    setState('syncing'); // will be doing initial sync
  } else {
    setState('offline');
  }

  // Listen to sync-status events from sync-client.ts
  on('sync-status', (detail) => {
    const status = detail.status as string;
    switch (status) {
      case 'syncing':
        setState('syncing');
        break;
      case 'pushed':
      case 'pulled':
      case 'done':
        setState('done');
        break;
      case 'error':
        setState('error');
        break;
    }
  });

  // When sync is enabled/disabled, update immediately
  on('sync-enabled', () => {
    setState('syncing');
    startHealthChecks();
  });

  on('sync-disabled', () => {
    setState('offline');
    stopHealthChecks();
  });

  // Update labels on locale change
  on('locale-changed', () => {
    const { label } = getElements();
    if (label) label.textContent = labelFor(currentState);
  });

  // Start periodic health checks if sync is on
  if (isSyncEnabled()) {
    startHealthChecks();
  }
}

function startHealthChecks(): void {
  stopHealthChecks();
  // Run a check right away (after a short delay to not block boot)
  setTimeout(() => runHealthCheck(), 3000);
  // Then every 60 seconds
  healthTimer = setInterval(() => runHealthCheck(), 60_000);
}

function stopHealthChecks(): void {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}
