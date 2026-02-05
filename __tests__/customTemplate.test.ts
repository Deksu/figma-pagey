import {
  CUSTOM_TEMPLATE_LIMITS,
  parseTemplateInput,
  sanitizeStoredTemplate,
  validateTemplateLines,
  validateTemplateName
} from '../src/customTemplate';

describe('custom template validation', () => {
  it('normalizes and validates input lines', () => {
    const { pages, errors } = parseTemplateInput('  Cover  \n---\n\nFinal');
    expect(errors).toEqual([]);
    expect(pages).toEqual(['Cover', '---', 'Final']);
  });

  it('rejects empty templates', () => {
    const { errors } = parseTemplateInput('\n\n');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects lines over the max length', () => {
    const tooLong = 'a'.repeat(CUSTOM_TEMPLATE_LIMITS.maxLineLength + 1);
    const { errors } = validateTemplateLines(['Cover', tooLong, 'Final']);
    expect(errors.some((error) => error.includes('characters'))).toBe(true);
  });

  it('rejects too many lines', () => {
    const lines = Array.from(
      { length: CUSTOM_TEMPLATE_LIMITS.maxLines + 1 },
      (_, index) => `Line ${index + 1}`
    );
    const { errors } = validateTemplateLines(lines);
    expect(errors.some((error) => error.includes('lines'))).toBe(true);
  });

  it('validates template names', () => {
    expect(validateTemplateName('')).toContain('Template name is required.');
    const tooLong = 'a'.repeat(CUSTOM_TEMPLATE_LIMITS.maxNameLength + 1);
    expect(
      validateTemplateName(tooLong).some((error) => error.includes('characters'))
    ).toBe(true);
  });
});

describe('custom template storage sanitization', () => {
  it('returns null for invalid stored values', () => {
    expect(sanitizeStoredTemplate(null)).toBeNull();
    expect(sanitizeStoredTemplate({ templates: [{ pages: [''] }] })).toEqual({
      templates: []
    });
    expect(sanitizeStoredTemplate({ templates: [{ pages: [123] }] })).toEqual({
      templates: []
    });
  });

  it('returns empty templates when stored list is empty', () => {
    expect(sanitizeStoredTemplate({ templates: [] })).toEqual({ templates: [] });
  });

  it('returns pages for a valid stored template', () => {
    const pages = ['Cover', '---', 'Final'];
    expect(
      sanitizeStoredTemplate({
        templates: [
          { id: 'custom:1', name: 'Custom', pages, updatedAt: Date.now() }
        ]
      })
    ).toEqual({
      templates: [
        { id: 'custom:1', name: 'Custom', pages, updatedAt: expect.any(Number) }
      ]
    });
  });
});
