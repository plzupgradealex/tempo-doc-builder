/**
 * Application state management.
 * Central mutable state with event-based notifications.
 */

import type { AppState, Agenda, KnowledgeDomain, ViewName } from './types';
import { getDefaultDomains } from './domains/defaults';
import { emit } from './bus';

const state: AppState = {
  currentView: 'agenda',
  currentAgenda: null,
  trekMode: false,
  theme: 'tng',
  domains: getDefaultDomains(),
};

export function getState(): Readonly<AppState> {
  return state;
}

// ─── View Navigation ───

export function setView(view: ViewName): void {
  state.currentView = view;
  emit('view-changed', { view });
}

// ─── Agenda ───

export function setAgenda(agenda: Agenda | null): void {
  state.currentAgenda = agenda;
  emit('agenda-changed', { agenda });
}

export function updateAgenda(updates: Partial<Agenda>): void {
  if (state.currentAgenda) {
    Object.assign(state.currentAgenda, updates, {
      updatedAt: new Date().toISOString(),
    });
    emit('agenda-changed', { agenda: state.currentAgenda });
  }
}

export function getAgenda(): Agenda | null {
  return state.currentAgenda;
}

// ─── Trek Mode ───

export function setTrekMode(enabled: boolean): void {
  state.trekMode = enabled;
  emit('trek-mode-changed', { enabled });
}

// ─── Theme ───

export function setTheme(theme: 'tng' | 'movie'): void {
  state.theme = theme;
  document.documentElement.setAttribute(
    'data-theme',
    theme === 'movie' ? 'movie' : '',
  );
  emit('theme-changed', { theme });
}

// ─── Knowledge Domains ───

export function setDomains(domains: KnowledgeDomain[]): void {
  state.domains = domains;
  emit('domains-changed', { domains });
}

export function getDomains(): KnowledgeDomain[] {
  return state.domains;
}

export function resetDomains(): void {
  state.domains = getDefaultDomains();
  emit('domains-changed', { domains: state.domains });
}
