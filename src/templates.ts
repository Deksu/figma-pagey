export type Template = {
  id: string;
  name: string;
  pages: string[];
};

export const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Default',
  pages: [
    '🖼️ Cover',
    '---',
    '✅ Final views',
    '▶️ Master prototype',
    '---',
    '🧩 Components',
    '---',
    '✏️ Exploration',
    '👀 Preview',
    '---',
    '✨ References',
    '---',
    '🗄️ Archive'
  ]
};

export const TEMPLATES: Template[] = [
  DEFAULT_TEMPLATE,
  {
    id: 'sectioned',
    name: 'Sectioned',
    pages: [
      '🖼️ Cover',
      '---',
      '✅ Finalized views',
      '   ↪ 💻 Desktop',
      '   ↪ 📱 Mobile',
      '---',
      '▶️ Master prototypes',
      '   ↪ 💻 Desktop',
      '   ↪ 📱Mobile',
      '---',
      '✏️ Exploration phases',
      '   ↪ ✏️ Phase 1',
      '   ↪ ✏️ Phase 2',
      '---',
      '🧩 Components',
      '   ↪ 💻 Desktop',
      '   ↪ 📱 Mobile',
      '   ↪ ♟️ General',
      '---',
      '🗄️ Archive',
      '   ↪ 🪦 Cemetery'
    ]
  }
];

export const getCustomTemplate = (id: string, name: string, pages: string[]): Template => ({
  id,
  name,
  pages
});

export const getTemplateById = (id: string): Template | undefined =>
  TEMPLATES.find((template) => template.id === id);
