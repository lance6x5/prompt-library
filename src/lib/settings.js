import { DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from './anthropic.js';

/** Small UI settings kept in localStorage (never the API key - see keyStore.js). */
const KEY = 'promptvault.settings';

export const DEFAULT_SETTINGS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  model: DEFAULT_MODEL, // one of MODELS ids, or 'custom'
  customModel: '',
  maxTokens: DEFAULT_MAX_TOKENS,
  sort: 'updated',
  tagMode: 'and',
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or unavailable - settings just won't persist */
  }
}

export function clearSettings() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Resolve the effective model id from settings. */
export function effectiveModel(s) {
  if (s.model === 'custom') return String(s.customModel || '').trim() || DEFAULT_MODEL;
  return s.model || DEFAULT_MODEL;
}
