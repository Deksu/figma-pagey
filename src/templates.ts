export type Template = {
  id: string;
  name: string;
  pages: string[];
  description?: string;
};

export const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Default',
  description: 'A clean, sequential structure for product work.',
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
    description: 'Deeply nested sections for complex systems.',
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

export const getCustomTemplate = (
  id: string,
  name: string,
  pages: string[],
  description?: string
): Template => ({
  id,
  name,
  pages,
  description: description ?? 'A template you crafted by hand.'
});

export const getTemplateById = (id: string): Template | undefined =>
  TEMPLATES.find((template) => template.id === id);
