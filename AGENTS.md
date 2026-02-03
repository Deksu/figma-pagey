# AGENTS.md

## Project overview
This repository contains a lightweight React-based Figma plugin that creates a set of template pages inside the current Figma file. The plugin is intentionally small and easy to maintain, with a minimal UI and a simple message-based bridge between the UI and Figma plugin code.

Key features:
- One-click creation of a predefined page template (currently the Default template).
- Optional undo that removes only the pages created by the current plugin run.
- React UI with minimal CSS (no heavy UI frameworks).

## Build and test commands
- Install dependencies: `npm install`
- Development watch build: `npm run dev`
- Production build: `npm run build`
- Typecheck: `npm run typecheck`
- Tests: `npm test`
- Preflight (typecheck + test + build): `npm run preflight`
- Release helpers:
  - `npm run release:patch`
  - `npm run release:minor`
  - `npm run release:major`

## Code style guidelines
- Keep code simple and explicit; avoid unnecessary abstractions.
- Prefer small, focused modules (`src/code.ts`, `src/ui.tsx`, `src/templates.ts`).
- Use TypeScript strictness; avoid `any` unless absolutely required.
- Keep UI styles in `src/ui.css` with clear, named CSS variables.
- Preserve existing UI layout and spacing unless the design spec changes.

## Testing instructions
- Unit tests live in `__tests__/` and use Jest.
- Tests should cover template definitions and the create/undo logic.
- When adding templates or logic, update tests accordingly.
- Run `npm test` before pushing to ensure CI passes.

## Security considerations
- The plugin runs inside Figma and should not request any special permissions.
- Do not include network calls or external scripts in the UI.
- Avoid storing sensitive information in the UI or plugin code.
- Keep the plugin self-contained; bundle all assets locally.

## Visual design guidelines
- Typography: Inter, regular/semibold/bold with -2% letter spacing.
- Primary color: `#3C4DEC` (defined in CSS variables).
- Text color: `#121212` (defined in CSS variables).
- Keep UI minimal and clean, matching the provided Figma mockups.
- Template selection cards:
  - Card size: 200x180
  - Placeholder image anchored bottom-right
  - Selected state uses the primary blue border and indicator
- Maintain consistent spacing and subtle shadows; avoid heavy effects.
