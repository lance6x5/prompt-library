import { useId, useMemo, useRef, useState } from 'react';
import { buildExport, parseImport, analyzeImport, resolveImport, SCHEMA_VERSION } from '../lib/schema.js';
import { filterByTags } from '../lib/filter.js';
import { downloadJson, readFileText } from '../lib/browser.js';

const stamp = () => new Date().toISOString().slice(0, 10);

/** Export (all or filtered), import with duplicate handling, and reset. */
export default function DataPage({ prompts, categories, allTags, version, onImport, onReset, notify }) {
  const uid = useId();
  const fileRef = useRef(null);

  // ---- Export selection ----
  const [favOnly, setFavOnly] = useState(false);
  const [cat, setCat] = useState('*');
  const [tags, setTags] = useState([]);
  const [tagMode, setTagMode] = useState('or');
  const selection = useMemo(() => {
    let list = prompts;
    if (favOnly) list = list.filter((p) => p.favorite);
    if (cat !== '*') list = list.filter((p) => (p.category || '') === cat);
    return filterByTags(list, tags, tagMode);
  }, [prompts, favOnly, cat, tags, tagMode]);

  // ---- Import state ----
  const [pending, setPending] = useState(null); // { name, incoming, fresh, duplicates }
  const [strategy, setStrategy] = useState('skip');
  const [importError, setImportError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    try {
      const data = JSON.parse(await readFileText(file));
      const incoming = parseImport(data);
      if (!incoming.length) throw new Error('No prompts found in this file.');
      setPending({ name: file.name, incoming, ...analyzeImport(prompts, incoming) });
      setStrategy('skip');
    } catch (err) {
      setPending(null);
      setImportError(err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message);
    }
  };

  const confirmImport = async () => {
    const { toPut, added, overwritten, skipped } = resolveImport(prompts, pending.incoming, strategy);
    await onImport(toPut);
    setPending(null);
    notify(`Imported: ${added} added, ${overwritten} overwritten, ${skipped} skipped`);
  };

  return (
    <section aria-labelledby={`${uid}-h`}>
      <h1 id={`${uid}-h`}>Import / Export</h1>

      <div className="panel">
        <h2>Export</h2>
        <p className="small muted">
          Downloads a JSON file (format <code>promptvault.prompts</code>, schema version {SCHEMA_VERSION}). Nothing leaves
          your browser.
        </p>
        <div className="actions start">
          <button
            type="button"
            className="btn primary"
            disabled={!prompts.length}
            onClick={() => downloadJson(buildExport(prompts, version), `promptvault-all-${stamp()}.json`)}
          >
            Export all ({prompts.length})
          </button>
        </div>

        <fieldset className="export-filter">
          <legend>Or export a filtered selection</legend>
          <div className="grid-2">
            <div className="field">
              <label htmlFor={`${uid}-cat`}>Category</label>
              <select id={`${uid}-cat`} value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="*">Any category</option>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field checkbox-field">
              <label>
                <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} /> Favorites only
              </label>
            </div>
          </div>
          {allTags.length > 0 && (
            <div className="field">
              <span className="label">Tags</span>
              <div className="segmented" role="radiogroup" aria-label="Tag match mode">
                <label>
                  <input type="radio" name={`${uid}-tm`} checked={tagMode === 'or'} onChange={() => setTagMode('or')} />
                  <span>Any (OR)</span>
                </label>
                <label>
                  <input type="radio" name={`${uid}-tm`} checked={tagMode === 'and'} onChange={() => setTagMode('and')} />
                  <span>All (AND)</span>
                </label>
              </div>
              <ul className="tag-filter">
                {allTags.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      className="chip"
                      aria-pressed={tags.includes(t)}
                      onClick={() => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
                    >
                      #{t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            className="btn"
            disabled={!selection.length}
            onClick={() => downloadJson(buildExport(selection, version), `promptvault-selection-${stamp()}.json`)}
          >
            Export selection ({selection.length})
          </button>
        </fieldset>
      </div>

      <div className="panel">
        <h2>Import</h2>
        <p className="small muted">Import a Promptvault JSON export. You'll be asked how to handle duplicates.</p>
        <label htmlFor={`${uid}-file`} className="label">
          Choose a JSON file
        </label>
        <input
          id={`${uid}-file`}
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="file-input"
          onChange={onFile}
        />
        {importError && (
          <p className="error" role="alert">
            {importError}
          </p>
        )}
        {pending && (
          <div className="import-review" role="region" aria-label="Import review">
            <p>
              <strong>{pending.name}</strong>: {pending.incoming.length} prompt{pending.incoming.length === 1 ? '' : 's'} —{' '}
              {pending.fresh.length} new, {pending.duplicates.length} duplicate{pending.duplicates.length === 1 ? '' : 's'}.
            </p>
            {pending.duplicates.length > 0 && (
              <fieldset>
                <legend>Duplicates (same id, or same title and text)</legend>
                <ul className="small dup-list">
                  {pending.duplicates.slice(0, 8).map((d) => (
                    <li key={d.incoming.id}>{d.incoming.title}</li>
                  ))}
                  {pending.duplicates.length > 8 && <li>…and {pending.duplicates.length - 8} more</li>}
                </ul>
                {[
                  ['skip', 'Skip duplicates (keep my existing prompts)'],
                  ['overwrite', 'Overwrite existing with imported versions'],
                  ['keep-both', 'Keep both (imported copies get “(imported)” in the title)'],
                ].map(([value, label]) => (
                  <label key={value} className="radio-row">
                    <input
                      type="radio"
                      name={`${uid}-strategy`}
                      value={value}
                      checked={strategy === value}
                      onChange={() => setStrategy(value)}
                    />{' '}
                    {label}
                  </label>
                ))}
              </fieldset>
            )}
            <div className="actions start">
              <button type="button" className="btn primary" onClick={confirmImport}>
                Import
              </button>
              <button type="button" className="btn" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="panel danger-zone">
        <h2>Reset</h2>
        <p className="small">Delete all prompts, settings and any remembered API key from this browser.</p>
        <button type="button" className="btn danger" onClick={onReset}>
          Reset all data…
        </button>
      </div>
    </section>
  );
}
