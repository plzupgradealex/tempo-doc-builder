/**
 * Library view — saved agendas from IndexedDB.
 * Load, delete, export as JSON, cloud sync panel.
 */

import type { Agenda } from '../../types';
import { setAgenda } from '../../state';
import { emit, on } from '../../bus';
import { listAgendas, deleteAgenda, exportAgendaToJSON, importAgendaFromJSON } from '../../storage';
import { setView } from '../../state';
import { t } from '../../i18n';
import { generatePassphrase, getSavedPhrase, savePhrase, clearPhrase } from '../../sync/passphrase';
import { syncLibrary, pushLibrary } from '../../sync/sync-client';

export function initLibraryView(): void {
  const container = document.getElementById('view-library')!;

  on('view-changed', ({ view }) => {
    if (view === 'library') {
      renderLibrary(container);
    }
  });
}

async function renderLibrary(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div class="lcars-panel">
      <div class="lcars-panel-header">
        <div class="lcars-panel-indicator" style="background: var(--lcars-purple);"></div>
        <h2 class="lcars-panel-title">${t('documents')}</h2>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button class="lcars-btn accent lcars-shaped" id="lib-import">
          <i class="fa-solid fa-file-import"></i> ${t('importJson')}
        </button>
        <input type="file" id="lib-import-input" accept=".json" style="display:none;">
      </div>
      <div class="library-grid" id="library-grid-docs">
        <div class="lcars-loading"><div class="lcars-spinner"></div></div>
      </div>
    </div>
    <div class="lcars-panel" style="margin-top: 16px;">
      <div class="lcars-panel-header">
        <div class="lcars-panel-indicator" style="background: var(--lcars-gold);"></div>
        <h2 class="lcars-panel-title">${t('templates')}</h2>
      </div>
      <div class="library-grid" id="library-grid-templates">
        <div class="lcars-loading"><div class="lcars-spinner"></div></div>
      </div>
    </div>
    ${renderSyncPanel()}
  `;

  // Import button
  const importBtn = container.querySelector('#lib-import')!;
  const importInput = container.querySelector('#lib-import-input') as HTMLInputElement;

  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const agenda = await importAgendaFromJSON(file);
      setAgenda(agenda);
      setView('agenda');
      emit('agenda-loaded', {});
    } catch (e) {
      console.error('Import failed:', e);
    }
  });

  // Sync panel wiring
  initSyncPanel(container, () => renderLibrary(container));

  // Load agendas
  try {
    const allAgendas = await listAgendas();
    const docs = allAgendas.filter((a) => !a.isTemplate);
    const templates = allAgendas.filter((a) => a.isTemplate);

    const docsGrid = container.querySelector('#library-grid-docs')!;
    const templatesGrid = container.querySelector('#library-grid-templates')!;

    if (docs.length === 0) {
      docsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-text">${t('noSavedAgendas')}</div>
        </div>
      `;
    } else {
      docsGrid.innerHTML = '';
      docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      docs.forEach((agenda) => {
        docsGrid.appendChild(renderAgendaCard(agenda, container));
      });
    }

    if (templates.length === 0) {
      templatesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">${t('noTemplates')}</div>
        </div>
      `;
    } else {
      templatesGrid.innerHTML = '';
      templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      templates.forEach((agenda) => {
        templatesGrid.appendChild(renderAgendaCard(agenda, container));
      });
    }
  } catch (e) {
    console.error('Failed to load library:', e);
    const docsGrid = container.querySelector('#library-grid-docs')!;
    docsGrid.innerHTML = `
      <div class="lcars-alert">
        <div class="lcars-alert-title">${t('errorTitle')}</div>
        <div class="lcars-alert-message">${t('errorLoadAgendas')}</div>
      </div>
    `;
  }
}

function renderAgendaCard(agenda: Agenda, container: HTMLElement): HTMLElement {
  const card = document.createElement('div');
  card.className = 'library-card';
  const updated = new Date(agenda.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  card.innerHTML = `
    <div class="library-card-title">
      ${agenda.isTemplate ? '<i class="fa-solid fa-bookmark" style="color:var(--lcars-gold);margin-right:6px;"></i>' : ''}
      ${agenda.name || t('untitledAgenda')}
    </div>
    <div class="library-card-meta">
      ${agenda.header.projectName ? `${t('project')}: ${agenda.header.projectName}<br>` : ''}
      ${agenda.days.length} ${t('dayCount')} · ${t('updated')}: ${updated}
    </div>
    <div class="library-card-actions">
      <button class="lcars-btn small primary" data-action="load">${t('load')}</button>
      <button class="lcars-btn small teal" data-action="export">${t('exportJson')}</button>
      <button class="lcars-btn small danger" data-action="delete">${t('delete')}</button>
    </div>
  `;

  card.querySelector('[data-action="load"]')!.addEventListener('click', () => {
    const loaded = structuredClone(agenda);
    if (agenda.isTemplate) {
      // When loading a template, create a new document from it
      loaded.id = crypto.randomUUID();
      loaded.isTemplate = false;
      loaded.createdAt = new Date().toISOString();
      loaded.updatedAt = new Date().toISOString();
    }
    setAgenda(loaded);
    setView('agenda');
    emit('agenda-loaded', {});
  });

  card.querySelector('[data-action="export"]')!.addEventListener('click', () => {
    exportAgendaToJSON(agenda);
  });

  card.querySelector('[data-action="delete"]')!.addEventListener('click', async () => {
    if (confirm(t('deleteConfirm'))) {
      await deleteAgenda(agenda.id);
      renderLibrary(container);
    }
  });

  return card;
}

/* ─── Sync Panel ─── */

function renderSyncPanel(): string {
  const phrase = getSavedPhrase();
  const enabled = !!phrase;

  if (enabled) {
    return `
      <div class="lcars-panel" style="margin-top: 16px;">
        <div class="lcars-panel-header">
          <div class="lcars-panel-indicator" style="background: var(--lcars-teal);"></div>
          <h2 class="lcars-panel-title">${t('syncTitle')}</h2>
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block;color:var(--lcars-text-muted);font-size:13px;margin-bottom:4px;letter-spacing:1px;">${t('syncPhrase')}</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <code id="sync-phrase-display" style="flex:1;background:rgba(153,153,255,0.1);padding:10px 14px;border-radius:4px;font-size:16px;letter-spacing:2px;color:var(--lcars-lavender);border:1px solid rgba(153,153,255,0.2);font-family:var(--lcars-font);">${phrase}</code>
            <button class="lcars-btn small teal" id="sync-copy"><i class="fa-solid fa-copy"></i></button>
          </div>
          <div style="color:var(--lcars-text-muted);font-size:12px;margin-top:6px;">${t('syncPhraseHint')}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="lcars-btn primary lcars-shaped" id="sync-now"><i class="fa-solid fa-rotate"></i> ${t('syncNow')}</button>
          <button class="lcars-btn small danger" id="sync-disable">${t('syncDisable')}</button>
        </div>
        <div id="sync-status" style="margin-top:8px;font-size:13px;color:var(--lcars-text-muted);min-height:20px;"></div>
      </div>
    `;
  }

  return `
    <div class="lcars-panel" style="margin-top: 16px;">
      <div class="lcars-panel-header">
        <div class="lcars-panel-indicator" style="background: var(--lcars-text-muted);"></div>
        <h2 class="lcars-panel-title">${t('syncTitle')}</h2>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="lcars-btn primary lcars-shaped" id="sync-enable"><i class="fa-solid fa-cloud"></i> ${t('syncEnable')}</button>
        <div style="display:flex;gap:4px;align-items:center;flex:1;min-width:220px;">
          <input type="text" id="sync-phrase-input" class="lcars-input" placeholder="${t('syncEnterPhrase')}" style="flex:1;font-family:var(--lcars-font);letter-spacing:1px;">
          <button class="lcars-btn small teal" id="sync-connect"><i class="fa-solid fa-link"></i></button>
        </div>
      </div>
    </div>
  `;
}

function initSyncPanel(container: HTMLElement, refreshLibrary: () => void): void {
  const statusEl = container.querySelector('#sync-status') as HTMLElement | null;

  // Enable sync — generate new phrase
  container.querySelector('#sync-enable')?.addEventListener('click', () => {
    const phrase = generatePassphrase();
    savePhrase(phrase);
    emit('sync-enabled', {});
    refreshLibrary();
    // Auto-push on first enable
    pushLibrary().catch(console.error);
  });

  // Connect with existing phrase
  container.querySelector('#sync-connect')?.addEventListener('click', async () => {
    const input = container.querySelector('#sync-phrase-input') as HTMLInputElement | null;
    const phrase = input?.value.trim();
    if (!phrase) return;
    savePhrase(phrase);
    emit('sync-enabled', {});
    refreshLibrary();
    // Pull remote library
    try {
      await syncLibrary();
      refreshLibrary();
    } catch (e) {
      console.error('Sync failed:', e);
    }
  });

  // Copy phrase
  container.querySelector('#sync-copy')?.addEventListener('click', async () => {
    const phrase = getSavedPhrase();
    if (phrase) {
      await navigator.clipboard.writeText(phrase);
      if (statusEl) statusEl.textContent = `✓ ${t('syncCopied')}`;
    }
  });

  // Sync now
  container.querySelector('#sync-now')?.addEventListener('click', async () => {
    if (statusEl) statusEl.textContent = `⟳ ${t('syncSyncing')}`;
    try {
      const result = await syncLibrary();
      if (statusEl) statusEl.textContent = `✓ ${t('syncDone')} — ${result.merged} ${t('syncMerged')}`;
      if (result.merged > 0) refreshLibrary();
    } catch {
      if (statusEl) statusEl.textContent = `✗ ${t('syncError')}`;
    }
  });

  // Disable sync
  container.querySelector('#sync-disable')?.addEventListener('click', () => {
    clearPhrase();
    emit('sync-disabled', {});
    refreshLibrary();
  });
}
