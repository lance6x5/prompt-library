/**
 * Anonymous visit counter via the open-source Abacus service
 * (https://github.com/JasonLovesDoggo/abacus). No signup, no key, no cookies.
 *
 * Deliberately independent from the BYOK / Anthropic code: it never sees the
 * API key, prompts or any other user data. The request carries no headers,
 * no query params, no credentials and no referrer.
 *
 * The first load per browser session calls /hit (increments); later loads call
 * /get. Dev hosts and Do Not Track / Global Privacy Control only read (/get).
 */
export const COUNTER_BASE = 'https://abacus.jasoncameron.dev';
export const COUNTER_KEY = 'lance6x5.github.io/prompt-library';
export const SESSION_FLAG = 'prompt-library:visit-counted';
const TIMEOUT_MS = 4000;

function isDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function optedOut(nav) {
  if (!nav) return false;
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

function readFlag(storage) {
  try {
    return storage?.getItem(SESSION_FLAG) === '1';
  } catch {
    return false;
  }
}

function writeFlag(storage) {
  try {
    storage?.setItem(SESSION_FLAG, '1');
  } catch {
    // Storage unavailable (private mode, disabled) - ignore.
  }
}

/** Format a count for display, e.g. 12345 -> "12,345". */
export function formatVisits(n, locale) {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

/**
 * Record (once per session) and/or read the visit count.
 * Resolves to a number, or null on any failure. Never throws.
 * @param {{ fetch?: Function, storage?: Storage, navigator?: object, hostname?: string, timeoutMs?: number }} [env]
 */
export async function getVisitCount(env = {}) {
  try {
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    const doFetch = env.fetch || g.fetch;
    if (typeof doFetch !== 'function') return null;
    let storage = env.storage;
    if (storage === undefined) {
      try {
        storage = g.sessionStorage;
      } catch {
        storage = null;
      }
    }
    const nav = env.navigator !== undefined ? env.navigator : g.navigator;
    const hostname = env.hostname !== undefined ? env.hostname : g.location?.hostname || '';
    if (nav && nav.onLine === false) return null;

    const canCount = !isDevHost(hostname) && !optedOut(nav) && !readFlag(storage);
    const url = `${COUNTER_BASE}/${canCount ? 'hit' : 'get'}/${COUNTER_KEY}`;

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), env.timeoutMs ?? TIMEOUT_MS) : null;
    let res;
    try {
      res = await doFetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        mode: 'cors',
        referrerPolicy: 'no-referrer',
        signal: controller?.signal,
      });
      if (!res || !res.ok) return null;
      const data = await res.json();
      const value = data && typeof data.value === 'number' && Number.isFinite(data.value) ? data.value : null;
      if (value === null) return null;
      if (canCount) writeFlag(storage);
      return value;
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
