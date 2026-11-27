/**
 * Minimal Anthropic Messages API client for the browser (bring-your-own-key).
 * No SDK dependency: plain fetch + Server-Sent Events parsing.
 */
export const API_URL = 'https://api.anthropic.com/v1/messages';
export const API_VERSION = '2023-06-01';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (most capable)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (balanced)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (fastest)' },
];
export const DEFAULT_MODEL = 'claude-sonnet-5-5';
export const DEFAULT_MAX_TOKENS = 1024;
export const MAX_TOKENS_LIMIT = 64000;

/** Clamp a user-supplied max_tokens value to a sane integer range. */
export function clampMaxTokens(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 1) return DEFAULT_MAX_TOKENS;
  return Math.min(v, MAX_TOKENS_LIMIT);
}

/** Build the fetch() arguments for a streaming Messages API request. */
export function buildRequest({ apiKey, model, maxTokens, prompt, signal }) {
  return {
    url: API_URL,
    init: {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
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
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        max_tokens: clampMaxTokens(maxTokens),
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal,
    },
  };
}

/** Error categories shown to the user. */
export class ApiError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

const QUOTA_RE = /credit|billing|balance|quota|spend/i;

/** Map an HTTP status + parsed error body to an ApiError. */
export function mapHttpError(status, body) {
  const apiMsg = body?.error?.message || '';
  const type = body?.error?.type || '';
  if (status === 401 || type === 'authentication_error') {
    return new ApiError('invalid_key', 'Invalid API key. Check the key in Settings and try again.', status);
  }
  if (status === 429 || type === 'rate_limit_error') {
    return new ApiError('rate_limit', 'Rate limit reached. Wait a moment and try again.', status);
  }
  if (status === 529 || type === 'overloaded_error') {
    return new ApiError('overloaded', 'The API is temporarily overloaded. Please try again shortly.', status);
  }
  if ((status === 400 || status === 402 || status === 403) && QUOTA_RE.test(apiMsg)) {
    return new ApiError('quota', 'Quota exceeded: your account is out of credit or over its spending limit. Check billing in the Anthropic Console.', status);
  }
  if (status === 403 || type === 'permission_error') {
    return new ApiError('forbidden', 'This key is not permitted to use that model or resource.', status);
  }
  if (status === 404 || type === 'not_found_error') {
    return new ApiError('not_found', `Not found${apiMsg ? `: ${apiMsg}` : ''}. Check the model id.`, status);
  }
  if (status >= 500) {
    return new ApiError('server', 'The API returned a server error. Please try again.', status);
  }
  return new ApiError('bad_request', apiMsg ? `Request rejected: ${apiMsg}` : `Request failed (HTTP ${status}).`, status);
}

/** Map a thrown fetch/stream error to an ApiError. */
export function mapThrownError(err) {
  if (err instanceof ApiError) return err;
  if (err?.name === 'AbortError') return new ApiError('aborted', 'Stopped.', 0);
  if (err instanceof TypeError) {
    return new ApiError('network', 'Network failure: could not reach api.anthropic.com. Check your connection.', 0);
  }
  return new ApiError('unknown', err?.message || 'Unexpected error.', 0);
}

/**
 * Incremental SSE parser. Feed it text chunks; it returns complete events
 * as { event, data } objects (data parsed as JSON when possible).
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
    throw mapHttpError(status, data);
  }
  return {};
}

/**
 * Stream a completion. Calls onText(delta) as text arrives.
 * Resolves with { text, stopReason }. Rejects with ApiError.
 */
export async function streamMessage({ apiKey, model, maxTokens, prompt, signal, onText, fetchImpl }) {
  const doFetch = fetchImpl || globalThis.fetch.bind(globalThis);
  if (!apiKey) throw new ApiError('no_key', 'Add your Anthropic API key in Settings first.', 0);
  const { url, init } = buildRequest({ apiKey, model, maxTokens, prompt, signal });
  let res;
  try {
    res = await doFetch(url, init);
  } catch (err) {
    throw mapThrownError(err);
  }
  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw mapHttpError(res.status, body);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const feed = createSseParser();
  let text = '';
  let stopReason = null;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const ev of feed(decoder.decode(value, { stream: true }))) {
        const r = interpretEvent(ev);
        if (r.text) {
          text += r.text;
          onText?.(r.text);
        }
        if (r.stopReason) stopReason = r.stopReason;
      }
    }
  } catch (err) {
    throw mapThrownError(err);
  }
  return { text, stopReason };
}
