/**
 * Ollama (local models, no key). Talks to the Ollama server on this machine.
 * Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
 *
 * The browser can only reach it if Ollama allows this site's origin:
 *   OLLAMA_ORIGINS=https://lance6x5.github.io ollama serve
 * It only works on the same machine that runs Ollama.
 */
import { ApiError, clampMaxTokens, createNdjsonParser, errorMessage, fetchJson, mapCommonStatus, mapThrownError, normalizeErrorInput, runStream, tidyModels } from './common.js';

export const ORIGIN = 'http://localhost:11434';
export const ALT_ORIGIN = 'http://127.0.0.1:11434';
export const API_URL = `${ORIGIN}/api/chat`;
export const TAGS_URL = `${ORIGIN}/api/tags`;
export const ORIGINS_HINT =
  'Could not reach Ollama at localhost:11434. Make sure Ollama is running on this computer and was started with OLLAMA_ORIGINS=https://lance6x5.github.io so the browser is allowed to connect.';

/** Example models from the Ollama docs; anything you have pulled works. */
export const DEFAULT_MODELS = [
  { id: 'llama3.2', label: 'Llama 3.2' },
  { id: 'gemma4', label: 'Gemma 4' },
  { id: 'mistral', label: 'Mistral' },
];
export const DEFAULT_MODEL = 'llama3.2';

export function buildRequest({ model, maxTokens, system, prompt, signal }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return {
    url: API_URL,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        stream: true,
        options: { num_predict: clampMaxTokens(maxTokens) },
      }),
      signal,
    },
  };
}

export function buildListRequest() {
  return { url: TAGS_URL, init: { method: 'GET' } };
}

export function mapError(input, body) {
  const { status, error } = normalizeErrorInput(input);
  if (error !== undefined) return mapThrownError(error, { provider: 'ollama', networkHint: ORIGINS_HINT });
  const msg = errorMessage(body);
  // Ollama answers 403 when the request's Origin is not in OLLAMA_ORIGINS.
  if (status === 403) return new ApiError('network', ORIGINS_HINT, status, 'ollama');
  if (status === 404 || /not found/i.test(msg)) {
    return new ApiError('not_found', `Model not found${msg ? `: ${msg}` : ''}. Run "ollama pull <model>" first, or refresh the model list.`, 404, 'ollama');
  }
  return mapCommonStatus(status, msg, { provider: 'ollama', label: 'Ollama' });
}

/** Interpret one NDJSON object: { message.content, done, done_reason } or { error }. */
export function interpretChunk(obj) {
  if (!obj || typeof obj !== 'object') return {};
  if (obj.error) throw mapError(/not found/i.test(obj.error) ? 404 : 500, obj);
  const out = {};
  if (obj.message?.content) out.text = obj.message.content;
  if (obj.done) {
    out.done = true;
    out.stopReason = obj.done_reason === 'length' ? 'max_tokens' : obj.done_reason || 'stop';
  }
  return out;
}

export const ollama = {
  id: 'ollama',
  label: 'Ollama (local, no key)',
  shortLabel: 'Ollama',
  needsKey: false,
  origin: ORIGIN,
  keyHelpUrl: 'https://ollama.com/download',
  docsUrl: 'https://ollama.com/library',
  defaultModels: DEFAULT_MODELS,
  defaultModel: DEFAULT_MODEL,
  buildRequest,
  buildListRequest,
  mapError,
  async listModels(_key, { fetchImpl, signal } = {}) {
    const request = buildListRequest();
    request.init.signal = signal;
    const json = await fetchJson({ request, mapError, fetchImpl });
    return tidyModels((json?.models || []).map((m) => ({ id: m.model || m.name, label: m.name || m.model })));
  },
  async stream({ model, maxTokens, system, prompt, signal, onText, fetchImpl }) {
    return runStream({
      request: buildRequest({ model, maxTokens, system, prompt, signal }),
      parser: createNdjsonParser,
      interpret: interpretChunk,
      mapError,
      onText,
      fetchImpl,
    });
  },
};

export default ollama;
