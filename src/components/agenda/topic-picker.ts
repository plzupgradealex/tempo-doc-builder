/**
 * Topic picker modal — displays available knowledge domains for adding to a day.
 * Supports click-to-add and drag-to-day.
 * Split into "Sundries" (kickoff, pause, debrief, etc.) and "Topics" (knowledge domains).
 */

import type { AgendaEvent, KnowledgeDomain } from '../../types';
import { getState, updateAgenda } from '../../state';
import { emit, on } from '../../bus';
import { uid } from '../../utils/id';
import { addMinutes } from '../../utils/time';
import { setDragData } from '../../utils/drag-drop';
import { t } from '../../i18n';

/** Insert after the last event of the same type; otherwise before recap/adjourn. */
function findInsertionIndex(events: AgendaEvent[], eventType: string): number {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === eventType) return i + 1;
  }
  const tailIdx = events.findIndex((ev) => ev.type === 'recap' || ev.type === 'adjourn');
  return tailIdx >= 0 ? tailIdx : events.length;
}

let targetDayId: string | null = null;

export function initTopicPicker(): void {
  const modal = document.getElementById('topic-picker-modal')!;
  const closeBtn = document.getElementById('topic-picker-close')!;
  const body = document.getElementById('topic-picker-body')!;

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    targetDayId = null;
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      targetDayId = null;
    }
  });

  on('open-topic-picker', ({ dayId }) => {
    targetDayId = dayId as string;
    renderTopics(body);
    modal.classList.add('active');
  });
}

function renderTopics(container: HTMLElement): void {
  const domains = getState().domains;
  container.innerHTML = '';

  const sundries = domains.filter((d) => d.category === 'sundry');
  const topics = domains.filter((d) => d.category !== 'sundry');

  // Add built-in pause/lunch as virtual sundry cards
  const pauseCard = createPauseCard(t('lunchBreak'), 'fa-utensils', 30);
  const coffeeCard = createPauseCard(t('pause'), 'fa-mug-hot', 15);

  // Sundries section
  const sundriesHeader = document.createElement('div');
  sundriesHeader.className = 'topic-picker-section-header';
  sundriesHeader.innerHTML = `
    <div class="lcars-panel-indicator" style="background: var(--lcars-peach); width: 6px; height: 20px; border-radius: 3px;"></div>
    <span style="font-weight: 600; letter-spacing: 2px; color: var(--lcars-peach); font-size: 14px;">${t('sundries').toUpperCase()}</span>
  `;
  sundriesHeader.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:12px;';
  container.appendChild(sundriesHeader);

  const sundriesGrid = document.createElement('div');
  sundriesGrid.className = 'topic-picker-grid';
  sundriesGrid.appendChild(coffeeCard);
  sundriesGrid.appendChild(pauseCard);
  sundries.forEach((domain) => {
    sundriesGrid.appendChild(createTopicCard(domain));
  });
  container.appendChild(sundriesGrid);

  // Topics section
  const topicsHeader = document.createElement('div');
  topicsHeader.className = 'topic-picker-section-header';
  topicsHeader.innerHTML = `
    <div class="lcars-panel-indicator" style="background: var(--lcars-lavender); width: 6px; height: 20px; border-radius: 3px;"></div>
    <span style="font-weight: 600; letter-spacing: 2px; color: var(--lcars-lavender); font-size: 14px;">${t('topics').toUpperCase()}</span>
  `;
  topicsHeader.style.cssText = 'display:flex;align-items:center;gap:10px;margin:20px 0 12px;';
  container.appendChild(topicsHeader);

  const topicsGrid = document.createElement('div');
  topicsGrid.className = 'topic-picker-grid';
  topics.forEach((domain) => {
    topicsGrid.appendChild(createTopicCard(domain));
  });
  container.appendChild(topicsGrid);
}

/** Create a virtual pause/lunch card (not a domain, creates a pause event directly). */
function createPauseCard(title: string, icon: string, duration: number): HTMLElement {
  const card = document.createElement('div');
  card.className = 'topic-card';

  card.innerHTML = `
    <div class="topic-card-header">
      <div class="topic-card-icon">
        <i class="fa-solid ${icon}"></i>
      </div>
      <span class="topic-card-name">${title}</span>
    </div>
    <div class="topic-card-desc" style="font-size:11px;opacity:0.6;">${duration} min</div>
  `;

  card.addEventListener('click', () => {
    if (targetDayId) {
      addPauseToDay(title, duration, targetDayId);
      document.getElementById('topic-picker-modal')!.classList.remove('active');
      targetDayId = null;
    }
  });

  return card;
}

function addPauseToDay(title: string, duration: number, dayId: string): void {
  const agenda = getState().currentAgenda;
  if (!agenda) return;
  const day = agenda.days.find((d) => d.id === dayId);
  if (!day) return;

  const lastNonAdjourn = day.events.filter((ev) => ev.type !== 'adjourn');
  const lastEvent = lastNonAdjourn[lastNonAdjourn.length - 1];
  const startTime = lastEvent ? lastEvent.endTime : day.dayStartTime;

  const pauseEvent: AgendaEvent = {
    id: uid(),
    type: 'pause',
    title,
    description: '',
    bulletPoints: [],
    startTime,
    endTime: addMinutes(startTime, duration),
    duration,
    attendees: [],
  };

  const insertIdx = findInsertionIndex(day.events, 'pause');
  day.events.splice(insertIdx, 0, pauseEvent);
  updateAgenda({ days: agenda.days });
  emit('day-updated', { dayId });
}

function createTopicCard(domain: KnowledgeDomain): HTMLElement {
  const card = document.createElement('div');
  card.className = 'topic-card';
  card.draggable = true;
  const dur = domain.defaultDuration ?? 120;

  card.innerHTML = `
    <div class="topic-card-header">
      <div class="topic-card-icon">
        <i class="fa-solid ${domain.icon}"></i>
      </div>
      <span class="topic-card-name">${domain.name}</span>
    </div>
    <div class="topic-card-desc">${domain.description}</div>
    <div class="topic-card-duration" style="font-size:11px;opacity:0.5;margin-top:4px;">${dur} min</div>
  `;

  // Click to add
  card.addEventListener('click', () => {
    if (targetDayId) {
      addDomainToDay(domain, targetDayId);
      document.getElementById('topic-picker-modal')!.classList.remove('active');
      targetDayId = null;
    }
  });

  // Drag
  card.addEventListener('dragstart', (e) => {
    setDragData(e, { type: 'domain', domainId: domain.id });
  });

  return card;
}

function addDomainToDay(domain: KnowledgeDomain, dayId: string): void {
  const agenda = getState().currentAgenda;
  if (!agenda) return;

  const day = agenda.days.find((d) => d.id === dayId);
  if (!day) return;

  const lastNonAdjourn = day.events.filter((ev) => ev.type !== 'adjourn');
  const lastEvent = lastNonAdjourn[lastNonAdjourn.length - 1];
  const startTime = lastEvent ? lastEvent.endTime : day.dayStartTime;
  const duration = domain.defaultDuration ?? 120;

  const newEvent: AgendaEvent = {
    id: uid(),
    type: domain.id === 'plant-tour' ? 'plant-tour' : 'topic',
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

  updateAgenda({ days: agenda.days });
  emit('day-updated', { dayId });
}
