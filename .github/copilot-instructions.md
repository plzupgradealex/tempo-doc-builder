# Copilot Instructions for Tempo

## Project Overview
Tempo is an LCARS-styled (Star Trek TNG) consultant trip agenda builder PWA. It creates professional multi-day PDF/DOCX agendas for consultants traveling to client sites. Deployed at https://tempo-6el.pages.dev.

**Stack:** Vanilla TypeScript + Vite 7 — no frameworks. ES2022 target, strict mode, bundler moduleResolution. Dev server port 5174.

## Architecture
- **Vanilla TypeScript + Vite** — no React/Vue/Angular
- **Event-driven** — central event bus (`src/bus.ts`) with `emit(event, detail?)` and `on(event, handler)` → unsubscribe fn
- **State** — mutable singleton in `src/state.ts`. Fields: `currentView`, `currentAgenda`, `trekMode`, `theme ('tng'|'movie')`, `domains`. Setters emit bus events.
- **Persistence** — IndexedDB (db: `tempo`, stores: `agendas`, `domains`) for saved data. localStorage for drafts (key `tempo-draft`), locale (key `tempo-locale`), and sync passphrase (key `tempo-sync-phrase`).
- **PDF** — jsPDF 4, A4, client-side generation. Cobalt blue header/footer bars `rgb(0, 71, 171)`.
- **DOCX** — docx library, client-side Word document generation.
- **i18n** — 4 languages (EN/ES/DE/FR), ~240 keys. `t(key)` with `{0}`, `{1}` template placeholders. Falls back to EN then raw key.
- **Components return DOM** — each exports a render function creating DOM and appending to container.

## Cloud Sync & Encryption
- **Sync API**: Cloudflare Worker at `https://tempo-sync.alex-31f.workers.dev` with KV namespace for encrypted blob storage and Durable Objects for real-time collaboration rooms.
- **Encryption**: PBKDF2 (100k iterations, SHA-256) derives AES-256-GCM key from passphrase. Wire format: `base64(salt[16] + iv[12] + ciphertext)`. Passphrase → SHA-256 hash = KV storage key. Server is zero-knowledge.
- **Passkey (WebAuthn)**: HKDF from credential ID → AES-GCM encrypts passphrase locally; stored in localStorage. On boot, auto-unlocks if passkey exists but no passphrase in memory.
- **Sync indicator**: Status bar shows "READY" by default; when synced shows "READY · 🔒 CLOUDFLARE COMMLINK" in teal. State transitions use a typewriter animation (one letter at a time). No pulsing/throbbing — low-tech LCARS style. Clicking opens sync modal.
- **Health checks**: Periodic HEAD requests to `/api/sync` every 60s to verify worker connectivity.
- **Public publish**: Two-step process — saving an agenda does NOT update the public link. User must explicitly click "Publish" in preview view. Standalone HTML stored in KV with `pub:{slug}` key. Served at `/{slug}.html`. Friendly slugs generated from vendor-customer-project header fields. Ownership tracked via KV metadata; only the publisher's sync key can update/delete.

## Bus Events
`view-changed`, `agenda-changed`, `trek-mode-changed`, `theme-changed`, `domains-changed`, `locale-changed`, `auth-changed`, `day-updated`, `open-topic-picker`, `agenda-saved`, `sync-status`, `sync-enabled`, `sync-disabled`

## Key Design Decisions
1. **CSS split:** `src/styles/lcars-core.css` = reusable LCARS design system (do NOT add app-specific styles). `src/styles/tempo.css` = app-specific styles. Themes via CSS variables + `color-mix()`. Two themes: TNG (default) and Movie (`[data-theme="movie"]`).
2. **Knowledge domains are data, not code** — stored in `src/domains/defaults.ts`, loaded into IndexedDB, user-editable in Domains view.
3. **Star Trek mode** — toggleable text replacement via `src/trek/mode.ts` (~20 mappings like Project→Mission). **NEVER put Trek terminology in PDF/DOCX output.**
4. **FontAwesome 6 Solid** icons via CDN. Icon picker (`icon-picker.ts`) has ~100 curated business icons with search.
5. **Icon map** (`src/utils/icon-map.ts`) — 40+ FA→emoji mappings for PDF/text contexts. `faToSymbol(faIcon)` returns emoji or `'●'` fallback.
6. **Time inputs** use `step="900"` for 15-minute increments.
7. **Event insertion** — `findInsertionIndex(events, eventType)` scans backwards for last event of same type, inserts after it; falls back to before recap/adjourn.
8. **Draft system** — localStorage quick save/restore. Draft auto-clears on full save to library. On app load, shows restore/discard prompt if draft exists.
9. **Bottom bar layout** — 3 segments: status bar (flex:2, shows "Ready" or "Ready · 🔒 CLOUDFLARE COMMLINK"), agenda status (flex:1, day/event counts), HELP button (cap). Sync state shown via text + colour on status bar with typewriter animation for transitions. No separate sync indicator segment, no pulsing animations.
10. **Bundle optimisation** — jsPDF optional deps (canvg, html2canvas, dompurify) excluded via rollup externals in vite.config.ts. 0 npm vulnerabilities.

## Types (src/types.ts)
- **`EventType`**: `'orientation' | 'topic' | 'pause' | 'plant-tour' | 'adjourn' | 'recap' | 'custom'`
- **`AgendaEvent`**: `id, type, topicDomainId?, title, description, bulletPoints[], startTime, endTime, duration, attendees[]`
- **`AgendaDay`**: `id, date, dayStartTime ("09:00"), adjournTime ("17:00"), events[]`
- **`KnowledgeDomain`**: `id, name, icon (FA class), description, defaultBulletPoints[], recommendedAttendees[], isDefault`
- **`Agenda`**: `id, name, createdAt, updatedAt, publishedSlug?, publishedAt?, header: AgendaHeader, travel: TravelInfo, preWork: PreWorkNeeds, days: AgendaDay[]`
- **`AppState`**: `currentView: ViewName, currentAgenda, trekMode, theme: 'tng'|'movie', domains[]`
- **`ViewName`**: `'agenda' | 'library' | 'domains' | 'preview' | 'about'`
- **`TravelMode`**: `'flight' | 'train' | 'vehicle'`

## File Structure (44 source files, ~10k lines)
```
src/
  main.ts              — entry point, bootstraps app + sync + passkey auto-unlock
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
      preview-view.ts  — agenda preview + PDF/DOCX/JSON export + publish button + renderAgendaHTML (exported)
      about-view.ts    — about page with security transparency section
    agenda/
      header-form.ts   — project info form fields
      travel-form.ts   — arrival/departure travel details
      pre-work.ts      — pre-work needs checkboxes
      day-panel.ts     — day panel: events, drag-drop, add buttons, recalculateTimes, detectOverlaps, findInsertionIndex
      event-card.ts    — individual event card: controls, inline edit, time inputs, icon display
      topic-picker.ts  — modal showing available domains to add as topics (with sub-menus)
      icon-picker.ts   — FA icon picker dialog with search (~100 icons)
  domains/
    defaults.ts        — 13 default knowledge domains
  export/
    pdf.ts             — jsPDF A4 PDF generation
    docx.ts            — Word document generation via docx library
  i18n/
    index.ts           — i18n engine (t, setLocale, getLocale, getLocales)
    types.ts           — Translations interface (~240 keys)
    en.ts              — English translations
    es.ts              — Spanish translations
    de.ts              — German translations
    fr.ts              — French translations
  sync/
    sync-client.ts     — push/pull encrypted library to CF KV (getApiUrl, syncLibrary, pushLibrary, isSyncEnabled)
    sync-indicator.ts  — status bar sync state (Cloudflare Commlink) with 60s health checks
    sync-modal.ts      — sync settings overlay (passphrase generate/enter, passkey register/unlock/remove, sync now, disconnect)
    crypto.ts          — PBKDF2 + AES-256-GCM encrypt/decrypt using Web Crypto API
    passphrase.ts      — passphrase generation (3 words from curated list) + localStorage save/load/clear
    passkey.ts         — WebAuthn passkey register/authenticate/remove (HKDF + AES-GCM for passphrase encryption)
    collab-client.ts   — real-time collaboration via Durable Objects WebSocket rooms
    publish.ts         — public HTML publishing (generateSlug, wrapStandaloneHTML, publishHTML, unpublishAgenda, getPublicUrl)
  trek/
    mode.ts            — Star Trek text mappings (~20 entries)
  styles/
    lcars-core.css     — reusable LCARS design system (947 lines)
    tempo.css          — app-specific styles (1100+ lines)
  utils/
    id.ts              — UUID generation (crypto.randomUUID)
    time.ts            — time arithmetic (addMinutes, parseTime, formatTime)
    time-picker.ts     — custom time picker component
    drag-drop.ts       — drag-and-drop utilities
    icon-map.ts        — FA class → emoji mapping (40+ entries) for PDF
```

## Knowledge Domains (13 defaults)
| ID | Icon | Bullets | Attendees |
|---|---|---|---|
| `procurement` | `fa-cart-shopping` | 4 | 3 |
| `inventory` | `fa-boxes-stacked` | 4 | 3 |
| `production` | `fa-industry` | 4 | 3 |
| `cutting` | `fa-scissors` | 4 | 3 |
| `finance` | `fa-calculator` | 4 | 3 |
| `sales` | `fa-chart-line` | 4 | 3 |
| `livestock` | `fa-cow` | 4 | 3 |
| `debrief` | `fa-comments` | 4 | 3 |
| `qa` | `fa-clipboard-check` | 4 | 3 |
| `maintenance` | `fa-wrench` | 4 | 3 |
| `travel` | `fa-plane` | 4 | 3 |
| `kickoff` | `fa-rocket` | 4 | 3 |
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
- CSS sync states driven by `data-sync` attribute on status bar, not separate DOM elements

## Sync Functions
- **sync-client.ts**: `pushLibrary()`, `syncLibrary()`, `isSyncEnabled()`, `getApiUrl()`
- **crypto.ts**: `encrypt(plaintext, passphrase)`, `decrypt(ciphertext, passphrase)`
- **passphrase.ts**: `generatePassphrase()`, `getSavedPhrase()`, `savePhrase()`, `clearPhrase()`
- **passkey.ts**: `registerPasskey(passphrase)`, `authenticateWithPasskey()`, `removePasskey()`, `hasRegisteredPasskey()`, `isPasskeySupported()`
- **sync-indicator.ts**: `initSyncIndicator()` — manages status bar sync state + health checks
- **sync-modal.ts**: `initSyncModal()` — overlay for managing sync settings
- **publish.ts**: `generateSlug(agenda)`, `wrapStandaloneHTML(innerHtml, agenda)`, `publishHTML(slug, html)`, `unpublishAgenda(slug)`, `getPublicUrl(slug)`

## Testing
- **Unit tests:** Vitest + jsdom in `tests/unit/` — 4 test files, 52 tests
  - `trek.test.ts`, `time.test.ts`, `domains.test.ts`, `state.test.ts`
- **E2E tests:** Playwright (chromium) in `tests/e2e/agenda-flow.spec.ts`
  - 6 describe blocks covering: full flow, i18n switching, JSON export/import, multi-day, domains management, agenda building workflow
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
- **Sync flow:** `syncLibrary()` → `pullLibrary()` + `pushLibrary()`. Pull merges by ID, newest `updatedAt` wins. Push encrypts full library and PUTs to KV. Auto-push on `agenda-saved` event.
- **Passkey auto-unlock:** On boot, if passkey exists but no passphrase, `authenticateWithPasskey()` runs → retrieves passphrase → enables sync automatically.

## Deployment
- **Frontend:** Cloudflare Pages — `wrangler pages deploy dist --project-name tempo --commit-dirty=true`
- **Worker:** `cd worker && wrangler deploy` — deploys to `tempo-sync.alex-31f.workers.dev`
- **KV namespace:** `ade044f798574843ac9acfac6fe34c82`
- **GitHub:** `plzupgradealex/tempo-doc-builder` (main branch)
- Build: `npm run build` (runs `tsc && vite build`)
- Must pass: `npx tsc --noEmit` + `npx vitest run` (52 tests) before deploy

## Dependencies (0 vulnerabilities)
- **jspdf** ^4.2.0 — PDF generation (optional deps canvg/html2canvas/dompurify excluded via rollup externals)
- **docx** ^9.5.3 — Word document generation
- **file-saver** ^2.0.5 — File download triggers
- Dev: vite, typescript, vitest, playwright
