/**
 * Anthropic Messages API (bring-your-own-key, browser-direct).
 * Docs: https://platform.claude.com/docs/en/api/messages
 * Models: https://platform.claude.com/docs/en/about-claude/models/overview
 */
import {
  ApiError,
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

export const ORIGIN = 'https://api.anthropic.com';
export const API_URL = `${ORIGIN}/v1/messages`;
export const MODELS_URL = `${ORIGIN}/v1/models`;
export const API_VERSION = '2023-06-01';

/** Verified against the official models overview on 2026-11-27. */
export const DEFAULT_MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (most capable)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (balanced)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (fastest)' },
  { id: 'claude-fable-5-2', label: 'Claude Fable 5.2 (deep reasoning)' },
];
export const DEFAULT_MODEL = 'claude-sonnet-5-5';

function headers(key) {
  return {
    'x-api-key': key,
    'anthropic-version': API_VERSION,
    'content-type': 'application/json',
    // Why this header is needed: the Anthropic API rejects cross-origin
    // browser (CORS) requests unless the caller explicitly opts in.
    // The risk: any API key used from browser code is visible to that
    // browser (dev tools, extensions, anyone with access to the device).
    // That is acceptable here ONLY because this is bring-your-own-key: the
    // key belongs to the person using the app, is never shipped in our
    // code, and is sent only to api.anthropic.com. Users should create a
    // dedicated key with a spending limit.
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

/** Build the fetch() arguments for a streaming Messages API request. */
export function buildRequest({ key, model, maxTokens, system, prompt, signal }) {
  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: clampMaxTokens(maxTokens),
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  };
  if (system) body.system = system;
  return { url: API_URL, init: { method: 'POST', headers: headers(key), body: JSON.stringify(body), signal } };
}

export function buildListRequest(key) {
  return { url: `${MODELS_URL}?limit=100`, init: { method: 'GET', headers: headers(key) } };
}

/** Map an HTTP response/status (+ parsed body) or a thrown error to an ApiError. */
export function mapError(input, body) {
  const { status, error } = normalizeErrorInput(input);
  if (error !== undefined) return mapThrownError(error, { provider: 'anthropic', host: 'api.anthropic.com' });
  const msg = errorMessage(body);
  const type = body?.error?.type || '';
  const opts = { provider: 'anthropic', label: 'Anthropic', billingUrl: 'https://platform.claude.com/settings/billing' };
  if (type === 'authentication_error') return mapCommonStatus(401, msg, opts);
  if (type === 'rate_limit_error') return mapCommonStatus(429, '', opts);
  if (status === 529 || type === 'overloaded_error') return mapCommonStatus(529, msg, opts);
  if (type === 'not_found_error') return mapCommonStatus(404, msg, opts);
  if (type === 'permission_error' && !/credit|billing|balance|quota|spend/i.test(msg)) return mapCommonStatus(403, msg, opts);
  return mapCommonStatus(status, msg, opts);
}

/**
 * Interpret one SSE event. Returns { text } for text deltas, { done: true }
 * at message_stop, { stopReason } for message_delta, or throws for errors.
 */
export function interpretEvent({ event, data }) {
  const type = (data && data.type) || event;
  if (type === 'content_block_delta' && data.delta?.type === 'text_delta') return { text: data.delta.text };
  if (type === 'message_delta' && data.delta?.stop_reason) return { stopReason: data.delta.stop_reason };
  if (type === 'message_stop') return { done: true };
  if (type === 'error') {
    const errType = data?.error?.type;
    const status = errType === 'overloaded_error' ? 529 : errType === 'rate_limit_error' ? 429 : 500;
    throw mapError(status, data);
  }
  return {};
}

export const anthropic = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  shortLabel: 'Anthropic',
  needsKey: true,
  origin: ORIGIN,
  keyHelpUrl: 'https://platform.claude.com/settings/keys',
  docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
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
    return tidyModels((json?.data || []).map((m) => ({ id: m.id, label: m.display_name || m.id })));
  },
  async stream({ key, model, maxTokens, system, prompt, signal, onText, fetchImpl }) {
    requireKey(this, key);
    return runStream({
      request: buildRequest({ key, model, maxTokens, system, prompt, signal }),
      parser: createSseParser,
      interpret: interpretEvent,
      mapError,
      onText,
      fetchImpl,
    });
  },
};

export { ApiError };
export default anthropic;
