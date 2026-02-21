/**
 * Top bar controls: theme toggle, Trek mode toggle, help modal, language panel.
 */

import { getState, setTheme, setTrekMode } from '../state';
import { on } from '../bus';
import { t, getLocale, setLocale, getLocales } from '../i18n';
import type { Locale } from '../i18n/types';

let previousView = 'agenda';

export function initFrame(): void {
  initThemeToggle();
  initTrekToggle();
  initHelpModal();
  initTitleUpdates();
  initLanguagePanel();
}

function initThemeToggle(): void {
  const btn = document.getElementById('theme-toggle')!;
  const status = document.getElementById('theme-status')!;
  const label = btn.querySelector('.toggle-label') as HTMLElement;

  const updateLabels = () => {
    if (label) label.textContent = t('theme');
    status.textContent = getState().theme.toUpperCase();
  };

  btn.addEventListener('click', () => {
    const next = getState().theme === 'tng' ? 'movie' : 'tng';
    setTheme(next);
    status.textContent = next.toUpperCase();
  });

  on('locale-changed', updateLabels);
}

function initTrekToggle(): void {
  const btn = document.getElementById('trek-toggle')!;
  const label = btn.querySelector('.toggle-label') as HTMLElement;

  btn.addEventListener('click', () => {
    const next = !getState().trekMode;
    setTrekMode(next);
    btn.setAttribute('data-trek', next ? 'on' : 'off');
  });

  on('locale-changed', () => {
    if (label) label.textContent = t('mode');
  });
}

function initTitleUpdates(): void {
  const title = document.getElementById('app-title')!;

  function updateTitle(): void {
    title.textContent = getState().trekMode
      ? 'TEMPO BRIEFING PLANNING'
      : 'TEMPO AGENDA BUILDER';
  }

  on('trek-mode-changed', updateTitle);
  on('locale-changed', updateTitle);
}

function initHelpModal(): void {
  const modal = document.getElementById('help-modal')!;
  const openBtn = document.getElementById('help-btn')!;
  const closeBtn = document.getElementById('help-close')!;

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Update help button text on locale change
  const helpLabel = openBtn.querySelector('span');
  on('locale-changed', () => {
    if (helpLabel) helpLabel.textContent = t('help');
  });

  // Update help modal content on locale change
  on('locale-changed', () => renderHelpContent(modal));
  renderHelpContent(modal);
}

function renderHelpContent(modal: HTMLElement): void {
  const body = modal.querySelector('.lcars-modal-body');
  if (!body) return;

  const titleEl = modal.querySelector('.lcars-modal-header-title');
  if (titleEl) titleEl.textContent = t('help').toUpperCase();

  body.innerHTML = `
    <h3 style="color: var(--lcars-lavender); margin-bottom: 12px;">${t('helpGettingStarted')}</h3>
    <ul style="padding-left: 20px; margin: 12px 0;">
      <li>${t('helpProjectHeader')}</li>
      <li>${t('helpPreWorkQuestions')}</li>
      <li>${t('helpTravelDetails')}</li>
      <li>${t('helpAddTopics')}</li>
      <li>${t('helpDragReorder')}</li>
      <li>${t('helpPreviewExport')}</li>
    </ul>
    <h3 style="color: var(--lcars-lavender); margin: 16px 0 12px;">${t('helpKeyboardShortcuts')}</h3>
    <ul style="padding-left: 20px;">
      <li><code style="background: rgba(153,153,255,0.15); padding: 2px 6px; border-radius: 3px; color: var(--lcars-lavender); font-family: monospace; font-size: 13px;">Ctrl+S</code> — ${t('helpSaveAgenda')}</li>
      <li><code style="background: rgba(153,153,255,0.15); padding: 2px 6px; border-radius: 3px; color: var(--lcars-lavender); font-family: monospace; font-size: 13px;">Ctrl+P</code> — ${t('helpPreviewPdf')}</li>
      <li><code style="background: rgba(153,153,255,0.15); padding: 2px 6px; border-radius: 3px; color: var(--lcars-lavender); font-family: monospace; font-size: 13px;">Ctrl+E</code> — ${t('helpExportPdf')}</li>
    </ul>
    <h3 style="color: var(--lcars-lavender); margin: 16px 0 12px;">${t('trekModeTitle')}</h3>
    <p>${t('helpTrekDescription')}</p>
  `;
}

function initLanguagePanel(): void {
  const elbow = document.getElementById('elbow-bottom');
  const langView = document.getElementById('view-language');
  if (!elbow || !langView) return;

  // Click the translate icon to open language panel
  elbow.addEventListener('click', () => {
    // Remember current view to return to
    const allViews = document.querySelectorAll<HTMLElement>('.view');
    allViews.forEach((v) => {
      if (v.classList.contains('active') && v.id !== 'view-language') {
        previousView = v.id.replace('view-', '');
      }
    });

    // Hide all views, show language
    allViews.forEach((v) => v.classList.remove('active'));
    langView.classList.add('active');

    // Deactivate sidebar buttons
    document.querySelectorAll('.lcars-sidebar-button').forEach((b) => b.classList.remove('active'));

    renderLanguagePanel(langView);
  });

  on('locale-changed', () => {
    if (langView.classList.contains('active')) {
      renderLanguagePanel(langView);
    }
  });
}

function renderLanguagePanel(container: HTMLElement): void {
  const currentLang = getLocale();
  const locales = getLocales();

  container.innerHTML = `
    <div class="lcars-lang-panel">
      <div class="lcars-lang-header">
        <div class="lcars-lang-header-cap"></div>
        <div class="lcars-lang-header-title">${t('selectLanguage')}</div>
        <div class="lcars-lang-header-bar"></div>
      </div>
      <div class="lcars-lang-buttons" id="lang-list">
        ${locales.map(({ code, label }) => `
          <button class="lcars-lang-btn ${code === currentLang ? 'active' : ''}" data-lang="${code}">
            ${label === 'EN' ? 'ENGLISH' : label === 'ES' ? 'ESPAÑOL' : label === 'DE' ? 'DEUTSCH' : 'FRANÇAIS'}
          </button>
        `).join('')}
      </div>
      <div class="lcars-lang-footer">
        <div class="lcars-lang-footer-bar"></div>
        <div class="lcars-lang-footer-cap"></div>
      </div>
    </div>
  `;

  // Add click handlers for language buttons
  container.querySelectorAll<HTMLButtonElement>('.lcars-lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang as Locale;
      setLocale(lang);

      // Return to previous view
      const allViews = document.querySelectorAll<HTMLElement>('.view');
      allViews.forEach((v) => v.classList.remove('active'));
      const target = document.getElementById(`view-${previousView}`);
      if (target) target.classList.add('active');

      // Re-activate sidebar button
      document.querySelectorAll('.lcars-sidebar-button').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-view') === previousView);
      });
    });
  });
}
