import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TEMPLATES, Template, getCustomTemplate } from './templates';
import './ui.css';
import logoUrl from '../images/logo-v2.svg';
import iconAddUrl from '../images/icon-add.svg';
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
      templates: {
        id: string;
        name: string;
        pages: string[];
        description?: string;
      }[];
    }
  | {
      type: 'CUSTOM_TEMPLATE_SAVED';
      template: { id: string; name: string; pages: string[]; description?: string };
    }
  | { type: 'CUSTOM_TEMPLATE_DELETED'; templateId: string }
  | { type: 'CUSTOM_TEMPLATE_SAVE_FAILED'; errors: string[] }
  | { type: 'UNDO_COMPLETE' };

type UiMessage =
  | {
      type: 'CREATE_PAGES';
      templateId: string;
      options: { removeDividers: boolean; removeEmojis: boolean };
      pagesOverride?: string[];
    }
  | { type: 'LOAD_CUSTOM_TEMPLATE' }
  | {
      type: 'SAVE_CUSTOM_TEMPLATE';
      template: { id?: string; name: string; pages: string[]; description?: string };
    }
  | { type: 'DELETE_CUSTOM_TEMPLATE'; templateId: string }
  | { type: 'UNDO_PAGES' }
  | { type: 'CLOSE_PLUGIN' };

type ViewState = 'select' | 'post-create' | 'confirm-undo' | 'edit-custom';

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
  const [isCreating, setIsCreating] = useState(false);
  const [customDescription, setCustomDescription] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [editingPreviewKey, setEditingPreviewKey] = useState<string | null>(
    null
  );
  const [editingPreviewValue, setEditingPreviewValue] = useState('');
  const [previewOverrides, setPreviewOverrides] = useState<
    Record<string, string>
  >({});
  const [previewAdditions, setPreviewAdditions] = useState<
    { key: string; label: string }[]
  >([]);
  const [previewOrder, setPreviewOrder] = useState<string[] | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const createTimeoutRef = React.useRef<number | null>(null);

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

  useEffect(() => {
    sendToPlugin({ type: 'LOAD_CUSTOM_TEMPLATE' });

    const handler = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginMessage | undefined;
      if (!message) return;

      if (message.type === 'CREATED_PAGES') {
        setCreatedCount(message.createdIds.length);
        setView('post-create');
        setToast(null);
        setIsCreating(false);
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
        setIsCreating(false);
      }

      if (message.type === 'CUSTOM_TEMPLATE_LOADED') {
        const loaded = message.templates.map((template) =>
          getCustomTemplate(
            template.id,
            template.name,
            template.pages,
            template.description
          )
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
            message.template.pages,
            message.template.description
          );
          return exists
            ? current.map((template) =>
                template.id === next.id ? next : template
              )
            : [...current, next];
        });
        setCustomInput(message.template.pages.join('\n'));
        setCustomName(message.template.name);
        setCustomDescription(message.template.description ?? '');
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

  useEffect(() => {
    return () => {
      if (createTimeoutRef.current) {
        window.clearTimeout(createTimeoutRef.current);
      }
    };
  }, []);

  const handleCreate = () => {
    if (!selectedTemplate) return;
    if (isCreating) return;
    const pagesOverride = orderedPreviewItems.map((item) => item.label);
    setIsCreating(true);
    if (createTimeoutRef.current) {
      window.clearTimeout(createTimeoutRef.current);
    }
    createTimeoutRef.current = window.setTimeout(() => {
      sendToPlugin({
        type: 'CREATE_PAGES',
        templateId: selectedTemplate.id,
        options: { removeDividers, removeEmojis },
        pagesOverride:
          hasPreviewOverrides || hasPreviewAdditions || previewOrder
            ? pagesOverride
            : undefined
      });
      createTimeoutRef.current = null;
    }, 650);
  };

  const handleClose = () => {
    sendToPlugin({ type: 'CLOSE_PLUGIN' });
  };

  const handleUndo = () => {
    sendToPlugin({ type: 'UNDO_PAGES' });
  };

  const reorderPreview = (fromKey: string, toKey: string) => {
    setPreviewOrder((current) => {
      const base = current ?? previewItems.map((item) => item.key);
      const fromIndex = base.indexOf(fromKey);
      const toIndex = base.indexOf(toKey);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return base;
      }
      const next = [...base];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    key: string
  ) => {
    event.dataTransfer.setData('text/plain', key);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingKey(key);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    key: string
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (draggingKey && draggingKey !== key) {
      reorderPreview(draggingKey, key);
    }
  };

  const handleDragEnd = () => {
    setDraggingKey(null);
  };

  const handleResetPreview = () => {
    setEditingPreviewKey(null);
    setEditingPreviewValue('');
    setPreviewOverrides({});
    setPreviewAdditions([]);
    setPreviewOrder(null);
  };

  const handleDeletePreviewItem = (key: string) => {
    setPreviewAdditions((current) => current.filter((item) => item.key !== key));
    setPreviewOverrides((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setPreviewOrder((current) => {
      const base = current ?? previewItems.map((item) => item.key);
      return base.filter((itemKey) => itemKey !== key);
    });
    if (editingPreviewKey === key) {
      setEditingPreviewKey(null);
      setEditingPreviewValue('');
    }
  };

  const handleAddPreviewItem = () => {
    const key = `add-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const label = 'New page';
    setPreviewAdditions((current) => [...current, { key, label }]);
    setEditingPreviewKey(key);
    setEditingPreviewValue(label);
  };

  const openCustomEditor = (template?: Template) => {
    setCustomErrors([]);
    setCustomNameError('');
    if (template) {
      setCustomInput(template.pages.join('\n'));
      setCustomName(template.name);
      setCustomDescription(template.description ?? '');
      setEditingTemplateId(template.id);
    } else {
      setCustomInput('');
      setCustomName('Custom');
      setCustomDescription('');
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
        pages,
        description: customDescription.trim() || undefined
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

  const previewPages = transformPages(selectedTemplate?.pages ?? [], {
    removeDividers,
    removeEmojis
  });

  const previewItems = useMemo(() => {
    const baseItems = previewPages.map((page, index) => {
      const key = `${page === '---' ? 'divider' : 'item'}-${index}`;
      return {
        key,
        type: page === '---' ? 'divider' : 'item',
        label: previewOverrides[key] ?? page,
        index,
        isAddition: false
      };
    });
    const additions = previewAdditions.map((item) => ({
      key: item.key,
      type: 'item' as const,
      label: item.label,
      index: null,
      isAddition: true
    }));
    return [...baseItems, ...additions];
  }, [previewPages, previewOverrides, previewAdditions]);
  const hasPreviewOverrides = Object.keys(previewOverrides).length > 0;
  const hasPreviewAdditions = previewAdditions.length > 0;
  const previewOrderKeys = useMemo(() => {
    if (previewOrder) {
      return previewOrder;
    }
    return previewItems.map((item) => item.key);
  }, [previewItems, previewOrder]);
  const orderedPreviewItems = useMemo(() => {
    const map = new Map(previewItems.map((item) => [item.key, item]));
    return previewOrderKeys
      .map((key) => map.get(key))
      .filter((item): item is (typeof previewItems)[number] => !!item);
  }, [previewItems, previewOrderKeys]);
  const showReset =
    (selectedTemplateId === 'default' || selectedTemplateId === 'sectioned') &&
    (hasPreviewOverrides || hasPreviewAdditions || !!previewOrder);

  useEffect(() => {
    setEditingPreviewKey(null);
    setEditingPreviewValue('');
    setPreviewOverrides({});
    setPreviewAdditions([]);
    setPreviewOrder(null);
  }, [selectedTemplateId, removeDividers, removeEmojis]);

  return (
    <div className="app-shell">

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

      {(view === 'select' ||
        view === 'post-create' ||
        view === 'confirm-undo') && (
        <div className="app-shell">
          <div className="panel-body">
            <div className="column">
              <div className="panel-brand">
                <img className="logo" src={logoUrl} alt="Pagey logo" />
                <div>
                  <div className="brand-name">Pagey</div>
                  <div className="brand-version">v{__PLUGIN_VERSION__}</div>
                </div>
              </div>
              <div className="section-title">Select template structure</div>
              <div className="template-list">
              {templates.map((template) => {
                const isCustomTemplate = !TEMPLATES.some(
                  (base) => base.id === template.id
                );
                const previewVariant = isCustomTemplate
                  ? 'custom'
                  : template.id;
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
                    <div
                      className={`preview-thumb preview-thumb-${previewVariant}`}
                      aria-hidden="true"
                    >
                      <span className="thumb-line" />
                      <span className="thumb-line" />
                      <span className="thumb-line" />
                    </div>
                    <div className="template-meta">
                      <div className="template-label">{template.name}</div>
                      <div className="template-subtitle">
                        {template.description}
                      </div>
                    </div>
                    <span className="radio-dot" aria-hidden="true" />
                  </div>
                </label>
              );
              })}
              {customTemplates.length < CUSTOM_TEMPLATE_LIMITS.maxTemplates && (
                <button
                  type="button"
                  className="template-option cta"
                  onClick={() => openCustomEditor()}
                >
                  <div className="template-card cta-card">
                    <div className="template-meta">
                      <div className="template-label">Create template</div>
                      <div className="template-subtitle">
                        Build your own set of pages.
                      </div>
                    </div>
                  </div>
                </button>
              )}
              </div>
            </div>
            <div className="column preview-pane">
              <div className="section-title">Live preview</div>
              <div className="toggle-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={removeDividers}
                    onChange={(event) => setRemoveDividers(event.target.checked)}
                  />
                  <span className="checkbox-box" aria-hidden="true" />
                  <span className="checkbox-label">Hide dividers</span>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={removeEmojis}
                    onChange={(event) => setRemoveEmojis(event.target.checked)}
                  />
                  <span className="checkbox-box" aria-hidden="true" />
                  <span className="checkbox-label">Hide emojis</span>
                </label>
                {showReset && (
                  <button
                    type="button"
                    className="reset-button"
                    onClick={handleResetPreview}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="preview">
                <div className="preview-header">
                  <div className="preview-title">Pages</div>
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
                  {orderedPreviewItems.map((item) =>
                    item.type === 'divider' ? (
                      <div
                        key={`${selectedTemplate?.id ?? 'template'}-${item.key}`}
                        className="preview-divider-row"
                        draggable
                        onDragStart={(event) => handleDragStart(event, item.key)}
                        onDragOver={(event) => handleDragOver(event, item.key)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="preview-divider" />
                      </div>
                    ) : (
                      <div
                        key={`${selectedTemplate?.id ?? 'template'}-${item.key}`}
                        className={`preview-item ${
                          editingPreviewKey === item.key ? 'is-editing' : ''
                        }`}
                        draggable
                        onDragStart={(event) => handleDragStart(event, item.key)}
                        onDragOver={(event) => handleDragOver(event, item.key)}
                        onDragEnd={handleDragEnd}
                      >
                        {editingPreviewKey === item.key ? (
                          <>
                            <input
                              className="preview-input"
                              value={editingPreviewValue}
                              onChange={(event) =>
                                setEditingPreviewValue(event.target.value)
                              }
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  const trimmed = editingPreviewValue.trim();
                                  const nextValue = trimmed.length
                                    ? trimmed
                                    : item.label;
                                  if (item.isAddition) {
                                    setPreviewAdditions((current) =>
                                      current.map((entry) =>
                                        entry.key === item.key
                                          ? { ...entry, label: nextValue }
                                          : entry
                                      )
                                    );
                                  } else {
                                    setPreviewOverrides((current) => ({
                                      ...current,
                                      [item.key]: nextValue
                                    }));
                                  }
                                  setEditingPreviewKey(null);
                                  setEditingPreviewValue('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="preview-edit is-delete"
                              aria-label="Delete"
                              onClick={() => handleDeletePreviewItem(item.key)}
                            >
                              <svg
                                className="icon-trash"
                                viewBox="0 0 16 16"
                                aria-hidden="true"
                              >
                                <path
                                  d="M3.5 4.5h9M6.2 4.5V3.4h3.6v1.1M6.1 6.2v5.1M9.9 6.2v5.1M4.8 4.5l.5 8.5h5.4l.5-8.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="preview-edit is-save"
                              aria-label="Save"
                              onClick={() => {
                                const trimmed = editingPreviewValue.trim();
                                const nextValue = trimmed.length
                                  ? trimmed
                                  : item.label;
                                if (item.isAddition) {
                                  setPreviewAdditions((current) =>
                                    current.map((entry) =>
                                      entry.key === item.key
                                        ? { ...entry, label: nextValue }
                                        : entry
                                    )
                                  );
                                } else {
                                  setPreviewOverrides((current) => ({
                                    ...current,
                                    [item.key]: nextValue
                                  }));
                                }
                                setEditingPreviewKey(null);
                                setEditingPreviewValue('');
                              }}
                            >
                              <svg
                                className="icon-check"
                                viewBox="0 0 16 16"
                                aria-hidden="true"
                              >
                                <path
                                  d="M3.2 8.6l2.6 2.6 6-6"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="preview-text">{item.label}</span>
                            <button
                              type="button"
                              className="preview-edit"
                              aria-label="Edit"
                              onClick={() => {
                                setEditingPreviewKey(item.key);
                                setEditingPreviewValue(item.label);
                              }}
                            >
                              <svg
                                className="icon-edit"
                                viewBox="0 0 16 16"
                                aria-hidden="true"
                              >
                                <path
                                  d="M10.9 2.4l2.7 2.7-7.2 7.2-3.1.4.4-3.1 7.2-7.2z"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    className="preview-add"
                    onClick={handleAddPreviewItem}
                  >
                    <span className="preview-add-icon" aria-hidden="true">
                      +
                    </span>
                    Add page
                  </button>
                </div>
              </div>
              <div className="preview-footer-note">Made with love and vibes</div>
            </div>
          </div>

          <div className="panel-footer">
            {view === 'select' && (
              <>
                <button className="button ghost" onClick={handleClose}>
                  Close plugin
                </button>
                <button
                  className="button primary"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating pages...' : 'Create pages'}
                  <span className="button-icon" aria-hidden="true">
                    {isCreating ? (
                      <span className="spinner" />
                    ) : (
                      <img src={iconAddUrl} alt="" />
                    )}
                  </span>
                </button>
              </>
            )}
            {view === 'post-create' && (
              <>
                <div className="footer-message">
                  {createdCount} pages created. Verify everything is OK.
                </div>
                <div className="footer-actions">
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
              </>
            )}
            {view === 'confirm-undo' && (
              <>
                <div className="footer-message">
                  This will delete the pages created by this plugin run.
                </div>
                <div className="footer-actions">
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
              </>
            )}
          </div>
        </div>
      )}

      {view === 'edit-custom' && (
        <div className="app-shell custom-editor">
          <div className="panel-header">
            <div className="panel-brand">
              <img className="logo" src={logoUrl} alt="Pagey logo" />
              <div>
                <div className="brand-name">Pagey</div>
                <div className="brand-version">v{__PLUGIN_VERSION__}</div>
              </div>
            </div>
          </div>
          <div className="panel-body single-column">
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
            <label className="custom-input">
              <span className="custom-label">Description (optional)</span>
              <input
                className="custom-name"
                type="text"
                value={customDescription}
                maxLength={80}
                onChange={(event) => setCustomDescription(event.target.value)}
                placeholder="Short description for the template"
              />
              <span className="custom-meta">Max 80 characters</span>
            </label>
            <div className="custom-hint">
              One line per page. Use <code>---</code> for dividers.
            </div>
            <textarea
              className={`custom-textarea ${
                customErrors.length > 0 ? 'error' : ''
              }`}
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
          <div className="panel-footer">
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

    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
