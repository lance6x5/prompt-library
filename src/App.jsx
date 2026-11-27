import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as db from './lib/db.js';
import { seedPrompts } from './lib/seed.js';
import { createKeyStore } from './lib/keyStore.js';
import { loadSettings, saveSettings, clearSettings } from './lib/settings.js';
import { filterByTags, filterByView, sortPrompts, categories as getCategories } from './lib/filter.js';
import { createIndex, searchPrompts } from './lib/search.js';
import { applyEdit, createPrompt, duplicatePrompt, markUsed, restoreVersion } from './lib/prompt.js';
import { extractVariables } from './lib/template.js';
import { changedPrompts } from './lib/tags.js';
import { copyText, isEditable } from './lib/browser.js';
import { getVisitCount, formatVisits } from './lib/visits.js';
import { navigate } from './lib/router.js';
import { useRoute, useTheme } from './hooks.js';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import PromptList from './components/PromptList.jsx';
import PromptDetail from './components/PromptDetail.jsx';
import PromptEditor from './components/PromptEditor.jsx';
import UseDialog from './components/UseDialog.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import TagManager from './components/TagManager.jsx';
import DataPage from './components/DataPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import AboutPage from './components/AboutPage.jsx';

export const APP_VERSION = __APP_VERSION__;

const byUpdated = (list) => sortPrompts(list, 'updated');

export default function App() {
  const route = useRoute();
  const [prompts, setPrompts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettingsState] = useState(loadSettings);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [useTarget, setUseTarget] = useState(null); // { prompt, run }
  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [visits, setVisits] = useState(null);
  const [keyStore] = useState(() => createKeyStore());
  const [, setKeyVersion] = useState(0);
  const searchRef = useRef(null);
  const mainRef = useRef(null);
  const toastTimer = useRef(null);

  useTheme(settings.theme);

  // ---- Load from IndexedDB (seed on first run) ----
  useEffect(() => {
    let alive = true;
    (async () => {
      let list = await db.getAll();
      if (!list.length && !db.wasSeeded()) {
        list = seedPrompts();
        try {
          await db.putMany(list);
        } catch {
          /* keep seeds in memory */
        }
        db.markSeeded();
      }
      if (alive) {
        setPrompts(byUpdated(list.map((p) => createPrompt(p))));
        setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- Anonymous visit count (independent of prompts/settings/API key) ----
  useEffect(() => {
    let alive = true;
    getVisitCount().then((n) => {
      if (alive && n !== null) setVisits(n);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Close the mobile nav and move focus to main content on route change.
  useEffect(() => {
    setNavOpen(false);
    setSelectedIndex(0);
  }, [route.name, route.id, route.view?.type, route.view?.name]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettingsState((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // ---- Persistence helpers ----
  const persist = useCallback(
    async (list) => {
      if (!list.length) return;
      setPrompts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        for (const p of list) map.set(p.id, p);
        return byUpdated([...map.values()]);
      });
      try {
        await db.putMany(list);
      } catch (err) {
        notify(err.message);
      }
    },
    [notify]
  );

  const savePrompt = useCallback((p) => persist([p]), [persist]);

  const deletePrompt = useCallback(
    (p) => {
      setConfirmState({
        title: 'Delete prompt?',
        message: `"${p.title}" will be permanently deleted from this browser.`,
        confirmLabel: 'Delete',
        danger: true,
        onConfirm: async () => {
          setPrompts((prev) => prev.filter((x) => x.id !== p.id));
          try {
            await db.remove(p.id);
          } catch (err) {
            notify(err.message);
          }
          navigate('list');
          notify('Prompt deleted');
        },
      });
    },
    [notify]
  );

  const toggleFavorite = useCallback((p) => savePrompt({ ...p, favorite: !p.favorite }), [savePrompt]);

  const recordUse = useCallback(
    (p) => {
      // Re-read the latest copy so concurrent edits are not lost.
      setPrompts((prev) => {
        const cur = prev.find((x) => x.id === p.id) || p;
        const next = markUsed(cur);
        db.put(next).catch(() => {});
        return prev.map((x) => (x.id === p.id ? next : x));
      });
    },
    []
  );

  /** Copy a prompt; if it has variables, open the fill-in dialog instead. */
  const usePrompt = useCallback(
    async (p, run = false) => {
      if (run || extractVariables(p.body).length) {
        setUseTarget({ prompt: p, run });
        return;
      }
      const ok = await copyText(p.body);
      if (ok) {
        recordUse(p);
        notify(`Copied "${p.title}"`);
      } else notify('Copy failed - your browser blocked clipboard access.');
    },
    [notify, recordUse]
  );

  const applyBulk = useCallback(
    (nextList) => {
      const changed = changedPrompts(prompts, nextList).map((p) => ({ ...p, updatedAt: Date.now() }));
      persist(changed);
      return changed.length;
    },
    [prompts, persist]
  );

  const resetAll = useCallback(() => {
    setConfirmState({
      title: 'Reset all data?',
      message:
        'This permanently deletes every prompt, all settings and any remembered API key from this browser. Export first if you want a backup.',
      confirmLabel: 'Reset everything',
      danger: true,
      requireText: 'RESET',
      onConfirm: async () => {
        try {
          await db.clearAll();
        } catch (err) {
          notify(err.message);
        }
        clearSettings();
        keyStore.forget();
        setKeyVersion((v) => v + 1);
        db.markSeeded(true);
        setPrompts([]);
        setSettingsState(loadSettings());
        setSelectedTags([]);
        setQuery('');
        navigate('list');
        notify('All data reset');
      },
    });
  }, [keyStore, notify]);

  const addExamples = useCallback(() => {
    persist(seedPrompts());
    notify('Added 5 example prompts');
  }, [persist, notify]);

  // ---- Derived list for list views ----
  const index = useMemo(() => createIndex(prompts), [prompts]);
  const categories = useMemo(() => getCategories(prompts), [prompts]);
  const allTags = useMemo(() => [...new Set(prompts.flatMap((p) => p.tags))].sort(), [prompts]);

  const visible = useMemo(() => {
    if (route.name !== 'list') return [];
    let list = filterByView(prompts, route.view);
    list = filterByTags(list, selectedTags, settings.tagMode);
    if (query.trim()) {
      const allowed = new Set(list.map((p) => p.id));
      return searchPrompts(index, prompts, query).filter((p) => allowed.has(p.id));
    }
    return route.view.type === 'recent' ? list : sortPrompts(list, settings.sort);
  }, [route, prompts, selectedTags, settings.tagMode, settings.sort, query, index]);

  // Searching from any page jumps to the list.
  const onSearch = useCallback(
    (q) => {
      setQuery(q);
      setSelectedIndex(0);
      if (q && route.name !== 'list') navigate('list');
    },
    [route.name]
  );

  // ---- Global keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('dialog[open]')) return;
      const inSearch = e.target === searchRef.current;
      const editing = isEditable(e.target) && !inSearch;
      if (editing) return;

      if (inSearch && e.key === 'Escape') {
        if (query) onSearch('');
        else searchRef.current.blur();
        return;
      }
      if (!inSearch && e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (!inSearch && (e.key === 'n' || e.key === 'N') && !e.shiftKey) {
        e.preventDefault();
        navigate('new');
        return;
      }
      if (route.name !== 'list' || !visible.length) return;
      const onBody = inSearch || e.target === document.body || e.target === mainRef.current;
      if (e.key === 'ArrowDown' || (!inSearch && e.key === 'j')) {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, visible.length - 1));
      } else if (e.key === 'ArrowUp' || (!inSearch && e.key === 'k')) {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && onBody) {
        e.preventDefault();
        const p = visible[Math.min(selectedIndex, visible.length - 1)];
        if (p) usePrompt(p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route.name, visible, selectedIndex, usePrompt, query, onSearch]);

  // ---- Routing ----
  const current = route.id ? prompts.find((p) => p.id === route.id) : null;
  let content;
  if (!loaded) {
    content = <p className="muted">Loading your prompts…</p>;
  } else {
    switch (route.name) {
      case 'list':
        content = (
          <PromptList
            view={route.view}
            prompts={visible}
            total={prompts.length}
            query={query}
            selectedIndex={Math.min(selectedIndex, Math.max(visible.length - 1, 0))}
            onSelect={setSelectedIndex}
            sort={settings.sort}
            onSort={(sort) => updateSettings({ sort })}
            selectedTags={selectedTags}
            onClearFilters={() => {
              setSelectedTags([]);
              onSearch('');
            }}
            onUse={usePrompt}
            onToggleFavorite={toggleFavorite}
            onAddExamples={addExamples}
          />
        );
        break;
      case 'detail':
        content = (
          <PromptDetail
            prompt={current}
            onUse={usePrompt}
            onToggleFavorite={toggleFavorite}
            onDuplicate={(p) => {
              const copy = duplicatePrompt(p);
              savePrompt(copy);
              notify('Prompt duplicated');
              navigate('edit', copy.id);
            }}
            onDelete={deletePrompt}
            onRestore={(p, i) =>
              setConfirmState({
                title: 'Restore this version?',
                message: 'The current version will be kept in history, so you can switch back.',
                confirmLabel: 'Restore',
                onConfirm: () => {
                  savePrompt(restoreVersion(p, i));
                  notify('Version restored');
                },
              })
            }
            notify={notify}
          />
        );
        break;
      case 'edit':
      case 'new':
        content = (
          <PromptEditor
            key={route.id || 'new'}
            prompt={route.name === 'edit' ? current : null}
            notFound={route.name === 'edit' && !current}
            categories={categories}
            allTags={allTags}
            onSave={(form) => {
              const saved = current && route.name === 'edit' ? applyEdit(current, form) : createPrompt(form);
              savePrompt(saved);
              notify('Prompt saved');
              navigate('prompt', saved.id);
            }}
            onCancel={() => (current ? navigate('prompt', current.id) : navigate('list'))}
          />
        );
        break;
      case 'tags':
        content = (
          <TagManager
            prompts={prompts}
            onApply={(next, msg) => {
              const n = applyBulk(next);
              notify(`${msg} (${n} prompt${n === 1 ? '' : 's'} updated)`);
            }}
            onFilter={(tag) => {
              setSelectedTags([tag]);
              navigate('list');
            }}
            confirm={setConfirmState}
          />
        );
        break;
      case 'data':
        content = (
          <DataPage
            prompts={prompts}
            categories={categories}
            allTags={allTags}
            version={APP_VERSION}
            onImport={async (list) => {
              await persist(list);
            }}
            onReset={resetAll}
            notify={notify}
          />
        );
        break;
      case 'settings':
        content = (
          <SettingsPage
            settings={settings}
            onChange={updateSettings}
            keyStore={keyStore}
            onKeyChange={() => setKeyVersion((v) => v + 1)}
            notify={notify}
          />
        );
        break;
      case 'about':
        content = <AboutPage version={APP_VERSION} />;
        break;
      default:
        content = (
          <section>
            <h1>Page not found</h1>
            <p>
              <a href="#/">Back to all prompts</a>
            </p>
          </section>
        );
    }
  }

  return (
    <div className="app">
      <button type="button" className="skip-link" onClick={() => mainRef.current?.focus()}>
        Skip to content
      </button>
      <Header
        searchRef={searchRef}
        query={query}
        onSearch={onSearch}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((o) => !o)}
        version={APP_VERSION}
      />
      <div className="layout">
        <Sidebar
          open={navOpen}
          route={route}
          prompts={prompts}
          categories={categories}
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={(t) =>
            setSelectedTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
          }
          onClearTags={() => setSelectedTags([])}
          tagMode={settings.tagMode}
          onTagMode={(tagMode) => updateSettings({ tagMode })}
        />
        <main id="main" ref={mainRef} tabIndex={-1}>
          {content}
        </main>
      </div>
      <footer className="app-footer">
        <span>Promptvault v{APP_VERSION}</span>
        <span aria-hidden="true">·</span>
        <a href="#/about">About &amp; shortcuts</a>
        <span aria-hidden="true">·</span>
        <span>Your data stays in this browser.</span>
        <span className="visit-count" aria-live="polite" hidden={visits === null}>
          {visits !== null && (
            <>
              <span aria-hidden="true">· </span>
              {formatVisits(visits)} {visits === 1 ? 'visit' : 'visits'}
            </>
          )}
        </span>
      </footer>

      {useTarget && (
        <UseDialog
          prompt={prompts.find((p) => p.id === useTarget.prompt.id) || useTarget.prompt}
          startRun={useTarget.run}
          settings={settings}
          onSettingsChange={updateSettings}
          apiKey={keyStore.get()}
          onUsed={recordUse}
          notify={notify}
          onClose={() => setUseTarget(null)}
        />
      )}
      {confirmState && <ConfirmDialog {...confirmState} onClose={() => setConfirmState(null)} />}
      <div className="toast" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
