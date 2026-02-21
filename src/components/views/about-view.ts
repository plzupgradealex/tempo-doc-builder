/**
 * About view — project info.
 */

import { on } from '../../bus';
import { t } from '../../i18n';

export function initAboutView(): void {
  const container = document.getElementById('view-about')!;

  on('view-changed', ({ view }) => {
    if (view === 'about') {
      renderAbout(container);
    }
  });

  on('locale-changed', () => renderAbout(container));

  // Render initially
  renderAbout(container);
}

function renderAbout(container: HTMLElement): void {
  container.innerHTML = `
    <div class="lcars-panel">
      <div class="lcars-panel-header">
        <div class="lcars-panel-indicator" style="background: var(--lcars-peach);"></div>
        <h2 class="lcars-panel-title">${t('aboutTitle')}</h2>
      </div>
      <div class="about-content">
        <p style="font-size: 16px; color: var(--lcars-text); margin-bottom: 20px;">
          <strong>Tempo</strong> — ${t('aboutDescription')}
        </p>

        <div style="background: rgba(102, 204, 204, 0.1); border-left: 4px solid var(--lcars-teal); padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0;">
            <strong style="color: var(--lcars-teal);">${t('privacyTitle')}</strong><br><br>
            ${t('privacyDescription')}
          </p>
        </div>

        <div style="background: rgba(153, 153, 255, 0.1); border-left: 4px solid var(--lcars-lavender); padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0;">
            <strong style="color: var(--lcars-lavender);">${t('trekModeTitle')}</strong><br><br>
            ${t('trekModeDescription')}
          </p>
        </div>

        <div style="font-size: 12px; color: var(--lcars-text-dim); margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 204, 153, 0.2);">
          <p style="margin-bottom: 8px;">${t('aboutVersion')}</p>
          <p style="margin-bottom: 8px;">${t('aboutLcarsReuse')}</p>
          <p>${t('aboutLcarsFile').replace('{0}', '<code style="background: rgba(153,153,255,0.15); padding: 2px 6px; border-radius: 3px; color: var(--lcars-lavender); font-family: monospace; font-size: 13px;">src/styles/lcars-core.css</code>')}</p>
        </div>
      </div>
    </div>
  `;
}
