/**
 * Library view — saved agendas from IndexedDB.
 * Load, delete, export as JSON.
 */

import { setAgenda } from '../../state';
import { emit, on } from '../../bus';
import { listAgendas, deleteAgenda, exportAgendaToJSON, importAgendaFromJSON } from '../../storage';
import { setView } from '../../state';
import { t } from '../../i18n';

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
        <h2 class="lcars-panel-title">${t('savedAgendas')}</h2>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button class="lcars-btn accent lcars-shaped" id="lib-import">
          <i class="fa-solid fa-file-import"></i> ${t('importJson')}
        </button>
        <input type="file" id="lib-import-input" accept=".json" style="display:none;">
      </div>
      <div class="library-grid" id="library-grid">
        <div class="lcars-loading"><div class="lcars-spinner"></div></div>
      </div>
    </div>
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

  // Load agendas
  try {
    const agendas = await listAgendas();
    const grid = container.querySelector('#library-grid')!;

    if (agendas.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-text">${t('noSavedAgendas')}</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    agendas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    agendas.forEach((agenda) => {
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
        <div class="library-card-title">${agenda.name || t('untitledAgenda')}</div>
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
        setAgenda(structuredClone(agenda));
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

      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Failed to load library:', e);
    const grid = container.querySelector('#library-grid')!;
    grid.innerHTML = `
      <div class="lcars-alert">
        <div class="lcars-alert-title">${t('errorTitle')}</div>
        <div class="lcars-alert-message">${t('errorLoadAgendas')}</div>
      </div>
    `;
  }
}
