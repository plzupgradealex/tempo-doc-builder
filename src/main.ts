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
import { setDomains, getState } from './state';
import { on } from './bus';
import { t } from './i18n';
import { getUser, handleOIDCCallback } from './auth/auth';

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

  // Set initial status
  const status = document.getElementById('status-bar');
  if (status) status.textContent = t('ready');

  // Update status text on locale change
  on('locale-changed', () => {
    const st = document.getElementById('status-bar');
    if (st && st.textContent !== '') st.textContent = t('ready');
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
}

// Boot the app
boot().catch(console.error);
