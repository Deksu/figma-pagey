# Architecture

## Overview
- `src/code.ts` runs in the Figma plugin context.
- `src/ui.tsx` renders the React UI in an iframe.
- UI and plugin code communicate via `postMessage`.

## Data flow
1. UI sends `CREATE_PAGES` with template id and options.
2. `code.ts` creates pages, stores created ids in memory, replies `CREATED_PAGES`.
3. UI moves to confirmation view.
4. If undo is requested, UI sends `UNDO_PAGES`.
5. `code.ts` deletes only the created ids and replies `UNDO_COMPLETE`.

## Transform logic
- `transformPages` handles divider and emoji removal.
- Used by UI preview and by `code.ts` before creation to keep parity.
