/**
 * DOCX export — generates a professional Word document agenda using the docx library.
 * Mirrors the same structure and sky colour theme as the PDF export.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType,
  TableLayoutType, HeadingLevel,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Agenda, AgendaEvent } from '../types';
import { formatDateLong, formatDuration } from '../utils/time';
import { t } from '../i18n';
import { faToSymbol } from '../utils/icon-map';
import { getState } from '../state';

/* ─── Sky-themed colours (hex, matching PDF) ─── */
const SKY = {
  primary:   '3377AA',
  secondary: '77BBDD',
  lightBg:   'F0F7FF',
  text:      '2C3E50',
  textSec:   '5A6C7E',
  textMuted: '8C9BAA',
  warn:      'D27828',
  warnBg:    'FFF8E6',
};

const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE_BORDER, bottom: NONE_BORDER, left: NONE_BORDER, right: NONE_BORDER };

function getEventColorHex(type: string): string {
  switch (type) {
    case 'orientation': return '60BCBC';
    case 'topic':       return '7799DD';
    case 'pause':       return 'CCAA77';
    case 'plant-tour':  return '60BC99';
    case 'adjourn':     return 'AA7744';
    case 'recap':       return 'AA77DD';
    case 'custom':      return '77BBDD';
    default:            return 'AA9977';
  }
}

function getEventEmoji(event: AgendaEvent): string {
  if (event.topicDomainId) {
    const domains = getState().domains;
    const domain = domains.find((d) => d.id === event.topicDomainId);
    if (domain) return faToSymbol(domain.icon) + ' ';
  } else if (event.type === 'orientation') return '\uD83E\uDD1D ';
  else if (event.type === 'pause') return '\u2615 ';
  else if (event.type === 'recap') return '\uD83D\uDCCB ';
  return '';
}

export async function generateDOCX(agenda: Agenda): Promise<void> {
  const h = agenda.header;
  const sections: Paragraph[] = [];

  // ─── Header — vendor name ───
  sections.push(new Paragraph({
    children: [new TextRun({
      text: h.vendorName || 'Agenda',
      bold: true,
      size: 36,
      color: SKY.primary,
      font: 'Calibri',
    })],
    spacing: { after: 200 },
  }));

  // ─── Project Info Table ───
  const infoFields = [
    [t('previewCustomerNumber'), h.customerNumber],
    [t('previewCustomerAddress'), h.customerAddress],
    [t('previewCustomerContact'), h.customerProjectContact],
    [t('previewVendorContact'), h.vendorProjectContact],
    [t('previewProjectNumber'), h.projectNumber],
    [t('previewProject'), h.projectName],
  ].filter(([, v]) => v) as [string, string][];

  if (infoFields.length > 0) {
    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: infoFields.map(([label, value]) => new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: [new Paragraph({
              children: [new TextRun({ text: label, bold: true, size: 18, color: SKY.textSec, font: 'Calibri' })],
            })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: [new Paragraph({
              children: [new TextRun({ text: value, size: 18, color: SKY.text, font: 'Calibri' })],
            })],
          }),
        ],
      })),
    });
    sections.push(new Paragraph({ children: [] }));
    sections.push(infoTable as unknown as Paragraph);
  }

  // Separator
  sections.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SKY.secondary } },
    spacing: { after: 200 },
    children: [],
  }));

  // ─── Pre-Work ───
  const preWorkItems: string[] = [];
  if (agenda.preWork.needsProjector) preWorkItems.push(t('projectorRequirement'));
  if (agenda.preWork.needsNetworkAccess) preWorkItems.push(t('networkRequirement'));

  if (preWorkItems.length > 0) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: `\u26A0\uFE0F ${t('previewPreWorkTitle')}`, bold: true, size: 18, color: SKY.warn, font: 'Calibri' })],
      shading: { type: ShadingType.SOLID, color: SKY.warnBg },
      spacing: { before: 100, after: 60 },
      indent: { left: 100 },
    }));
    preWorkItems.forEach((item) => {
      sections.push(new Paragraph({
        children: [new TextRun({ text: `\u2022 ${item}`, size: 18, color: SKY.text, font: 'Calibri' })],
        shading: { type: ShadingType.SOLID, color: SKY.warnBg },
        indent: { left: 300 },
        spacing: { after: 40 },
      }));
    });
    sections.push(new Paragraph({ children: [], spacing: { after: 100 } }));
  }

  // ─── Travel Arrival ───
  const arr = agenda.travel.arrival;
  if (arr.date) {
    sections.push(buildTravelParagraph(t('previewTravelArrival'), arr, 'arrival'));
    sections.push(new Paragraph({ children: [], spacing: { after: 100 } }));
  }

  // ─── Days ───
  agenda.days.forEach((day, dayIdx) => {
    // Day header
    sections.push(new Paragraph({
      children: [new TextRun({
        text: `${t('previewDay').replace('{0}', String(dayIdx + 1))}: ${formatDateLong(day.date)}`,
        bold: true,
        size: 24,
        color: SKY.primary,
        font: 'Calibri',
      })],
      heading: HeadingLevel.HEADING_2,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: SKY.secondary } },
      spacing: { before: 300, after: 150 },
    }));

    // Events
    day.events.forEach((event) => {
      sections.push(...buildEventParagraphs(event));
    });
  });

  // ─── Travel Departure ───
  const dep = agenda.travel.departure;
  if (dep.date) {
    sections.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    sections.push(buildTravelParagraph(t('previewTravelDeparture'), dep, 'departure'));
  }

  // ─── Build document ───
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `agenda-${(h.projectName || agenda.name || 'export')
    .replace(/\s+/g, '-')
    .toLowerCase()}.docx`;
  saveAs(blob, filename);
}

function buildTravelParagraph(
  label: string,
  leg: Agenda['travel']['arrival'],
  direction: 'arrival' | 'departure',
): Paragraph {
  const modeLabel = leg.mode === 'vehicle' ? t('vehicle') : leg.mode === 'train' ? t('train') : t('flight');
  let text = `${label}: ${formatDateLong(leg.date)} ${t('travelAtTime')} ${leg.time}`;
  if (leg.reference) text += ` \u00B7 ${modeLabel}: ${leg.reference}`;
  if (leg.location) text += ` \u00B7 ${leg.location}`;
  const estKey = direction === 'arrival' ? 'previewEstToSite' : 'previewEstFromSite';
  if (leg.travelTimeToSite) text += ` \u00B7 ${t(estKey).replace('{0}', String(leg.travelTimeToSite))}`;

  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 16, color: SKY.text, font: 'Calibri' })],
    shading: { type: ShadingType.SOLID, color: SKY.lightBg },
    spacing: { before: 60, after: 60 },
    indent: { left: 100 },
  });
}

function buildEventParagraphs(event: AgendaEvent): Paragraph[] {
  const paras: Paragraph[] = [];
  const emoji = getEventEmoji(event);
  const colorHex = getEventColorHex(event.type);

  const timeStr = event.type === 'adjourn'
    ? event.startTime
    : `${event.startTime} \u2013 ${event.endTime}`;

  // Title line: time + emoji + title + duration
  const titleChildren: TextRun[] = [
    new TextRun({ text: timeStr + '   ', bold: true, size: 18, color: SKY.textMuted, font: 'Calibri' }),
    new TextRun({ text: `${emoji}${event.title}`, bold: true, size: 20, color: SKY.text, font: 'Calibri' }),
  ];
  if (event.duration > 0) {
    titleChildren.push(new TextRun({
      text: `  (${formatDuration(event.duration)})`,
      size: 14,
      color: SKY.textMuted,
      font: 'Calibri',
    }));
  }

  paras.push(new Paragraph({
    children: titleChildren,
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: colorHex, space: 8 } },
    spacing: { before: 120, after: 40 },
    indent: { left: 100 },
  }));

  // Description
  if (event.description) {
    paras.push(new Paragraph({
      children: [new TextRun({ text: event.description, size: 16, color: SKY.textSec, font: 'Calibri', italics: true })],
      indent: { left: 600 },
      spacing: { after: 40 },
    }));
  }

  // Bullet points
  event.bulletPoints.forEach((bp) => {
    paras.push(new Paragraph({
      children: [new TextRun({ text: `\u2022 ${bp}`, size: 16, color: SKY.text, font: 'Calibri' })],
      indent: { left: 700 },
      spacing: { after: 20 },
    }));
  });

  // Travel fields
  if (event.topicDomainId === 'travel') {
    const parts: string[] = [];
    if (event.travelFrom) parts.push(`${t('travelFromLabel')}: ${event.travelFrom}`);
    if (event.travelTo) parts.push(`${t('travelToLabel')}: ${event.travelTo}`);
    if (event.travelFlight) parts.push(`${t('travelFlightLabel')}: ${event.travelFlight}`);
    if (event.travelDepartureTime) parts.push(`${t('travelDepartureTimeLabel')}: ${event.travelDepartureTime}`);
    if (event.travelArrivalTime) parts.push(`${t('travelArrivalTimeLabel')}: ${event.travelArrivalTime}`);
    if (parts.length > 0) {
      paras.push(new Paragraph({
        children: [new TextRun({ text: parts.join('  \u00B7  '), size: 16, color: SKY.textSec, font: 'Calibri' })],
        indent: { left: 700 },
        spacing: { after: 20 },
      }));
    }
  }

  // Attendees
  if (event.attendees.length > 0) {
    const attStr = `${t('previewAttendees')} ${event.attendees.map((a) => a.name || a.role).join(', ')}`;
    paras.push(new Paragraph({
      children: [new TextRun({ text: attStr, size: 14, color: SKY.textMuted, font: 'Calibri' })],
      indent: { left: 600 },
      spacing: { after: 40 },
    }));
  }

  return paras;
}
