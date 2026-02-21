/**
 * Agenda view — main builder interface.
 * Composes: header form, pre-work, travel, day panels.
 */

import type { Agenda, AgendaDay, AgendaEvent } from '../../types';
import { getState, setAgenda, updateAgenda, getAgenda } from '../../state';
import { on, emit } from '../../bus';
import { uid } from '../../utils/id';
import { todayISO, nextDay } from '../../utils/time';
import { renderHeaderForm } from '../agenda/header-form';
import { renderPreWork } from '../agenda/pre-work';
import { renderTravelArrival, renderTravelDeparture } from '../agenda/travel-form';
import { renderDayPanel } from '../agenda/day-panel';
import { saveAgenda, saveDraft, loadDraft, clearDraft } from '../../storage';
import { t } from '../../i18n';

export function initAgendaView(): void {
  const container = document.getElementById('view-agenda')!;

  // Check for a saved draft first
  const draft = loadDraft();
  if (draft) {
    showDraftPrompt(container, draft);
    return;
  }

  // Create a new agenda if none exists
  if (!getState().currentAgenda) {
    createNewAgenda();
  }

  renderAgendaView(container);

  // Re-render when agenda changes significantly
  on('agenda-loaded', () => {
    renderAgendaView(container);
  });
}

function renderAgendaView(container: HTMLElement): void {
  container.innerHTML = '';

  const scroll = document.createElement('div');
  scroll.className = 'agenda-scroll';

  // Header Form
  renderHeaderForm(scroll);

  // Pre-Work
  renderPreWork(scroll);

  // Travel Arrival
  renderTravelArrival(scroll);

  // Days
  const daysContainer = document.createElement('div');
  daysContainer.id = 'days-container';
  scroll.appendChild(daysContainer);
  renderAllDays(daysContainer);

  // Day management buttons
  const dayActions = document.createElement('div');
  dayActions.style.cssText = 'display:flex; gap:8px; margin:16px 0;';
  dayActions.innerHTML = `
    <button class="lcars-btn primary lcars-shaped" id="btn-add-day">
      <i class="fa-solid fa-plus"></i> ${t('newDay')}
    </button>
    <button class="lcars-btn danger lcars-shaped" id="btn-remove-day">
      <i class="fa-solid fa-minus"></i> ${t('removeLastDay')}
    </button>
    <div style="flex:1;"></div>
    <button class="lcars-btn lcars-shaped" id="btn-save-draft" style="--btn-bg: var(--lcars-gold);">
      <i class="fa-solid fa-pen-to-square"></i> ${t('saveDraft')}
    </button>
    <button class="lcars-btn teal lcars-shaped" id="btn-save-agenda">
      <i class="fa-solid fa-floppy-disk"></i> ${t('save')}
    </button>
  `;
  scroll.appendChild(dayActions);

  // Travel Departure
  renderTravelDeparture(scroll);

  container.appendChild(scroll);

  // Bind day management
  document.getElementById('btn-add-day')!.addEventListener('click', () => {
    addDay();
    renderAllDays(daysContainer);
  });

  document.getElementById('btn-remove-day')!.addEventListener('click', () => {
    removeLastDay();
    renderAllDays(daysContainer);
  });

  document.getElementById('btn-save-draft')!.addEventListener('click', () => {
    const agenda = getAgenda();
    if (agenda) {
      saveDraft(agenda);
      showStatus(t('draftSaved'));
    }
  });

  document.getElementById('btn-save-agenda')!.addEventListener('click', async () => {
    const agenda = getAgenda();
    if (agenda) {
      await saveAgenda(agenda);
      clearDraft(); // clear draft after full save
      emit('agenda-saved', {});
      showStatus(t('agendaSaved'));
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.getElementById('btn-save-agenda')?.click();
    }
  });
}

function renderAllDays(container: HTMLElement): void {
  container.innerHTML = '';
  const agenda = getState().currentAgenda;
  if (!agenda) return;

  agenda.days.forEach((day, i) => {
    renderDayPanel(day, i, container);
  });
}

function createNewAgenda(): void {
  const today = todayISO();

  const orientationEvent: AgendaEvent = {
    id: uid(),
    type: 'orientation',
    title: t('orientation'),
    description: t('orientationDescription'),
    bulletPoints: [
      t('bulletOrientation1'),
      t('bulletOrientation2'),
      t('bulletOrientation3'),
      t('bulletOrientation4'),
    ],
    startTime: '09:00',
    endTime: '09:30',
    duration: 30,
    attendees: [],
  };

  const adjournEvent: AgendaEvent = {
    id: uid(),
    type: 'adjourn',
    title: t('adjourn'),
    description: '',
    bulletPoints: [],
    startTime: '17:00',
    endTime: '17:00',
    duration: 0,
    attendees: [],
  };

  const day1: AgendaDay = {
    id: uid(),
    date: today,
    dayStartTime: '09:00',
    adjournTime: '17:00',
    events: [orientationEvent, adjournEvent],
  };

  const agenda: Agenda = {
    id: uid(),
    name: t('newAgenda'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    header: {
      vendorName: '',
      customerNumber: '',
      customerAddress: '',
      customerProjectContact: '',
      vendorProjectContact: '',
      projectNumber: '',
      projectName: '',
    },
    travel: {
      arrival: {
        date: today,
        time: '08:00',
        mode: 'flight',
        reference: '',
        location: '',
        travelTimeToSite: 30,
      },
      departure: {
        date: today,
        time: '18:00',
        mode: 'flight',
        reference: '',
        location: '',
        travelTimeToSite: 30,
      },
    },
    preWork: {
      needsProjector: false,
      needsNetworkAccess: false,
    },
    days: [day1],
  };

  setAgenda(agenda);
}

function addDay(): void {
  const agenda = getState().currentAgenda;
  if (!agenda) return;

  const lastDay = agenda.days[agenda.days.length - 1];
  const newDate = lastDay ? nextDay(lastDay.date) : todayISO();
  const isLastDay = true; // Will be recalculated

  // If the previous last day had a recap, we might move it
  // Actually, we just let users manage the recap

  const adjournEvent: AgendaEvent = {
    id: uid(),
    type: 'adjourn',
    title: t('adjourn'),
    description: '',
    bulletPoints: [],
    startTime: '17:00',
    endTime: '17:00',
    duration: 0,
    attendees: [],
  };

  const newDay: AgendaDay = {
    id: uid(),
    date: newDate,
    dayStartTime: '09:00',
    adjournTime: '17:00',
    events: [adjournEvent],
  };

  // Auto-add recap to the new last day (before adjourn)
  if (isLastDay) {
    const recapEvent: AgendaEvent = {
      id: uid(),
      type: 'recap',
      title: t('recapTitle'),
      description: t('recapDescription'),
      bulletPoints: [
        t('bulletRecap1'),
        t('bulletRecap2'),
        t('bulletRecap3'),
        t('bulletRecap4'),
      ],
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      attendees: [],
    };
    newDay.events.unshift(recapEvent);

    // Remove recap from previous last day if it exists
    if (lastDay) {
      const existingRecapIdx = lastDay.events.findIndex((e) => e.type === 'recap');
      if (existingRecapIdx >= 0) {
        lastDay.events.splice(existingRecapIdx, 1);
      }
    }
  }

  agenda.days.push(newDay);
  updateAgenda({ days: agenda.days });
}

function removeLastDay(): void {
  const agenda = getState().currentAgenda;
  if (!agenda || agenda.days.length <= 1) return;

  agenda.days.pop();

  // Ensure the new last day has a recap
  const newLast = agenda.days[agenda.days.length - 1];
  const hasRecap = newLast.events.some((e) => e.type === 'recap');
  if (!hasRecap) {
    const recapEvent: AgendaEvent = {
      id: uid(),
      type: 'recap',
      title: t('recapTitle'),
      description: t('recapDescription'),
      bulletPoints: [
        t('bulletRecap1'),
        t('bulletRecap2'),
        t('bulletRecap3'),
        t('bulletRecap4'),
      ],
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      attendees: [],
    };

    const adjournIdx = newLast.events.findIndex((e) => e.type === 'adjourn');
    if (adjournIdx >= 0) {
      newLast.events.splice(adjournIdx, 0, recapEvent);
    } else {
      newLast.events.push(recapEvent);
    }
  }

  updateAgenda({ days: agenda.days });
}

function showStatus(msg: string): void {
  const status = document.getElementById('status-bar');
  if (status) {
    status.textContent = msg;
    setTimeout(() => {
      status.textContent = t('ready');
    }, 3000);
  }
}

function showDraftPrompt(container: HTMLElement, draft: Agenda): void {
  container.innerHTML = '';

  const prompt = document.createElement('div');
  prompt.className = 'lcars-panel';
  prompt.style.cssText = 'max-width: 520px; margin: 48px auto; padding: 32px;';
  prompt.innerHTML = `
    <div class="lcars-panel-title" style="margin-bottom: 16px;">
      <i class="fa-solid fa-pen-to-square"></i> ${t('saveDraft')}
    </div>
    <p style="margin-bottom: 8px; opacity: 0.85;">${draft.name || t('untitledAgenda')}</p>
    <p style="margin-bottom: 24px; font-size: 0.85rem; opacity: 0.6;">${t('updated')}: ${new Date(draft.updatedAt).toLocaleString()}</p>
    <p style="margin-bottom: 24px;">${t('draftFound')}</p>
    <div style="display:flex; gap:12px;">
      <button class="lcars-btn teal lcars-shaped" id="btn-draft-restore">
        <i class="fa-solid fa-rotate-left"></i> ${t('draftRestore')}
      </button>
      <button class="lcars-btn danger lcars-shaped" id="btn-draft-discard">
        <i class="fa-solid fa-trash-can"></i> ${t('draftDiscard')}
      </button>
    </div>
  `;
  container.appendChild(prompt);

  document.getElementById('btn-draft-restore')!.addEventListener('click', () => {
    setAgenda(draft);
    clearDraft();
    renderAgendaView(container);
    showStatus(t('draftRestore'));
  });

  document.getElementById('btn-draft-discard')!.addEventListener('click', () => {
    clearDraft();
    if (!getState().currentAgenda) {
      createNewAgenda();
    }
    renderAgendaView(container);
    showStatus(t('draftCleared'));
  });
}
