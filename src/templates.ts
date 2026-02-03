export type Template = {
  id: string;
  name: string;
  pages: string[];
};

export const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Default',
  pages: [
    'Cover',
    'References',
    'Exploration',
    'Preview',
    'Master prototype',
    'Final views',
    'Components',
    'Archive'
  ]
};

export const TEMPLATES: Template[] = [
  DEFAULT_TEMPLATE,
  {
    id: 'selection-2',
    name: 'Selection #2',
    pages: DEFAULT_TEMPLATE.pages
  },
  {
    id: 'selection-3',
    name: 'Selection #3',
    pages: DEFAULT_TEMPLATE.pages
  }
];

export const getTemplateById = (id: string): Template | undefined =>
  TEMPLATES.find((template) => template.id === id);
