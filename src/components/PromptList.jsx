import { useEffect, useRef } from 'react';
import { extractVariables } from '../lib/template.js';

const TITLES = {
  all: 'All prompts',
  favorites: 'Favorites',
  recent: 'Recently used',
};

function snippet(body) {
  const s = body.replace(/[#>*`_]/g, '').replace(/\s+/g, ' ').trim();
  return s.length > 160 ? s.slice(0, 159) + '…' : s;
}

/** List view with keyboard selection (↑/↓ or j/k, Enter copies). */
export default function PromptList({
  view,
  prompts,
  total,
  query,
  selectedIndex,
  onSelect,
  sort,
  onSort,
  selectedTags,
  onClearFilters,
  onUse,
  onToggleFavorite,
  onAddExamples,
}) {
  const listRef = useRef(null);
  const title = view.type === 'category' ? `Category: ${view.name || 'Uncategorized'}` : TITLES[view.type];
  const filtered = Boolean(query.trim()) || selectedTags.length > 0;

  // Keep the selected row visible.
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]');
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (total === 0) {
    return (
      <section className="empty">
        <h1>Your library is empty</h1>
        <p>Create your first prompt, import a JSON export, or add a few examples to explore.</p>
        <div className="actions start">
          <a className="btn primary" href="#/new">
            New prompt
          </a>
          <button type="button" className="btn" onClick={onAddExamples}>
            Add example prompts
          </button>
          <a className="btn" href="#/data">
            Import
          </a>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="list-title">
      <div className="list-head">
        <h1 id="list-title">
          {title} <span className="count">{prompts.length}</span>
        </h1>
        {view.type !== 'recent' && !query.trim() && (
          <label className="inline-field">
            <span>Sort</span>
            <select value={sort} onChange={(e) => onSort(e.target.value)}>
              <option value="updated">Recently edited</option>
              <option value="created">Newest</option>
              <option value="title">Title A–Z</option>
              <option value="usage">Most used</option>
            </select>
          </label>
        )}
      </div>
      {filtered && (
        <p className="filter-note">
          {query.trim() && (
            <>
              Matching “<strong>{query.trim()}</strong>”.{' '}
            </>
          )}
          {selectedTags.length > 0 && <>Tags: {selectedTags.map((t) => `#${t}`).join(', ')}. </>}
          <button type="button" className="link-btn" onClick={onClearFilters}>
            Clear filters
          </button>
        </p>
      )}
      <p className="hint small muted" id="list-hint">
        Shortcuts: <kbd>/</kbd> search · <kbd>↑</kbd>
        <kbd>↓</kbd> select · <kbd>Enter</kbd> copy · <kbd>n</kbd> new
      </p>

      {prompts.length === 0 ? (
        <p className="muted">
          {view.type === 'recent'
            ? 'Nothing used yet. Copy or run a prompt and it will show up here.'
            : view.type === 'favorites'
              ? 'No favorites yet. Star a prompt to pin it here.'
              : 'No prompts match.'}
        </p>
      ) : (
        <ul className="prompt-list" ref={listRef} aria-describedby="list-hint">
          {prompts.map((p, i) => {
            const selected = i === selectedIndex;
            const vars = extractVariables(p.body).length;
            return (
              <li
                key={p.id}
                className={`prompt-row${selected ? ' selected' : ''}`}
                data-selected={selected}
                onMouseEnter={() => onSelect(i)}
              >
                <div className="row-main">
                  <a href={`#/prompt/${encodeURIComponent(p.id)}`} className="row-title" onFocus={() => onSelect(i)}>
                    {p.title}
                    {selected && <span className="visually-hidden"> (selected)</span>}
                  </a>
                  <p className="row-snippet">{snippet(p.body) || <em>Empty prompt</em>}</p>
                  <div className="row-meta">
                    {p.category && <span className="badge">{p.category}</span>}
                    {p.tags.map((t) => (
                      <span key={t} className="tag">
                        #{t}
                      </span>
                    ))}
                    {vars > 0 && <span className="small muted">{vars} variable{vars === 1 ? '' : 's'}</span>}
                    {p.usageCount > 0 && <span className="small muted">used {p.usageCount}×</span>}
                  </div>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-btn star"
                    aria-pressed={p.favorite}
                    aria-label={p.favorite ? `Unfavorite ${p.title}` : `Favorite ${p.title}`}
                    onClick={() => onToggleFavorite(p)}
                  >
                    <span aria-hidden="true">{p.favorite ? '★' : '☆'}</span>
                  </button>
                  <button type="button" className="btn small" onClick={() => onUse(p)}>
                    {vars ? 'Use…' : 'Copy'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
