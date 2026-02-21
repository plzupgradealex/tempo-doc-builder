/**
 * Event card component — renders a single agenda event.
 * Supports display mode and inline edit mode.
 * All event types (except adjourn) support drag, edit, delete, and duration.
 */

import type { AgendaEvent, AgendaDay } from '../../types';
import { getState, updateAgenda } from '../../state';
import { emit } from '../../bus';
import { addMinutes, formatDuration, timeToMinutes } from '../../utils/time';
import { createTimePicker, getTimePickerValue } from '../../utils/time-picker';
import { setDragData } from '../../utils/drag-drop';
import { t } from '../../i18n';

/** Get the FA icon class for an event based on its type/domain */
function getEventIcon(event: AgendaEvent): string {
  if (event.topicDomainId) {
    const domains = getState().domains;
    const domain = domains.find((d) => d.id === event.topicDomainId);
    if (domain) return domain.icon;
  }
  switch (event.type) {
    case 'orientation': return 'fa-handshake';
    case 'pause': return 'fa-mug-hot';
    case 'recap': return 'fa-clipboard-list';
    case 'adjourn': return 'fa-door-open';
    case 'custom': return 'fa-pen-to-square';
    default: return 'fa-circle-question';
  }
}

export function renderEventCard(
  event: AgendaEvent,
  day: AgendaDay,
  container: HTMLElement,
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'event-card';
  card.setAttribute('data-event-id', event.id);
  // All movable types (everything except orientation and adjourn)
  const isDraggable = event.type !== 'orientation' && event.type !== 'adjourn';
  card.draggable = isDraggable;

  const indicatorClass = event.type;
  const isAdjourn = event.type === 'adjourn';
  const showControls = !isAdjourn;

  // Build static HTML (without time pickers — those are added as DOM)
  card.innerHTML = `
    <div class="event-card-indicator ${indicatorClass}"></div>
    <div class="event-card-content">
      <div class="event-card-top">
        <div class="event-card-time-controls"></div>
        <span class="event-card-title">
          <i class="fa-solid ${getEventIcon(event)}" style="margin-right:6px; opacity:0.7;"></i>
          ${escapeHtml(event.title)}
        </span>
        ${!isAdjourn ? `
          <span class="event-card-duration">${formatDuration(event.duration)}</span>
        ` : ''}
      </div>
      ${event.description ? `<div class="event-card-description">${escapeHtml(event.description)}</div>` : ''}
      ${event.topicDomainId === 'travel' ? `
        <div class="event-card-travel-fields" style="display:grid; grid-template-columns:auto 1fr; gap:2px 10px; font-size:12px; margin:6px 0; padding:6px 8px; background:rgba(255,255,255,0.05); border-radius:4px;">
          ${event.travelFrom ? `<span style="color:#aaa;">${t('travelFromLabel')}:</span><span>${escapeHtml(event.travelFrom)}</span>` : ''}
          ${event.travelTo ? `<span style="color:#aaa;">${t('travelToLabel')}:</span><span>${escapeHtml(event.travelTo)}</span>` : ''}
          ${event.travelFlight ? `<span style="color:#aaa;">${t('travelFlightLabel')}:</span><span>${escapeHtml(event.travelFlight)}</span>` : ''}
          ${event.travelDepartureTime ? `<span style="color:#aaa;">${t('travelDepartureTimeLabel')}:</span><span>${event.travelDepartureTime}</span>` : ''}
          ${event.travelArrivalTime ? `<span style="color:#aaa;">${t('travelArrivalTimeLabel')}:</span><span>${event.travelArrivalTime}</span>` : ''}
        </div>
      ` : ''}
      ${event.bulletPoints.length > 0 ? `
        <ul class="event-card-bullets">
          ${event.bulletPoints.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
      ` : ''}
      ${event.attendees.length > 0 ? `
        <div class="event-card-attendees">
          <i class="fa-solid fa-users" style="margin-right:4px;"></i>
          ${event.attendees.map((a) => a.name || a.role).join(', ')}
        </div>
      ` : ''}
    </div>
    ${showControls ? `
      <div class="event-card-actions">
        <button class="event-card-action grip" title="${t('editDragReorder')}">
          <i class="fa-solid fa-grip-vertical"></i>
        </button>
        <button class="event-card-action edit" title="${t('editButton')}">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="event-card-action delete" title="${t('editRemove')}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    ` : ''}
  `;

  // Insert custom time pickers into the time-controls container
  const timeControls = card.querySelector('.event-card-time-controls')!;
  const startPicker = createTimePicker(event.startTime, 'start', t('editStartTime'));
  timeControls.appendChild(startPicker);
  if (!isAdjourn) {
    const sep = document.createElement('span');
    sep.className = 'event-card-time-sep';
    sep.textContent = '–';
    timeControls.appendChild(sep);
    const endPicker = createTimePicker(event.endTime, 'end', t('editEndTime'));
    timeControls.appendChild(endPicker);
  }

  // Drag events
  if (isDraggable) {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      setDragData(e, {
        type: 'event',
        eventId: event.id,
        sourceDayId: day.id,
      });
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  }

  // Time picker change handlers
  const startPickerEl = card.querySelector('.lcars-time-picker[data-field="start"]') as HTMLElement | null;
  const endPickerEl = card.querySelector('.lcars-time-picker[data-field="end"]') as HTMLElement | null;

  if (startPickerEl) {
    startPickerEl.addEventListener('time-change', ((e: CustomEvent) => {
      event.startTime = e.detail.value;
      if (event.type === 'adjourn') {
        event.endTime = event.startTime;
        event.duration = 0;
        day.adjournTime = event.startTime;
      } else {
        // Keep duration, shift end time
        event.endTime = addMinutes(event.startTime, event.duration);
      }
      // Sync dayStartTime when the first event on the day changes
      if (day.events[0]?.id === event.id) {
        day.dayStartTime = event.startTime;
      }
      updateAgenda({ days: getState().currentAgenda!.days });
      emit('day-updated', { dayId: day.id });
    }) as EventListener);
  }

  if (endPickerEl) {
    endPickerEl.addEventListener('time-change', ((e: CustomEvent) => {
      event.endTime = e.detail.value;
      event.duration = timeToMinutes(event.endTime) - timeToMinutes(event.startTime);
      if (event.duration < 0) event.duration = 0;
      updateAgenda({ days: getState().currentAgenda!.days });
      emit('day-updated', { dayId: day.id });
    }) as EventListener);
  }

  // Edit button
  const editBtn = card.querySelector('.event-card-action.edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      renderEditInline(event, day, card);
    });
  }

  // Delete button
  const deleteBtn = card.querySelector('.event-card-action.delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const idx = day.events.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        day.events.splice(idx, 1);
        updateAgenda({ days: getState().currentAgenda!.days });
        emit('day-updated', { dayId: day.id });
      }
    });
  }

  container.appendChild(card);
  return card;
}

function renderEditInline(event: AgendaEvent, day: AgendaDay, cardEl: HTMLElement): void {
  const editEl = document.createElement('div');
  editEl.className = 'event-edit-inline';

  editEl.innerHTML = `
    <div class="event-edit-grid">
      <div class="form-group">
        <label class="lcars-label">${t('editTitle')}</label>
        <input type="text" class="lcars-input" id="edit-title" value="${escapeAttr(event.title)}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('editStartTime')}</label>
        <div id="edit-start-picker-slot"></div>
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('editEndTime')}</label>
        <div id="edit-end-picker-slot"></div>
      </div>
    </div>
    <div class="form-group">
      <label class="lcars-label">${t('editDescription')}</label>
      <textarea class="lcars-textarea" id="edit-desc" rows="2">${escapeHtml(event.description)}</textarea>
    </div>
    ${event.topicDomainId === 'travel' ? `
    <div class="event-edit-travel-fields" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
      <div class="form-group">
        <label class="lcars-label">${t('travelFromLabel')}</label>
        <input type="text" class="lcars-input" id="edit-travel-from" value="${escapeAttr(event.travelFrom || '')}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('travelToLabel')}</label>
        <input type="text" class="lcars-input" id="edit-travel-to" value="${escapeAttr(event.travelTo || '')}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('travelFlightLabel')}</label>
        <input type="text" class="lcars-input" id="edit-travel-flight" value="${escapeAttr(event.travelFlight || '')}">
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('travelDepartureTimeLabel')}</label>
        <div id="edit-travel-dep-slot"></div>
      </div>
      <div class="form-group">
        <label class="lcars-label">${t('travelArrivalTimeLabel')}</label>
        <div id="edit-travel-arr-slot"></div>
      </div>
    </div>
    ` : ''}
    <div class="event-edit-bullets-editor">
      <label class="lcars-label">${t('editSubTopics')}</label>
      <div id="edit-bullets"></div>
      <button class="lcars-btn small teal" id="edit-add-bullet" style="margin-top:6px;">
        <i class="fa-solid fa-plus"></i> ${t('editAddPoint')}
      </button>
    </div>
    <div class="event-edit-attendees">
      <label class="lcars-label">${t('editAttendees')}</label>
      <div id="edit-attendees"></div>
      <button class="lcars-btn small accent" id="edit-add-attendee" style="margin-top:6px;">
        <i class="fa-solid fa-user-plus"></i> ${t('editAddAttendee')}
      </button>
    </div>
    <div class="event-edit-actions">
      <button class="lcars-btn small" id="edit-cancel">${t('editCancel')}</button>
      <button class="lcars-btn small primary" id="edit-save">${t('editSave')}</button>
    </div>
  `;

  // Insert time pickers into edit form
  const editStartSlot = editEl.querySelector('#edit-start-picker-slot')!;
  const editStartPicker = createTimePicker(event.startTime, 'edit-start', t('editStartTime'));
  editStartSlot.appendChild(editStartPicker);

  const editEndSlot = editEl.querySelector('#edit-end-picker-slot')!;
  const editEndPicker = createTimePicker(event.endTime, 'edit-end', t('editEndTime'));
  editEndSlot.appendChild(editEndPicker);

  // Travel time pickers
  let editTravelDepPicker: HTMLElement | null = null;
  let editTravelArrPicker: HTMLElement | null = null;
  const travelDepSlot = editEl.querySelector('#edit-travel-dep-slot');
  if (travelDepSlot) {
    editTravelDepPicker = createTimePicker(event.travelDepartureTime || '08:00', 'edit-travel-dep', t('travelDepartureTimeLabel'));
    travelDepSlot.appendChild(editTravelDepPicker);
  }
  const travelArrSlot = editEl.querySelector('#edit-travel-arr-slot');
  if (travelArrSlot) {
    editTravelArrPicker = createTimePicker(event.travelArrivalTime || '10:00', 'edit-travel-arr', t('travelArrivalTimeLabel'));
    travelArrSlot.appendChild(editTravelArrPicker);
  }

  // Render bullet rows
  const bulletsContainer = editEl.querySelector('#edit-bullets')!;
  event.bulletPoints.forEach((bp, i) => {
    addBulletRow(bulletsContainer, bp, i);
  });

  editEl.querySelector('#edit-add-bullet')!.addEventListener('click', () => {
    addBulletRow(bulletsContainer, '', bulletsContainer.children.length);
  });

  // Render attendee rows
  const attendeesContainer = editEl.querySelector('#edit-attendees')!;
  event.attendees.forEach((att, i) => {
    addAttendeeRow(attendeesContainer, att.name, att.role, i);
  });

  editEl.querySelector('#edit-add-attendee')!.addEventListener('click', () => {
    addAttendeeRow(attendeesContainer, '', '', attendeesContainer.children.length);
  });

  // Cancel
  editEl.querySelector('#edit-cancel')!.addEventListener('click', () => {
    editEl.replaceWith(cardEl);
    // Re-render card in place
    emit('day-updated', { dayId: day.id });
  });

  // Save
  editEl.querySelector('#edit-save')!.addEventListener('click', () => {
    event.title = (editEl.querySelector('#edit-title') as HTMLInputElement).value;
    event.startTime = getTimePickerValue(editStartPicker);
    event.endTime = getTimePickerValue(editEndPicker);
    event.description = (editEl.querySelector('#edit-desc') as HTMLTextAreaElement).value;

    // Travel fields
    if (event.topicDomainId === 'travel') {
      event.travelFrom = (editEl.querySelector('#edit-travel-from') as HTMLInputElement)?.value || '';
      event.travelTo = (editEl.querySelector('#edit-travel-to') as HTMLInputElement)?.value || '';
      event.travelFlight = (editEl.querySelector('#edit-travel-flight') as HTMLInputElement)?.value || '';
      event.travelDepartureTime = editTravelDepPicker ? getTimePickerValue(editTravelDepPicker) : '';
      event.travelArrivalTime = editTravelArrPicker ? getTimePickerValue(editTravelArrPicker) : '';
    }

    // Collect bullets
    const bulletInputs = bulletsContainer.querySelectorAll<HTMLInputElement>('input');
    event.bulletPoints = Array.from(bulletInputs).map((i) => i.value).filter(Boolean);

    // Collect attendees
    const attRows = attendeesContainer.querySelectorAll('.event-edit-attendee-row');
    event.attendees = Array.from(attRows).map((row) => {
      const inputs = row.querySelectorAll<HTMLInputElement>('input');
      return { name: inputs[0]?.value ?? '', role: inputs[1]?.value ?? '' };
    }).filter((a) => a.name || a.role);

    // Recalculate duration
    const [sh, sm] = event.startTime.split(':').map(Number);
    const [eh, em] = event.endTime.split(':').map(Number);
    event.duration = (eh * 60 + em) - (sh * 60 + sm);

    updateAgenda({ days: getState().currentAgenda!.days });
    emit('day-updated', { dayId: day.id });
  });

  cardEl.replaceWith(editEl);
}

function addBulletRow(container: Element, value: string, _idx: number): void {
  const row = document.createElement('div');
  row.className = 'event-edit-bullet-row';
  row.innerHTML = `
    <input type="text" class="lcars-input" value="${escapeAttr(value)}" placeholder="${t('editSubTopicPlaceholder')}">
    <button class="lcars-btn small danger" title="${t('editRemove')}"><i class="fa-solid fa-xmark"></i></button>
  `;
  row.querySelector('button')!.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function addAttendeeRow(container: Element, name: string, role: string, _idx: number): void {
  const row = document.createElement('div');
  row.className = 'event-edit-attendee-row';
  row.innerHTML = `
    <input type="text" class="lcars-input" value="${escapeAttr(name)}" placeholder="${t('editNamePlaceholder')}">
    <input type="text" class="lcars-input" value="${escapeAttr(role)}" placeholder="${t('editRolePlaceholder')}" style="max-width:160px;">
    <button class="lcars-btn small danger" title="${t('editRemove')}"><i class="fa-solid fa-xmark"></i></button>
  `;
  row.querySelector('button')!.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
