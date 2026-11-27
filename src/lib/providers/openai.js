/**
 * OpenAI Chat Completions API (bring-your-own-key, browser-direct).
 * Docs: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
 * Models: https://developers.openai.com/api/docs/models
 *
 * Shared with OpenRouter, which exposes an OpenAI-compatible endpoint.
 */
import {
  clampMaxTokens,
  createSseParser,
  errorMessage,
  fetchJson,
  mapCommonStatus,
  mapThrownError,
  normalizeErrorInput,
  requireKey,
  runStream,
  tidyModels,
} from './common.js';

export const ORIGIN = 'https://api.openai.com';
export const API_URL = `${ORIGIN}/v1/chat/completions`;
export const MODELS_URL = `${ORIGIN}/v1/models`;

/** Verified against the official models page on 2026-11-27. */
export const DEFAULT_MODELS = [
  { id: 'gpt-6.2-sol', label: 'GPT-6.2 Sol (balanced)' },
  { id: 'gpt-6.2-astra', label: 'GPT-6.2 Astra (most capable)' },
  { id: 'gpt-6.1-terra', label: 'GPT-6.1 Terra (fast)' },
  { id: 'gpt-6-luna', label: 'GPT-6 Luna (lowest cost)' },
];
export const DEFAULT_MODEL = 'gpt-6.2-sol';

/** Chat-completions body shared by OpenAI and OpenRouter. */
export function chatBody({ model, maxTokens, system, prompt, tokenField = 'max_completion_tokens' }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return { model, messages, stream: true, [tokenField]: clampMaxTokens(maxTokens) };
}

/**
 * Interpret one OpenAI-style SSE event: { choices[0].delta.content },
 * finish_reason, the "[DONE]" sentinel, or an in-stream { error }.
 */
export function interpretChatEvent({ data }, mapError) {
  if (data === '[DONE]') return { done: true };
  if (!data || typeof data !== 'object') return {};
  if (data.error) throw mapError(Number(data.error.code) || 500, data);
  const choice = data.choices?.[0];
  const out = {};
  if (choice?.delta?.content) out.text = choice.delta.content;
  if (choice?.finish_reason) out.stopReason = choice.finish_reason === 'length' ? 'max_tokens' : choice.finish_reason;
  return out;
}

export function buildRequest({ key, model, maxTokens, system, prompt, signal }) {
  return {
    url: API_URL,
    init: {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(chatBody({ model: model || DEFAULT_MODEL, maxTokens, system, prompt })),
      signal,
    },
  };
}

export function buildListRequest(key) {
  return { url: MODELS_URL, init: { method: 'GET', headers: { authorization: `Bearer ${key}` } } };
}

// Models in /v1/models that cannot be used for text chat.
const NON_CHAT = /embed|whisper|tts|transcribe|realtime|audio|image|dall-e|moderation|davinci|babbage|search|live|sora/i;

export function mapError(input, body) {
  const { status, error } = normalizeErrorInput(input);
  if (error !== undefined) return mapThrownError(error, { provider: 'openai', host: 'api.openai.com' });
  const msg = errorMessage(body);
  const code = String(body?.error?.code || body?.error?.type || '');
  const opts = { provider: 'openai', label: 'OpenAI', billingUrl: 'https://platform.openai.com/settings/organization/billing' };
  if (code === 'invalid_api_key') return mapCommonStatus(401, msg, opts);
  if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') return mapCommonStatus(402, msg, opts);
  if (code === 'model_not_found') return mapCommonStatus(404, msg, opts);
  return mapCommonStatus(status, msg, opts);
}

export const openai = {
  id: 'openai',
  label: 'OpenAI (GPT)',
  shortLabel: 'OpenAI',
  needsKey: true,
  origin: ORIGIN,
  keyHelpUrl: 'https://platform.openai.com/api-keys',
  docsUrl: 'https://developers.openai.com/api/docs/models',
  defaultModels: DEFAULT_MODELS,
  defaultModel: DEFAULT_MODEL,
  buildRequest,
  buildListRequest,
  mapError,
  async listModels(key, { fetchImpl, signal } = {}) {
    requireKey(this, key);
    const request = buildListRequest(key);
    request.init.signal = signal;
    const json = await fetchJson({ request, mapError, fetchImpl });
    return tidyModels((json?.data || []).filter((m) => !NON_CHAT.test(m.id)).map((m) => ({ id: m.id, label: m.id })));
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

export default openai;
