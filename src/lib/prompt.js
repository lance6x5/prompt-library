import { newId } from './id.js';

export const HISTORY_LIMIT = 10;

/** Fields that are versioned in edit history. */
export const VERSIONED_FIELDS = ['title', 'body', 'tags', 'category', 'model', 'notes'];

/** Normalise a tag list: trimmed, lower-cased, unique, non-empty. */
export function normalizeTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags || '').split(',');
  const out = [];
  for (const t of list) {
    const v = String(t).trim().toLowerCase();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/** Create a complete prompt record from partial input. */
export function createPrompt(partial = {}, now = Date.now()) {
  return {
    id: partial.id || newId(),
    title: String(partial.title ?? '').trim() || 'Untitled prompt',
    body: String(partial.body ?? ''),
    tags: normalizeTags(partial.tags),
    category: String(partial.category ?? '').trim(),
    model: String(partial.model ?? '').trim(),
    notes: String(partial.notes ?? ''),
    favorite: Boolean(partial.favorite),
    createdAt: Number(partial.createdAt) || now,
    updatedAt: Number(partial.updatedAt) || now,
    usageCount: Math.max(0, Number(partial.usageCount) || 0),
    lastUsedAt: Number(partial.lastUsedAt) || null,
    history: Array.isArray(partial.history) ? partial.history.slice(0, HISTORY_LIMIT) : [],
  };
}

function snapshot(p, at) {
  const s = { savedAt: at };
  for (const f of VERSIONED_FIELDS) s[f] = Array.isArray(p[f]) ? [...p[f]] : p[f];
  return s;
}

function changed(a, b) {
  return VERSIONED_FIELDS.some((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f]));
}

/**
 * Apply edits to a prompt. If any versioned field changed, the previous
 * version is pushed to the front of history (max HISTORY_LIMIT entries).
 */
export function applyEdit(prompt, edits, now = Date.now()) {
  const next = { ...prompt, ...edits };
  if ('tags' in edits) next.tags = normalizeTags(edits.tags);
  if ('title' in edits) next.title = String(edits.title).trim() || 'Untitled prompt';
  if ('category' in edits) next.category = String(edits.category).trim();
  if (!changed(prompt, next)) return { ...next, history: prompt.history || [] };
  next.history = [snapshot(prompt, prompt.updatedAt || now), ...(prompt.history || [])].slice(0, HISTORY_LIMIT);
  next.updatedAt = now;
  return next;
}

/** Restore history entry `index`; the current version is kept in history. */
export function restoreVersion(prompt, index, now = Date.now()) {
  const entry = (prompt.history || [])[index];
  if (!entry) return prompt;
  const edits = {};
  for (const f of VERSIONED_FIELDS) edits[f] = entry[f];
  return applyEdit(prompt, edits, now);
}

/** Duplicate a prompt with a fresh id, reset stats and empty history. */
export function duplicatePrompt(prompt, now = Date.now()) {
  return createPrompt(
    {
      ...prompt,
      id: undefined,
      title: `${prompt.title} (copy)`,
      favorite: false,
      usageCount: 0,
      lastUsedAt: null,
      history: [],
      createdAt: now,
      updatedAt: now,
    },
    now
  );
}

/** Record a "use" (copy / run). */
export function markUsed(prompt, now = Date.now()) {
  return { ...prompt, usageCount: (prompt.usageCount || 0) + 1, lastUsedAt: now };
}

/** Serialise a single prompt as Markdown. */
export function promptToMarkdown(p) {
  const meta = [];
  if (p.category) meta.push(`**Category:** ${p.category}`);
  if (p.tags?.length) meta.push(`**Tags:** ${p.tags.join(', ')}`);
  if (p.model) meta.push(`**Model:** ${p.model}`);
  let md = `# ${p.title}\n\n`;
  if (meta.length) md += meta.join('  \n') + '\n\n';
  md += p.body.trim() + '\n';
  if (p.notes?.trim()) md += `\n## Notes\n\n${p.notes.trim()}\n`;
  return md;
}
