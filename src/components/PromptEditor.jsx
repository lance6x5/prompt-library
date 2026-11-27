import { useId, useState } from 'react';
import { renderMarkdown } from '../lib/markdown.js';
import { extractVariables } from '../lib/template.js';

/** Create / edit form with a Markdown preview toggle. */
export default function PromptEditor({ prompt, notFound, categories, allTags, onSave, onCancel }) {
  const uid = useId();
  const [form, setForm] = useState(() => ({
    title: prompt?.title ?? '',
    body: prompt?.body ?? '',
    tags: (prompt?.tags ?? []).join(', '),
    category: prompt?.category ?? '',
    model: prompt?.model ?? '',
    notes: prompt?.notes ?? '',
    favorite: prompt?.favorite ?? false,
  }));
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  if (notFound) {
    return (
      <section>
        <h1>Prompt not found</h1>
        <p>
          <a href="#/">Back to all prompts</a>
        </p>
      </section>
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const vars = extractVariables(form.body);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Please give the prompt a title.');
    if (!form.body.trim()) return setError('The prompt body cannot be empty.');
    setError('');
    onSave({ ...form, tags: form.tags.split(',') });
  };

  return (
    <section aria-labelledby={`${uid}-h`}>
      <h1 id={`${uid}-h`}>{prompt ? 'Edit prompt' : 'New prompt'}</h1>
      <form className="editor" onSubmit={submit} noValidate>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor={`${uid}-title`}>Title</label>
          <input id={`${uid}-title`} value={form.title} onChange={set('title')} required autoFocus maxLength={200} />
        </div>

        <div className="field">
          <div className="field-head">
            <label htmlFor={`${uid}-body`}>Prompt</label>
            <div className="segmented-btns" role="group" aria-label="Editor mode">
              <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>
                Write
              </button>
              <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>
                Preview
              </button>
            </div>
          </div>
          {preview ? (
            <div
              className="markdown preview-box"
              aria-live="polite"
              // Safe: renderMarkdown escapes HTML first.
              dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body) || '<p><em>Nothing to preview.</em></p>' }}
            />
          ) : (
            <textarea
              id={`${uid}-body`}
              value={form.body}
              onChange={set('body')}
              rows={12}
              required
              aria-describedby={`${uid}-body-help`}
              spellCheck="true"
            />
          )}
          <p id={`${uid}-body-help`} className="small muted">
            Markdown supported (headings, lists, **bold**, *italic*, `code`, code blocks, links). Add template variables like{' '}
            <code>{'{{topic}}'}</code>.
            {vars.length > 0 && <> Detected: {vars.map((v) => `{{${v}}}`).join(', ')}.</>}
          </p>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor={`${uid}-tags`}>Tags</label>
            <input
              id={`${uid}-tags`}
              value={form.tags}
              onChange={set('tags')}
              list={`${uid}-taglist`}
              aria-describedby={`${uid}-tags-help`}
              autoComplete="off"
            />
            <datalist id={`${uid}-taglist`}>
              {allTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <p id={`${uid}-tags-help`} className="small muted">
              Comma-separated, e.g. writing, email
            </p>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-cat`}>Category</label>
            <input id={`${uid}-cat`} value={form.category} onChange={set('category')} list={`${uid}-catlist`} autoComplete="off" />
            <datalist id={`${uid}-catlist`}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-model`}>Target model</label>
            <input
              id={`${uid}-model`}
              value={form.model}
              onChange={set('model')}
              placeholder="e.g. claude-sonnet-5-5"
              autoComplete="off"
            />
          </div>
          <div className="field checkbox-field">
            <label>
              <input type="checkbox" checked={form.favorite} onChange={set('favorite')} /> Favorite
            </label>
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${uid}-notes`}>Notes</label>
          <textarea id={`${uid}-notes`} value={form.notes} onChange={set('notes')} rows={4} />
        </div>

        <div className="actions start">
          <button type="submit" className="btn primary">
            Save
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
