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

        <div style="background: rgba(255, 153, 0, 0.08); border-left: 4px solid var(--lcars-orange); padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0 0 12px 0;">
            <strong style="color: var(--lcars-orange);">${t('aboutToolsTitle')}</strong>
          </p>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: var(--lcars-text);">
            ${t('aboutToolsDescription')}
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${['Vite', 'TypeScript', 'jsPDF', 'docx', 'FileSaver.js', 'Cloudflare Workers', 'Cloudflare KV', 'Durable Objects', 'Web Crypto', 'WebAuthn'].map(tool =>
              `<span style="display:inline-block;padding:4px 12px;background:rgba(255,153,0,0.12);border-radius:12px;font-size:12px;color:var(--lcars-orange);letter-spacing:1px;">${tool}</span>`
            ).join('')}
          </div>
        </div>

        <div style="background: rgba(102, 204, 204, 0.1); border-left: 4px solid var(--lcars-teal); padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0;">
            <strong style="color: var(--lcars-teal);">${t('privacyTitle')}</strong><br><br>
            ${t('privacyDescription')}
          </p>
        </div>

        <div style="background: rgba(102, 178, 255, 0.08); border-left: 4px solid var(--lcars-sky); padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0 0 12px 0;">
            <strong style="color: var(--lcars-sky);">${t('securityTitle')}</strong>
          </p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: var(--lcars-text);">
            ${t('securityDescription')}
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px; color: var(--lcars-text);">
            <div style="display: flex; gap: 10px; align-items: baseline;">
              <span style="color: var(--lcars-sky); font-weight: bold; flex-shrink: 0;">&#9670;</span>
              <span>${t('securityE2E')}</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: baseline;">
              <span style="color: var(--lcars-sky); font-weight: bold; flex-shrink: 0;">&#9670;</span>
              <span>${t('securityZeroKnowledge')}</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: baseline;">
              <span style="color: var(--lcars-sky); font-weight: bold; flex-shrink: 0;">&#9670;</span>
              <span>${t('securityPassphrase')}</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: baseline;">
              <span style="color: var(--lcars-sky); font-weight: bold; flex-shrink: 0;">&#9670;</span>
              <span>${t('securityPasskey')}</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: baseline;">
              <span style="color: var(--lcars-sky); font-weight: bold; flex-shrink: 0;">&#9670;</span>
              <span>${t('securityNoAccounts')}</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: baseline;">
              <span style="color: var(--lcars-sky); font-weight: bold; flex-shrink: 0;">&#9670;</span>
              <span>${t('securityTransparency')}</span>
            </div>
          </div>
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
