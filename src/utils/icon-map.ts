/**
 * Map FontAwesome icon classes to Unicode symbols for text-only contexts (PDF, plain text export).
 * These are standard Unicode characters that render in most PDF fonts.
 */

const ICON_MAP: Record<string, string> = {
  'fa-cart-shopping': '🛒',
  'fa-boxes-stacked': '📦',
  'fa-industry': '🏭',
  'fa-scissors': '✂️',
  'fa-calculator': '🧮',
  'fa-chart-line': '📈',
  'fa-cow': '🐑',
  'fa-clipboard-check': '✅',
  'fa-magnifying-glass': '🔍',
  'fa-plane': '✈️',
  'fa-flag': '🚩',  'fa-person-walking': '🚶',
  'fa-handshake': '🤝',
  'fa-handshake-simple': '🤝',
  'fa-users': '👥',
  'fa-user-tie': '👔',
  'fa-truck': '🚚',
  'fa-warehouse': '🏢',
  'fa-building': '🏢',
  'fa-gear': '⚙️',
  'fa-gears': '⚙️',
  'fa-wrench': '🔧',
  'fa-flask': '🧪',
  'fa-file': '📄',
  'fa-clipboard': '📋',
  'fa-clipboard-list': '📋',
  'fa-check': '✓',
  'fa-star': '★',
  'fa-globe': '🌐',
  'fa-lightbulb': '💡',
  'fa-circle-question': '❓',
  'fa-mug-hot': '🌭',
  'fa-clock': '🕐',
  'fa-calendar': '📅',
  'fa-shield': '🛡️',
  'fa-award': '🏆',
  'fa-coins': '💰',
  'fa-money-bill': '💵',
  'fa-tag': '🏷️',
  'fa-leaf': '🍃',
  'fa-bolt': '⚡',
  'fa-fire': '🔥',
  'fa-rocket': '🚀',
  'fa-pen-to-square': '✏️',
};

/** Get a Unicode symbol for a FontAwesome icon class. Returns symbol or '●' as fallback. */
export function faToSymbol(faIcon: string): string {
  return ICON_MAP[faIcon] ?? '●';
}
