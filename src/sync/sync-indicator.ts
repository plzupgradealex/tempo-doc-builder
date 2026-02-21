/**
 * Sync Status Indicator — LCARS bottom-bar integration.
 *
 * Shows sync state on the status bar (#status-bar) with a
 * typewriter animation for state changes.  When sync is enabled
 * the bar shows "READY · 🔒 CLOUDFLARE COMMLINK".  State
 * transitions type out the new text one letter at a time for
 * an authentic low-tech LCARS feel.
 */

import { on } from '../bus';
import { t } from '../i18n';
import { isSyncEnabled, getApiUrl } from './sync-client';

type SyncState = 'offline' | 'online' | 'syncing' | 'error' | 'done';

let currentState: SyncState = 'offline';
let healthTimer: ReturnType<typeof setInterval> | null = null;
let typewriterTimer: ReturnType<typeof setTimeout> | null = null;

function getStatusBar(): HTMLElement | null {
  return document.getElementById('status-bar');
}

function labelFor(state: SyncState): string {
  if (!isSyncEnabled()) return t('ready');
  switch (state) {
    case 'offline':  return t('ready');
    case 'online':   return `${t('ready')} · 🔒 CLOUDFLARE COMMLINK`;
    case 'syncing':  return `${t('ready')} · 🔒 SYNCING...`;
    case 'error':    return `${t('ready')} · ⚠ ${t('syncBarError')}`;
    case 'done':     return `${t('ready')} · 🔒 SYNC COMPLETE`;
  }
}

/** Type out text one character at a time, LCARS style. */
function typewrite(bar: HTMLElement, text: string, speed = 28): void {
  // Cancel any running typewriter
  if (typewriterTimer) {
    clearTimeout(typewriterTimer);
    typewriterTimer = null;
  }

  let i = 0;
  bar.textContent = '';

  function tick(): void {
    if (i <= text.length) {
      bar.textContent = text.slice(0, i) + (i < text.length ? '▌' : '');
      i++;
      typewriterTimer = setTimeout(tick, speed);
    } else {
      bar.textContent = text;
      typewriterTimer = null;
    }
  }
  tick();
}

function setState(state: SyncState, animate = true): void {
  const prev = currentState;
  currentState = state;
  const bar = getStatusBar();
  if (!bar) return;

  const text = labelFor(state);

  if (isSyncEnabled()) {
    bar.setAttribute('data-sync', state);
    if (animate && state !== prev) {
      typewrite(bar, text);
    } else {
      bar.textContent = text;
    }
  } else {
    bar.setAttribute('data-sync', 'offline');
    bar.textContent = t('ready');
  }

  // After "done" flash, revert to "online" after a brief delay
  if (state === 'done') {
    setTimeout(() => {
      if (currentState === 'done') setState('online');
    }, 3000);
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
    setState('offline', false);
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
    setState(currentState, false);
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
