import { DEFAULT_TEMPLATE, TEMPLATES } from '../src/templates';

describe('templates', () => {
  it('includes the default template', () => {
    expect(TEMPLATES).toContain(DEFAULT_TEMPLATE);
  });

  it('default template has required pages', () => {
    expect(DEFAULT_TEMPLATE.pages).toEqual([
      'Cover',
      'References',
      'Exploration',
      'Preview',
      'Master prototype',
      'Final views',
      'Components',
      'Archive'
    ]);
  });
});
