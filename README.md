# Tempo

**LCARS-styled consultant trip agenda builder.**

Tempo helps consultants plan on-site trip agendas — select knowledge
domains, arrange topics across days, define travel logistics, and
export a polished PDF or DOCX to email or print.

Deployed at **https://tempo-6el.pages.dev**

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5174
```

Build for production:

```bash
npm run build      # output in dist/
```

Deploy to Cloudflare Pages:

```bash
npm run deploy     # requires wrangler auth
```

## Features

| Feature | Detail |
|---|---|
| **LCARS UI** | Authentic Star Trek TNG-inspired design system with TNG and Movie theme variants |
| **Agenda Builder** | Drag-and-drop topics into day timelines with auto-calculated times |
| **Knowledge Domains** | 13 defaults (Procurement, Inventory, Production, Cutting, Finance, Sales, Livestock, Debrief, QA, Maintenance, Travel, Kickoff, Plant Tour) — fully editable |
| **Day Management** | Add/remove days; Orientation auto-first, Adjourn auto-last, Recap on final day |
| **Pre-Work** | Projector and network access requirements with generated text |
| **Travel Info** | Arrival/departure with flight/train/vehicle, times, locations |
| **PDF Export** | Professional A4 PDF via jsPDF — no server needed |
| **DOCX Export** | Word document export via docx library |
| **Library** | Save/load agendas in IndexedDB; JSON import/export |
| **Cloud Sync** | E2E encrypted sync via Cloudflare Workers + KV with passphrase-based auth |
| **Passkey Support** | WebAuthn biometric authentication for quick device unlock |
| **Public Share Links** | Publish agendas as standalone HTML pages at friendly URLs (two-step: edits don't auto-publish) |
| **i18n** | 4 languages (EN/ES/DE/FR) with ~240 translation keys |
| **Star Trek Mode** | Toggle Trek terminology in the UI ("Project" → "Mission", etc.) — PDF stays professional |
| **PWA** | Installable, works offline once cached |
| **Themes** | TNG (warm) and Movie (cool blue) colour palettes |

## Cloud Sync & Security

Tempo uses a zero-knowledge cloud sync architecture:

- **E2E Encryption**: Data is encrypted in the browser using AES-256-GCM with a key derived from your passphrase (PBKDF2, 100k iterations). Only the encrypted blob leaves the device.
- **Zero-Knowledge Server**: The Cloudflare Worker stores data keyed by SHA-256(passphrase). It never sees the plaintext passphrase or the unencrypted data. The operator genuinely cannot decrypt your data.
- **Passphrase Model**: Users share a passphrase across devices — no accounts, no emails, no passwords. The passphrase is simultaneously a workspace identifier and an encryption key.
- **Passkey (WebAuthn)**: Optionally register a device passkey for biometric quick-unlock. The passkey encrypts the passphrase locally using HKDF-derived AES-GCM keyed from the credential ID.
- **Status Bar**: When sync is enabled, the bottom bar shows "CLOUDFLARE COMMLINK" with colour-coded states (teal = linked, orange = syncing, red = error).

Infrastructure: Cloudflare Workers (sync API), Cloudflare KV (encrypted blob storage), Durable Objects (real-time collaboration rooms).

## Public Share Links

Publish an agenda as a standalone public HTML page — separate from save/sync:

1. **Build your agenda** in the editor and preview it.
2. **Click "Publish"** in the Preview view — the HTML is uploaded to the worker and a friendly URL is generated (e.g. `https://tempo-sync.alex-31f.workers.dev/vendor-customer-project-agenda.html`).
3. **Editing and saving does NOT update the public page.** You must click "Update Published" to push changes live.
4. **Unpublish** removes the public page entirely.

Slugs are auto-generated from the agenda header (vendor + customer + project). Only the original publisher (identified by sync key) can update or delete the page.

## Star Trek Mode

Trek mode replaces UI labels for fun:

- Project → Mission
- Project # → Mission #
- Customer # → Starbase ID
- Projector → Viewscreen
- Network access → Computer core access, decryption codes and shield frequencies
- New Agenda → New Mission Brief
- Library → Mission Archives

**The PDF/DOCX exports never include Trek terminology** — they always use professional labels.

## File Structure

```
tempo/
├── index.html                    # LCARS frame + bottom bar + modals
├── package.json
├── tsconfig.json
├── vite.config.ts                # Vite config (rollup externals for jspdf optional deps)
├── src/
│   ├── main.ts                   # Entry point — bootstraps all components + sync
│   ├── types.ts                  # All shared TypeScript interfaces/types
│   ├── bus.ts                    # EventTarget event bus (emit/on)
│   ├── state.ts                  # Mutable AppState singleton + setters that emit events
│   ├── storage.ts                # IndexedDB CRUD + JSON file I/O + localStorage draft
│   ├── auth/
│   │   └── auth.ts               # OIDC-ready scaffolding (currently local-only)
│   ├── components/
│   │   ├── frame.ts              # Theme/trek toggles, help modal
│   │   ├── sidebar.ts            # Nav buttons, view switching
│   │   ├── views/
│   │   │   ├── agenda-view.ts    # Main builder (header, pre-work, travel, day panels)
│   │   │   ├── library-view.ts   # Saved agendas list (load/delete/export)
│   │   │   ├── domains-view.ts   # Knowledge domain CRUD
│   │   │   ├── preview-view.ts   # HTML preview + PDF/DOCX export buttons
│   │   │   └── about-view.ts     # About page with security transparency section
│   │   └── agenda/
│   │       ├── header-form.ts    # Project info form fields
│   │       ├── pre-work.ts       # Projector/network checkboxes
│   │       ├── travel-form.ts    # Arrival/departure forms
│   │       ├── day-panel.ts      # Day with events + drop target + time calculator
│   │       ├── event-card.ts     # Event display + inline edit
│   │       ├── topic-picker.ts   # Domain selection modal with sub-menus
│   │       └── icon-picker.ts    # FA icon picker dialog with search (~100 icons)
│   ├── domains/
│   │   └── defaults.ts           # 13 default knowledge domains
│   ├── export/
│   │   ├── pdf.ts                # jsPDF A4 PDF generation
│   │   └── docx.ts               # Word document generation via docx library
│   ├── i18n/
│   │   ├── index.ts              # i18n engine (t, setLocale, getLocale, getLocales)
│   │   ├── types.ts              # Translations interface (~240 keys)
│   │   ├── en.ts                 # English translations
│   │   ├── es.ts                 # Spanish translations
│   │   ├── de.ts                 # German translations
│   │   └── fr.ts                 # French translations
│   ├── sync/
│   │   ├── sync-client.ts        # Push/pull encrypted library to CF KV
│   │   ├── sync-indicator.ts     # Bottom bar status (Cloudflare Commlink) with health checks
│   │   ├── sync-modal.ts         # Sync settings overlay (passphrase, passkey, sync now)
│   │   ├── crypto.ts             # PBKDF2 + AES-256-GCM encryption/decryption
│   │   ├── passphrase.ts         # Passphrase generation + localStorage management
│   │   ├── passkey.ts            # WebAuthn passkey register/authenticate/remove
│   │   ├── collab-client.ts      # Real-time collaboration via Durable Objects WebSocket
│   │   └── publish.ts            # Public HTML publishing (two-step publish/unpublish)
│   ├── trek/
│   │   └── mode.ts               # Star Trek text replacements (~20 entries)
│   ├── styles/
│   │   ├── lcars-core.css        # ★ Reusable LCARS design system (947 lines)
│   │   └── tempo.css             # App-specific styles (1100+ lines)
│   └── utils/
│       ├── id.ts                 # crypto.randomUUID wrapper
│       ├── time.ts               # Time formatting/math (addMinutes, parseTime, formatTime)
│       ├── time-picker.ts        # Custom time picker component
│       ├── drag-drop.ts          # HTML5 DnD helpers
│       └── icon-map.ts           # FA class → emoji mapping (40+ entries) for PDF
├── tests/
│   ├── unit/                     # Vitest unit tests (4 files, 52 tests)
│   │   ├── trek.test.ts
│   │   ├── time.test.ts
│   │   ├── domains.test.ts
│   │   └── state.test.ts
│   └── e2e/                      # Playwright E2E tests
│       └── agenda-flow.spec.ts   # Full flow, i18n, JSON, multi-day, domains, builder
├── worker/                       # Cloudflare Worker (tempo-sync)
│   ├── src/
│   │   └── index.ts              # KV sync API + Durable Objects rooms
│   ├── wrangler.toml
│   └── package.json
└── public/
    └── manifest.json             # PWA manifest
```

**Stats:** 44 source files, ~10,000 lines of code, 0 npm vulnerabilities.

## Reusing the LCARS Design

The design system lives in `src/styles/lcars-core.css` and is **completely
self-contained**. To use it in another project:

1. Copy `lcars-core.css` into your project
2. Link it in your HTML
3. Use the frame structure from `index.html` (search for `lcars-frame`)
4. Toggle themes by adding `class="movie-theme"` to the root `<div>`

The core CSS provides: frame grid layout, elbows, top/bottom bars,
sidebar buttons, panels, form inputs, buttons, toggles, modals, toasts,
loading spinner, scrollbar, and responsive breakpoints.

## Testing

```bash
npm test           # Vitest unit tests (52 tests)
npm run test:e2e   # Playwright E2E (starts dev server automatically)
```

## Stack

- **Vite 7** + **TypeScript** (ES2022, strict)
- **jsPDF 4** for client-side PDF generation
- **docx** for Word document generation
- **FileSaver.js** for download triggers
- **Web Crypto API** for PBKDF2 + AES-256-GCM encryption
- **WebAuthn** for passkey biometric authentication
- **Cloudflare Workers** + **KV** + **Durable Objects** for sync backend
- **Vitest** + **jsdom** for unit tests
- **Playwright** for E2E tests
- **Cloudflare Pages** for deployment
- No frameworks — vanilla TypeScript + DOM

## Backlog

- [ ] Rotate sync passphrase (re-encrypt data with new passphrase, update KV key, re-encrypt passkey blob)
- [ ] Map-of-the-week visual (calendar strip showing all days at a glance)
- [ ] Embed Antonio font in PDF for TNG-styled headers
- [ ] Single-file HTML export (via vite-plugin-singlefile)
- [ ] Agenda templates (save/load reusable agenda structures)
- [ ] Multi-language support
