/**
 * Preview view — renders an HTML preview of the agenda and provides PDF export.
 */

import { getState } from '../../state';
import { on } from '../../bus';
import { generatePDF } from '../../export/pdf';
import { generateDOCX } from '../../export/docx';
import { exportAgendaToJSON } from '../../storage';
import { formatDateLong } from '../../utils/time';
import { t } from '../../i18n';
import { faToSymbol } from '../../utils/icon-map';

export function initPreviewView(): void {
  const container = document.getElementById('view-preview')!;

  on('view-changed', ({ view }) => {
    if (view === 'preview') {
      renderPreview(container);
    }
  });

  // Keyboard shortcut for PDF export
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      const agenda = getState().currentAgenda;
      if (agenda) generatePDF(agenda);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && getState().currentView === 'preview') {
      e.preventDefault();
      const agenda = getState().currentAgenda;
      if (agenda) generatePDF(agenda);
    }
  });
}

function renderPreview(container: HTMLElement): void {
  const agenda = getState().currentAgenda;

  if (!agenda) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">${t('noAgendaPreview')}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="preview-container">
      <div class="preview-actions">
        <button class="lcars-btn primary lcars-shaped" id="preview-export-pdf">
          <i class="fa-solid fa-file-pdf"></i> ${t('exportPdf')}
        </button>
        <button class="lcars-btn lavender lcars-shaped" id="preview-export-docx">
          <i class="fa-solid fa-file-word"></i> ${t('exportDocx')}
        </button>
        <button class="lcars-btn teal lcars-shaped" id="preview-export-json">
          <i class="fa-solid fa-file-code"></i> ${t('exportJson')}
        </button>
      </div>
      <div class="preview-frame" id="preview-frame"></div>
    </div>
  `;

  // Render HTML preview
  const frame = container.querySelector('#preview-frame')!;
  frame.innerHTML = renderAgendaHTML(agenda);

  // Export buttons
  container.querySelector('#preview-export-pdf')!.addEventListener('click', () => {
    generatePDF(agenda);
  });

  container.querySelector('#preview-export-docx')!.addEventListener('click', () => {
    generateDOCX(agenda);
  });

  container.querySelector('#preview-export-json')!.addEventListener('click', () => {
    exportAgendaToJSON(agenda);
  });
}

function renderAgendaHTML(agenda: ReturnType<typeof getState>['currentAgenda']): string {
  if (!agenda) return '';

  const h = agenda.header;

  let html = `
    <div style="border-bottom: 3px solid #ff9900; padding-bottom: 16px; margin-bottom: 20px;">
      <h1 style="font-size: 22px; color: #ff9900; margin-bottom: 12px;">${h.vendorName || 'Vendor'}</h1>
      <table style="font-size: 12px; line-height: 1.8; border-spacing: 0 2px;">
        ${h.customerNumber ? `<tr><td style="font-weight:bold; padding-right:16px;">${t('previewCustomerNumber')}</td><td>${h.customerNumber}</td></tr>` : ''}
        ${h.customerAddress ? `<tr><td style="font-weight:bold; padding-right:16px;">${t('previewCustomerAddress')}</td><td>${h.customerAddress}</td></tr>` : ''}
        ${h.customerProjectContact ? `<tr><td style="font-weight:bold; padding-right:16px;">${t('previewCustomerContact')}</td><td>${h.customerProjectContact}</td></tr>` : ''}
        ${h.vendorProjectContact ? `<tr><td style="font-weight:bold; padding-right:16px;">${t('previewVendorContact')}</td><td>${h.vendorProjectContact}</td></tr>` : ''}
        ${h.projectNumber ? `<tr><td style="font-weight:bold; padding-right:16px;">${t('previewProjectNumber')}</td><td>${h.projectNumber}</td></tr>` : ''}
        ${h.projectName ? `<tr><td style="font-weight:bold; padding-right:16px;">${t('previewProject')}</td><td>${h.projectName}</td></tr>` : ''}
      </table>
    </div>
  `;

  // Pre-work
  const preWorkItems: string[] = [];
  if (agenda.preWork.needsProjector) {
    preWorkItems.push(t('projectorRequirement'));
  }
  if (agenda.preWork.needsNetworkAccess) {
    preWorkItems.push(t('networkRequirement'));
  }

  if (preWorkItems.length > 0) {
    html += `
      <div style="background: #fff8e1; border-left: 4px solid #ff9900; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 4px 4px 0;">
        <strong style="color: #e65100;">⚠️ ${t('previewPreWorkTitle')}</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          ${preWorkItems.map((i) => `<li>${i}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Travel arrival
  const arr = agenda.travel.arrival;
  if (arr.date) {
    const modeLabel = arr.mode === 'vehicle' ? t('vehicle') : arr.mode === 'train' ? t('train') : t('flight');
    html += `
      <div style="background: #f0f7ff; border-left: 4px solid #4a90d9; padding: 10px 16px; margin-bottom: 16px; border-radius: 0 4px 4px 0; font-size: 12px;">
        <strong>${t('previewTravelArrival')}</strong>
        ${formatDateLong(arr.date)} ${t('travelAtTime')} ${arr.time}
        ${arr.reference ? ` · ${modeLabel}: ${arr.reference}` : ''}
        ${arr.location ? ` · ${arr.location}` : ''}
        ${arr.travelTimeToSite ? ` · ${t('previewEstToSite').replace('{0}', String(arr.travelTimeToSite))}` : ''}
      </div>
    `;
  }

  // Days
  agenda.days.forEach((day, i) => {
    html += `
      <h2 style="font-size: 16px; color: #333; border-bottom: 2px solid #ff9900; padding-bottom: 6px; margin: 24px 0 12px;">
        ${t('previewDay').replace('{0}', String(i + 1))}: ${formatDateLong(day.date)}
      </h2>
    `;

    day.events.forEach((event) => {
      const timeStr = event.type === 'adjourn'
        ? `${event.startTime}`
        : `${event.startTime} – ${event.endTime}`;

      // Get icon for display
      let iconPrefix = '';
      if (event.topicDomainId) {
        const domains = getState().domains;
        const domain = domains.find((d) => d.id === event.topicDomainId);
        if (domain) iconPrefix = `${faToSymbol(domain.icon)} `;
      } else if (event.type === 'orientation') {
        iconPrefix = '🤝 ';
      } else if (event.type === 'pause') {
        iconPrefix = '☕ ';
      } else if (event.type === 'recap') {
        iconPrefix = '📋 ';
      }

      html += `
        <div style="margin-bottom: 12px; padding-left: 8px; border-left: 3px solid ${getEventColor(event.type)};">
          <div style="display: flex; gap: 12px; align-items: baseline;">
            <strong style="color: #666; min-width: 100px; font-size: 12px;">${timeStr}</strong>
            <strong style="font-size: 13px;">${iconPrefix}${event.title}</strong>
          </div>
          ${event.description ? `<p style="color: #555; margin: 4px 0 4px 112px; font-size: 11px;">${event.description}</p>` : ''}
          ${event.topicDomainId === 'travel' ? `
            <div style="margin: 4px 0 4px 112px; font-size: 11px; color: #444;">
              ${event.travelFrom ? `<span style="color:#888;">${t('travelFromLabel')}:</span> ${event.travelFrom}` : ''}
              ${event.travelTo ? ` &nbsp;→&nbsp; <span style="color:#888;">${t('travelToLabel')}:</span> ${event.travelTo}` : ''}
              ${event.travelFlight ? ` &nbsp;·&nbsp; <span style="color:#888;">${t('travelFlightLabel')}:</span> ${event.travelFlight}` : ''}
              ${event.travelDepartureTime ? ` &nbsp;·&nbsp; <span style="color:#888;">${t('travelDepartureTimeLabel')}:</span> ${event.travelDepartureTime}` : ''}
              ${event.travelArrivalTime ? ` → <span style="color:#888;">${t('travelArrivalTimeLabel')}:</span> ${event.travelArrivalTime}` : ''}
            </div>
          ` : ''}
          ${event.bulletPoints.length > 0 ? `
            <ul style="margin: 4px 0 4px 112px; padding-left: 16px; font-size: 11px; color: #444;">
              ${event.bulletPoints.map((b) => `<li>${b}</li>`).join('')}
            </ul>
          ` : ''}
          ${event.attendees.length > 0 ? `
            <p style="margin: 4px 0 0 112px; font-size: 10px; color: #888;">
              ${t('previewAttendees')} ${event.attendees.map((a) => a.name || a.role).join(', ')}
            </p>
          ` : ''}
        </div>
      `;
    });
  });

  // Travel departure
  const dep = agenda.travel.departure;
  if (dep.date) {
    const modeLabel = dep.mode === 'vehicle' ? t('vehicle') : dep.mode === 'train' ? t('train') : t('flight');
    html += `
      <div style="background: #f0f7ff; border-left: 4px solid #4a90d9; padding: 10px 16px; margin-top: 20px; border-radius: 0 4px 4px 0; font-size: 12px;">
        <strong>${t('previewTravelDeparture')}</strong>
        ${formatDateLong(dep.date)} ${t('travelAtTime')} ${dep.time}
        ${dep.reference ? ` · ${modeLabel}: ${dep.reference}` : ''}
        ${dep.location ? ` · ${dep.location}` : ''}
        ${dep.travelTimeToSite ? ` · ${t('previewEstFromSite').replace('{0}', String(dep.travelTimeToSite))}` : ''}
      </div>
    `;
  }

  return html;
}

function getEventColor(type: string): string {
  switch (type) {
    case 'orientation': return '#66cccc';
    case 'topic': return '#9999ff';
    case 'pause': return '#ffbb88';
    case 'plant-tour': return '#66cc99';
    case 'adjourn': return '#cc6633';
    case 'recap': return '#cc77ff';
    case 'custom': return '#99ccff';
    default: return '#cc9966';
  }
}
