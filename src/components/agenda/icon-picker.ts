/**
 * FontAwesome Icon Picker — a visual icon selector for knowledge domains.
 * Shows a grid of relevant FA6 Solid icons with search filtering.
 */

/** Curated list of business/consulting-relevant FontAwesome 6 Solid icons */
const FA_ICONS: string[] = [
  // Business & Commerce
  'fa-cart-shopping', 'fa-box', 'fa-boxes-stacked', 'fa-truck',
  'fa-warehouse', 'fa-industry', 'fa-building', 'fa-store',
  'fa-shop', 'fa-cash-register', 'fa-receipt', 'fa-barcode',

  // Finance & Accounting
  'fa-calculator', 'fa-coins', 'fa-money-bill', 'fa-credit-card',
  'fa-chart-line', 'fa-chart-bar', 'fa-chart-pie', 'fa-chart-area',
  'fa-percent', 'fa-piggy-bank', 'fa-wallet', 'fa-file-invoice-dollar',

  // Production & Manufacturing
  'fa-gears', 'fa-gear', 'fa-wrench', 'fa-screwdriver-wrench',
  'fa-hammer', 'fa-scissors', 'fa-flask', 'fa-vials',
  'fa-microchip', 'fa-bolt', 'fa-cog',

  // People & Teams
  'fa-users', 'fa-user-tie', 'fa-user-group', 'fa-people-group',
  'fa-handshake', 'fa-handshake-simple', 'fa-person-walking',
  'fa-user', 'fa-id-badge', 'fa-id-card', 'fa-address-card',

  // Logistics & Transport
  'fa-truck-fast', 'fa-dolly', 'fa-pallet', 'fa-ship',
  'fa-plane', 'fa-train', 'fa-bus', 'fa-car',

  // Documents & Data
  'fa-file', 'fa-file-lines', 'fa-file-contract', 'fa-file-pen',
  'fa-clipboard', 'fa-clipboard-list', 'fa-clipboard-check',
  'fa-folder', 'fa-folder-open', 'fa-database', 'fa-server',

  // Communication & Presentation
  'fa-comments', 'fa-envelope', 'fa-phone', 'fa-video',
  'fa-display', 'fa-laptop', 'fa-desktop', 'fa-chalkboard',
  'fa-chalkboard-user', 'fa-presentation-screen',

  // Tools & Actions
  'fa-magnifying-glass', 'fa-check', 'fa-check-double', 'fa-list-check',
  'fa-bullseye', 'fa-star', 'fa-flag', 'fa-bookmark',
  'fa-thumbtack', 'fa-paperclip', 'fa-link', 'fa-lock',

  // Nature & Energy
  'fa-leaf', 'fa-seedling', 'fa-sun', 'fa-temperature-half',
  'fa-fire', 'fa-droplet', 'fa-snowflake',

  // Misc
  'fa-circle-question', 'fa-circle-info', 'fa-triangle-exclamation',
  'fa-shield', 'fa-award', 'fa-trophy', 'fa-medal',
  'fa-tag', 'fa-tags', 'fa-clock', 'fa-calendar',
  'fa-map', 'fa-location-dot', 'fa-compass', 'fa-globe',
  'fa-puzzle-piece', 'fa-lightbulb', 'fa-rocket', 'fa-wand-magic-sparkles',
];

/**
 * Open the icon picker dialog.
 * Returns a promise that resolves with the selected icon class or null if cancelled.
 */
export function openIconPicker(currentIcon?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'icon-picker-overlay';

    overlay.innerHTML = `
      <div class="icon-picker-dialog">
        <h3>SELECT ICON</h3>
        <input type="text" class="icon-picker-search" placeholder="Search icons..." autofocus>
        <div class="icon-picker-grid" id="icon-picker-grid"></div>
      </div>
    `;

    const grid = overlay.querySelector('#icon-picker-grid')!;
    const search = overlay.querySelector('.icon-picker-search') as HTMLInputElement;

    function renderIcons(filter: string): void {
      const lc = filter.toLowerCase().replace('fa-', '');
      const filtered = filter
        ? FA_ICONS.filter((ic) => ic.replace('fa-', '').includes(lc))
        : FA_ICONS;

      grid.innerHTML = '';
      filtered.forEach((icon) => {
        const btn = document.createElement('button');
        btn.className = 'icon-picker-item';
        if (icon === currentIcon) btn.classList.add('selected');
        btn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        btn.title = icon;
        btn.addEventListener('click', () => {
          cleanup();
          resolve(icon);
        });
        grid.appendChild(btn);
      });
    }

    renderIcons('');
    search.addEventListener('input', () => renderIcons(search.value));

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });

    // Close on Escape
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    }
    document.addEventListener('keydown', onKey);

    function cleanup(): void {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    }

    document.body.appendChild(overlay);
    search.focus();
  });
}
