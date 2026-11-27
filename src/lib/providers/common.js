/**
 * Shared pieces for the bring-your-own-key AI providers: error type, stream
 * parsers (SSE and NDJSON), a generic streaming runner and error helpers.
 * No SDK dependencies: plain fetch + text parsing.
 */
export const DEFAULT_MAX_TOKENS = 1024;
export const MAX_TOKENS_LIMIT = 64000;

/** Clamp a user-supplied max tokens value to a sane integer range. */
export function clampMaxTokens(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 1) return DEFAULT_MAX_TOKENS;
  return Math.min(v, MAX_TOKENS_LIMIT);
}

/**
 * Error categories shown to the user:
 *   no_key | invalid_key | forbidden | rate_limit | quota | not_found |
 *   overloaded | server | bad_request | network | aborted | unknown
 */
export class ApiError extends Error {
  constructor(kind, message, status = 0, provider = '') {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.provider = provider;
  }
}

export const QUOTA_RE = /credit|billing|balance|quota|spend|insufficient/i;

/** Pull a human-readable message out of the many error body shapes providers use. */
export function errorMessage(body) {
  if (!body) return '';
  if (typeof body === 'string') return body.slice(0, 300);
  const e = body.error;
  if (typeof e === 'string') return e;
  return String(e?.message || body.message || '').slice(0, 300);
}

/**
 * Turn whatever a provider's mapError receives into { status, body } or an
 * Error: accepts a number, a Response-like { status }, or a thrown error.
 */
export function normalizeErrorInput(input) {
  if (typeof input === 'number') return { status: input };
  if (input && typeof input === 'object' && typeof input.status === 'number' && !(input instanceof Error)) {
    return { status: input.status };
  }
  return { error: input };
}

/** Map a thrown fetch/stream error (not an HTTP status) to an ApiError. */
export function mapThrownError(err, { provider = '', host = 'the provider', networkHint = '' } = {}) {
  if (err instanceof ApiError) return err;
  if (err?.name === 'AbortError') return new ApiError('aborted', 'Stopped.', 0, provider);
  if (err instanceof TypeError) {
    return new ApiError(
      'network',
      networkHint || `Network failure: could not reach ${host}. Check your connection and API key, then try again.`,
      0,
      provider
    );
  }
  return new ApiError('unknown', err?.message || 'Unexpected error.', 0, provider);
}

/** Generic status mapping used by providers after their own special cases. */
export function mapCommonStatus(status, msg, { provider, label, billingUrl }) {
  const detail = msg ? `: ${msg}` : '';
  if (status === 401) {
    return new ApiError('invalid_key', `Invalid ${label} API key. Check the key in Settings and try again.`, status, provider);
  }
  if (status === 402 || ((status === 400 || status === 403 || status === 429) && QUOTA_RE.test(msg))) {
    return new ApiError(
      'quota',
      `Quota exceeded: your ${label} account is out of credit or over its spending limit.${billingUrl ? ` Check billing at ${billingUrl}.` : ''}`,
      status,
      provider
    );
  }
  if (status === 429) return new ApiError('rate_limit', 'Rate limit reached. Wait a moment and try again.', status, provider);
  if (status === 403) {
    return new ApiError('forbidden', `This key is not permitted to use that model or resource${detail}.`, status, provider);
  }
  if (status === 404) return new ApiError('not_found', `Model not found${detail}. Check the model id or refresh the model list.`, status, provider);
  if (status === 503 || status === 529 || status === 502) {
    return new ApiError('overloaded', `${label} is temporarily overloaded or unavailable. Please try again shortly.`, status, provider);
  }
  if (status >= 500) return new ApiError('server', `${label} returned a server error. Please try again.`, status, provider);
  return new ApiError('bad_request', msg ? `Request rejected: ${msg}` : `Request failed (HTTP ${status}).`, status, provider);
}

/**
 * Incremental SSE parser. Feed it text chunks; it returns complete events
 * as { event, data } objects (data parsed as JSON when possible, raw text
 * otherwise, e.g. the OpenAI "[DONE]" sentinel).
 */
export function createSseParser() {
  let buffer = '';
  return function feed(chunk) {
    buffer += chunk.replace(/\r\n?/g, '\n');
    const events = [];
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let event = 'message';
      const dataLines = [];
      for (const line of raw.split('\n')) {
        if (line.startsWith(':')) continue;
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      if (!dataLines.length) continue;
      const text = dataLines.join('\n');
      let data = text;
      try {
        data = JSON.parse(text);
      } catch {
        /* keep raw text */
      }
      events.push({ event, data });
    }
    return events;
  };
}

/** Incremental newline-delimited JSON parser (Ollama). Returns parsed objects. */
export function createNdjsonParser() {
  let buffer = '';
  return function feed(chunk) {
    buffer += chunk;
    const out = [];
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        out.push(JSON.parse(line));
      } catch {
        /* skip malformed line */
      }
    }
    return out;
  };
}

async function readBody(res) {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
}

/**
 * Run a streaming request. `interpret(item)` turns one parsed item into
 * { text?, stopReason?, done? } or throws an ApiError.
 * Resolves with { text, stopReason }. Rejects with ApiError.
 */
export async function runStream({ request, parser, interpret, mapError, onText, fetchImpl }) {
  const doFetch = fetchImpl || globalThis.fetch.bind(globalThis);
  let res;
  try {
    res = await doFetch(request.url, request.init);
  } catch (err) {
    throw mapError(err);
  }
  if (!res.ok) throw mapError(res, await readBody(res));
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const feed = parser();
  let text = '';
  let stopReason = null;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const item of feed(decoder.decode(value, { stream: true }))) {
        const r = interpret(item) || {};
        if (r.text) {
          text += r.text;
          onText?.(r.text);
        }
        if (r.stopReason) stopReason = r.stopReason;
      }
    }
  } catch (err) {
    throw mapError(err);
  }
  return { text, stopReason };
}

/** GET a JSON document (model listing). Rejects with a mapped ApiError. */
export async function fetchJson({ request, mapError, fetchImpl }) {
  const doFetch = fetchImpl || globalThis.fetch.bind(globalThis);
  let res;
  try {
    res = await doFetch(request.url, request.init);
  } catch (err) {
    throw mapError(err);
  }
  if (!res.ok) throw mapError(res, await readBody(res));
  try {
    return await res.json();
  } catch {
    throw new ApiError('unknown', 'The model list response was not valid JSON.', res.status);
  }
}

/** Require a key for providers that need one. */
export function requireKey(provider, key) {
  if (provider.needsKey && !String(key || '').trim()) {
    throw new ApiError('no_key', `Add your ${provider.label} API key in Settings first.`, 0, provider.id);
  }
}

/** Sort + de-duplicate a model list of { id, label }. */
export function tidyModels(list) {
  const seen = new Set();
  return list
    .filter((m) => m && m.id && !seen.has(m.id) && seen.add(m.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}
