# Changelog

## 3.0.0
- Full UI redesign with two-column layout, live preview pane, and refreshed template cards.
- Live preview supports inline editing, drag-and-drop reordering, and adding new pages.
- Added optional custom template description field with persistence.
- Added reset controls for default templates and improved toast placement.
- Added create-page loading state and consolidated confirmation actions in the bottom bar.

## 2.0.0
- Added per-user custom template editor with save/load.
- Stored custom templates in Figma client storage.
- Added support for multiple named custom templates (up to 5).
- Added validation and tests for custom template data.
- Updated UI preview and selection behavior for custom templates.
- Added delete action for custom templates and fixed persistence after deletion.

## 1.2.1
- Refined button sizing, alignment, and action layouts.
- Added toast feedback with success/error styling and animation.
- Fixed toast enter animation by deferring the visible state to the next frame.
- Improved layout responsiveness for smaller plugin windows.

## 1.2.0
- Added options to remove dividers and emojis from templates (preview + creation).
- Added checkbox UI controls for template cleanup options.
- Improved emoji handling and added transform logic tests.
- Adjusted brand logo sizing.

## 1.1.1
- Added custom selection card as a disabled "coming soon" option.
- Updated selection card imagery and logo.
- Swapped selection card previews to template-specific images.

## 1.1.0
- Added emoji and divider-aware page templates.
- Introduced the "Sectioned" template with nested page structure.
- Fixed template preview rendering with divider markers.
- Improved inline bundle decoding for emoji support.

## 1.0.0
- Initial stable release with template creation, undo flow, and React UI.
- Included basic tests, CI workflow, and release automation scripts.
