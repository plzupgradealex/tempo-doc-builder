import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  setView,
  setAgenda,
  updateAgenda,
  setTrekMode,
  setTheme,
  setDomains,
  getDomains,
  resetDomains,
} from '../../src/state';
import { getDefaultDomains } from '../../src/domains/defaults';

describe('state', () => {
  beforeEach(() => {
    setAgenda(null);
    setTrekMode(false);
    setTheme('tng');
    resetDomains();
  });

  it('returns current state', () => {
    const s = getState();
    expect(s.currentView).toBeDefined();
    expect(s.trekMode).toBe(false);
    expect(s.theme).toBe('tng');
  });

  it('sets the current view', () => {
    setView('library');
    expect(getState().currentView).toBe('library');
  });

  it('sets and clears current agenda', () => {
    const agenda = makeAgenda();
    setAgenda(agenda);
    expect(getState().currentAgenda).toBe(agenda);

    setAgenda(null);
    expect(getState().currentAgenda).toBeNull();
  });

  it('updates current agenda partially', () => {
    const agenda = makeAgenda();
    setAgenda(agenda);
    updateAgenda({ name: 'Updated Name' } as any);
    expect(getState().currentAgenda!.name).toBe('Updated Name');
  });

  it('does nothing when updating without an agenda', () => {
    setAgenda(null);
    updateAgenda({ name: 'Nope' } as any);
    expect(getState().currentAgenda).toBeNull();
  });

  it('toggles trek mode', () => {
    setTrekMode(true);
    expect(getState().trekMode).toBe(true);
    setTrekMode(false);
    expect(getState().trekMode).toBe(false);
  });

  it('switches theme', () => {
    setTheme('movie');
    expect(getState().theme).toBe('movie');
    setTheme('tng');
    expect(getState().theme).toBe('tng');
  });

  it('sets custom domains', () => {
    const custom = [{ ...getDefaultDomains()[0], name: 'Custom' }];
    setDomains(custom);
    expect(getDomains()[0].name).toBe('Custom');
  });

  it('resets domains to defaults', () => {
    const custom = [{ ...getDefaultDomains()[0], name: 'Custom' }];
    setDomains(custom);
    resetDomains();
    expect(getDomains().length).toBe(getDefaultDomains().length);
    expect(getDomains()[0].name).toBe(getDefaultDomains()[0].name);
  });
});

function makeAgenda() {
  return {
    id: 'test-1',
    name: 'Test Agenda',
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
      arrival: { date: '', time: '', mode: 'flight' as const, reference: '', location: '', travelTimeToSite: 0 },
      departure: { date: '', time: '', mode: 'flight' as const, reference: '', location: '', travelTimeToSite: 0 },
    },
    preWork: { needsProjector: false, needsNetworkAccess: false },
    days: [],
  };
}
