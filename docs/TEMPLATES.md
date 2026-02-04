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

## Adding a template
1. Add to `src/templates.ts`.
2. Ensure preview and creation logic use `transformPages`.
3. Update tests in `__tests__/templates.test.ts`.
