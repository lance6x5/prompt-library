import { createPrompt } from './prompt.js';
import { newId } from './id.js';

/**
 * Export file format (schemaVersion 1):
 *
 * {
 *   "format": "promptvault.prompts",
 *   "schemaVersion": 1,
 *   "appVersion": "1.0.0",
 *   "exportedAt": "2026-01-01T00:00:00.000Z",
 *   "prompts": [
 *     {
 *       "id": "uuid", "title": "string", "body": "string",
 *       "tags": ["string"], "category": "string", "model": "string",
 *       "notes": "string", "favorite": false,
 *       "createdAt": 0, "updatedAt": 0,          // epoch milliseconds
 *       "usageCount": 0, "lastUsedAt": null,     // epoch ms or null
 *       "history": [ { "savedAt": 0, "title": "", "body": "", "tags": [],
 *                      "category": "", "model": "", "notes": "" } ]   // max 10
 *     }
 *   ]
 * }
 *
 * MAJOR app version bumps are reserved for breaking changes to this schema.
 */
export const EXPORT_FORMAT = 'promptvault.prompts';
export const SCHEMA_VERSION = 1;

export function buildExport(prompts, appVersion, now = new Date()) {
  return {
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion,
    exportedAt: now.toISOString(),
    prompts: prompts.map((p) => ({ ...p })),
  };
}

/**
 * Validate and normalise parsed JSON. Accepts a full export object or a bare
 * array of prompts. Throws an Error with a user-friendly message if invalid.
 */
export function parseImport(data) {
  let list;
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === 'object' && Array.isArray(data.prompts)) {
    if (data.format && data.format !== EXPORT_FORMAT) throw new Error('This file is not a Promptvault export.');
    if (Number(data.schemaVersion) > SCHEMA_VERSION) {
      throw new Error(`This file uses schema version ${data.schemaVersion}; this app supports up to ${SCHEMA_VERSION}. Please update the app.`);
    }
    list = data.prompts;
  } else throw new Error('Unrecognised file: expected a Promptvault export with a "prompts" array.');

  return list
    .filter((p) => p && typeof p === 'object' && (typeof p.body === 'string' || typeof p.title === 'string'))
    .map((p) => createPrompt(p));
}

const contentKey = (p) => `${p.title.trim().toLowerCase()}\u0001${p.body.trim()}`;

/** Find the existing prompt that an incoming prompt duplicates (same id, or same title + body). */
export function findDuplicate(existing, incoming) {
  return existing.find((e) => e.id === incoming.id) || existing.find((e) => contentKey(e) === contentKey(incoming)) || null;
}

/** Split incoming prompts into fresh ones and duplicates. */
export function analyzeImport(existing, incoming) {
  const fresh = [];
  const duplicates = [];
  for (const p of incoming) {
    const dup = findDuplicate(existing, p);
    if (dup) duplicates.push({ incoming: p, existing: dup });
    else fresh.push(p);
  }
  return { fresh, duplicates };
}

/**
 * Resolve an import. strategy: 'skip' | 'overwrite' | 'keep-both'.
 * Returns { toPut: Prompt[], added, overwritten, skipped }.
 */
export function resolveImport(existing, incoming, strategy = 'skip') {
  const { fresh, duplicates } = analyzeImport(existing, incoming);
  const usedIds = new Set(existing.map((p) => p.id));
  const toPut = [];
  for (const p of fresh) {
    const id = usedIds.has(p.id) ? newId() : p.id;
    usedIds.add(id);
    toPut.push({ ...p, id });
  }
  let overwritten = 0;
  let skipped = 0;
  let added = fresh.length;
  for (const { incoming: p, existing: e } of duplicates) {
    if (strategy === 'overwrite') {
      toPut.push({ ...p, id: e.id });
      overwritten++;
    } else if (strategy === 'keep-both') {
      const id = newId();
      usedIds.add(id);
      toPut.push({ ...p, id, title: `${p.title} (imported)` });
      added++;
    } else skipped++;
  }
  return { toPut, added, overwritten, skipped };
}
