import { createPages, undoPages } from './createPages';
import { getTemplateById } from './templates';

type UiMessage =
  | { type: 'CREATE_PAGES'; templateId: string }
  | { type: 'UNDO_PAGES' }
  | { type: 'CLOSE_PLUGIN' };

type PluginMessage =
  | { type: 'CREATED_PAGES'; createdIds: string[]; templateId: string }
  | { type: 'UNDO_COMPLETE' };

const UI_WIDTH = 720;
const UI_HEIGHT = 760;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });

let createdPageIds: string[] = [];
let activeTemplateId: string | null = null;

figma.ui.onmessage = (message: UiMessage) => {
  if (message.type === 'CREATE_PAGES') {
    const template = getTemplateById(message.templateId);
    if (!template) {
      figma.notify('Template not found.');
      return;
    }

    createdPageIds = createPages(figma, template.pages);
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
