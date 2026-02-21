/**
 * Domains view — edit, add, remove, and reset knowledge domains.
 */

import { getState, setDomains, resetDomains } from '../../state';
import { on } from '../../bus';
import { saveCustomDomains } from '../../storage';
import { uid } from '../../utils/id';
import { t } from '../../i18n';
import { openIconPicker } from '../agenda/icon-picker';
import type { KnowledgeDomain } from '../../types';

export function initDomainsView(): void {
  const container = document.getElementById('view-domains')!;

  on('view-changed', ({ view }) => {
    if (view === 'domains') {
      renderDomainsView(container);
    }
  });
}

function renderDomainsView(container: HTMLElement): void {
  const domains = getState().domains;

  container.innerHTML = `
    <div class="lcars-panel">
      <div class="lcars-panel-header">
        <div class="lcars-panel-indicator" style="background: var(--lcars-teal);"></div>
        <h2 class="lcars-panel-title">${t('knowledgeDomains')}</h2>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
        <button class="lcars-btn primary lcars-shaped" id="dom-add">
          <i class="fa-solid fa-plus"></i> ${t('addDomain')}
        </button>
        <button class="lcars-btn lcars-shaped" id="dom-reset">
          <i class="fa-solid fa-rotate-left"></i> ${t('resetToDefaults')}
        </button>
        <button class="lcars-btn teal lcars-shaped" id="dom-save">
          <i class="fa-solid fa-floppy-disk"></i> ${t('saveDomains')}
        </button>
      </div>
      <div class="domains-grid" id="domains-grid"></div>
    </div>
  `;

  const grid = container.querySelector('#domains-grid')!;
  renderDomainCards(grid, domains);

  container.querySelector('#dom-add')!.addEventListener('click', () => {
    const newDomain: KnowledgeDomain = {
      id: uid(),
      name: t('newTopic'),
      icon: 'fa-circle-question',
      description: '',
      defaultBulletPoints: [],
      recommendedAttendees: [],
      isDefault: false,
    };
    const current = getState().domains;
    setDomains([...current, newDomain]);
    renderDomainsView(container);
  });

  container.querySelector('#dom-reset')!.addEventListener('click', () => {
    if (confirm(t('resetConfirm'))) {
      resetDomains();
      renderDomainsView(container);
    }
  });

  container.querySelector('#dom-save')!.addEventListener('click', async () => {
    await saveCustomDomains(getState().domains);
    showStatus(t('domainsSaved'));
  });
}

function renderDomainCards(grid: Element, domains: KnowledgeDomain[]): void {
  grid.innerHTML = '';

  domains.forEach((domain) => {
    const card = document.createElement('div');
    card.className = 'domain-edit-card';

    card.innerHTML = `
      <div class="form-group">
        <label class="lcars-label">${t('name')}</label>
        <input type="text" class="lcars-input" data-field="name" value="${escapeAttr(domain.name)}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('icon')}</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="lcars-btn small icon-pick-btn" data-action="pick-icon" title="Choose icon" style="font-size:20px; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            <i class="fa-solid ${domain.icon}"></i>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('description')}</label>
        <textarea class="lcars-textarea" data-field="description" rows="3">${escapeHtml(domain.description)}</textarea>
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('subTopicBullets')}</label>
        <textarea class="lcars-textarea" data-field="bullets" rows="3">${domain.defaultBulletPoints.join('\n')}</textarea>
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('recommendedAttendees')}</label>
        <textarea class="lcars-textarea" data-field="attendees" rows="2">${domain.recommendedAttendees.join('\n')}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button class="lcars-btn small danger" data-action="delete">
          <i class="fa-solid fa-trash-can"></i> ${t('remove')}
        </button>
      </div>
    `;

    // Bind change events
    card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-field]').forEach((input) => {
      input.addEventListener('change', () => {
        const field = input.dataset.field!;
        switch (field) {
          case 'name': domain.name = input.value; break;
          case 'description': domain.description = input.value; break;
          case 'bullets':
            domain.defaultBulletPoints = input.value.split('\n').filter(Boolean);
            break;
          case 'attendees':
            domain.recommendedAttendees = input.value.split('\n').filter(Boolean);
            break;
        }
        setDomains(getState().domains);
      });
    });

    // Icon picker button
    const iconBtn = card.querySelector('[data-action="pick-icon"]');
    if (iconBtn) {
      iconBtn.addEventListener('click', async () => {
        const icon = await openIconPicker(domain.icon);
        if (icon) {
          domain.icon = icon;
          iconBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
          setDomains(getState().domains);
        }
      });
    }

    // Delete button
    card.querySelector('[data-action="delete"]')!.addEventListener('click', () => {
      const current = getState().domains.filter((d) => d.id !== domain.id);
      setDomains(current);
      grid.innerHTML = '';
      renderDomainCards(grid, current);
    });

    grid.appendChild(card);
  });
}

function showStatus(msg: string): void {
  const status = document.getElementById('status-bar');
  if (status) {
    status.textContent = msg;
    setTimeout(() => { status.textContent = t('ready'); }, 3000);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
