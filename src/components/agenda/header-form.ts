/**
 * Header form component — project & customer information.
 */

import { getState, updateAgenda } from '../../state';
import { trek } from '../../trek/mode';
import { on } from '../../bus';
import { t } from '../../i18n';
import type { Translations } from '../../i18n/types';
import type { AgendaHeader } from '../../types';

interface FieldDef {
  key: keyof AgendaHeader;
  i18nKey: keyof Translations;
  wide?: boolean;
}

const FIELDS: FieldDef[] = [
  { key: 'vendorName', i18nKey: 'vendor', wide: true },
  { key: 'customerNumber', i18nKey: 'customerNumber' },
  { key: 'projectNumber', i18nKey: 'projectNumber' },
  { key: 'customerAddress', i18nKey: 'customerAddress', wide: true },
  { key: 'customerProjectContact', i18nKey: 'customerProjectContact' },
  { key: 'vendorProjectContact', i18nKey: 'vendorProjectContact' },
  { key: 'projectName', i18nKey: 'project', wide: true },
];

export function renderHeaderForm(container: HTMLElement): void {
  const panel = document.createElement('div');
  panel.className = 'lcars-panel';
  panel.innerHTML = `
    <div class="lcars-panel-header">
      <div class="lcars-panel-indicator" style="background: var(--lcars-orange);"></div>
      <h2 class="lcars-panel-title" id="header-form-title">${t('projectInformation')}</h2>
    </div>
    <div class="agenda-header-form" id="header-form-fields"></div>
  `;
  container.appendChild(panel);

  const fieldsContainer = panel.querySelector('#header-form-fields')!;
  const isTrek = getState().trekMode;

  FIELDS.forEach((f) => {
    const group = document.createElement('div');
    group.className = `form-group${f.wide ? ' wide' : ''}`;
    const label = document.createElement('label');
    label.className = 'lcars-label';
    label.setAttribute('data-field', f.key);
    label.textContent = trek(t(f.i18nKey), isTrek);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lcars-input';
    input.id = `header-${f.key}`;
    input.placeholder = trek(t(f.i18nKey), isTrek);

    // Load existing value
    const agenda = getState().currentAgenda;
    if (agenda) {
      input.value = agenda.header[f.key];
    }

    input.addEventListener('change', () => {
      const a = getState().currentAgenda;
      if (a) {
        a.header[f.key] = input.value;
        updateAgenda({ header: a.header });
      }
    });

    group.appendChild(label);
    group.appendChild(input);
    fieldsContainer.appendChild(group);
  });

  // Trek mode updates
  on('trek-mode-changed', () => {
    const isTrekNow = getState().trekMode;
    panel.querySelector('#header-form-title')!.textContent =
      isTrekNow ? 'Mission Parameters' : t('projectInformation');
    FIELDS.forEach((f) => {
      const lbl = panel.querySelector(`[data-field="${f.key}"]`);
      if (lbl) lbl.textContent = trek(t(f.i18nKey), isTrekNow);
    });
  });

  // Locale updates
  on('locale-changed', () => {
    const isTrekNow = getState().trekMode;
    panel.querySelector('#header-form-title')!.textContent =
      isTrekNow ? 'Mission Parameters' : t('projectInformation');
    FIELDS.forEach((f) => {
      const lbl = panel.querySelector(`[data-field="${f.key}"]`);
      if (lbl) lbl.textContent = trek(t(f.i18nKey), isTrekNow);
      const inp = panel.querySelector(`#header-${f.key}`) as HTMLInputElement | null;
      if (inp) inp.placeholder = trek(t(f.i18nKey), isTrekNow);
    });
  });
}
