import { useState } from 'react';
import { renderMarkdown } from '../lib/markdown.js';
import { extractVariables } from '../lib/template.js';
import { promptToMarkdown } from '../lib/prompt.js';
import { copyText, formatDate } from '../lib/browser.js';

/** Single prompt view: preview, metadata, actions and version history. */
export default function PromptDetail({ prompt, onUse, onToggleFavorite, onDuplicate, onDelete, onRestore, notify }) {
  const [raw, setRaw] = useState(false);

  if (!prompt) {
    return (
      <section>
        <h1>Prompt not found</h1>
        <p>
          It may have been deleted. <a href="#/">Back to all prompts</a>
        </p>
      </section>
    );
  }

  const vars = extractVariables(prompt.body);
  const copyMd = async () => {
    const ok = await copyText(promptToMarkdown(prompt));
    notify(ok ? 'Copied as Markdown' : 'Copy failed');
  };

  return (
    <article className="detail" aria-labelledby="detail-title">
      <p className="small">
        <a href="#/">← All prompts</a>
      </p>
      <div className="detail-head">
        <h1 id="detail-title">{prompt.title}</h1>
        <button
          type="button"
          className="icon-btn star big"
          aria-pressed={prompt.favorite}
          aria-label={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={() => onToggleFavorite(prompt)}
        >
          <span aria-hidden="true">{prompt.favorite ? '★' : '☆'}</span>
        </button>
      </div>
      <div className="row-meta">
        {prompt.category && (
          <a className="badge" href={`#/category/${encodeURIComponent(prompt.category)}`}>
            {prompt.category}
          </a>
        )}
        {prompt.tags.map((t) => (
          <span key={t} className="tag">
            #{t}
          </span>
        ))}
        {prompt.model && <span className="small muted">Target model: {prompt.model}</span>}
      </div>

      <div className="actions start wrap">
        <button type="button" className="btn primary" onClick={() => onUse(prompt)}>
          {vars.length ? 'Use (fill variables)…' : 'Copy prompt'}
        </button>
        <button type="button" className="btn" onClick={() => onUse(prompt, true)}>
          Run with AI…
        </button>
        <a className="btn" href={`#/edit/${encodeURIComponent(prompt.id)}`}>
          Edit
        </a>
        <button type="button" className="btn" onClick={() => onDuplicate(prompt)}>
          Duplicate
        </button>
        <button type="button" className="btn" onClick={copyMd}>
          Copy as Markdown
        </button>
        <button type="button" className="btn danger" onClick={() => onDelete(prompt)}>
          Delete
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Prompt</h2>
          <button type="button" className="link-btn" aria-pressed={raw} onClick={() => setRaw((r) => !r)}>
            {raw ? 'Show preview' : 'Show raw text'}
          </button>
        </div>
        {raw ? (
          <pre className="raw">{prompt.body}</pre>
        ) : (
          // Safe: renderMarkdown escapes all HTML before applying formatting.
          <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(prompt.body) }} />
        )}
        {vars.length > 0 && (
          <p className="small muted">
            Variables: {vars.map((v) => `{{${v}}}`).join(', ')}
          </p>
        )}
      </div>

      {prompt.notes?.trim() && (
        <div className="panel">
          <h2>Notes</h2>
          <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(prompt.notes) }} />
        </div>
      )}

      <dl className="stats">
        <div>
          <dt>Created</dt>
          <dd>{formatDate(prompt.createdAt)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDate(prompt.updatedAt)}</dd>
        </div>
        <div>
          <dt>Used</dt>
          <dd>
            {prompt.usageCount} time{prompt.usageCount === 1 ? '' : 's'}
          </dd>
        </div>
        <div>
          <dt>Last used</dt>
          <dd>{formatDate(prompt.lastUsedAt)}</dd>
        </div>
      </dl>

      <section className="panel" aria-labelledby="history-title">
        <h2 id="history-title">Version history</h2>
        {prompt.history?.length ? (
          <ol className="history">
            {prompt.history.map((h, i) => (
              <li key={`${h.savedAt}-${i}`}>
                <details>
                  <summary>
                    <strong>{h.title}</strong> <span className="small muted">— saved {formatDate(h.savedAt)}</span>
                  </summary>
                  <pre className="raw">{h.body}</pre>
                  <p className="small muted">
                    {h.category && <>Category: {h.category}. </>}
                    {h.tags?.length > 0 && <>Tags: {h.tags.join(', ')}.</>}
                  </p>
                </details>
                <button type="button" className="btn small" onClick={() => onRestore(prompt, i)}>
                  Restore
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="small muted">No earlier versions yet. The last 10 edits are kept here.</p>
        )}
      </section>
    </article>
  );
}
