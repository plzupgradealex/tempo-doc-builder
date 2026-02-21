/**
 * Sidebar navigation component.
 * Handles view switching, Trek mode label updates, and i18n.
 */

import { setView, getState } from '../state';
import { on } from '../bus';
import { trek } from '../trek/mode';
import { t } from '../i18n';
import type { Translations } from '../i18n/types';
import type { ViewName } from '../types';

const VIEW_I18N_KEYS: Record<ViewName, keyof Translations> = {
  agenda: 'newAgenda',
  library: 'library',
  domains: 'domains',
  preview: 'preview',
  about: 'about',
};

export function initSidebar(): void {
  const sidebar = document.getElementById('sidebar')!;
  const buttons = sidebar.querySelectorAll<HTMLButtonElement>('.lcars-sidebar-button[data-view]');

  function updateLabels(): void {
    const isTrek = getState().trekMode;
    buttons.forEach((btn) => {
      const view = btn.dataset.view as ViewName;
      if (view && VIEW_I18N_KEYS[view]) {
        btn.textContent = trek(t(VIEW_I18N_KEYS[view]), isTrek);
      }
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view as ViewName;
      if (view) setView(view);
    });
  });

  // Update active state when view changes
  on('view-changed', ({ view }) => {
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Show/hide views
    document.querySelectorAll<HTMLElement>('.view').forEach((v) => {
      const id = v.id.replace('view-', '');
      v.classList.toggle('active', id === view);
    });
  });

  // Update labels on Trek mode or locale change
  on('trek-mode-changed', updateLabels);
  on('locale-changed', updateLabels);

  // Initial labels
  updateLabels();
}
