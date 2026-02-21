/**
 * Tempo — Main Entry Point
 * Bootstraps all components.
 */

import './styles/lcars-core.css';
import './styles/tempo.css';

import { initFrame } from './components/frame';
import { initSidebar } from './components/sidebar';
import { initAgendaView } from './components/views/agenda-view';
import { initLibraryView } from './components/views/library-view';
import { initDomainsView } from './components/views/domains-view';
import { initPreviewView } from './components/views/preview-view';
import { initAboutView } from './components/views/about-view';
import { initTopicPicker } from './components/agenda/topic-picker';
import { loadCustomDomains } from './storage';
import { setDomains, setAgenda, getState, setView } from './state';
import { on, emit } from './bus';
import { t } from './i18n';
import { getUser, handleOIDCCallback } from './auth/auth';
import { isSyncEnabled, syncLibrary, pushLibrary } from './sync/sync-client';
import { getRoomIdFromUrl, joinRoom } from './sync/collab-client';
import { initSyncIndicator } from './sync/sync-indicator';
import { initSyncModal } from './sync/sync-modal';
import { hasRegisteredPasskey, authenticateWithPasskey } from './sync/passkey';
import { savePhrase } from './sync/passphrase';

async function boot(): Promise<void> {
  // Load custom domains from IndexedDB if available
  try {
    const saved = await loadCustomDomains();
    if (saved.length > 0) {
      setDomains(saved);
    }
  } catch {
    // Use defaults — already set in state.ts
  }

  // Initialize frame controls (theme, trek, help)
  initFrame();

  // Initialize sidebar navigation
  initSidebar();

  // Initialize views
  initAgendaView();
  initLibraryView();
  initDomainsView();
  initPreviewView();
  initAboutView();

  // Initialize topic picker modal
  initTopicPicker();

  // Initialize sync status indicator
  initSyncIndicator();

  // Initialize sync settings modal
  initSyncModal();

  // Status bar updates
  on('agenda-changed', () => {
    const agenda = getState().currentAgenda;
    const statusEl = document.getElementById('agenda-status');
    if (statusEl && agenda) {
      const days = agenda.days.length;
      const events = agenda.days.reduce((sum, d) => sum + d.events.length, 0);
      statusEl.textContent = `${days} ${t('dayCount')} · ${events} ${t('eventCount')}`;
    }
  });

  // Set initial status text (sync-indicator will override if sync is on)
  const status = document.getElementById('status-bar');
  if (status && !isSyncEnabled()) status.textContent = t('ready');

  // Update agenda status on locale change
  on('locale-changed', () => {
    const agendaStatus = document.getElementById('agenda-status');
    const agenda = getState().currentAgenda;
    if (agendaStatus && agenda) {
      const days = agenda.days.length;
      const events = agenda.days.reduce((sum, d) => sum + d.events.length, 0);
      agendaStatus.textContent = `${days} ${t('dayCount')} · ${events} ${t('eventCount')}`;
    } else if (agendaStatus) {
      agendaStatus.textContent = t('noAgenda');
    }
  });

  // Auth: check for OIDC callback
  handleOIDCCallback();

  // Auth: update welcome message
  initAuthUI();

  // ── Cloud Sync: pull on boot if enabled ──
  if (isSyncEnabled()) {
    syncLibrary().catch(console.error);
  } else if (hasRegisteredPasskey()) {
    // Passkey exists but no passphrase in localStorage — try auto-unlock
    authenticateWithPasskey().then((phrase) => {
      if (phrase) {
        savePhrase(phrase);
        emit('sync-enabled', {});
        syncLibrary().catch(console.error);
      }
    }).catch(console.error);
  }

  // Auto-push after every save
  on('agenda-saved', () => {
    if (isSyncEnabled()) pushLibrary().catch(console.error);
  });

  // ── Collab: join room if ?room=... is in the URL ──
  const roomId = getRoomIdFromUrl();
  if (roomId) {
    const room = joinRoom(roomId);
    room.onUpdate((agenda) => {
      setAgenda(agenda);
      setView('agenda');
    });
  }
}

function initAuthUI(): void {
  const statusBar = document.getElementById('status-bar');
  if (!statusBar) return;

  function updateWelcome(): void {
    const user = getUser();
    if (user) {
      statusBar!.textContent = `${t('welcome')}, ${user.displayName}`;
    } else {
      statusBar!.textContent = t('ready');
    }
  }

  updateWelcome();
  on('auth-changed', updateWelcome);
  on('locale-changed', updateWelcome);

  // Register service worker for PWA installability + offline
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// Boot the app
boot().catch(console.error);
