/**
 * Star Trek mode — text replacements for the UI.
 *
 * When Trek mode is ON, certain labels change to Star Trek equivalents.
 * The PDF export is NEVER affected — only the UI.
 */

const trekMap: Record<string, string> = {
  // Header labels
  'Project #': 'Mission #',
  'Project': 'Mission',
  'Customer #': 'Starbase ID',
  'Customer Address': 'Starbase Coordinates',
  'Customer Project Contact': 'Starbase Liaison Officer',
  'Vendor Project Contact': 'Away Team Commander',

  // Pre-work
  'Will you need a projector and/or TV?':
    'Will you need a Viewscreen?',
  'Will you need network access at this site to accomplish your goals?':
    'Will you require access to the customer computer core and need decryption codes and shield frequencies?',
  'Please make available a TV or Projector for slidedecks':
    'Please ensure a Viewscreen is available on the bridge for tactical displays',
  'Please ensure network access is provisioned and available for attendee use':
    'Please ensure computer core access is provisioned with decryption codes and shield frequencies cleared for away team use',

  // Navigation & titles
  'New Agenda': 'New Mission Brief',
  'Library': 'Mission Archives',
  'Domains': 'Knowledge Banks',
  'Preview': 'Tactical Preview',
  'TEMPO': 'STARFLEET TEMPO',

  // Day
  'Orientation': 'Orientation',
  'Adjourn': 'Adjourn',

  // Travel
  'Travel — Arrival': 'Away Team Arrival',
  'Travel — Departure': 'Away Team Departure',
};

/** Get Trek-mode replacement for a label, or return original if no mapping */
export function trek(label: string, isTrekMode: boolean): string {
  if (!isTrekMode) return label;
  return trekMap[label] ?? label;
}

/** Get all trek mappings (for testing / display) */
export function getTrekMappings(): Record<string, string> {
  return { ...trekMap };
}
