import Fuse from 'fuse.js';

/** Fuzzy full-text search across title, body, tags and notes. */
export const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'tags', weight: 0.25 },
    { name: 'body', weight: 0.2 },
    { name: 'notes', weight: 0.15 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
};

export function createIndex(prompts) {
  return new Fuse(prompts, FUSE_OPTIONS);
}

/** Return prompts ranked by relevance; empty query returns input unchanged. */
export function searchPrompts(index, prompts, query) {
  const q = String(query || '').trim();
  if (!q) return prompts;
  return index.search(q).map((r) => r.item);
}
