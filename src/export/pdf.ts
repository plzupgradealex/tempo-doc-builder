/**
 * PDF export — generates a professional PDF agenda using jsPDF.
 * Uses a Sky-themed colour palette inspired by Star Trek movie-era LCARS.
 * Emoji icons are rendered via browser canvas → PNG for perfect display.
 * Trek mode labels are NEVER used in PDF output.
 */

import { jsPDF } from 'jspdf';
import type { Agenda, AgendaEvent } from '../types';
import { formatDateLong, formatDuration } from '../utils/time';
import { t } from '../i18n';
import { faToSymbol } from '../utils/icon-map';
import { getState } from '../state';

const MARGIN = 20;
const PAGE_W = 210; // A4 width mm
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_H = 5;
const PAGE_BOTTOM = 275; // usable page bottom (leave room for footer)

/* ─── Sky-themed colour palette (movie-era LCARS) ─── */
const SKY = {
  primary:   [51, 119, 170]  as const, // #3377aa  deep sky blue
  secondary: [119, 187, 221] as const, // #77bbdd  sky blue
  accent:    [68, 221, 187]  as const, // #44ddbb  teal
  lightBg:   [240, 247, 255] as const, // #f0f7ff  very light blue
  text:      [44, 62, 80]    as const, // #2c3e50  dark blue-gray
  textSec:   [90, 108, 126]  as const, // #5a6c7e  medium blue-gray
  textMuted: [140, 155, 170] as const, // #8c9baa  muted
  warn:      [210, 120, 40]  as const, // #d27828  warm amber
  warnBg:    [255, 248, 230] as const, // #fff8e6  warm amber bg
};

/* ─── Emoji-to-image via browser canvas ─── */
const emojiCache = new Map<string, string>();

function emojiToDataUrl(emoji: string, size = 64): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(size * 0.75)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(emoji, size / 2, size / 2);
  return canvas.toDataURL('image/png');
}

function getEmojiImg(emoji: string): string {
  if (!emojiCache.has(emoji)) {
    emojiCache.set(emoji, emojiToDataUrl(emoji));
  }
  return emojiCache.get(emoji)!;
}

/** Draw an emoji as a small inline image; returns the x-position after the emoji. */
function drawEmoji(doc: jsPDF, emoji: string, x: number, y: number, size = 3.5): number {
  try {
    const img = getEmojiImg(emoji);
    doc.addImage(img, 'PNG', x, y - size * 0.7, size, size);
    return x + size + 1;
  } catch {
    return x;
  }
}

export function generatePDF(agenda: Agenda): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // ─── Header — vendor name in sky blue ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...SKY.primary);
  doc.text(agenda.header.vendorName || 'Agenda', MARGIN, y + 5);
  y += 12;

  // ─── Project Info Table (dynamic column width) ───
  doc.setFontSize(9);
  const h = agenda.header;
  const fields = [
    [t('previewCustomerNumber'), h.customerNumber],
    [t('previewCustomerAddress'), h.customerAddress],
    [t('previewCustomerContact'), h.customerProjectContact],
    [t('previewVendorContact'), h.vendorProjectContact],
    [t('previewProjectNumber'), h.projectNumber],
    [t('previewProject'), h.projectName],
  ].filter(([, v]) => v) as [string, string][];

  // Measure longest label so values never overlap
  doc.setFont('helvetica', 'bold');
  let maxLabelW = 0;
  fields.forEach(([label]) => {
    const w = doc.getTextWidth(label);
    if (w > maxLabelW) maxLabelW = w;
  });
  const valueX = MARGIN + maxLabelW + 4;

  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SKY.textSec);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SKY.text);
    doc.text(value, valueX, y);
    y += LINE_H;
  });

  // LCARS-inspired bracket separator
  y += 2;
  doc.setFillColor(...SKY.secondary);
  doc.roundedRect(MARGIN, y, 12, 2.5, 1.2, 1.2, 'F');
  doc.setFillColor(...SKY.primary);
  doc.rect(MARGIN + 14, y + 0.75, CONTENT_W - 14, 1, 'F');
  y += 6;

  // ─── Pre-Work ───
  const preWorkItems: string[] = [];
  if (agenda.preWork.needsProjector) preWorkItems.push(t('projectorRequirement'));
  if (agenda.preWork.needsNetworkAccess) preWorkItems.push(t('networkRequirement'));

  if (preWorkItems.length > 0) {
    const blockH = 4 + preWorkItems.length * LINE_H + 4;
    doc.setFillColor(...SKY.warnBg);
    doc.rect(MARGIN, y, CONTENT_W, blockH, 'F');
    doc.setFillColor(...SKY.warn);
    doc.rect(MARGIN, y, 1.5, blockH, 'F');

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...SKY.warn);
    const warnX = drawEmoji(doc, '\u26A0\uFE0F', MARGIN + 4, y + 2, 3);
    doc.text(t('previewPreWorkTitle'), warnX, y + 2);
    y += LINE_H + 1;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SKY.text);
    preWorkItems.forEach((item) => {
      doc.text(`\u2022 ${item}`, MARGIN + 6, y + 2);
      y += LINE_H;
    });
    y += 6;
  }

  // ─── Travel Arrival ───
  const arr = agenda.travel.arrival;
  if (arr.date) {
    y = renderTravelBlock(doc, t('previewTravelArrival'), arr, y, 'arrival');
  }

  // ─── Days ───
  agenda.days.forEach((day, dayIdx) => {
    // Day header height = bar(0.8) + gap(3) + text line(8) = ~12mm
    const dayHeaderH = 12;

    // Check if day header fits; if not, new page
    if (y + dayHeaderH > PAGE_BOTTOM) { doc.addPage(); y = MARGIN; }

    // Day header — sky bar + sky-coloured text
    doc.setFillColor(...SKY.secondary);
    doc.rect(MARGIN, y, CONTENT_W, 0.8, 'F');
    y += 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...SKY.primary);
    doc.text(
      `${t('previewDay').replace('{0}', String(dayIdx + 1))}: ${formatDateLong(day.date)}`,
      MARGIN, y + 3,
    );
    y += 8;

    // Events
    day.events.forEach((event) => {
      // Pre-calculate event height so we can page-break before it
      const eventH = estimateEventHeight(doc, event);

      if (y + eventH > PAGE_BOTTOM) {
        doc.addPage();
        y = MARGIN;
      }

      y = renderEvent(doc, event, y);
    });

    y += 4;
  });

  // ─── Travel Departure ───
  const dep = agenda.travel.departure;
  if (dep.date) {
    if (y + 14 > PAGE_BOTTOM) { doc.addPage(); y = MARGIN; }
    y = renderTravelBlock(doc, t('previewTravelDeparture'), dep, y, 'departure');
  }

  // ─── Footer on all pages ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...SKY.textMuted);
    doc.text(
      t('previewPageOf').replace('{0}', String(i)).replace('{1}', String(totalPages)),
      PAGE_W / 2,
      290,
      { align: 'center' },
    );
    doc.setFillColor(...SKY.primary);
    doc.rect(MARGIN, 293, CONTENT_W, 1, 'F');
  }

  // Save
  const filename = `agenda-${(agenda.header.projectName || agenda.name || 'export')
    .replace(/\s+/g, '-')
    .toLowerCase()}.pdf`;
  doc.save(filename);
}

/** Estimate the total height (mm) an event will occupy so we can page-break before it. */
function estimateEventHeight(doc: jsPDF, event: AgendaEvent): number {
  // Title row: colour bar + time + title + duration
  let h = LINE_H + 2; // 7mm base

  // Description lines
  if (event.description) {
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(event.description, CONTENT_W - 34);
    h += descLines.length * (LINE_H - 1);
  }

  // Bullet points
  h += event.bulletPoints.length * (LINE_H - 1);

  // Travel fields
  if (event.topicDomainId === 'travel') {
    const hasTravelFields = event.travelFrom || event.travelTo || event.travelFlight
      || event.travelDepartureTime || event.travelArrivalTime;
    if (hasTravelFields) h += LINE_H;
  }

  // Attendees
  if (event.attendees.length > 0) h += LINE_H;

  // Bottom margin
  h += 2;

  return h;
}

/** Render a single event at position y, returns new y after the event. */
function renderEvent(doc: jsPDF, event: AgendaEvent, y: number): number {
  const timeStr = event.type === 'adjourn'
    ? event.startTime
    : `${event.startTime} \u2013 ${event.endTime}`;

  // Event colour indicator bar
  const color = getEventRGB(event.type);
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(MARGIN, y, 1.5, LINE_H * 1.5, 'F');

  // Time
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SKY.textMuted);
  doc.text(timeStr, MARGIN + 4, y + 3);

  // Title — emoji rendered as image, text rendered clean
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...SKY.text);
  const titleX = MARGIN + 30;
  let textX = titleX;

  if (event.topicDomainId) {
    const domains = getState().domains;
    const domain = domains.find((d) => d.id === event.topicDomainId);
    if (domain) {
      textX = drawEmoji(doc, faToSymbol(domain.icon), titleX, y + 3, 3.5);
    }
  } else if (event.type === 'orientation') {
    textX = drawEmoji(doc, '\uD83E\uDD1D', titleX, y + 3, 3.5);
  } else if (event.type === 'pause') {
    textX = drawEmoji(doc, '\u2615', titleX, y + 3, 3.5);
  } else if (event.type === 'recap') {
    textX = drawEmoji(doc, '\uD83D\uDCCB', titleX, y + 3, 3.5);
  }
  doc.text(event.title, textX, y + 3);

  // Duration
  if (event.duration > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SKY.textMuted);
    doc.text(`(${formatDuration(event.duration)})`, MARGIN + CONTENT_W - 5, y + 3, { align: 'right' });
  }

  y += LINE_H + 2;

  // Description
  if (event.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SKY.textSec);
    const descLines = doc.splitTextToSize(event.description, CONTENT_W - 34);
    descLines.forEach((line: string) => {
      doc.text(line, MARGIN + 30, y);
      y += LINE_H - 1;
    });
  }

  // Bullet points
  if (event.bulletPoints.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...SKY.text);
    event.bulletPoints.forEach((bp) => {
      doc.text(`\u2022 ${bp}`, MARGIN + 32, y);
      y += LINE_H - 1;
    });
  }

  // Travel fields
  if (event.topicDomainId === 'travel') {
    doc.setFontSize(8);
    doc.setTextColor(...SKY.textSec);
    const parts: string[] = [];
    if (event.travelFrom) parts.push(`${t('travelFromLabel')}: ${event.travelFrom}`);
    if (event.travelTo) parts.push(`${t('travelToLabel')}: ${event.travelTo}`);
    if (event.travelFlight) parts.push(`${t('travelFlightLabel')}: ${event.travelFlight}`);
    if (event.travelDepartureTime) parts.push(`${t('travelDepartureTimeLabel')}: ${event.travelDepartureTime}`);
    if (event.travelArrivalTime) parts.push(`${t('travelArrivalTimeLabel')}: ${event.travelArrivalTime}`);
    if (parts.length > 0) {
      doc.text(parts.join('  \u00B7  '), MARGIN + 32, y);
      y += LINE_H;
    }
  }

  // Attendees
  if (event.attendees.length > 0) {
    doc.setFontSize(7);
    doc.setTextColor(...SKY.textMuted);
    const attStr = `${t('previewAttendees')} ${event.attendees.map((a) => a.name || a.role).join(', ')}`;
    doc.text(attStr, MARGIN + 30, y);
    y += LINE_H;
  }

  y += 2;
  return y;
}

function renderTravelBlock(
  doc: jsPDF,
  label: string,
  leg: Agenda['travel']['arrival'],
  y: number,
  direction: 'arrival' | 'departure',
): number {
  doc.setFillColor(...SKY.lightBg);
  doc.rect(MARGIN, y, CONTENT_W, 10, 'F');
  doc.setFillColor(...SKY.secondary);
  doc.rect(MARGIN, y, 1.5, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SKY.text);

  const modeLabel = leg.mode === 'vehicle' ? t('vehicle') : leg.mode === 'train' ? t('train') : t('flight');
  let text = `${label}: ${formatDateLong(leg.date)} ${t('travelAtTime')} ${leg.time}`;
  if (leg.reference) text += ` \u00B7 ${modeLabel}: ${leg.reference}`;
  if (leg.location) text += ` \u00B7 ${leg.location}`;
  const estKey = direction === 'arrival' ? 'previewEstToSite' : 'previewEstFromSite';
  if (leg.travelTimeToSite) text += ` \u00B7 ${t(estKey).replace('{0}', String(leg.travelTimeToSite))}`;

  doc.text(text, MARGIN + 4, y + 6);
  return y + 14;
}

function getEventRGB(type: string): [number, number, number] {
  switch (type) {
    case 'orientation': return [96, 188, 188];
    case 'topic':       return [119, 153, 221];
    case 'pause':       return [204, 170, 119];
    case 'plant-tour':  return [96, 188, 153];
    case 'adjourn':     return [170, 119, 68];
    case 'recap':       return [170, 119, 221];
    case 'custom':      return [119, 187, 221];
    default:            return [170, 153, 119];
  }
}
