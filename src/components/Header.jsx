import FeedbackMenu from './FeedbackMenu.jsx';

const BASE = import.meta.env.BASE_URL;

/** App header: logo, search, new prompt, feedback, mobile nav toggle. */
export default function Header({ searchRef, query, onSearch, navOpen, onToggleNav, version }) {
  return (
    <header className="app-header">
      <button
        type="button"
        className="icon-btn nav-toggle"
        aria-expanded={navOpen}
        aria-controls="sidebar"
        onClick={onToggleNav}
      >
        <span aria-hidden="true">☰</span>
        <span className="visually-hidden">Menu</span>
      </button>
      <a href="#/" className="brand" aria-label="Promptvault home">
        <img src={`${BASE}logo.svg`} alt="" width="32" height="32" />
        <span className="brand-text">
          <span className="brand-name">Promptvault</span>
          <span className="brand-tagline">Your best prompts, kept and ready.</span>
        </span>
      </a>
      <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search-input" className="visually-hidden">
          Search prompts
        </label>
        <input
          id="search-input"
          ref={searchRef}
          type="search"
          placeholder="Search prompts  ( / )"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
      </form>
      <div className="header-actions">
        <a href="#/new" className="btn primary" title="New prompt (n)">
          <span aria-hidden="true">+</span> New
        </a>
        <FeedbackMenu version={version} />
      </div>
    </header>
  );
}
