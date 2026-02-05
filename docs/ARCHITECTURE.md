# Architecture

## Overview
- `src/code.ts` runs in the Figma plugin context.
- `src/ui.tsx` renders the React UI in an iframe.
- UI and plugin code communicate via `postMessage`.

## Data flow
1. UI sends `CREATE_PAGES` with template id, options, and optional `pagesOverride`.
2. `code.ts` creates pages (using overrides when provided), stores created ids in memory, replies `CREATED_PAGES`.
3. UI moves to confirmation view.
4. If undo is requested, UI sends `UNDO_PAGES`.
5. `code.ts` deletes only the created ids and replies `UNDO_COMPLETE`.

## Custom template flow
1. UI sends `LOAD_CUSTOM_TEMPLATE` on startup.
2. `code.ts` reads `figma.clientStorage` (key `pagey.customTemplate.v2`) and replies `CUSTOM_TEMPLATE_LOADED` with all saved templates.
3. UI opens editor, validates input, and sends `SAVE_CUSTOM_TEMPLATE` with template metadata.
4. `code.ts` validates again, stores under `pagey.customTemplate.v2`, replies `CUSTOM_TEMPLATE_SAVED`.
5. UI can send `DELETE_CUSTOM_TEMPLATE` to remove a saved custom template.
6. `code.ts` removes it from storage and replies `CUSTOM_TEMPLATE_DELETED`.

## Transform logic
- `transformPages` handles divider and emoji removal.
- Used by UI preview and by `code.ts` before creation to keep parity.
