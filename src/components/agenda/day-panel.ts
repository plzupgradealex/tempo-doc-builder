/**
 * Day panel component — renders a single day with its events.
 * Supports drag-and-drop reordering and event addition.
 */

import type { AgendaDay, AgendaEvent } from '../../types';
import { getState, updateAgenda } from '../../state';
import { emit, on } from '../../bus';
import { uid } from '../../utils/id';
import { addMinutes, formatDateLong, timeToMinutes } from '../../utils/time';
import { makeDropTarget } from '../../utils/drag-drop';
import { renderEventCard } from './event-card';
import { t } from '../../i18n';

/**
 * Find the best insertion index for a new event of the given type.
 * Strategy: insert after the last event of the same type; if none exist,
 * insert before recap/adjourn (the structural tail events).
 */
function findInsertionIndex(events: AgendaEvent[], eventType: string): number {
  // Find the last event of the same type
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === eventType) return i + 1;
  }
  // No match — insert before the first recap or adjourn
  const tailIdx = events.findIndex((ev) => ev.type === 'recap' || ev.type === 'adjourn');
  return tailIdx >= 0 ? tailIdx : events.length;
}

/** Recalculate start/end times sequentially based on current event order and durations */
function recalculateTimes(day: AgendaDay): void {
  let cursor = day.dayStartTime;
  for (const event of day.events) {
    if (event.type === 'adjourn') {
      event.startTime = cursor;
      event.endTime = cursor;
      continue;
    }
    event.startTime = cursor;
    event.endTime = addMinutes(cursor, event.duration);
    cursor = event.endTime;
  }
}

/** Detect overlapping events in a day. Returns pairs of overlapping event indices. */
function detectOverlaps(day: AgendaDay): Array<[number, number]> {
  const overlaps: Array<[number, number]> = [];
  for (let i = 0; i < day.events.length; i++) {
    const a = day.events[i];
    if (a.type === 'adjourn') continue;
    for (let j = i + 1; j < day.events.length; j++) {
      const b = day.events[j];
      if (b.type === 'adjourn') continue;
      const aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime);
      if (aEnd > bStart) {
        overlaps.push([i, j]);
      }
    }
  }
  return overlaps;
}

export function renderDayPanel(
  day: AgendaDay,
  dayIndex: number,
  container: HTMLElement,
): void {
  const panel = document.createElement('div');
  panel.className = 'day-panel lcars-panel';
  panel.setAttribute('data-day-id', day.id);

  const headerHtml = `
    <div class="day-panel-header">
      <div class="lcars-panel-indicator" style="background: var(--lcars-blue);"></div>
      <span class="day-panel-title">${t('day')} ${dayIndex + 1}: ${formatDateLong(day.date)}</span>
      <input type="date" class="lcars-input day-panel-date-input" value="${day.date}">
      <div class="day-panel-time-inputs" style="display:flex;gap:6px;align-items:center;">
        <label style="font-size:11px;color:var(--lcars-text-muted);letter-spacing:1px;">${t('dayStartTime')}</label>
        <input type="time" class="lcars-input day-start-time" value="${day.dayStartTime}" style="width:90px;font-size:13px;">
        <label style="font-size:11px;color:var(--lcars-text-muted);letter-spacing:1px;">${t('dayAdjournTime')}</label>
        <input type="time" class="lcars-input day-adjourn-time" value="${day.adjournTime}" style="width:90px;font-size:13px;">
      </div>
      <div class="day-panel-actions">
        <button class="lcars-btn small primary" data-action="add-topic" title="${t('addTopic')}">
          <i class="fa-solid fa-plus"></i> ${t('topic')}
        </button>
        <button class="lcars-btn small" data-action="add-custom" title="${t('addCustom')}">
          <i class="fa-solid fa-pen-to-square"></i> ${t('custom')}
        </button>
        <button class="lcars-btn small" data-action="arrange-times" title="${t('arrangeTimes')}" style="--btn-bg: var(--lcars-teal);">
          <i class="fa-solid fa-arrows-up-down"></i> ${t('arrangeTimes')}
        </button>
        <button class="lcars-btn small" data-action="toggle-compact" title="${t('compressedMode')}">
          <i class="fa-solid fa-compress"></i> ${t('compressedMode')}
        </button>
      </div>
    </div>
    <div class="day-events" data-day-id="${day.id}"></div>
  `;

  panel.innerHTML = headerHtml;
  container.appendChild(panel);

  // Date change
  const dateInput = panel.querySelector('.day-panel-date-input') as HTMLInputElement;
  dateInput.addEventListener('change', () => {
    day.date = dateInput.value;
    const titleEl = panel.querySelector('.day-panel-title')!;
    titleEl.textContent = `${t('day')} ${dayIndex + 1}: ${formatDateLong(day.date)}`;
    updateAgenda({ days: getState().currentAgenda!.days });
  });

  // Day start time change
  const startTimeInput = panel.querySelector('.day-start-time') as HTMLInputElement;
  startTimeInput.addEventListener('change', () => {
    day.dayStartTime = startTimeInput.value;
    // Update the first event's start time if it's orientation
    if (day.events[0]?.type === 'orientation') {
      day.events[0].startTime = day.dayStartTime;
      day.events[0].endTime = addMinutes(day.dayStartTime, day.events[0].duration);
    }
    updateAgenda({ days: getState().currentAgenda!.days });
    renderEvents(day, eventsContainer);
  });

  // Day adjourn time change
  const adjournTimeInput = panel.querySelector('.day-adjourn-time') as HTMLInputElement;
  adjournTimeInput.addEventListener('change', () => {
    day.adjournTime = adjournTimeInput.value;
    // Update the adjourn event
    const adjournEvent = day.events.find((e) => e.type === 'adjourn');
    if (adjournEvent) {
      adjournEvent.startTime = day.adjournTime;
      adjournEvent.endTime = day.adjournTime;
    }
    updateAgenda({ days: getState().currentAgenda!.days });
    renderEvents(day, eventsContainer);
  });

  // Render events
  const eventsContainer = panel.querySelector('.day-events') as HTMLElement;
  renderEvents(day, eventsContainer);

  // Drop target for reordering and adding domains
  makeDropTarget(eventsContainer, (payload, e) => {
    if (payload.type === 'domain' && payload.domainId) {
      // Add domain as new event
      const domains = getState().domains;
      const domain = domains.find((d) => d.id === payload.domainId);
      if (!domain) return;

      const lastNonAdjourn = day.events.filter((ev) => ev.type !== 'adjourn');
      const lastEvent = lastNonAdjourn[lastNonAdjourn.length - 1];
      const startTime = lastEvent ? lastEvent.endTime : day.dayStartTime;
      const duration = domain.defaultDuration ?? 120;

      const newEvent: AgendaEvent = {
        id: uid(),
        type: 'topic',
        topicDomainId: domain.id,
        title: domain.name,
        description: domain.description,
        bulletPoints: [...domain.defaultBulletPoints],
        startTime,
        endTime: addMinutes(startTime, duration),
        duration,
        attendees: domain.recommendedAttendees.map((r) => ({ name: '', role: r })),
      };

      // Insert after last topic, or before recap/adjourn
      const insertIdx = findInsertionIndex(day.events, 'topic');
      day.events.splice(insertIdx, 0, newEvent);

      updateAgenda({ days: getState().currentAgenda!.days });
      emit('day-updated', { dayId: day.id });
    } else if (payload.type === 'event' && payload.eventId) {
      // Reorder: find drop position
      const dropY = e.clientY;
      const cards = eventsContainer.querySelectorAll('.event-card');
      let insertIdx = day.events.length;

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (dropY < mid && insertIdx === day.events.length) {
          insertIdx = i;
        }
      });

      // Move event
      if (payload.sourceDayId === day.id) {
        const oldIdx = day.events.findIndex((ev) => ev.id === payload.eventId);
        if (oldIdx >= 0 && oldIdx !== insertIdx) {
          const [moved] = day.events.splice(oldIdx, 1);
          // Ensure we don't place before orientation or after adjourn
          const minIdx = day.events[0]?.type === 'orientation' ? 1 : 0;
          const maxIdx = day.events[day.events.length - 1]?.type === 'adjourn'
            ? day.events.length - 1
            : day.events.length;
          const safeIdx = Math.max(minIdx, Math.min(maxIdx, insertIdx > oldIdx ? insertIdx - 1 : insertIdx));
          day.events.splice(safeIdx, 0, moved);
          updateAgenda({ days: getState().currentAgenda!.days });
          emit('day-updated', { dayId: day.id });
        }
      } else {
        // Cross-day move
        const agenda = getState().currentAgenda;
        if (!agenda) return;
        const sourceDay = agenda.days.find((d) => d.id === payload.sourceDayId);
        if (!sourceDay) return;
        const sourceIdx = sourceDay.events.findIndex((ev) => ev.id === payload.eventId);
        if (sourceIdx < 0) return;
        const [moved] = sourceDay.events.splice(sourceIdx, 1);
        const minIdx = day.events[0]?.type === 'orientation' ? 1 : 0;
        const maxIdx = day.events[day.events.length - 1]?.type === 'adjourn'
          ? day.events.length - 1
          : day.events.length;
        const safeIdx = Math.max(minIdx, Math.min(maxIdx, insertIdx));
        day.events.splice(safeIdx, 0, moved);
        updateAgenda({ days: agenda.days });
        emit('day-updated', { dayId: sourceDay.id });
        emit('day-updated', { dayId: day.id });
      }
    }
  });

  // Add Topic button → open topic picker
  panel.querySelector('[data-action="add-topic"]')!.addEventListener('click', () => {
    emit('open-topic-picker', { dayId: day.id });
  });

  // Arrange Times — recalculate all event times sequentially
  panel.querySelector('[data-action="arrange-times"]')!.addEventListener('click', () => {
    recalculateTimes(day);
    updateAgenda({ days: getState().currentAgenda!.days });
    emit('day-updated', { dayId: day.id });
  });

  // Toggle compact/compressed mode
  panel.querySelector('[data-action="toggle-compact"]')!.addEventListener('click', () => {
    eventsContainer.classList.toggle('compact-mode');
    const btn = panel.querySelector('[data-action="toggle-compact"]') as HTMLButtonElement;
    const isCompact = eventsContainer.classList.contains('compact-mode');
    btn.innerHTML = isCompact
      ? `<i class="fa-solid fa-expand"></i> ${t('compressedMode')}`
      : `<i class="fa-solid fa-compress"></i> ${t('compressedMode')}`;
  });

  // Add Custom Event button
  panel.querySelector('[data-action="add-custom"]')!.addEventListener('click', () => {
    const lastNonAdjourn = day.events.filter((ev) => ev.type !== 'adjourn');
    const lastEvent = lastNonAdjourn[lastNonAdjourn.length - 1];
    const startTime = lastEvent ? lastEvent.endTime : day.dayStartTime;

    const customEvent: AgendaEvent = {
      id: uid(),
      type: 'custom',
      title: t('customTopic'),
      description: '',
      bulletPoints: [],
      startTime,
      endTime: addMinutes(startTime, 60),
      duration: 60,
      attendees: [],
    };

    const adjournIdx = day.events.findIndex((ev) => ev.type === 'adjourn');
    if (adjournIdx >= 0) {
      const insertIdx = findInsertionIndex(day.events, 'custom');
      day.events.splice(insertIdx, 0, customEvent);
    } else {
      day.events.push(customEvent);
    }

    updateAgenda({ days: getState().currentAgenda!.days });
    emit('day-updated', { dayId: day.id });
  });

  // Listen for day updates
  on('day-updated', ({ dayId }) => {
    if (dayId === day.id) {
      renderEvents(day, eventsContainer);
    }
  });
}

function renderEvents(day: AgendaDay, container: HTMLElement): void {
  container.innerHTML = '';

  // Check for overlaps
  const overlaps = detectOverlaps(day);
  const overlappingIndices = new Set<number>();
  overlaps.forEach(([a, b]) => { overlappingIndices.add(a); overlappingIndices.add(b); });

  if (overlaps.length > 0) {
    const banner = document.createElement('div');
    banner.className = 'overlap-warning';
    banner.innerHTML = `
      <span class="overlap-warning-text">
        <i class="fa-solid fa-triangle-exclamation"></i>
        ${t('overlapWarning')}
      </span>
      <button class="lcars-btn small primary overlap-fix-btn">${t('fixOverlaps')}</button>
    `;
    banner.querySelector('.overlap-fix-btn')!.addEventListener('click', () => {
      recalculateTimes(day);
      updateAgenda({ days: getState().currentAgenda!.days });
      emit('day-updated', { dayId: day.id });
    });
    container.appendChild(banner);
  }

  // Check for >2.5 hour gaps without a pause
  const pauseWarnings = detectPauseGaps(day);
  if (pauseWarnings.length > 0) {
    const banner = document.createElement('div');
    banner.className = 'pause-warning';
    banner.innerHTML = `
      <i class="fa-solid fa-clock"></i>
      <span>${t('pauseWarning')}</span>
    `;
    container.appendChild(banner);
  }

  // Check for events outside normal hours (before 06:00 or after 21:00)
  const nightEvents = detectNightEvents(day);
  if (nightEvents.length > 0) {
    const banner = document.createElement('div');
    banner.className = 'night-warning';
    banner.innerHTML = `
      <i class="fa-solid fa-moon"></i>
      <span>${t('nightWarning')}</span>
    `;
    container.appendChild(banner);
  }

  day.events.forEach((event, idx) => {
    const card = renderEventCard(event, day, container);
    if (overlappingIndices.has(idx)) {
      card.classList.add('overlap');
    }
  });
}

/** Detect events scheduled outside normal hours (before 06:00 or after 21:00) */
function detectNightEvents(day: AgendaDay): AgendaEvent[] {
  const EARLY = 6 * 60;  // 06:00
  const LATE = 21 * 60;  // 21:00
  return day.events.filter((ev) => {
    if (ev.type === 'adjourn') return false;
    const start = timeToMinutes(ev.startTime);
    const end = timeToMinutes(ev.endTime);
    return start < EARLY || end > LATE;
  });
}

/** Detect gaps >150 minutes without a pause-type event */
function detectPauseGaps(day: AgendaDay): Array<{ from: string; to: string }> {
  const gaps: Array<{ from: string; to: string }> = [];
  let lastPauseEnd = day.dayStartTime;

  for (const event of day.events) {
    if (event.type === 'adjourn') continue;
    if (event.type === 'pause') {
      lastPauseEnd = event.endTime;
      continue;
    }
    const gapMinutes = timeToMinutes(event.endTime) - timeToMinutes(lastPauseEnd);
    if (gapMinutes > 150) {
      gaps.push({ from: lastPauseEnd, to: event.startTime });
    }
  }
  return gaps;
}
