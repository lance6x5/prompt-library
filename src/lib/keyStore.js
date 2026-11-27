/**
 * API key storage for the bring-your-own-key "Run with AI" feature.
 * One key slot per provider.
 *
 * Default: a key lives only in this module's memory and disappears when the
 * tab closes. Opt-in "Remember on this device" (per provider) copies it to
 * localStorage. Each key is only ever handed to its own provider, which
 * sends it only to that provider's API origin.
 */
const PREFIX = 'promptvault.key.';
/** Kept from v1.x so an already-remembered Anthropic key keeps working. */
export const KEY_STORAGE = 'promptvault.anthropicKey';

export function storageKeyFor(providerId) {
  return providerId === 'anthropic' ? KEY_STORAGE : PREFIX + providerId;
}

export function createKeyStore(storage = safeLocalStorage(), providerIds = ['anthropic', 'openai', 'gemini', 'openrouter']) {
  const slots = new Map(); // id -> { key, remembered }
  for (const id of providerIds) {
    let key = '';
    let remembered = false;
    try {
      const saved = storage?.getItem(storageKeyFor(id));
      if (saved) {
        key = saved;
        remembered = true;
      }
    } catch {
      /* storage unavailable */
    }
    slots.set(id, { key, remembered });
  }
  const slot = (id) => {
    if (!slots.has(id)) slots.set(id, { key: '', remembered: false });
    return slots.get(id);
  };

  const store = {
    get: (id) => slot(id).key,
    has: (id) => Boolean(slot(id).key),
    isRemembered: (id) => slot(id).remembered,
    /** Provider ids that currently have a key. */
    ids: () => [...slots.keys()].filter((id) => slots.get(id).key),
    /** Set a provider's key; persist only if remember === true. */
    set(id, key, remember = false) {
      const s = slot(id);
      s.key = String(key || '').trim();
      s.remembered = Boolean(remember) && Boolean(s.key);
      try {
        if (s.remembered) storage?.setItem(storageKeyFor(id), s.key);
        else storage?.removeItem(storageKeyFor(id));
      } catch {
        s.remembered = false;
      }
    },
    setRemember(id, remember) {
      store.set(id, slot(id).key, remember);
    },
    forget(id) {
      const s = slot(id);
      s.key = '';
      s.remembered = false;
      try {
        storage?.removeItem(storageKeyFor(id));
      } catch {
        /* ignore */
      }
    },
    forgetAll() {
      for (const id of slots.keys()) store.forget(id);
    },
  };
  return store;
}

/** Show only the last 4 characters of a key. */
export function maskKey(key) {
  const k = String(key || '');
  if (!k) return '';
  return '••••' + k.slice(-4);
}

function safeLocalStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}
