import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TEMPLATES, Template } from './templates';
import './ui.css';
import logoUrl from '../images/placeholder-logo.png';
import previewImgUrl from '../images/preview-img-v2.png';
import iconAddUrl from '../images/icon-add.svg';

type PluginMessage =
  | { type: 'CREATED_PAGES'; createdIds: string[]; templateId: string }
  | { type: 'UNDO_COMPLETE' };

type UiMessage =
  | { type: 'CREATE_PAGES'; templateId: string }
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
  const [status, setStatus] = useState<string | null>(null);

  const selectedTemplate = useMemo<Template | undefined>(
    () => TEMPLATES.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId]
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginMessage | undefined;
      if (!message) return;

      if (message.type === 'CREATED_PAGES') {
        setCreatedCount(message.createdIds.length);
        setView('post-create');
        setStatus(null);
      }

      if (message.type === 'UNDO_COMPLETE') {
        setCreatedCount(0);
        setView('select');
        setStatus('Pages deleted.');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleCreate = () => {
    if (!selectedTemplate) return;
    sendToPlugin({ type: 'CREATE_PAGES', templateId: selectedTemplate.id });
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
        <img className="logo" src={logoUrl} alt="Pager logo" />
        <div className="brand-name">Pager</div>
      </div>

      {view === 'select' && (
        <div>
          <div className="section grid">
            {TEMPLATES.map((template) => (
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
                    src={previewImgUrl}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className="template-label">{template.name}</div>
              </label>
            ))}
          </div>

          <div className="section preview">
            <div className="preview-title">Template preview</div>
            <div className="preview-list">
              {selectedTemplate?.pages.map((page, index) =>
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

          {status && <div className="status">{status}</div>}

          <div className="footer-row">
            <button className="button ghost" onClick={handleClose}>
              Close plugin
            </button>
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
        <div>
          <div className="message">
            {createdCount} pages created. Verify everything is OK.
          </div>
          <div className="footer-row">
            <button className="button primary" onClick={handleClose}>
              All good, close
            </button>
            <button
              className="button ghost"
              onClick={() => setView('confirm-undo')}
            >
              Undo…
            </button>
          </div>
        </div>
      )}

      {view === 'confirm-undo' && (
        <div>
          <div className="message">
            This will delete the pages created by this plugin run.
          </div>
          <div className="footer-row">
            <button className="button danger" onClick={handleUndo}>
              Delete pages
            </button>
            <button
              className="button ghost"
              onClick={() => setView('post-create')}
            >
              Back
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
