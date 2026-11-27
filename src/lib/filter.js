/**
 * View + tag filtering. `view` is one of:
 *   { type: 'all' } | { type: 'favorites' } | { type: 'recent' } | { type: 'examples' } | { type: 'category', name }
 */
export const RECENT_LIMIT = 20;
export const EXAMPLE_TAG = 'example';

export function filterByTags(prompts, tags = [], mode = 'and') {
  if (!tags.length) return prompts;
  return prompts.filter((p) => {
    const pt = p.tags || [];
    return mode === 'or' ? tags.some((t) => pt.includes(t)) : tags.every((t) => pt.includes(t));
  });
}

export function filterByView(prompts, view = { type: 'all' }) {
  switch (view.type) {
    case 'favorites':
      return prompts.filter((p) => p.favorite);
    case 'recent':
      return prompts
        .filter((p) => p.lastUsedAt)
        .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
        .slice(0, RECENT_LIMIT);
    case 'examples':
      return prompts.filter((p) => (p.tags || []).includes(EXAMPLE_TAG));
    case 'category':
      return prompts.filter((p) => (p.category || '') === (view.name || ''));
    default:
      return prompts;
  }
}

export function sortPrompts(prompts, sort = 'updated') {
  const list = [...prompts];
  switch (sort) {
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'usage':
      return list.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    case 'created':
      return list.sort((a, b) => b.createdAt - a.createdAt);
    default:
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

/** Distinct, sorted, non-empty categories. */
export function categories(prompts) {
  return [...new Set(prompts.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
