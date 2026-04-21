# Figma Pagey

A lightweight Figma plugin that scaffolds a set of template pages in the current file, so you can skip the manual setup at the start of every project.

## Features
- One-click creation of structured page templates (Default and Sectioned).
- Live preview editor with inline rename, drag-and-drop reorder, and add-page controls.
- Optional toggles to strip dividers or emojis from a template before creating pages.
- Undo that removes only the pages created during the current plugin run.
- Save up to 5 per-user custom templates, with optional descriptions, persisted in Figma client storage.

## Privacy

This plugin runs locally inside Figma and does not send, store, or process data outside the local plugin environment. There is no backend, no authentication, no analytics, and no network calls. Custom templates are stored in Figma's per-user [`clientStorage`](https://www.figma.com/plugin-docs/api/figma-clientStorage/) and never leave your machine / Figma account.

## Installation (local development)

Prerequisites: Node.js 18+ and npm.

```bash
git clone https://github.com/Deksu/figma-pagey.git
cd figma-pagey
npm install
npm run build
```

## Running the plugin in Figma

1. Open the Figma desktop app (required for local plugin development).
2. Open any Figma file.
3. Menu → **Plugins** → **Development** → **Import plugin from manifest…**
4. Select the `manifest.json` at the root of this repo.
5. Run it from **Plugins** → **Development** → **Figma Pagey**.

For active development use `npm run dev` (webpack watch) and then re-run the plugin in Figma to pick up changes.

## Scripts
- `npm run dev` — webpack watch build.
- `npm run build` — production build into `dist/`.
- `npm test` — Jest unit tests.
- `npm run typecheck` — TypeScript `--noEmit`.
- `npm run preflight` — typecheck + tests + build.

## Project structure
- `src/code.ts` — Figma plugin sandbox logic.
- `src/ui.tsx` — React UI rendered in the plugin iframe.
- `src/templates.ts` — built-in template definitions.
- `src/createPages.ts` — page creation and undo helpers.
- `src/customTemplate.ts` — custom template validation and storage shape.
- `src/transformPages.ts` — divider/emoji transform logic.
- `__tests__/` — Jest unit tests.
- `docs/` — architecture, UX, templates, testing, and release notes.

## Contributing

Issues and pull requests are welcome. Please run `npm run preflight` before opening a PR.

## License

MIT — see [LICENSE](./LICENSE). Copyright © 2026 Miikka Marin.

You are free to use, modify, and redistribute this code, including for commercial use, subject to the terms of the MIT License.
