/**
 * Google Gemini API (bring-your-own-key, browser-direct).
 * Docs: https://ai.google.dev/api/generate-content (streamGenerateContent, alt=sse)
 * Models: https://firebase.google.com/docs/ai-logic/models (Gemini Developer API model names)
 *
 * The key is sent in the x-goog-api-key header, never in the URL, so it does
 * not end up in logs, history or Referer headers.
 */
import {
  ApiError,
  QUOTA_RE,
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

export const ORIGIN = 'https://generativelanguage.googleapis.com';
export const BASE = `${ORIGIN}/v1beta`;

/** Stable models verified against Google's model list on 2026-11-27. */
export const DEFAULT_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (balanced)' },
  { id: 'gemini-4-argon', label: 'Gemini 4 Argon (most capable)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (fastest)' },
];
export const DEFAULT_MODEL = 'gemini-3.8-flash';

/** Strip an optional "models/" prefix and anything that could escape the path. */
export function cleanModelId(model) {
  return String(model || DEFAULT_MODEL)
    .trim()
    .replace(/^models\//, '')
    .replace(/[^A-Za-z0-9._-]/g, '');
}

export function buildRequest({ key, model, maxTokens, system, prompt, signal }) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: clampMaxTokens(maxTokens) },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  return {
    url: `${BASE}/models/${encodeURIComponent(cleanModelId(model))}:streamGenerateContent?alt=sse`,
    init: {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    },
  };
}

export function buildListRequest(key) {
  return { url: `${BASE}/models?pageSize=1000`, init: { method: 'GET', headers: { 'x-goog-api-key': key } } };
}

export function mapError(input, body) {
  const { status, error } = normalizeErrorInput(input);
  if (error !== undefined) return mapThrownError(error, { provider: 'gemini', host: 'generativelanguage.googleapis.com' });
  const msg = errorMessage(body);
  const st = String(body?.error?.status || '');
  const reasons = JSON.stringify(body?.error?.details || '');
  const opts = { provider: 'gemini', label: 'Google Gemini', billingUrl: 'https://aistudio.google.com/' };
  // Google returns 400 INVALID_ARGUMENT (reason API_KEY_INVALID) for a bad key.
  if (/API_KEY_INVALID|API key not valid/i.test(reasons + msg)) return mapCommonStatus(401, msg, opts);
  if (status === 403 || st === 'PERMISSION_DENIED') return mapCommonStatus(QUOTA_RE.test(msg) ? 402 : 401, msg, opts);
  if (status === 429 || st === 'RESOURCE_EXHAUSTED') {
    return new ApiError(
      QUOTA_RE.test(msg) ? 'quota' : 'rate_limit',
      'Gemini rate limit or quota reached. Wait a minute and try again, or check your plan and billing in Google AI Studio.',
      429,
      'gemini'
    );
  }
  if (st === 'NOT_FOUND') return mapCommonStatus(404, msg, opts);
  if (st === 'UNAVAILABLE') return mapCommonStatus(503, msg, opts);
  return mapCommonStatus(status, msg, opts);
}

/** Interpret one SSE event: candidates[0].content.parts[].text + finishReason. */
export function interpretEvent({ data }) {
  if (!data || typeof data !== 'object') return {};
  if (data.error) throw mapError(Number(data.error.code) || 500, data);
  const cand = data.candidates?.[0];
  const out = {};
  const text = (cand?.content?.parts || [])
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('');
  if (text) out.text = text;
  if (cand?.finishReason) {
    out.stopReason = cand.finishReason === 'MAX_TOKENS' ? 'max_tokens' : cand.finishReason.toLowerCase();
  }
  return out;
}

export const gemini = {
  id: 'gemini',
  label: 'Google Gemini',
  shortLabel: 'Gemini',
  needsKey: true,
  origin: ORIGIN,
  keyHelpUrl: 'https://aistudio.google.com/apikey',
  docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
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
    return tidyModels(
      (json?.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => ({ id: cleanModelId(m.name), label: m.displayName || cleanModelId(m.name) }))
    );
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

export default gemini;
