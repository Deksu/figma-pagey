# Templates

## Conventions
- `---` is a divider marker.
- Emoji removal strips the leading emoji plus the following single space.
- Divider removal drops `---` entries entirely.

## Default
```
🖼️ Cover
---
✅ Final views
▶️ Master prototype
---
🧩 Components
---
✏️ Exploration
👀 Preview
---
✨ References
---
🗄️ Archive
```

## Sectioned
```
🖼️ Cover
---
✅ Finalized views
   ↪ 💻 Desktop
   ↪ 📱 Mobile
---
▶️ Master prototypes
   ↪ 💻 Desktop
   ↪ 📱 Mobile
---
✏️ Exploration phases
   ↪ ✏️ Phase 1
   ↪ ✏️ Phase 2
---
🧩 Components
   ↪ 💻 Desktop
   ↪ 📱 Mobile
   ↪ ♟️ General
---
🗄️ Archive
   ↪ 🪦 Cemetery
```

## Custom
- Defined by the user in the UI.
- One line per page, use `---` to insert dividers.
- Saved per user using `figma.clientStorage`.
- Custom templates have a user-defined name (max 40 characters).
- Optional description (max 80 characters).
- Up to 5 custom templates can be saved.
- Template names must be unique (including Default and Sectioned).

## Adding a template
1. Add to `src/templates.ts`.
2. Ensure preview and creation logic use `transformPages`.
3. Update tests in `__tests__/templates.test.ts`.
