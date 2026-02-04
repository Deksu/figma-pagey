import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TEMPLATES, Template } from './templates';
import './ui.css';
import logoUrl from '../images/logo-v2.svg';
import previewImgUrl from '../images/preview-img-v2.png';
import iconAddUrl from '../images/icon-add.svg';
import defaultSelectionImgUrl from '../images/default-selection-img.png';
import sectionedSelectionImgUrl from '../images/sectioned-selection-img.png';
import customSelectionImgUrl from '../images/custom-selection-img.png';
import { transformPages } from './transformPages';

type PluginMessage =
  | { type: 'CREATED_PAGES'; createdIds: string[]; templateId: string }
  | { type: 'UNDO_COMPLETE' };

type UiMessage =
  | {
      type: 'CREATE_PAGES';
      templateId: string;
      options: { removeDividers: boolean; removeEmojis: boolean };
    }
  | { type: 'UNDO_PAGES' }
  | { type: 'CLOSE_PLUGIN' };

type ViewState = 'select' | 'post-create' | 'confirm-undo';

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

  const selectedTemplate = useMemo<Template | undefined>(
    () => TEMPLATES.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId]
  );

  const selectionImages: Record<string, string> = useMemo(
    () => ({
      default: defaultSelectionImgUrl,
      sectioned: sectionedSelectionImgUrl,
      'selection-3': customSelectionImgUrl
    }),
    []
  );

  useEffect(() => {
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
          <div className="section grid">
            {TEMPLATES.map((template) => {
              const isDisabled = template.id === 'selection-3';
              return (
                <label
                  key={template.id}
                  className={`template-option ${
                    template.id === selectedTemplateId ? 'selected' : ''
                  } ${isDisabled ? 'disabled' : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={template.id === selectedTemplateId}
                    onChange={() =>
                      isDisabled ? undefined : setSelectedTemplateId(template.id)
                    }
                    disabled={isDisabled}
                  />
                  <div className="template-card">
                    <span className="radio-dot" aria-hidden="true" />
                    <img
                      className="preview-thumb"
                      src={selectionImages[template.id] ?? previewImgUrl}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
                  <div className="template-label">{template.name}</div>
                </label>
              );
            })}
          </div>

          <div className="section preview">
            <div className="preview-title">Template preview</div>
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
