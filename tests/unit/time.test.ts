import { describe, it, expect } from 'vitest';
import {
  formatTime,
  parseTime,
  addMinutes,
  minutesBetween,
  formatDuration,
  formatDateLong,
  nextDay,
  todayISO,
} from '../../src/utils/time';

describe('time utilities', () => {
  describe('formatTime', () => {
    it('pads single-digit hours and minutes', () => {
      expect(formatTime(9, 5)).toBe('09:05');
    });
    it('handles midnight', () => {
      expect(formatTime(0, 0)).toBe('00:00');
    });
    it('handles 23:59', () => {
      expect(formatTime(23, 59)).toBe('23:59');
    });
  });

  describe('parseTime', () => {
    it('parses HH:mm string', () => {
      expect(parseTime('14:30')).toEqual({ hours: 14, minutes: 30 });
    });
    it('parses zero-padded string', () => {
      expect(parseTime('08:05')).toEqual({ hours: 8, minutes: 5 });
    });
  });

  describe('addMinutes', () => {
    it('adds minutes within same hour', () => {
      expect(addMinutes('09:00', 30)).toBe('09:30');
    });
    it('crosses hour boundary', () => {
      expect(addMinutes('09:45', 30)).toBe('10:15');
    });
    it('handles large additions', () => {
      expect(addMinutes('08:00', 120)).toBe('10:00');
    });
    it('handles zero', () => {
      expect(addMinutes('14:00', 0)).toBe('14:00');
    });
  });

  describe('minutesBetween', () => {
    it('returns difference in minutes', () => {
      expect(minutesBetween('09:00', '10:30')).toBe(90);
    });
    it('returns 0 for same time', () => {
      expect(minutesBetween('12:00', '12:00')).toBe(0);
    });
    it('returns negative for reversed times', () => {
      expect(minutesBetween('14:00', '13:00')).toBe(-60);
    });
  });

  describe('formatDuration', () => {
    it('formats hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
    });
    it('formats full hours', () => {
      expect(formatDuration(120)).toBe('2h');
    });
    it('formats minutes only', () => {
      expect(formatDuration(45)).toBe('45m');
    });
    it('handles 0', () => {
      expect(formatDuration(0)).toBe('0m');
    });
  });

  describe('formatDateLong', () => {
    it('formats ISO date to readable string', () => {
      const result = formatDateLong('2026-02-20');
      expect(result).toContain('2026');
      // Day name and month vary by locale but should contain the date
    });
    it('returns empty string for empty input', () => {
      expect(formatDateLong('')).toBe('');
    });
  });

  describe('nextDay', () => {
    it('advances to the next day', () => {
      expect(nextDay('2026-02-20')).toBe('2026-02-21');
    });
    it('crosses month boundary', () => {
      expect(nextDay('2026-01-31')).toBe('2026-02-01');
    });
    it('crosses year boundary', () => {
      expect(nextDay('2025-12-31')).toBe('2026-01-01');
    });
  });

  describe('todayISO', () => {
    it('returns ISO date string for today', () => {
      const result = todayISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
