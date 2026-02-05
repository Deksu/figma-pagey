# Figma Pagey - A custom Figma Plugin

**Description:** A lightweight Figma plugin that creates predefined page templates to speed up project setup.

A lightweight Figma plugin that creates a set of template pages in the current file. It ships with Default and Sectioned templates, supports undo, and offers a live preview editor for quick tweaks.

## Features
- Create structured page templates (Default and Sectioned)
- Live preview editor with inline rename, reorder, and add-page controls
- Optional toggles to hide dividers or emojis before creation
- Works even if pages with the same names already exist
- Undo deletes only pages created during the current plugin run
- Save up to 5 per-user custom templates with optional descriptions

## Getting Started
1. Install dependencies:
   - `npm install`
2. Build the plugin:
   - `npm run build`
3. In Figma:
   - Plugins → Development → Import plugin from manifest…
   - Select `manifest.json`
4. Run the plugin:
   - Plugins → Development → Template Page Creator

## Development
- Watch mode: `npm run dev`
- Tests: `npm test`
- Typecheck: `npm run typecheck`
 - Build: `npm run build`

## Continuous Integration
GitHub Actions runs typecheck, tests, and a production build on every push to `main` and for all pull requests.

## Release Checklist
1. Update `package.json` version (semver).
2. Run `npm test` and `npm run build`.
3. Verify the plugin UI and page creation inside Figma.
4. Commit the version bump and tag the release.
5. (Optional) Add release notes on GitHub.

## Project Structure
- `src/code.ts`: main Figma plugin logic
- `src/ui.tsx`: React UI
- `src/templates.ts`: template definitions
- `src/createPages.ts`: core page creation/undo logic
- `__tests__/`: unit tests

## Notes
This plugin uses a minimal React UI with plain CSS to stay lightweight and easy to maintain.

## Additional Docs
- `docs/UX.md`: UX flow and UI behavior notes
- `docs/TEMPLATES.md`: template lists and conventions
- `docs/ARCHITECTURE.md`: message flow and code structure
- `docs/TESTING.md`: test coverage and commands
- `docs/RELEASE.md`: release steps and versioning
