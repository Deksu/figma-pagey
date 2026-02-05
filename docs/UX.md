# UX Guide

## Views and flow
1. Select template
2. Custom template editor (when creating or editing)
3. Post-create confirmation (shown in bottom bar)
4. Confirm undo (shown in bottom bar)

## Selection view
- Template cards are stacked in the left column.
- Selected card uses primary border + indicator.
- Custom card shows "Create template" until saved.
- Logo and version live above the template list.

## Preview
- Live preview lives in the right column.
- Dividers render where `---` exists (unless removed).
- Optional toggles can remove dividers or emojis.
- Items can be renamed inline, reordered via drag-and-drop, or deleted.
- New pages can be added via the "Add page" button.
- Default and Sectioned templates expose a reset button when edited.

## Custom editor
- Name input (max 40 characters).
- Optional description input (max 80 characters).
- Textarea input: one line per page.
- `---` inserts dividers.
- Save validates limits (line count and length) before storage.
- Custom templates can be deleted from the preview header with a confirmation dialog.

## Buttons
- "Hug" sizing: height 44px, horizontal padding 16px.
- Primary actions align right on the select view.
- Post-create and confirm undo actions appear in the fixed bottom bar.

## Toast
- Top-right with padding.
- Shows for 6 seconds.
- Enter animation requires a next-frame state flip to trigger CSS transition.
