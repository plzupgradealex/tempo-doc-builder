/**
 * Time formatting and calculation utilities.
 */

import { getLocale } from '../i18n';

/** Format hours and minutes as "HH:mm" */
export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Parse "HH:mm" into { hours, minutes } */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

/** Add minutes to a time string, returns new "HH:mm" */
export function addMinutes(time: string, mins: number): string {
  const { hours, minutes } = parseTime(time);
  const total = hours * 60 + minutes + mins;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return formatTime(h, m);
}

/** Get duration in minutes between two time strings */
export function minutesBetween(start: string, end: string): number {
  const s = parseTime(start);
  const e = parseTime(end);
  return (e.hours * 60 + e.minutes) - (s.hours * 60 + s.minutes);
}

/** Convert "HH:mm" to total minutes from midnight */
export function timeToMinutes(time: string): number {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
}

/** Format minutes as human-readable duration e.g. "1h 30m" */
export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Locale map for date formatting */
const DATE_LOCALE: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
};

/** Format an ISO date string as a long date in the current locale */
export function formatDateLong(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  const locale = DATE_LOCALE[getLocale()] ?? 'en-US';
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Get next calendar day from an ISO date string */
export function nextDay(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Today's date as ISO string */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
