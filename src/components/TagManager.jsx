import { useId, useMemo, useState } from 'react';
import { tagCounts, renameTag, mergeTags, deleteTag, addTag, cleanTag } from '../lib/tags.js';

/** Create, rename, merge and delete tags across all prompts. */
export default function TagManager({ prompts, onApply, onFilter, confirm }) {
  const uid = useId();
  const counts = useMemo(() => tagCounts(prompts), [prompts]);
  const [editing, setEditing] = useState(null); // tag being renamed
  const [renameTo, setRenameTo] = useState('');
  const [mergeSel, setMergeSel] = useState([]);
  const [mergeTarget, setMergeTarget] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newFor, setNewFor] = useState([]);

  const doRename = (e) => {
    e.preventDefault();
    const to = cleanTag(renameTo);
    if (!to || to === editing) return setEditing(null);
    onApply(renameTag(prompts, editing, to), `Renamed #${editing} to #${to}`);
    setEditing(null);
  };

  const doMerge = (e) => {
    e.preventDefault();
    const target = cleanTag(mergeTarget);
    if (mergeSel.length < 2 || !target) return;
    onApply(mergeTags(prompts, mergeSel, target), `Merged ${mergeSel.length} tags into #${target}`);
    setMergeSel([]);
    setMergeTarget('');
  };

  const doCreate = (e) => {
    e.preventDefault();
    const t = cleanTag(newTag);
    if (!t || !newFor.length) return;
    onApply(addTag(prompts, t, newFor), `Added #${t}`);
    setNewTag('');
    setNewFor([]);
  };

  return (
    <section aria-labelledby={`${uid}-h`}>
      <h1 id={`${uid}-h`}>Tags</h1>

      {counts.length === 0 ? (
        <p className="muted">No tags yet. Create one below or add tags while editing a prompt.</p>
      ) : (
        <div className="panel">
          <h2>All tags</h2>
          <p className="small muted">Tick two or more tags to merge them.</p>
          <ul className="tag-table">
            {counts.map(({ tag, count }) => (
              <li key={tag}>
                <label className="merge-check">
                  <input
                    type="checkbox"
                    checked={mergeSel.includes(tag)}
                    onChange={(e) =>
                      setMergeSel((s) => (e.target.checked ? [...s, tag] : s.filter((x) => x !== tag)))
                    }
                  />
                  <span className="visually-hidden">Select #{tag} for merge</span>
                </label>
                {editing === tag ? (
                  <form className="inline-form" onSubmit={doRename}>
                    <label htmlFor={`${uid}-rn`} className="visually-hidden">
                      New name for #{tag}
                    </label>
                    <input
                      id={`${uid}-rn`}
                      value={renameTo}
                      onChange={(e) => setRenameTo(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                    />
                    <button type="submit" className="btn small primary">
                      Save
                    </button>
                    <button type="button" className="btn small" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <button type="button" className="link-btn tag-name" onClick={() => onFilter(tag)} title="Show prompts with this tag">
                      #{tag}
                    </button>
                    <span className="small muted">
                      {count} prompt{count === 1 ? '' : 's'}
                    </span>
                    <span className="tag-actions">
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                          setEditing(tag);
                          setRenameTo(tag);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="btn small danger"
                        onClick={() =>
                          confirm({
                            title: `Delete #${tag}?`,
                            message: `The tag will be removed from ${count} prompt${count === 1 ? '' : 's'}. The prompts themselves are kept.`,
                            confirmLabel: 'Delete tag',
                            danger: true,
                            onConfirm: () => onApply(deleteTag(prompts, tag), `Deleted #${tag}`),
                          })
                        }
                      >
                        Delete
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>

          <form className="inline-form" onSubmit={doMerge}>
            <label htmlFor={`${uid}-merge`}>Merge selected ({mergeSel.length}) into</label>
            <input
              id={`${uid}-merge`}
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              placeholder={mergeSel[0] || 'tag name'}
              autoComplete="off"
            />
            <button type="submit" className="btn" disabled={mergeSel.length < 2 || !mergeTarget.trim()}>
              Merge
            </button>
          </form>
        </div>
      )}

      <div className="panel">
        <h2>Create a tag</h2>
        <form onSubmit={doCreate}>
          <div className="field">
            <label htmlFor={`${uid}-new`}>Tag name</label>
            <input id={`${uid}-new`} value={newTag} onChange={(e) => setNewTag(e.target.value)} autoComplete="off" />
          </div>
          <fieldset className="pick-list">
            <legend>Apply it to</legend>
            {prompts.length === 0 && <p className="small muted">No prompts yet.</p>}
            {prompts.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={newFor.includes(p.id)}
                  onChange={(e) =>
                    setNewFor((s) => (e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)))
                  }
                />{' '}
                {p.title}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn primary" disabled={!newTag.trim() || !newFor.length}>
            Create tag
          </button>
        </form>
      </div>
    </section>
  );
}
