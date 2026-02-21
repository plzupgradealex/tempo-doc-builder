# Tempo

**LCARS-styled consultant trip agenda builder.**

Tempo helps consultants plan on-site trip agendas—select knowledge
domains, arrange topics across days, define travel logistics, and
export a polished PDF to email or print.

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
| **Agenda Builder** | Drag-and-drop topics into day timelines |
| **Knowledge Domains** | 6 defaults (Procurement, Inventory, Production, Cutting, Finance, Sales) — fully editable |
| **Day Management** | Add/remove days; Orientation auto-first, Adjourn auto-last, Recap on final day |
| **Pre-Work** | Projector and network access requirements with generated text |
| **Travel Info** | Arrival/departure with flight/train/vehicle, times, locations |
| **PDF Export** | Professional A4 PDF via jsPDF — no server needed |
| **Library** | Save/load agendas in IndexedDB; JSON import/export |
| **Star Trek Mode** | Toggle Trek terminology in the UI ("Project" → "Mission", etc.) — PDF stays professional |
| **PWA** | Installable, works offline once cached |
| **Themes** | TNG (warm) and Movie (cool blue) colour palettes |

## Star Trek Mode

Trek mode replaces UI labels for fun:

- Project → Mission
- Project # → Mission #
- Customer # → Starbase ID
- Projector → Viewscreen
- Network access → Computer core access, decryption codes and shield frequencies
- New Agenda → New Mission Brief
- Library → Mission Archives

**The PDF export never includes Trek terminology** — it always uses professional labels.

## File Structure

```
tempo/
├── index.html                    # LCARS frame
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                   # Entry point — bootstraps everything
│   ├── types.ts                  # All interfaces
│   ├── bus.ts                    # EventTarget event bus
│   ├── state.ts                  # Mutable app state + events
│   ├── storage.ts                # IndexedDB persistence + JSON I/O
│   ├── styles/
│   │   ├── lcars-core.css        # ★ Reusable LCARS design system
│   │   └── tempo.css             # App-specific styles
│   ├── components/
│   │   ├── frame.ts              # Theme/trek toggles, help modal
│   │   ├── sidebar.ts            # Nav buttons, view switching
│   │   ├── views/
│   │   │   ├── agenda-view.ts    # Main builder
│   │   │   ├── library-view.ts   # Saved agendas
│   │   │   ├── domains-view.ts   # Domain editor
│   │   │   ├── preview-view.ts   # HTML preview + PDF export
│   │   │   └── about-view.ts     # Info page
│   │   └── agenda/
│   │       ├── header-form.ts    # Project info form
│   │       ├── pre-work.ts       # Projector/network checkboxes
│   │       ├── travel-form.ts    # Arrival/departure forms
│   │       ├── day-panel.ts      # Day with events + drop target
│   │       ├── event-card.ts     # Event display + inline edit
│   │       └── topic-picker.ts   # Domain selection modal
│   ├── domains/
│   │   └── defaults.ts           # 6 default knowledge domains
│   ├── export/
│   │   └── pdf.ts                # jsPDF generation
│   ├── trek/
│   │   └── mode.ts               # Trek text replacements
│   └── utils/
│       ├── id.ts                 # crypto.randomUUID wrapper
│       ├── time.ts               # Time formatting/math
│       └── drag-drop.ts          # HTML5 DnD helpers
├── tests/
│   ├── unit/                     # Vitest unit tests
│   └── e2e/                      # Playwright E2E tests
└── public/
    └── manifest.json             # PWA manifest
```

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
npm test           # Vitest unit tests
npm run test:e2e   # Playwright E2E (starts dev server automatically)
```

## Stack

- **Vite** + **TypeScript** (ES2022, strict)
- **jsPDF** for client-side PDF generation
- **Vitest** + **jsdom** for unit tests
- **Playwright** for E2E tests
- **Cloudflare Pages** for deployment
- No frameworks — vanilla TypeScript + DOM

## Backlog

- [ ] Map-of-the-week visual (calendar strip showing all days at a glance)
- [ ] Embed Antonio font in PDF for TNG-styled headers
- [ ] Single-file HTML export (via vite-plugin-singlefile)
- [ ] Agenda templates (save/load reusable agenda structures)
- [ ] Multi-language support
