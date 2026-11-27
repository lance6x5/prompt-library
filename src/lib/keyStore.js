/**
 * API key storage for the bring-your-own-key "Run with AI" feature.
 *
 * Default: the key lives only in this module's memory and disappears when the
 * tab closes. Opt-in "Remember on this device" copies it to localStorage.
 * The key is never sent anywhere except api.anthropic.com.
 */
export const KEY_STORAGE = 'promptvault.anthropicKey';

export function createKeyStore(storage = safeLocalStorage()) {
  let memoryKey = '';
  let remembered = false;
  try {
    const saved = storage?.getItem(KEY_STORAGE);
    if (saved) {
      memoryKey = saved;
      remembered = true;
    }
  } catch {
    /* storage unavailable */
  }

  return {
    get: () => memoryKey,
    isRemembered: () => remembered,
    /** Set the key; persist only if remember === true. */
    set(key, remember = false) {
      memoryKey = String(key || '').trim();
      remembered = Boolean(remember) && Boolean(memoryKey);
      try {
        if (remembered) storage?.setItem(KEY_STORAGE, memoryKey);
        else storage?.removeItem(KEY_STORAGE);
      } catch {
        remembered = false;
      }
    },
    setRemember(remember) {
      this.set(memoryKey, remember);
    },
    forget() {
      memoryKey = '';
      remembered = false;
      try {
        storage?.removeItem(KEY_STORAGE);
      } catch {
        /* ignore */
      }
    },
  };
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
