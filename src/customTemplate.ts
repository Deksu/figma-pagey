export const CUSTOM_TEMPLATE_STORAGE_KEY = 'pagey.customTemplate.v2';
export const CUSTOM_TEMPLATE_ID_PREFIX = 'custom:';

export const CUSTOM_TEMPLATE_LIMITS = {
  minLines: 3,
  maxLines: 40,
  maxLineLength: 60,
  maxNameLength: 40,
  maxTemplates: 5
};

const controlCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

const normalizeLine = (value: string): string => value.trim();

export const normalizeTemplateName = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

export const createCustomTemplateId = (): string => {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${CUSTOM_TEMPLATE_ID_PREFIX}${Date.now()}-${rand}`;
};

export const isCustomTemplateId = (value: string): boolean =>
  value.startsWith(CUSTOM_TEMPLATE_ID_PREFIX);

const hasControlChars = (value: string): boolean => controlCharRegex.test(value);

export const validateTemplateLines = (
  lines: string[]
): { pages: string[]; errors: string[] } => {
  const normalized = lines.map(normalizeLine).filter((line) => line.length > 0);
  const errors: string[] = [];

  if (normalized.length < CUSTOM_TEMPLATE_LIMITS.minLines) {
    errors.push(
      `Add at least ${CUSTOM_TEMPLATE_LIMITS.minLines} lines to save a template.`
    );
  }

  if (normalized.length > CUSTOM_TEMPLATE_LIMITS.maxLines) {
    errors.push(
      `Keep templates to ${CUSTOM_TEMPLATE_LIMITS.maxLines} lines or fewer.`
    );
  }

  const overLimit = normalized.find(
    (line) => line.length > CUSTOM_TEMPLATE_LIMITS.maxLineLength
  );
  if (overLimit) {
    errors.push(
      `Lines must be ${CUSTOM_TEMPLATE_LIMITS.maxLineLength} characters or fewer.`
    );
  }

  const controlChars = normalized.find(hasControlChars);
  if (controlChars) {
    errors.push('Remove control characters before saving.');
  }

  return { pages: normalized, errors };
};

export const parseTemplateInput = (
  value: string
): { pages: string[]; errors: string[] } => {
  const lines = value.split(/\r?\n/);
  return validateTemplateLines(lines);
};

export type StoredCustomTemplate = {
  id: string;
  name: string;
  pages: string[];
  description?: string;
  updatedAt: number;
};

export type StoredCustomTemplates = {
  templates: StoredCustomTemplate[];
};

export const validateTemplateName = (value: string): string[] => {
  const name = normalizeTemplateName(value);
  const errors: string[] = [];
  if (name.length === 0) {
    errors.push('Template name is required.');
  }
  if (name.length > CUSTOM_TEMPLATE_LIMITS.maxNameLength) {
    errors.push(
      `Name must be ${CUSTOM_TEMPLATE_LIMITS.maxNameLength} characters or fewer.`
    );
  }
  if (hasControlChars(name)) {
    errors.push('Remove control characters before saving.');
  }
  return errors;
};

export const sanitizeStoredTemplate = (
  value: unknown
): StoredCustomTemplates | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as { templates?: unknown };
  if (!Array.isArray(record.templates)) return null;

  const templates = record.templates
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as StoredCustomTemplate;
      if (typeof candidate.id !== 'string') return null;
      if (typeof candidate.name !== 'string') return null;
      if (!Array.isArray(candidate.pages)) return null;
      if (!candidate.pages.every((page) => typeof page === 'string')) return null;
      if (
        candidate.description !== undefined &&
        typeof candidate.description !== 'string'
      )
        return null;
      const nameErrors = validateTemplateName(candidate.name);
      const { pages, errors } = validateTemplateLines(candidate.pages);
      if (nameErrors.length > 0 || errors.length > 0) return null;
      const normalized: StoredCustomTemplate = {
        id: candidate.id,
        name: normalizeTemplateName(candidate.name),
        pages,
        description:
          typeof candidate.description === 'string'
            ? candidate.description.trim().slice(0, 80)
            : undefined,
        updatedAt:
          typeof candidate.updatedAt === 'number' ? candidate.updatedAt : 0
      };
      return normalized;
    })
    .filter((item): item is StoredCustomTemplate => item !== null);

  return {
    templates: templates.slice(0, CUSTOM_TEMPLATE_LIMITS.maxTemplates)
  };
};
