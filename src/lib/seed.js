import { createPrompt } from './prompt.js';
import { findDuplicate } from './schema.js';
import { IMPORTED, ORIGINAL } from './seedLibrary.js';

/**
 * Versioned example prompts.
 *   v1 (1.0.0): the original 5 examples.
 *   v2 (1.3.0): +42 curated from awesome-chatgpt-prompts (CC0) and 15 originals.
 * Bump SEED_VERSION when adding a new set; existing users are then offered
 * only the prompts introduced after their stored version.
 */
export const SEED_VERSION = 2;
/** Every example carries this tag so "Browse examples" can find them. */
export const EXAMPLE_TAG = 'example';

const V1 = [
  {
    title: 'Summarize a document',
    category: 'Writing',
    tags: ['summary', 'writing'],
    model: 'claude-sonnet-5-5',
    favorite: true,
    body:
      'Summarize the following {{document_type}} for a **{{audience}}** audience.\n\n' +
      '- Keep it under {{word_limit}} words\n- Lead with the single most important point\n- End with 3 action items\n\n' +
      'Text:\n{{text}}',
    notes: 'Works well for meeting notes and long emails.',
  },
  {
    title: 'Code review checklist',
    category: 'Engineering',
    tags: ['code', 'review'],
    model: 'claude-opus-5-5',
    body:
      'You are a senior {{language}} engineer. Review the code below for:\n\n' +
      '1. Correctness and edge cases\n2. Security issues\n3. Readability and naming\n4. Test coverage gaps\n\n' +
      'Reply with a prioritized list. Quote the exact lines you refer to.\n\n```\n{{code}}\n```',
    notes: '',
  },
  {
    title: 'Explain like I am new to it',
    category: 'Learning',
    tags: ['learning', 'explain'],
    model: '',
    body:
      'Explain **{{topic}}** to someone who is new to it.\n\n' +
      'Use one everyday analogy, then give a short, precise definition, then one common misconception.',
    notes: 'Try with technical or finance topics.',
  },
  {
    title: 'Polite follow-up email',
    category: 'Writing',
    tags: ['email', 'writing'],
    model: 'claude-haiku-5-5',
    body:
      'Write a short, friendly follow-up email to {{recipient_name}} about {{subject}}.\n' +
      'Tone: {{tone}}. Mention that I last reached out on {{last_contact_date}}. Max 120 words.',
    notes: '',
  },
  {
    title: 'Brainstorm product names',
    category: 'Ideas',
    tags: ['brainstorm', 'naming'],
    model: '',
    body:
      'Brainstorm 15 names for a {{product_description}}.\n\n' +
      '> Constraints: easy to spell, available as a .com is a plus, no puns on competitors.\n\n' +
      'Group them by style (descriptive, abstract, playful) and star your top 3.',
    notes: 'Ask for a second round with "more like #N".',
  },
];

/** All seed definitions with the seed version that introduced them. */
export const SEED_DEFS = [
  ...V1.map((p) => ({ ...p, since: 1 })),
  ...IMPORTED.map((p) => ({ model: 'Any', ...p, since: 2, origin: 'imported' })),
  ...ORIGINAL.map((p) => ({ model: 'Any', ...p, since: 2, origin: 'original' })),
];

function build(defs, now) {
  const minute = 60000;
  // Older items get slightly older timestamps so "Recently edited" keeps a stable order.
  return defs.map(({ since: _since, origin: _origin, ...p }, i) =>
    createPrompt(
      {
        ...p,
        tags: [...p.tags, EXAMPLE_TAG],
        createdAt: now - (defs.length - i) * minute,
        updatedAt: now - (defs.length - i) * minute,
      },
      now
    )
  );
}

/** Every example prompt (fresh install, or re-adding after "Reset all data"). */
export function seedPrompts(now = Date.now()) {
  return build(SEED_DEFS, now);
}

/** Example prompts introduced after `sinceVersion`. */
export function seedPromptsSince(sinceVersion = 0, now = Date.now()) {
  return build(
    SEED_DEFS.filter((d) => d.since > sinceVersion),
    now
  );
}

/**
 * Examples to offer: introduced after `sinceVersion` and not already in the
 * library (same id, or same title + body - the import duplicate rule).
 * Never touches existing prompts.
 */
export function examplesToAdd(existing, sinceVersion = 0, now = Date.now()) {
  const out = [];
  for (const p of seedPromptsSince(sinceVersion, now)) {
    if (!findDuplicate(existing, p) && !findDuplicate(out, p)) out.push(p);
  }
  return out;
}

/**
 * Work out what to do with examples on load.
 *   storedVersion: number from storage, or null if never recorded
 *   seeded:        the v1.x "promptvault.seeded" flag
 * Returns { action: 'seed-all' | 'offer' | 'none', prompts, version, since }.
 *  - seed-all: brand-new install with an empty library -> add everything.
 *  - offer:    existing user with an older seed version -> show the banner.
 *  - none:     up to date (or nothing new after de-duplication).
 * `version` is the seed version to record now (null = leave unchanged until
 * the user answers the banner).
 */
export function planSeeds({ existing, storedVersion, seeded, now = Date.now() }) {
  const stored = Number.isFinite(Number(storedVersion)) && storedVersion !== null ? Number(storedVersion) : null;
  if (stored === null && !seeded && existing.length === 0) {
    return { action: 'seed-all', prompts: seedPrompts(now), version: SEED_VERSION };
  }
  // v1.x users (seeded flag, or prompts but no version) have seed set 1.
  const effective = stored ?? 1;
  if (effective >= SEED_VERSION) return { action: 'none', prompts: [], version: null };
  const prompts = examplesToAdd(existing, effective, now);
  if (!prompts.length) return { action: 'none', prompts: [], version: SEED_VERSION };
  return { action: 'offer', prompts, version: null, since: effective };
}

/** Counts for docs/tests. */
export const SEED_COUNTS = {
  v1: V1.length,
  imported: IMPORTED.length,
  original: ORIGINAL.length,
};
