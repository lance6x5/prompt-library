/** Tag management helpers. All functions are pure and return new arrays. */

/** Count tag usage across prompts: [{ tag, count }] sorted by name. */
export function tagCounts(prompts) {
  const map = new Map();
  for (const p of prompts) for (const t of p.tags || []) map.set(t, (map.get(t) || 0) + 1);
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

/** Apply fn to every prompt's tags; unchanged prompts keep their identity. */
function mapTags(prompts, fn) {
  return prompts.map((p) => {
    const before = p.tags || [];
    const after = [...new Set(fn(before))];
    return JSON.stringify(after) === JSON.stringify(before) ? p : { ...p, tags: after };
  });
}

/** Normalise a new tag name the same way prompt tags are normalised. */
export function cleanTag(name) {
  return String(name ?? '').trim().toLowerCase();
}

/** Create a tag by adding it to the given prompt ids. */
export function addTag(prompts, tag, ids) {
  const t = cleanTag(tag);
  if (!t) return prompts;
  const set = new Set(ids);
  return prompts.map((p) =>
    set.has(p.id) && !(p.tags || []).includes(t) ? { ...p, tags: [...(p.tags || []), t] } : p
  );
}

export function renameTag(prompts, from, to) {
  const target = cleanTag(to);
  if (!target || target === from) return prompts;
  return mapTags(prompts, (tags) => tags.map((t) => (t === from ? target : t)));
}

/** Merge all `sources` tags into `target`. */
export function mergeTags(prompts, sources, target) {
  const tgt = cleanTag(target);
  if (!tgt) return prompts;
  const set = new Set(sources);
  return mapTags(prompts, (tags) => tags.map((t) => (set.has(t) ? tgt : t)));
}

export function deleteTag(prompts, tag) {
  return mapTags(prompts, (tags) => tags.filter((t) => t !== tag));
}

/** Return prompts whose object identity changed between two parallel lists. */
export function changedPrompts(before, after) {
  return after.filter((p, i) => p !== before[i]);
}
