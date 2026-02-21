/**
 * Sync Modal — LCARS-styled overlay for managing sync passphrase & passkey.
 *
 * Opened by clicking the status bar "Ready" segment or the sync indicator.
 * Provides:
 *  - Generate / enter a sync passphrase
 *  - Copy passphrase
 *  - Register / authenticate / remove a device passkey
 *  - Sync now / disable sync
 */

import { t } from '../i18n';
import { on, emit } from '../bus';
import { generatePassphrase, getSavedPhrase, savePhrase, clearPhrase } from './passphrase';
import { isSyncEnabled, syncLibrary, pushLibrary } from './sync-client';
import {
  isPasskeySupported,
  hasRegisteredPasskey,
  registerPasskey,
  authenticateWithPasskey,
  removePasskey,
} from './passkey';

let modal: HTMLElement | null = null;
let body: HTMLElement | null = null;

/** Initialise the sync modal — call from main.ts boot(). */
export function initSyncModal(): void {
  modal = document.getElementById('sync-modal');
  body = document.getElementById('sync-modal-body');
  const closeBtn = document.getElementById('sync-modal-close');

  if (!modal || !body) return;

  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  // Make status bar clickable
  const statusBar = document.getElementById('status-bar');
  statusBar?.addEventListener('click', open);
  if (statusBar) statusBar.style.cursor = 'pointer';

  // Make sync indicator clickable too
  const syncIndicator = document.getElementById('sync-indicator');
  syncIndicator?.addEventListener('click', open);
  if (syncIndicator) syncIndicator.style.cursor = 'pointer';

  // Update title on locale change
  on('locale-changed', () => {
    const titleEl = document.getElementById('sync-modal-title');
    if (titleEl) titleEl.textContent = t('syncSettings').toUpperCase();
    if (modal?.classList.contains('active')) render();
  });
}

function open(): void {
  if (!modal) return;
  render();
  modal.classList.add('active');
}

function close(): void {
  modal?.classList.remove('active');
}

function render(): void {
  if (!body) return;

  const phrase = getSavedPhrase();
  const hasPasskey = hasRegisteredPasskey();
  const passkeySupported = isPasskeySupported();
  const syncOn = isSyncEnabled();

  const titleEl = document.getElementById('sync-modal-title');
  if (titleEl) titleEl.textContent = t('syncSettings').toUpperCase();

  body.innerHTML = `
    <p style="color:var(--lcars-text-dim);margin-bottom:16px;font-size:14px;line-height:1.5;">${t('syncModalDesc')}</p>

    ${syncOn && phrase ? renderConnectedState(phrase, hasPasskey, passkeySupported)
    : renderDisconnectedState(hasPasskey, passkeySupported)}
  `;

  wireHandlers();
}

function renderConnectedState(phrase: string, hasPasskey: boolean, passkeySupported: boolean): string {
  return `
    <!-- Current passphrase -->
    <div style="margin-bottom:16px;">
      <label style="color:var(--lcars-teal);font-size:13px;letter-spacing:2px;font-weight:600;display:block;margin-bottom:6px;">${t('syncPassphrase').toUpperCase()}</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <code id="sm-phrase-display" style="flex:1;background:rgba(102,204,204,0.1);padding:10px 14px;border-radius:4px;font-size:16px;letter-spacing:2px;color:var(--lcars-teal);border:1px solid rgba(102,204,204,0.2);font-family:var(--lcars-font);">${phrase}</code>
        <button class="lcars-btn small teal" id="sm-copy" title="Copy"><i class="fa-solid fa-copy"></i></button>
      </div>
      <div id="sm-copy-status" style="color:var(--lcars-text-dim);font-size:12px;margin-top:4px;min-height:16px;">${t('syncPhraseHint')}</div>
    </div>

    <!-- Actions -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <button class="lcars-btn primary lcars-shaped" id="sm-sync-now"><i class="fa-solid fa-rotate"></i> ${t('syncNow')}</button>
      <button class="lcars-btn small danger" id="sm-disconnect">${t('syncDisable')}</button>
    </div>

    <!-- Sync status -->
    <div id="sm-action-status" style="font-size:13px;color:var(--lcars-text-dim);min-height:20px;margin-bottom:16px;"></div>

    <!-- Passkey section -->
    <div style="border-top:1px solid rgba(102,204,204,0.15);padding-top:16px;">
      <label style="color:var(--lcars-lavender);font-size:13px;letter-spacing:2px;font-weight:600;display:block;margin-bottom:10px;">PASSKEY</label>
      ${hasPasskey ? `
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fa-solid fa-fingerprint" style="font-size:20px;color:var(--lcars-teal);"></i>
          <span style="color:var(--lcars-teal);font-size:13px;flex:1;">${t('syncPasskeyRegistered')}</span>
          <button class="lcars-btn small danger" id="sm-passkey-remove">${t('syncPasskeyRemove')}</button>
        </div>
      ` : passkeySupported ? `
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fa-solid fa-fingerprint" style="font-size:20px;color:var(--lcars-text-dim);"></i>
          <span style="color:var(--lcars-text-dim);font-size:13px;flex:1;">Quick biometric access on this device</span>
          <button class="lcars-btn small teal" id="sm-passkey-register"><i class="fa-solid fa-key"></i> ${t('syncRegisterPasskey')}</button>
        </div>
      ` : `
        <div style="color:var(--lcars-text-dim);font-size:13px;">
          <i class="fa-solid fa-fingerprint" style="opacity:0.3;"></i> ${t('syncPasskeyUnsupported')}
        </div>
      `}
    </div>
  `;
}

function renderDisconnectedState(hasPasskey: boolean, passkeySupported: boolean): string {
  return `
    <!-- Not connected -->
    <div style="margin-bottom:16px;">
      <label style="color:var(--lcars-teal);font-size:13px;letter-spacing:2px;font-weight:600;display:block;margin-bottom:10px;">${t('syncPassphrase').toUpperCase()}</label>

      <!-- Generate new -->
      <button class="lcars-btn primary lcars-shaped" id="sm-generate" style="margin-bottom:12px;">
        <i class="fa-solid fa-wand-magic-sparkles"></i> ${t('syncPassphraseNew')}
      </button>

      <!-- Or enter existing -->
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" id="sm-phrase-input" class="lcars-input" placeholder="${t('syncEnterPhrase')}" style="flex:1;font-family:var(--lcars-font);letter-spacing:1px;">
        <button class="lcars-btn small teal" id="sm-connect"><i class="fa-solid fa-link"></i> ${t('syncPassphraseExisting')}</button>
      </div>
    </div>

    <div id="sm-action-status" style="font-size:13px;color:var(--lcars-text-dim);min-height:20px;margin-bottom:16px;"></div>

    ${hasPasskey && passkeySupported ? `
      <!-- Passkey unlock -->
      <div style="border-top:1px solid rgba(102,204,204,0.15);padding-top:16px;">
        <button class="lcars-btn primary lcars-shaped" id="sm-passkey-unlock" style="width:100%;">
          <i class="fa-solid fa-fingerprint"></i> ${t('syncUsePasskey')}
        </button>
      </div>
    ` : ''}
  `;
}

function wireHandlers(): void {
  if (!body) return;

  const statusEl = body.querySelector('#sm-action-status') as HTMLElement | null;

  // Copy phrase
  body.querySelector('#sm-copy')?.addEventListener('click', async () => {
    const phrase = getSavedPhrase();
    if (!phrase) return;
    await navigator.clipboard.writeText(phrase);
    if (statusEl) statusEl.textContent = `✓ ${t('syncCopied')}`;
  });

  // Generate new passphrase
  body.querySelector('#sm-generate')?.addEventListener('click', () => {
    const phrase = generatePassphrase();
    savePhrase(phrase);
    emit('sync-enabled', {});
    pushLibrary().catch(console.error);
    render();
  });

  // Connect with existing phrase
  body.querySelector('#sm-connect')?.addEventListener('click', async () => {
    const input = body!.querySelector('#sm-phrase-input') as HTMLInputElement | null;
    const phrase = input?.value.trim();
    if (!phrase) return;
    savePhrase(phrase);
    emit('sync-enabled', {});
    if (statusEl) statusEl.textContent = `⟳ ${t('syncSyncing')}`;
    try {
      const result = await syncLibrary();
      if (statusEl) statusEl.textContent = `✓ ${t('syncDone')} — ${result.merged} ${t('syncMerged')}`;
      render();
    } catch {
      if (statusEl) statusEl.textContent = `✗ ${t('syncError')}`;
    }
  });

  // Sync now
  body.querySelector('#sm-sync-now')?.addEventListener('click', async () => {
    if (statusEl) statusEl.textContent = `⟳ ${t('syncSyncing')}`;
    try {
      const result = await syncLibrary();
      if (statusEl) statusEl.textContent = `✓ ${t('syncDone')} — ${result.merged} ${t('syncMerged')}`;
    } catch {
      if (statusEl) statusEl.textContent = `✗ ${t('syncError')}`;
    }
  });

  // Disconnect / disable sync
  body.querySelector('#sm-disconnect')?.addEventListener('click', () => {
    clearPhrase();
    emit('sync-disabled', {});
    render();
  });

  // Register passkey
  body.querySelector('#sm-passkey-register')?.addEventListener('click', async () => {
    const phrase = getSavedPhrase();
    if (!phrase) return;
    if (statusEl) statusEl.textContent = 'Registering passkey…';
    const ok = await registerPasskey(phrase);
    if (ok) {
      if (statusEl) statusEl.textContent = `✓ ${t('syncPasskeyRegistered')}`;
      render();
    } else {
      if (statusEl) statusEl.textContent = '✗ Passkey registration failed';
    }
  });

  // Remove passkey
  body.querySelector('#sm-passkey-remove')?.addEventListener('click', () => {
    removePasskey();
    render();
  });

  // Unlock with passkey
  body.querySelector('#sm-passkey-unlock')?.addEventListener('click', async () => {
    if (statusEl) statusEl.textContent = 'Authenticating…';
    const phrase = await authenticateWithPasskey();
    if (phrase) {
      savePhrase(phrase);
      emit('sync-enabled', {});
      if (statusEl) statusEl.textContent = `✓ Unlocked`;
      try {
        await syncLibrary();
      } catch { /* status bar will show */ }
      render();
    } else {
      if (statusEl) statusEl.textContent = '✗ Authentication failed';
    }
  });
}
