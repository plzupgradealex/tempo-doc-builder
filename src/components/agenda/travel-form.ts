/**
 * Travel form component — arrival and departure details.
 */

import { getState, updateAgenda } from '../../state';
import { trek } from '../../trek/mode';
import { on } from '../../bus';
import { t } from '../../i18n';
import type { TravelLeg, TravelMode } from '../../types';

function renderTravelLeg(
  container: HTMLElement,
  legKey: 'arrival' | 'departure',
): void {
  const agenda = getState().currentAgenda;
  if (!agenda) return;

  const leg = agenda.travel[legKey];
  const isTrek = getState().trekMode;
  const title = legKey === 'arrival'
    ? trek(t('travelArrival'), isTrek)
    : trek(t('travelDeparture'), isTrek);
  const travelLabel = legKey === 'arrival'
    ? t('travelTimeToSite')
    : t('travelTimeToSite');

  const panel = document.createElement('div');
  panel.className = 'lcars-panel';
  panel.id = `travel-${legKey}-panel`;
  panel.innerHTML = `
    <div class="lcars-panel-header">
      <div class="lcars-panel-indicator" style="background: var(--lcars-sky);"></div>
      <h2 class="lcars-panel-title" data-travel-title="${legKey}">${title}</h2>
    </div>
    <div class="travel-form">
      <div class="form-group">
        <label class="lcars-label">${t('date')}</label>
        <input type="date" class="lcars-input" id="travel-${legKey}-date" value="${leg.date}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('time')}</label>
        <input type="time" class="lcars-input" id="travel-${legKey}-time" value="${leg.time}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('travelMode')}</label>
        <select class="lcars-select" id="travel-${legKey}-mode">
          <option value="flight" ${leg.mode === 'flight' ? 'selected' : ''}>${t('flight')}</option>
          <option value="train" ${leg.mode === 'train' ? 'selected' : ''}>${t('train')}</option>
          <option value="vehicle" ${leg.mode === 'vehicle' ? 'selected' : ''}>${t('vehicle')}</option>
        </select>
      </div>
      <div class="form-group" id="travel-${legKey}-ref-group">
        <label class="lcars-label" id="travel-${legKey}-ref-label">${leg.mode === 'vehicle' ? t('vehicle') : t('reference')}</label>
        <input type="text" class="lcars-input" id="travel-${legKey}-ref" value="${leg.reference}" placeholder="${leg.mode === 'vehicle' ? t('travelRefVehiclePlaceholder') : t('travelRefPlaceholder')}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('location')}</label>
        <input type="text" class="lcars-input" id="travel-${legKey}-location" value="${leg.location}" placeholder="${t('travelLocationPlaceholder')}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${travelLabel}</label>
        <input type="number" class="lcars-input" id="travel-${legKey}-travel-time" value="${leg.travelTimeToSite}" min="0" step="5">
      </div>
    </div>
  `;

  container.appendChild(panel);

  // Bind events
  const fields = ['date', 'time', 'mode', 'ref', 'location', 'travel-time'];
  fields.forEach((field) => {
    const el = panel.querySelector(`#travel-${legKey}-${field}`) as HTMLInputElement | HTMLSelectElement;
    if (!el) return;
    el.addEventListener('change', () => {
      const a = getState().currentAgenda;
      if (!a) return;
      const l: TravelLeg = a.travel[legKey];
      switch (field) {
        case 'date': l.date = el.value; break;
        case 'time': l.time = el.value; break;
        case 'mode':
          l.mode = el.value as TravelMode;
          updateRefLabel(panel, legKey, l.mode);
          break;
        case 'ref': l.reference = el.value; break;
        case 'location': l.location = el.value; break;
        case 'travel-time': l.travelTimeToSite = parseInt(el.value) || 0; break;
      }
      updateAgenda({ travel: a.travel });
    });
  });
}

function updateRefLabel(panel: HTMLElement, legKey: string, mode: TravelMode): void {
  const label = panel.querySelector(`#travel-${legKey}-ref-label`);
  const input = panel.querySelector(`#travel-${legKey}-ref`) as HTMLInputElement | null;
  if (label) {
    label.textContent = mode === 'vehicle' ? t('vehicle') : t('reference');
  }
  if (input) {
    input.placeholder = mode === 'vehicle' ? t('travelRefVehiclePlaceholder') : t('travelRefPlaceholder');
  }
}

export function renderTravelArrival(container: HTMLElement): void {
  renderTravelLeg(container, 'arrival');

  on('trek-mode-changed', () => {
    const title = container.querySelector('[data-travel-title="arrival"]');
    if (title) {
      title.textContent = trek(t('travelArrival'), getState().trekMode);
    }
  });

  on('locale-changed', () => {
    const title = container.querySelector('[data-travel-title="arrival"]');
    if (title) {
      title.textContent = trek(t('travelArrival'), getState().trekMode);
    }
  });
}

export function renderTravelDeparture(container: HTMLElement): void {
  renderTravelLeg(container, 'departure');

  on('trek-mode-changed', () => {
    const title = container.querySelector('[data-travel-title="departure"]');
    if (title) {
      title.textContent = trek(t('travelDeparture'), getState().trekMode);
    }
  });

  on('locale-changed', () => {
    const title = container.querySelector('[data-travel-title="departure"]');
    if (title) {
      title.textContent = trek(t('travelDeparture'), getState().trekMode);
    }
  });
}
