# Copilot Instructions for Tempo

## Project Overview
Tempo is an LCARS-styled (Star Trek TNG) consultant trip agenda builder PWA. It creates professional multi-day PDF agendas for consultants traveling to client sites. Deployed at https://tempo-6el.pages.dev.

**Stack:** Vanilla TypeScript + Vite 7 — no frameworks. ES2022 target, strict mode, bundler moduleResolution. Dev server port 5174.

## Architecture
- **Vanilla TypeScript + Vite** — no React/Vue/Angular
- **Event-driven** — central event bus (`src/bus.ts`) with `emit(event, detail?)` and `on(event, handler)` → unsubscribe fn
- **State** — mutable singleton in `src/state.ts`. Fields: `currentView`, `currentAgenda`, `trekMode`, `theme ('tng'|'movie')`, `domains`. Setters emit bus events.
- **Persistence** — IndexedDB (db: `tempo`, stores: `agendas`, `domains`) for saved data. localStorage for drafts (key `tempo-draft`) and locale (key `tempo-locale`).
- **PDF** — jsPDF, A4, client-side generation. Cobalt blue header/footer bars `rgb(0, 71, 171)`.
- **i18n** — 4 languages (EN/ES/DE/FR), ~239 keys. `t(key)` with `{0}`, `{1}` template placeholders. Falls back to EN then raw key.
- **Components return DOM** — each exports a render function creating DOM and appending to container.

## Bus Events
`view-changed`, `agenda-changed`, `trek-mode-changed`, `theme-changed`, `domains-changed`, `locale-changed`, `auth-changed`, `day-updated`, `open-topic-picker`

## Key Design Decisions
1. **CSS split:** `src/styles/lcars-core.css` = reusable LCARS design system (do NOT add app-specific styles). `src/styles/tempo.css` = app-specific styles. Themes via CSS variables + `color-mix()`. Two themes: TNG (default) and Movie (`[data-theme="movie"]`).
2. **Knowledge domains are data, not code** — stored in `src/domains/defaults.ts`, loaded into IndexedDB, user-editable in Domains view.
3. **Star Trek mode** — toggleable text replacement via `src/trek/mode.ts` (~20 mappings like Project→Mission). **NEVER put Trek terminology in PDF output.**
4. **FontAwesome 6 Solid** icons via CDN. Icon picker (`icon-picker.ts`) has ~100 curated business icons with search.
5. **Icon map** (`src/utils/icon-map.ts`) — 40 FA→emoji mappings for PDF/text contexts. `faToSymbol(faIcon)` returns emoji or `'●'` fallback.
6. **Time inputs** use `step="900"` for 15-minute increments.
7. **Event insertion** — `findInsertionIndex(events, eventType)` scans backwards for last event of same type, inserts after it; falls back to before recap/adjourn.
8. **Draft system** — localStorage quick save/restore. Draft auto-clears on full save to library. On app load, shows restore/discard prompt if draft exists.

## Types (src/types.ts)
- **`EventType`**: `'orientation' | 'topic' | 'pause' | 'plant-tour' | 'adjourn' | 'recap' | 'custom'`
- **`AgendaEvent`**: `id, type, topicDomainId?, title, description, bulletPoints[], startTime, endTime, duration, attendees[]`
- **`AgendaDay`**: `id, date, dayStartTime ("09:00"), adjournTime ("17:00"), events[]`
- **`KnowledgeDomain`**: `id, name, icon (FA class), description, defaultBulletPoints[], recommendedAttendees[], isDefault`
- **`Agenda`**: `id, name, createdAt, updatedAt, header: AgendaHeader, travel: TravelInfo, preWork: PreWorkNeeds, days: AgendaDay[]`
- **`AppState`**: `currentView: ViewName, currentAgenda, trekMode, theme: 'tng'|'movie', domains[]`
- **`ViewName`**: `'agenda' | 'library' | 'domains' | 'preview' | 'about'`
- **`TravelMode`**: `'flight' | 'train' | 'vehicle'`

## File Structure (35 files)
```
src/
  main.ts              — entry point, bootstraps app
  types.ts             — all shared TypeScript interfaces/types
  bus.ts               — event bus (emit/on over native EventTarget)
  state.ts             — mutable AppState singleton + setters that emit events
  storage.ts           — IndexedDB CRUD + JSON file I/O + localStorage draft
  auth/
    auth.ts            — OIDC-ready scaffolding (currently local-only, login/logout/getUser)
  components/
    frame.ts           — LCARS frame structure
    sidebar.ts         — sidebar nav (views + theme/trek/locale toggles)
    views/
      agenda-view.ts   — main agenda builder (header form, pre-work, travel, day panels, save/draft buttons)
      library-view.ts  — saved agendas list (load/delete/export)
      domains-view.ts  — knowledge domain CRUD
      preview-view.ts  — agenda preview + PDF/JSON export buttons
      about-view.ts    — about page
    agenda/
      header-form.ts   — project info form fields
      travel-form.ts   — arrival/departure travel details
      pre-work.ts      — pre-work needs checkboxes
      day-panel.ts     — day panel: events, drag-drop, add buttons, recalculateTimes, detectOverlaps, findInsertionIndex
      event-card.ts    — individual event card: controls, inline edit, time inputs, icon display
      topic-picker.ts  — modal showing available domains to add as topics
      icon-picker.ts   — FA icon picker dialog with search (~100 icons)
  domains/
    defaults.ts        — 8 default knowledge domains
  export/
    pdf.ts             — jsPDF A4 PDF generation
  i18n/
    index.ts           — i18n engine (t, setLocale, getLocale, getLocales)
    types.ts           — Translations interface (~239 keys)
    en.ts              — English translations
    es.ts              — Spanish translations
    de.ts              — German translations
    fr.ts              — French translations
  trek/
    mode.ts            — Star Trek text mappings (~20 entries)
  styles/
    lcars-core.css     — reusable LCARS design system
    tempo.css          — app-specific styles
  utils/
    id.ts              — UUID generation
    time.ts            — time arithmetic (addMinutes, parseTime, formatTime)
    drag-drop.ts       — drag-and-drop utilities
    icon-map.ts        — FA class → emoji mapping (40 entries) for PDF
```

## Knowledge Domains (8 defaults)
| ID | Icon | Bullets | Attendees |
|---|---|---|---|
| `procurement` | `fa-cart-shopping` | 4 | 3 |
| `inventory` | `fa-boxes-stacked` | 4 | 3 |
| `production` | `fa-industry` | 4 | 3 |
| `cutting` | `fa-scissors` | 4 | 3 |
| `finance` | `fa-calculator` | 4 | 3 |
| `sales` | `fa-chart-line` | 4 | 3 |
| `livestock` | `fa-cow` | 4 | 3 |
| `plant-tour` | `fa-person-walking` | 5 | 0 |

Each domain has i18n keys: `domain{Id}`, `domain{Id}Desc`, `bullet{Id}1-4`, `attendee{Id}{Role}`.

## PDF Details (src/export/pdf.ts)
- **Header/footer bars:** cobalt blue `rgb(0, 71, 171)`, white text
- **Pre-work block:** yellow bg `rgb(255, 248, 225)`, orange left bar `rgb(255, 153, 0)`
- **Travel blocks:** light blue `rgb(240, 247, 255)`, blue left bar `rgb(74, 144, 217)`
- **Event color bars:** orientation=teal, topic=lavender, pause=peach, plant-tour=green, adjourn=orange, recap=purple, custom=light blue
- **Page break** at y > 260mm. Footer page numbers on all pages.
- Domain icons rendered as emoji via `faToSymbol()`. Trek labels NEVER used in PDF.

## Storage Functions (src/storage.ts)
`saveAgenda`, `loadAgenda`, `listAgendas`, `deleteAgenda`, `saveCustomDomains`, `loadCustomDomains`, `exportAgendaToJSON`, `importAgendaFromJSON`, `saveDraft`, `loadDraft`, `clearDraft`

## State Functions (src/state.ts)
`getState`, `setView`, `setAgenda`, `updateAgenda`, `getAgenda`, `setTrekMode`, `setTheme`, `setDomains`, `getDomains`, `resetDomains`

## Code Style
- `const` over `let` where possible
- Named exports preferred
- Types consolidated in `src/types.ts`
- Utility functions in `src/utils/` — small, pure, testable
- No inline styles in TypeScript — use CSS classes from `tempo.css`
- Event names are kebab-case: `'agenda-changed'`, `'view-changed'`
- i18n: all user-facing strings go through `t(key)`. Add keys to `types.ts` + all 4 lang files.

## Testing
- **Unit tests:** Vitest + jsdom in `tests/unit/` — 4 test files
  - `trek.test.ts`, `time.test.ts`, `domains.test.ts`, `state.test.ts`
- **E2E tests:** Playwright (chromium) in `tests/e2e/agenda-flow.spec.ts`
  - 6 describe blocks, ~54 tests covering: full flow, i18n switching, JSON export/import, multi-day, domains management, agenda building workflow, headed demo
  - webServer auto-starts dev server; `PLAYWRIGHT_HTML_OPEN=never` to suppress report auto-open
- **Run:** `npm test` (unit), `npm run test:e2e` (E2E), `npm run test:e2e:headed` (visible browser)
- **TSC check:** `npx tsc --noEmit` — must be clean before deploying

## Important Patterns
- **Adding a knowledge domain:** Add to `src/domains/defaults.ts` + add i18n keys (domain name, description, 4 bullets, attendee roles) in `types.ts` + all 4 lang files + add icon to `icon-map.ts` if new FA icon
- **Adding Trek mode text:** Add mapping to `src/trek/mode.ts`
- **Adding a new view:** Create in `src/components/views/`, add to `ViewName` union in `types.ts`, register in `sidebar.ts` and `main.ts`
- **Adding an event type:** Add to `EventType` union in `types.ts`, handle in `event-card.ts` (icon, controls), `day-panel.ts` (insertion), `pdf.ts` (color bar)
- **Event insertion order:** Uses `findInsertionIndex()` — always insert after last same-type event, never after orientation (index 0) or before adjourn (last)
- **Time recalculation:** `recalculateTimes(day)` walks events sequentially from `dayStartTime`, computing start/end from durations. Called after any event add/remove/reorder/duration change.
- **Overlap detection:** `detectOverlaps(day)` returns `[i, j]` pairs of overlapping events, shown as warnings.

## Deployment
- **Cloudflare Pages:** `wrangler pages deploy dist --project-name tempo --commit-dirty=true`
- Also available as `npm run deploy` if script exists
- Static site, no backend — all data local (IndexedDB + localStorage)
- Build: `npm run build` (runs `tsc && vite build`)
