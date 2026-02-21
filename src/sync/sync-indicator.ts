/**
 * Sync Status Indicator — LCARS bottom-bar integration.
 *
 * Instead of a separate segment, sync state is shown on the
 * status bar (#status-bar) itself.  When sync is enabled the
 * bar shows "CLOUDFLARE COMMLINK" and changes colour to reflect
 * the connection state (offline / online / syncing / error / done).
 * When sync is disabled it reverts to the normal "Ready" text.
 *
 * Also runs a periodic health-check ping to the worker.
 */

import { on } from '../bus';
import { t } from '../i18n';
import { isSyncEnabled, getApiUrl } from './sync-client';

type SyncState = 'offline' | 'online' | 'syncing' | 'error' | 'done';

let currentState: SyncState = 'offline';
let healthTimer: ReturnType<typeof setInterval> | null = null;

function getStatusBar(): HTMLElement | null {
  return document.getElementById('status-bar');
}

function labelFor(state: SyncState): string {
  if (!isSyncEnabled()) return t('ready');
  switch (state) {
    case 'offline':  return t('syncBarOffline');
    case 'online':   return 'CLOUDFLARE COMMLINK';
    case 'syncing':  return t('syncBarSyncing');
    case 'error':    return t('syncBarError');
    case 'done':     return 'CLOUDFLARE COMMLINK';
  }
}

function setState(state: SyncState): void {
  currentState = state;
  const bar = getStatusBar();
  if (!bar) return;

  if (isSyncEnabled()) {
    bar.setAttribute('data-sync', state);
    bar.textContent = labelFor(state);
  } else {
    bar.setAttribute('data-sync', 'offline');
    bar.textContent = t('ready');
  }

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
    const res = await fetch(`${getApiUrl()}/api/sync`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
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
  const s = currentState as string;
  if (s === 'syncing' || s === 'done') return;

  const ok = await healthCheck();
  const s2 = currentState as string;
  if (s2 === 'syncing' || s2 === 'done') return;
  setState(ok ? 'online' : 'error');
}

/** Initialise sync indicator — call from main.ts boot(). */
export function initSyncIndicator(): void {
  if (isSyncEnabled()) {
    setState('syncing');
  } else {
    setState('offline');
  }

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

  on('sync-enabled', () => {
    setState('syncing');
    startHealthChecks();
  });

  on('sync-disabled', () => {
    setState('offline');
    stopHealthChecks();
  });

  on('locale-changed', () => {
    setState(currentState);
  });

  if (isSyncEnabled()) {
    startHealthChecks();
  }
}

function startHealthChecks(): void {
  stopHealthChecks();
  setTimeout(() => runHealthCheck(), 3000);
  healthTimer = setInterval(() => runHealthCheck(), 60_000);
}

function stopHealthChecks(): void {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}
