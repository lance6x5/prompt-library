import { filterByView } from '../lib/filter.js';

/** Navigation: views, categories, tag filters (AND/OR) and utility pages. */
export default function Sidebar({
  open,
  route,
  prompts,
  categories,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  tagMode,
  onTagMode,
}) {
  const isList = route.name === 'list';
  const v = route.view || {};
  const cur = (cond) => (cond ? 'page' : undefined);
  const favCount = prompts.filter((p) => p.favorite).length;
  const recentCount = prompts.filter((p) => p.lastUsedAt).length;
  const exampleCount = filterByView(prompts, { type: 'examples' }).length;

  return (
    <nav id="sidebar" className={`sidebar${open ? ' open' : ''}`} aria-label="Library">
      <ul className="nav-list">
        <li>
          <a href="#/" aria-current={cur(isList && v.type === 'all')}>
            All prompts <span className="count">{prompts.length}</span>
          </a>
        </li>
        <li>
          <a href="#/favorites" aria-current={cur(isList && v.type === 'favorites')}>
            Favorites <span className="count">{favCount}</span>
          </a>
        </li>
        <li>
          <a href="#/recent" aria-current={cur(isList && v.type === 'recent')}>
            Recently used <span className="count">{recentCount}</span>
          </a>
        </li>
        <li>
          <a href="#/examples" aria-current={cur(isList && v.type === 'examples')}>
            Browse examples <span className="count">{exampleCount}</span>
          </a>
        </li>
      </ul>

      <h2 className="nav-heading">Categories</h2>
      {categories.length ? (
        <ul className="nav-list">
          {categories.map((c) => (
            <li key={c}>
              <a
                href={`#/category/${encodeURIComponent(c)}`}
                aria-current={cur(isList && v.type === 'category' && v.name === c)}
              >
                {c} <span className="count">{prompts.filter((p) => p.category === c).length}</span>
              </a>
            </li>
          ))}
          <li>
            <a href="#/category/" aria-current={cur(isList && v.type === 'category' && v.name === '')}>
              <em>Uncategorized</em>
            </a>
          </li>
        </ul>
      ) : (
        <p className="small muted">No categories yet.</p>
      )}

      <div className="nav-heading-row">
        <h2 className="nav-heading" id="tag-filter-heading">
          Filter by tags
        </h2>
        {selectedTags.length > 0 && (
          <button type="button" className="link-btn small" onClick={onClearTags}>
            Clear
          </button>
        )}
      </div>
      <fieldset className="segmented" aria-label="Tag match mode">
        <legend className="visually-hidden">Tag match mode</legend>
        <label>
          <input type="radio" name="tagmode" checked={tagMode === 'and'} onChange={() => onTagMode('and')} />
          <span>All (AND)</span>
        </label>
        <label>
          <input type="radio" name="tagmode" checked={tagMode === 'or'} onChange={() => onTagMode('or')} />
          <span>Any (OR)</span>
        </label>
      </fieldset>
      {allTags.length ? (
        <ul className="tag-filter" aria-labelledby="tag-filter-heading">
          {allTags.map((t) => (
            <li key={t}>
              <button
                type="button"
                className="chip"
                aria-pressed={selectedTags.includes(t)}
                onClick={() => onToggleTag(t)}
              >
                #{t}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small muted">No tags yet.</p>
      )}

      <h2 className="nav-heading">Manage</h2>
      <ul className="nav-list">
        <li>
          <a href="#/tags" aria-current={cur(route.name === 'tags')}>
            Tags
          </a>
        </li>
        <li>
          <a href="#/data" aria-current={cur(route.name === 'data')}>
            Import / Export
          </a>
        </li>
        <li>
          <a href="#/settings" aria-current={cur(route.name === 'settings')}>
            Settings &amp; AI keys
          </a>
        </li>
        <li>
          <a href="#/about" aria-current={cur(route.name === 'about')}>
            About
          </a>
        </li>
      </ul>
    </nav>
  );
}
