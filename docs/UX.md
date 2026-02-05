# UX Guide

## Views and flow
1. Select template
2. Custom template editor (when creating or editing)
3. Post-create confirmation
4. Confirm undo

## Selection view
- Template cards scroll horizontally when more custom templates are added.
- Selected card uses primary border + indicator.
- Custom card shows "Create template" until saved.

## Preview
- Uses template pages as-is.
- Dividers render only where `---` exists.
- Optional toggles can remove dividers or emojis.

## Custom editor
- Name input (max 40 characters).
- Textarea input: one line per page.
- `---` inserts dividers.
- Save validates limits (line count and length) before storage.
- Custom templates can be deleted from the preview header with a confirmation dialog.

## Buttons
- "Hug" sizing: height 44px, horizontal padding 16px.
- Primary actions align right on the select view.
- Post-create: Undo on left, All good on right.
- Confirm undo: Back on left, Delete on right (red).

## Toast
- Centered at top.
- Shows for 6 seconds.
- Enter animation requires a next-frame state flip to trigger CSS transition.
