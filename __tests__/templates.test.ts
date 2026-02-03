import { DEFAULT_TEMPLATE, TEMPLATES } from '../src/templates';

describe('templates', () => {
  it('includes the default template', () => {
    expect(TEMPLATES).toContain(DEFAULT_TEMPLATE);
  });

  it('default template has required pages', () => {
    expect(DEFAULT_TEMPLATE.pages).toEqual([
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
    ]);
  });

  it('sectioned template is available with nested items', () => {
    const sectioned = TEMPLATES.find((template) => template.id === 'sectioned');
    expect(sectioned?.name).toBe('Sectioned');
    expect(sectioned?.pages).toContain('   ↪ 💻 Desktop');
    expect(sectioned?.pages).toContain('   ↪ 🪦 Cemetery');
    expect(sectioned?.pages).toContain('▶️ Master prototypes');
  });
});
