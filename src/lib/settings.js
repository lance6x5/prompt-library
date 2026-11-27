import { DEFAULT_MAX_TOKENS, DEFAULT_PROVIDER, getProvider, PROVIDER_IDS } from './providers/index.js';

/** Small UI settings kept in localStorage (never an API key - see keyStore.js). */
const KEY = 'promptvault.settings';

export const DEFAULT_SETTINGS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  provider: DEFAULT_PROVIDER,
  models: {}, // providerId -> model id, or 'custom'
  customModels: {}, // providerId -> free-text model id
  fetchedModels: {}, // providerId -> [{ id, label }] from "Refresh models"
  maxTokens: DEFAULT_MAX_TOKENS,
  sort: 'updated',
  tagMode: 'and',
};

/**
 * Normalise stored settings. v1.x stored a single Anthropic `model` /
 * `customModel`; those become the Anthropic entries of the per-provider maps.
 */
export function migrateSettings(raw) {
  const s = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {});
  s.models = obj(s.models);
  s.customModels = obj(s.customModels);
  s.fetchedModels = obj(s.fetchedModels);
  if (raw && 'model' in raw && !('anthropic' in s.models)) s.models.anthropic = raw.model;
  if (raw && 'customModel' in raw && !('anthropic' in s.customModels)) s.customModels.anthropic = raw.customModel;
  delete s.model;
  delete s.customModel;
  if (!PROVIDER_IDS.includes(s.provider)) s.provider = DEFAULT_PROVIDER;
  return s;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return migrateSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return migrateSettings(null);
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

/** The model selection for a provider: a model id or 'custom'. */
export function selectedModel(s, providerId = s.provider) {
  return s.models?.[providerId] || getProvider(providerId).defaultModel;
}

/** Resolve the effective model id for a provider (default: the active one). */
export function effectiveModel(s, providerId = s.provider) {
  const provider = getProvider(providerId);
  const sel = selectedModel(s, providerId);
  if (sel === 'custom') return String(s.customModels?.[providerId] || '').trim() || provider.defaultModel;
  return sel;
}

/** Patch helper: set one provider's entry in a per-provider map. */
export function withProviderValue(s, field, providerId, value) {
  return { [field]: { ...(s[field] || {}), [providerId]: value } };
}
