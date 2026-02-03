# Figma Pagey - A custom Figma Plugin

**Description:** A lightweight Figma plugin that creates predefined page templates to speed up project setup.

A lightweight Figma plugin that creates a set of template pages in the current file. v1 ships with a single template (Default) and supports undoing the created pages.

## Features
- Create 8 predefined pages: Cover, References, Exploration, Preview, Master prototype, Final views, Components, Archive
- Works even if pages with the same names already exist
- Undo deletes only pages created during the current plugin run

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
