# UX Guide

## Views and flow
1. Select template
2. Post-create confirmation
3. Confirm undo

## Selection view
- Three cards in a single row.
- Selected card uses primary border + indicator.
- Disabled card is 25% opacity and non-interactive.

## Preview
- Uses template pages as-is.
- Dividers render only where `---` exists.
- Optional toggles can remove dividers or emojis.

## Buttons
- "Hug" sizing: height 44px, horizontal padding 16px.
- Primary actions align right on the select view.
- Post-create: Undo on left, All good on right.
- Confirm undo: Back on left, Delete on right (red).

## Toast
- Centered at top.
- Shows for 6 seconds.
- Enter animation requires a next-frame state flip to trigger CSS transition.
