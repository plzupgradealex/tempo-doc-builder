/**
 * Topic picker modal — displays available knowledge domains for adding to a day.
 * Supports click-to-add and drag-to-day.
 */

import type { AgendaEvent, KnowledgeDomain } from '../../types';
import { getState, updateAgenda } from '../../state';
import { emit, on } from '../../bus';
import { uid } from '../../utils/id';
import { addMinutes } from '../../utils/time';
import { setDragData } from '../../utils/drag-drop';

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

  const grid = document.createElement('div');
  grid.className = 'topic-picker-grid';

  domains.forEach((domain) => {
    const card = createTopicCard(domain);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function createTopicCard(domain: KnowledgeDomain): HTMLElement {
  const card = document.createElement('div');
  card.className = 'topic-card';
  card.draggable = true;

  card.innerHTML = `
    <div class="topic-card-header">
      <div class="topic-card-icon">
        <i class="fa-solid ${domain.icon}"></i>
      </div>
      <span class="topic-card-name">${domain.name}</span>
    </div>
    <div class="topic-card-desc">${domain.description}</div>
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

  const newEvent: AgendaEvent = {
    id: uid(),
    type: 'topic',
    topicDomainId: domain.id,
    title: domain.name,
    description: domain.description,
    bulletPoints: [...domain.defaultBulletPoints],
    startTime,
    endTime: addMinutes(startTime, 60),
    duration: 60,
    attendees: domain.recommendedAttendees.map((r) => ({ name: '', role: r })),
  };

  // Insert after last topic, or before recap/adjourn
  const insertIdx = findInsertionIndex(day.events, 'topic');
  day.events.splice(insertIdx, 0, newEvent);

  updateAgenda({ days: agenda.days });
  emit('day-updated', { dayId });
}
