/**
 * OpenRouter (bring-your-own-key, browser-direct). One key covers many
 * models (Llama, Mistral, DeepSeek, Qwen and more) through an
 * OpenAI-compatible Chat Completions endpoint.
 * Docs: https://openrouter.ai/docs/quickstart
 */
import { createSseParser, errorMessage, fetchJson, mapCommonStatus, mapThrownError, normalizeErrorInput, requireKey, runStream, tidyModels } from './common.js';
import { chatBody, interpretChatEvent } from './openai.js';

export const ORIGIN = 'https://openrouter.ai';
export const API_URL = `${ORIGIN}/api/v1/chat/completions`;
export const MODELS_URL = `${ORIGIN}/api/v1/models`;
export const APP_URL = 'https://lance6x5.github.io/prompt-library/';
export const APP_TITLE = 'Promptvault';

/** Model ids current on OpenRouter as of 2026-11-27; use "Refresh models" for the live list. */
export const DEFAULT_MODELS = [
  { id: 'openrouter/auto', label: 'Auto (OpenRouter picks a model)' },
  { id: 'meta-llama/llama-4-maverick', label: 'Meta Llama 4 Maverick' },
  { id: 'mistralai/mistral-medium-3-5', label: 'Mistral Medium 3.5' },
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'qwen/qwen3.8-flash', label: 'Qwen 3.8 Flash' },
];
export const DEFAULT_MODEL = 'openrouter/auto';

// Optional attribution headers documented by OpenRouter (app URL + name).
const ATTRIBUTION = { 'HTTP-Referer': APP_URL, 'X-Title': APP_TITLE };

export function buildRequest({ key, model, maxTokens, system, prompt, signal }) {
  return {
    url: API_URL,
    init: {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', ...ATTRIBUTION },
      body: JSON.stringify(chatBody({ model: model || DEFAULT_MODEL, maxTokens, system, prompt, tokenField: 'max_tokens' })),
      signal,
    },
  };
}

/** The model list is public: no key is sent for it. */
export function buildListRequest() {
  return { url: MODELS_URL, init: { method: 'GET', headers: { ...ATTRIBUTION } } };
}

export function mapError(input, body) {
  const { status, error } = normalizeErrorInput(input);
  if (error !== undefined) return mapThrownError(error, { provider: 'openrouter', host: 'openrouter.ai' });
  const msg = errorMessage(body);
  const opts = { provider: 'openrouter', label: 'OpenRouter', billingUrl: 'https://openrouter.ai/settings/credits' };
  if (/no endpoints found|not a valid model/i.test(msg)) return mapCommonStatus(404, msg, opts);
  return mapCommonStatus(status, msg, opts);
}

export const openrouter = {
  id: 'openrouter',
  label: 'OpenRouter (Llama, Mistral, DeepSeek, Qwen…)',
  shortLabel: 'OpenRouter',
  needsKey: true,
  origin: ORIGIN,
  keyHelpUrl: 'https://openrouter.ai/settings/keys',
  docsUrl: 'https://openrouter.ai/models',
  defaultModels: DEFAULT_MODELS,
  defaultModel: DEFAULT_MODEL,
  buildRequest,
  buildListRequest,
  mapError,
  async listModels(_key, { fetchImpl, signal } = {}) {
    const request = buildListRequest();
    request.init.signal = signal;
    const json = await fetchJson({ request, mapError, fetchImpl });
    return tidyModels(
      (json?.data || [])
        .filter((m) => {
          const out = m.architecture?.output_modalities;
          return !Array.isArray(out) || out.includes('text');
        })
        .map((m) => ({ id: m.id, label: m.name || m.id }))
    );
  },
  async stream({ key, model, maxTokens, system, prompt, signal, onText, fetchImpl }) {
    requireKey(this, key);
    return runStream({
      request: buildRequest({ key, model, maxTokens, system, prompt, signal }),
      parser: createSseParser,
      interpret: (ev) => interpretChatEvent(ev, mapError),
      mapError,
      onText,
      fetchImpl,
    });
  },
};

export default openrouter;
