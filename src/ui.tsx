import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TEMPLATES, Template, getCustomTemplate } from './templates';
import './ui.css';
import logoUrl from '../images/logo-v2.svg';
import previewImgUrl from '../images/preview-img-v2.png';
import iconAddUrl from '../images/icon-add.svg';
import defaultSelectionImgUrl from '../images/default-selection-img.png';
import sectionedSelectionImgUrl from '../images/sectioned-selection-img.png';
import customSelectionImgUrl from '../images/custom-selection-img.png';
import { transformPages } from './transformPages';
import {
  CUSTOM_TEMPLATE_LIMITS,
  createCustomTemplateId,
  normalizeTemplateName,
  parseTemplateInput,
  validateTemplateName
} from './customTemplate';

type PluginMessage =
  | { type: 'CREATED_PAGES'; createdIds: string[]; templateId: string }
  | {
      type: 'CUSTOM_TEMPLATE_LOADED';
      templates: { id: string; name: string; pages: string[] }[];
    }
  | {
      type: 'CUSTOM_TEMPLATE_SAVED';
      template: { id: string; name: string; pages: string[] };
    }
  | { type: 'CUSTOM_TEMPLATE_DELETED'; templateId: string }
  | { type: 'CUSTOM_TEMPLATE_SAVE_FAILED'; errors: string[] }
  | { type: 'UNDO_COMPLETE' };

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

type ViewState = 'select' | 'post-create' | 'confirm-undo' | 'edit-custom';

const CREATE_CUSTOM_CARD_ID = 'custom-create';

const sendToPlugin = (message: UiMessage) => {
  parent.postMessage({ pluginMessage: message }, '*');
};

const App = () => {
  const [view, setView] = useState<ViewState>('select');
  const [selectedTemplateId, setSelectedTemplateId] = useState('default');
  const [createdCount, setCreatedCount] = useState(0);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'success' | 'error';
    phase: 'entering' | 'visible' | 'leaving';
  } | null>(null);
  const [removeDividers, setRemoveDividers] = useState(false);
  const [removeEmojis, setRemoveEmojis] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customName, setCustomName] = useState('Custom');
  const [customNameError, setCustomNameError] = useState('');
  const [customErrors, setCustomErrors] = useState<string[]>([]);
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );

  const templates = useMemo(() => {
    return [...TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  const selectedCustomTemplate = useMemo(
    () =>
      customTemplates.find((template) => template.id === selectedTemplateId) ??
      null,
    [customTemplates, selectedTemplateId]
  );

  const selectedTemplate = useMemo<Template | undefined>(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates]
  );

  const selectionImages: Record<string, string> = useMemo(
    () => ({
      default: defaultSelectionImgUrl,
      sectioned: sectionedSelectionImgUrl,
      [CREATE_CUSTOM_CARD_ID]: customSelectionImgUrl
    }),
    []
  );

  useEffect(() => {
    sendToPlugin({ type: 'LOAD_CUSTOM_TEMPLATE' });

    const handler = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginMessage | undefined;
      if (!message) return;

      if (message.type === 'CREATED_PAGES') {
        setCreatedCount(message.createdIds.length);
        setView('post-create');
        setToast(null);
      }

      if (message.type === 'UNDO_COMPLETE') {
        setCreatedCount(0);
        setView('select');
        setToast({
          id: Date.now(),
          message: 'Pages deleted successfully',
          tone: 'success',
          phase: 'entering'
        });
      }

      if (message.type === 'CUSTOM_TEMPLATE_LOADED') {
        const loaded = message.templates.map((template) =>
          getCustomTemplate(template.id, template.name, template.pages)
        );
        setCustomTemplates(loaded);
      }

      if (message.type === 'CUSTOM_TEMPLATE_SAVED') {
        setCustomTemplates((current) => {
          const exists = current.find(
            (template) => template.id === message.template.id
          );
          const next = getCustomTemplate(
            message.template.id,
            message.template.name,
            message.template.pages
          );
          return exists
            ? current.map((template) =>
                template.id === next.id ? next : template
              )
            : [...current, next];
        });
        setCustomInput(message.template.pages.join('\n'));
        setCustomName(message.template.name);
        setEditingTemplateId(message.template.id);
        setCustomErrors([]);
        setCustomNameError('');
        setIsSavingCustom(false);
        setSelectedTemplateId(message.template.id);
        setView('select');
        setToast({
          id: Date.now(),
          message: 'Custom template saved',
          tone: 'success',
          phase: 'entering'
        });
      }

      if (message.type === 'CUSTOM_TEMPLATE_SAVE_FAILED') {
        setIsSavingCustom(false);
        const nameError = message.errors.find((error) =>
          error.toLowerCase().includes('name')
        );
        const otherErrors = message.errors.filter(
          (error) => error !== nameError
        );
        setCustomNameError(nameError ?? '');
        setCustomErrors(otherErrors);
        setToast({
          id: Date.now(),
          message: 'Custom template could not be saved',
          tone: 'error',
          phase: 'entering'
        });
      }

      if (message.type === 'CUSTOM_TEMPLATE_DELETED') {
        setCustomTemplates((current) =>
          current.filter((template) => template.id !== message.templateId)
        );
        setSelectedTemplateId((current) =>
          current === message.templateId ? 'default' : current
        );
        setToast({
          id: Date.now(),
          message: 'Template deleted',
          tone: 'success',
          phase: 'entering'
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const enterFrame = window.requestAnimationFrame(() => {
      setToast((current) =>
        current && current.id === toast.id
          ? { ...current, phase: 'visible' }
          : current
      );
    });
    const leaveTimeout = window.setTimeout(() => {
      setToast((current) =>
        current && current.id === toast.id
          ? { ...current, phase: 'leaving' }
          : current
      );
    }, 5400);
    const clearTimeout = window.setTimeout(() => {
      setToast((current) =>
        current && current.id === toast.id ? null : current
      );
    }, 6000);
    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(leaveTimeout);
      window.clearTimeout(clearTimeout);
    };
  }, [toast?.id]);

  const handleCreate = () => {
    if (!selectedTemplate) return;
    sendToPlugin({
      type: 'CREATE_PAGES',
      templateId: selectedTemplate.id,
      options: { removeDividers, removeEmojis }
    });
  };

  const handleClose = () => {
    sendToPlugin({ type: 'CLOSE_PLUGIN' });
  };

  const handleUndo = () => {
    sendToPlugin({ type: 'UNDO_PAGES' });
  };

  const openCustomEditor = (template?: Template) => {
    setCustomErrors([]);
    setCustomNameError('');
    if (template) {
      setCustomInput(template.pages.join('\n'));
      setCustomName(template.name);
      setEditingTemplateId(template.id);
    } else {
      setCustomInput('');
      setCustomName('Custom');
      setEditingTemplateId(null);
    }
    setView('edit-custom');
  };

  const handleSaveCustom = () => {
    const { pages, errors } = parseTemplateInput(customInput);
    const nameErrors = validateTemplateName(customName);
    const normalizedName = normalizeTemplateName(customName);
    const reservedNames = TEMPLATES.map((template) =>
      template.name.toLowerCase()
    );
    const duplicateName = customTemplates.find(
      (template) =>
        template.name.toLowerCase() === normalizedName.toLowerCase() &&
        template.id !== editingTemplateId
    );
    if (reservedNames.includes(normalizedName.toLowerCase()) || duplicateName) {
      nameErrors.push('Template name already exists.');
    }
    const hasLineErrors = errors.length > 0;
    const hasNameErrors = nameErrors.length > 0;
    setCustomErrors(hasLineErrors ? errors : []);
    if (hasNameErrors) {
      setCustomNameError(nameErrors[0]);
    } else {
      setCustomNameError('');
    }
    if (hasLineErrors || hasNameErrors) {
      return;
    }
    setIsSavingCustom(true);
    sendToPlugin({
      type: 'SAVE_CUSTOM_TEMPLATE',
      template: {
        id: editingTemplateId ?? createCustomTemplateId(),
        name: normalizedName,
        pages
      }
    });
  };

  const handleDeleteCustom = () => {
    if (!selectedCustomTemplate) return;
    const confirmed = window.confirm(
      `Delete "${selectedCustomTemplate.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    sendToPlugin({
      type: 'DELETE_CUSTOM_TEMPLATE',
      templateId: selectedCustomTemplate.id
    });
  };

  return (
    <div>
      <div className="brand">
        <img className="logo" src={logoUrl} alt="Pagey logo" />
        <div className="brand-name">Pagey</div>
      </div>

      {toast && (
        <div
          key={toast.id}
          className={`toast toast-${toast.tone} ${
            toast.phase === 'visible'
              ? 'is-visible'
              : toast.phase === 'leaving'
                ? 'is-leaving'
                : ''
          }`}
        >
          <div className="toast-text">{toast.message}</div>
        </div>
      )}

      {view === 'select' && (
        <div>
          <div className="section template-scroll">
            <div className="template-row">
              {templates.map((template) => {
                const isCustomTemplate = !TEMPLATES.some(
                  (base) => base.id === template.id
                );
                const previewSrc = isCustomTemplate
                  ? customSelectionImgUrl
                  : selectionImages[template.id] ?? previewImgUrl;
              return (
                <label
                  key={template.id}
                  className={`template-option ${
                    template.id === selectedTemplateId ? 'selected' : ''
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={template.id === selectedTemplateId}
                    onChange={() => setSelectedTemplateId(template.id)}
                  />
                  <div className="template-card">
                    <span className="radio-dot" aria-hidden="true" />
                    <img
                      className="preview-thumb"
                      src={previewSrc}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
                  <div className="template-label">{template.name}</div>
                </label>
              );
              })}
              {customTemplates.length < CUSTOM_TEMPLATE_LIMITS.maxTemplates && (
                <button
                  type="button"
                  className="template-option cta"
                  onClick={() => openCustomEditor()}
                >
                  <div className="template-card">
                    <span className="radio-dot" aria-hidden="true" />
                    <img
                      className="preview-thumb"
                      src={selectionImages[CREATE_CUSTOM_CARD_ID] ?? previewImgUrl}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
                  <div className="template-label">Create template</div>
                </button>
              )}
            </div>
          </div>

          <div className="section preview">
            <div className="preview-header">
              <div className="preview-title">Template preview</div>
              {selectedCustomTemplate && (
                <div className="preview-actions">
                  <button
                    className="button ghost small"
                    onClick={() => openCustomEditor(selectedCustomTemplate)}
                  >
                    Edit
                  </button>
                  <button
                    className="button danger small"
                    onClick={handleDeleteCustom}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="preview-list">
              {transformPages(selectedTemplate?.pages ?? [], {
                removeDividers,
                removeEmojis
              }).map((page, index) =>
                page === '---' ? (
                  <div
                    key={`${selectedTemplate?.id ?? 'template'}-divider-${index}`}
                    className="preview-divider"
                  />
                ) : (
                  <div
                    key={`${selectedTemplate?.id ?? 'template'}-item-${index}`}
                    className="preview-item"
                  >
                    {page}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="footer-row">
            <div className="checkbox-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={removeDividers}
                  onChange={(event) => setRemoveDividers(event.target.checked)}
                />
                <span className="checkbox-box" aria-hidden="true" />
                <span className="checkbox-label">Remove dividers</span>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={removeEmojis}
                  onChange={(event) => setRemoveEmojis(event.target.checked)}
                />
                <span className="checkbox-box" aria-hidden="true" />
                <span className="checkbox-label">Remove emojis</span>
              </label>
            </div>
            <button className="button primary" onClick={handleCreate}>
              Create pages
              <span className="button-icon" aria-hidden="true">
                <img src={iconAddUrl} alt="" />
              </span>
            </button>
          </div>

          <div className="footer-meta">
            <div className="footer-note">Made with love and vibes</div>
            <div className="footer-version">Version {__PLUGIN_VERSION__}</div>
          </div>
        </div>
      )}

      {view === 'edit-custom' && (
        <div className="custom-editor">
          <div className="section">
            <div className="preview-title">Custom template</div>
            <label className="custom-input">
              <span className="custom-label">Template name</span>
              <input
                className={`custom-name ${customNameError ? 'error' : ''}`}
                type="text"
                value={customName}
                maxLength={CUSTOM_TEMPLATE_LIMITS.maxNameLength}
                onChange={(event) => {
                  setCustomName(event.target.value);
                  if (customNameError) {
                    setCustomNameError('');
                  }
                }}
              />
              <span className="custom-meta">
                Max {CUSTOM_TEMPLATE_LIMITS.maxNameLength} characters
              </span>
              {customNameError && (
                <span className="custom-error-text">{customNameError}</span>
              )}
            </label>
            <div className="custom-hint">
              One line per page. Use <code>---</code> for dividers.
            </div>
            <textarea
              className="custom-textarea"
              value={customInput}
              onChange={(event) => {
                setCustomInput(event.target.value);
                if (customErrors.length > 0) {
                  setCustomErrors([]);
                }
              }}
              placeholder="Cover&#10;---&#10;Final views&#10;Master prototype"
              rows={12}
            />
            <div className="custom-meta">
              Min {CUSTOM_TEMPLATE_LIMITS.minLines} lines · Max{' '}
              {CUSTOM_TEMPLATE_LIMITS.maxLines} lines ·{' '}
              {CUSTOM_TEMPLATE_LIMITS.maxLineLength} chars per line
            </div>
            {customErrors.length > 0 && (
              <div className="custom-errors">
                {customErrors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}
          </div>
          <div className="footer-row action-row">
            <button
              className="button ghost"
              onClick={() => setView('select')}
              disabled={isSavingCustom}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={handleSaveCustom}
              disabled={isSavingCustom}
            >
              {isSavingCustom ? 'Saving...' : 'Save template'}
            </button>
          </div>
        </div>
      )}

      {view === 'post-create' && (
        <div className="centered-view">
          <div className="message">
            {createdCount} pages created. Verify everything is OK.
          </div>
          <div className="footer-row action-row">
            <button
              className="button ghost"
              onClick={() => setView('confirm-undo')}
            >
              Undo
            </button>
            <button className="button primary" onClick={handleClose}>
              All good, close
            </button>
          </div>
        </div>
      )}

      {view === 'confirm-undo' && (
        <div className="centered-view">
          <div className="message">
            This will delete the pages created by this plugin run.
          </div>
          <div className="footer-row action-row">
            <button
              className="button ghost"
              onClick={() => setView('post-create')}
            >
              Back
            </button>
            <button className="button danger" onClick={handleUndo}>
              Delete pages
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
