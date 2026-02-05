import { createPages, undoPages } from './createPages';
import { getTemplateById } from './templates';
import {
  CUSTOM_TEMPLATE_LIMITS,
  createCustomTemplateId,
  normalizeTemplateName,
  sanitizeStoredTemplate,
  CUSTOM_TEMPLATE_STORAGE_KEY,
  StoredCustomTemplate,
  StoredCustomTemplates,
  validateTemplateLines,
  validateTemplateName,
  isCustomTemplateId
} from './customTemplate';
import { transformPages } from './transformPages';

type UiMessage =
  | {
      type: 'CREATE_PAGES';
      templateId: string;
      options: { removeDividers: boolean; removeEmojis: boolean };
    }
  | { type: 'LOAD_CUSTOM_TEMPLATE' }
  | {
      type: 'SAVE_CUSTOM_TEMPLATE';
      template: { id?: string; name: string; pages: string[] };
    }
  | { type: 'DELETE_CUSTOM_TEMPLATE'; templateId: string }
  | { type: 'UNDO_PAGES' }
  | { type: 'CLOSE_PLUGIN' };

type PluginMessage =
  | { type: 'CREATED_PAGES'; createdIds: string[]; templateId: string }
  | { type: 'CUSTOM_TEMPLATE_LOADED'; templates: StoredCustomTemplates['templates'] }
  | { type: 'CUSTOM_TEMPLATE_SAVED'; template: StoredCustomTemplate }
  | { type: 'CUSTOM_TEMPLATE_DELETED'; templateId: string }
  | { type: 'CUSTOM_TEMPLATE_SAVE_FAILED'; errors: string[] }
  | { type: 'UNDO_COMPLETE' };

const UI_WIDTH = 720;
const UI_HEIGHT = 760;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });

let createdPageIds: string[] = [];
let activeTemplateId: string | null = null;

const LEGACY_CUSTOM_TEMPLATE_KEY = 'pagey.customTemplate.v1';

const loadStoredTemplates = async (): Promise<StoredCustomTemplates> => {
  const stored = await figma.clientStorage.getAsync(
    CUSTOM_TEMPLATE_STORAGE_KEY
  );
  const sanitized = sanitizeStoredTemplate(stored);
  if (sanitized) return sanitized;

  const legacy = await figma.clientStorage.getAsync(LEGACY_CUSTOM_TEMPLATE_KEY);
  if (legacy && typeof legacy === 'object') {
    const legacyRecord = legacy as { pages?: unknown };
    if (Array.isArray(legacyRecord.pages)) {
      const { pages, errors } = validateTemplateLines(legacyRecord.pages);
      if (errors.length === 0) {
        const migrated = {
          templates: [
            {
              id: createCustomTemplateId(),
              name: 'Custom',
              pages,
              updatedAt: Date.now()
            }
          ]
        };
        await figma.clientStorage.setAsync(
          CUSTOM_TEMPLATE_STORAGE_KEY,
          migrated
        );
        return migrated;
      }
    }
  }

  return { templates: [] };
};

const saveStoredTemplates = async (templates: StoredCustomTemplates) => {
  await figma.clientStorage.setAsync(
    CUSTOM_TEMPLATE_STORAGE_KEY,
    templates
  );
};

figma.ui.onmessage = async (message: UiMessage) => {
  if (message.type === 'LOAD_CUSTOM_TEMPLATE') {
    figma.ui.postMessage({
      type: 'CUSTOM_TEMPLATE_LOADED',
      templates: (await loadStoredTemplates()).templates
    } satisfies PluginMessage);
    return;
  }

  if (message.type === 'SAVE_CUSTOM_TEMPLATE') {
    const nameErrors = validateTemplateName(message.template.name);
    const { pages, errors } = validateTemplateLines(message.template.pages);
    const allErrors = [...nameErrors, ...errors];
    if (allErrors.length > 0) {
      figma.notify('Custom template is invalid.');
      figma.ui.postMessage({
        type: 'CUSTOM_TEMPLATE_SAVE_FAILED',
        errors: allErrors
      } satisfies PluginMessage);
      return;
    }

    const stored = await loadStoredTemplates();
    const normalizedName = normalizeTemplateName(message.template.name);
    const reservedNames = ['default', 'sectioned'];
    const lowerName = normalizedName.toLowerCase();
    const duplicate = stored.templates.find(
      (template) =>
        template.id !== message.template.id &&
        template.name.toLowerCase() === lowerName
    );
    if (reservedNames.includes(lowerName) || duplicate) {
      figma.ui.postMessage({
        type: 'CUSTOM_TEMPLATE_SAVE_FAILED',
        errors: ['Template name already exists.']
      } satisfies PluginMessage);
      return;
    }

    const existing = stored.templates.find(
      (template) => template.id === message.template.id
    );
    const isUpdate = Boolean(existing);
    if (
      !isUpdate &&
      stored.templates.length >= CUSTOM_TEMPLATE_LIMITS.maxTemplates
    ) {
      figma.ui.postMessage({
        type: 'CUSTOM_TEMPLATE_SAVE_FAILED',
        errors: [`You can save up to ${CUSTOM_TEMPLATE_LIMITS.maxTemplates} templates.`]
      } satisfies PluginMessage);
      return;
    }

    const templateId =
      message.template.id && isCustomTemplateId(message.template.id)
        ? message.template.id
        : createCustomTemplateId();

    const nextTemplate = {
      id: templateId,
      name: normalizedName,
      pages,
      updatedAt: Date.now()
    } satisfies StoredCustomTemplate;

    const nextTemplates = isUpdate
      ? stored.templates.map((template) =>
          template.id === templateId ? nextTemplate : template
        )
      : [...stored.templates, nextTemplate];

    await saveStoredTemplates({ templates: nextTemplates });
    figma.ui.postMessage({
      type: 'CUSTOM_TEMPLATE_SAVED',
      template: nextTemplate
    } satisfies PluginMessage);
    return;
  }

  if (message.type === 'DELETE_CUSTOM_TEMPLATE') {
    const stored = await loadStoredTemplates();
    const nextTemplates = stored.templates.filter(
      (template) => template.id !== message.templateId
    );
    await saveStoredTemplates({ templates: nextTemplates });
    figma.ui.postMessage({
      type: 'CUSTOM_TEMPLATE_DELETED',
      templateId: message.templateId
    } satisfies PluginMessage);
    return;
  }

  if (message.type === 'CREATE_PAGES') {
    let template = getTemplateById(message.templateId);
    if (!template) {
      const stored = await loadStoredTemplates();
      const custom = stored.templates.find(
        (item) => item.id === message.templateId
      );
      if (!custom) {
        figma.notify('Template not found.');
        return;
      }
      template = { id: custom.id, name: custom.name, pages: custom.pages };
    }
    if (!template) {
      figma.notify('Template not found.');
      return;
    }

    const options = message.options ?? {
      removeDividers: false,
      removeEmojis: false
    };
    const finalPages = transformPages(template.pages, options);
    createdPageIds = createPages(figma, finalPages);
    activeTemplateId = template.id;

    const response: PluginMessage = {
      type: 'CREATED_PAGES',
      createdIds: createdPageIds,
      templateId: template.id
    };
    figma.ui.postMessage(response);
    return;
  }

  if (message.type === 'UNDO_PAGES') {
    if (createdPageIds.length > 0) {
      undoPages(figma, createdPageIds);
    }
    createdPageIds = [];
    activeTemplateId = null;
    figma.ui.postMessage({ type: 'UNDO_COMPLETE' } satisfies PluginMessage);
    return;
  }

  if (message.type === 'CLOSE_PLUGIN') {
    figma.closePlugin();
  }
};
