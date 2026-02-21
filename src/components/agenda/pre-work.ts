/**
 * Pre-work section — projector/network needs & generated requirements text.
 */

import { getState, updateAgenda } from '../../state';
import { trek } from '../../trek/mode';
import { on } from '../../bus';
import { t } from '../../i18n';

export function renderPreWork(container: HTMLElement): void {
  const panel = document.createElement('div');
  panel.className = 'lcars-panel';
  panel.innerHTML = `
    <div class="lcars-panel-header">
      <div class="lcars-panel-indicator" style="background: var(--lcars-gold);"></div>
      <h2 class="lcars-panel-title" id="prework-title">${t('preWorkRequirements')}</h2>
    </div>
    <div class="prework-section" id="prework-section"></div>
  `;
  container.appendChild(panel);

  const section = panel.querySelector('#prework-section')!;
  const titleEl = panel.querySelector('#prework-title')!;
  renderQuestions(section);

  on('trek-mode-changed', () => {
    renderQuestions(section);
  });

  on('locale-changed', () => {
    titleEl.textContent = t('preWorkRequirements');
    renderQuestions(section);
  });
}

function renderQuestions(container: Element): void {
  const agenda = getState().currentAgenda;
  if (!agenda) return;

  const isTrek = getState().trekMode;

  const projectorQ = trek(t('projectorQuestion'), isTrek);
  const networkQ = trek(t('networkQuestion'), isTrek);

  container.innerHTML = `
    <label class="lcars-checkbox-row" id="prework-projector">
      <input type="checkbox" ${agenda.preWork.needsProjector ? 'checked' : ''}>
      <span class="lcars-toggle"></span>
      <span style="font-size:14px; text-transform:none; letter-spacing:normal;">${projectorQ}</span>
    </label>
    <label class="lcars-checkbox-row" id="prework-network">
      <input type="checkbox" ${agenda.preWork.needsNetworkAccess ? 'checked' : ''}>
      <span class="lcars-toggle"></span>
      <span style="font-size:14px; text-transform:none; letter-spacing:normal;">${networkQ}</span>
    </label>
    <div id="prework-output"></div>
  `;

  const projCheck = container.querySelector('#prework-projector input') as HTMLInputElement;
  const netCheck = container.querySelector('#prework-network input') as HTMLInputElement;

  function updatePreWork() {
    agenda!.preWork.needsProjector = projCheck.checked;
    agenda!.preWork.needsNetworkAccess = netCheck.checked;
    updateAgenda({ preWork: agenda!.preWork });
    renderOutput(container.querySelector('#prework-output')!);
  }

  projCheck.addEventListener('change', updatePreWork);
  netCheck.addEventListener('change', updatePreWork);

  renderOutput(container.querySelector('#prework-output')!);
}

function renderOutput(container: Element): void {
  const agenda = getState().currentAgenda;
  if (!agenda) return;

  const items: string[] = [];

  if (agenda.preWork.needsProjector) {
    items.push(trek(t('projectorRequirement'), getState().trekMode));
  }
  if (agenda.preWork.needsNetworkAccess) {
    items.push(trek(t('networkRequirement'), getState().trekMode));
  }

  if (items.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="prework-output">
      <div class="prework-output-title">⚠️ ${t('preWorkOutput')}</div>
      ${items.map((i) => `<div class="prework-output-item">▸ ${i}</div>`).join('')}
    </div>
  `;
}
