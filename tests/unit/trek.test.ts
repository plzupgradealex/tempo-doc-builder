import { describe, it, expect } from 'vitest';
import { trek } from '../../src/trek/mode';

describe('trek mode', () => {
  it('replaces "Project" labels', () => {
    expect(trek('Project', true)).toBe('Mission');
    expect(trek('Project #', true)).toBe('Mission #');
  });

  it('replaces "Customer #"', () => {
    expect(trek('Customer #', true)).toBe('Starbase ID');
  });

  it('replaces projector reference', () => {
    const result = trek('Will you need a projector and/or TV?', true);
    expect(result).toContain('Viewscreen');
  });

  it('replaces network access reference', () => {
    const result = trek('Will you need network access at this site to accomplish your goals?', true);
    expect(result).toContain('computer core');
  });

  it('replaces "New Agenda"', () => {
    expect(trek('New Agenda', true)).toBe('New Mission Brief');
  });

  it('replaces "Library"', () => {
    expect(trek('Library', true)).toBe('Mission Archives');
  });

  it('replaces "Domains"', () => {
    expect(trek('Domains', true)).toBe('Knowledge Banks');
  });

  it('replaces "Preview"', () => {
    expect(trek('Preview', true)).toBe('Tactical Preview');
  });

  it('replaces "TEMPO"', () => {
    expect(trek('TEMPO', true)).toBe('STARFLEET TEMPO');
  });

  it('returns original text when no match', () => {
    expect(trek('Hello World', true)).toBe('Hello World');
  });

  it('returns original text when trek mode is off', () => {
    expect(trek('Project', false)).toBe('Project');
    expect(trek('Library', false)).toBe('Library');
  });
});
