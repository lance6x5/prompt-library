import { describe, it, expect } from 'vitest';
import { PROVIDERS, getProvider, KEYED_PROVIDERS, DEFAULT_PROVIDER } from './index.js';
import { createSseParser, createNdjsonParser, clampMaxTokens, ApiError } from './common.js';
import anthropic, { interpretEvent as anthropicEvent, API_URL as ANTHROPIC_URL } from './anthropic.js';
import openai, { interpretChatEvent } from './openai.js';
import gemini, { interpretEvent as geminiEvent, cleanModelId } from './gemini.js';
import openrouter from './openrouter.js';
import ollama, { interpretChunk, ORIGINS_HINT } from './ollama.js';
import { createKeyStore } from '../keyStore.js';
import { CONNECT_SRC } from '../csp.js';

// Obviously fake, per-provider test keys (never real credentials).
const KEYS = {
  anthropic: 'test-anthropic-not-real-aaaa',
  openai: 'test-openai-not-real-bbbb',
  gemini: 'test-gemini-not-real-cccc',
  openrouter: 'test-openrouter-not-real-dddd',
};

const HOSTS = {
  anthropic: 'api.anthropic.com',
  openai: 'api.openai.com',
  gemini: 'generativelanguage.googleapis.com',
  openrouter: 'openrouter.ai',
  ollama: 'localhost:11434',
};

function streamResponse(chunks) {
  const enc = new TextEncoder();
  let i = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => (i < chunks.length ? { value: enc.encode(chunks[i++]), done: false } : { value: undefined, done: true }),
      }),
    },
  };
}

const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });

function mockFetch(responder) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return responder(url, init);
  };
  fn.calls = calls;
  return fn;
}

const sse = (obj) => `data: ${typeof obj === 'string' ? obj : JSON.stringify(obj)}\n\n`;

describe('provider registry', () => {
  it('exposes the five providers with the common interface', () => {
    expect(PROVIDERS.map((p) => p.id)).toEqual(['anthropic', 'openai', 'gemini', 'openrouter', 'ollama']);
    for (const p of PROVIDERS) {
      expect(typeof p.label).toBe('string');
      expect(typeof p.needsKey).toBe('boolean');
      expect(p.keyHelpUrl).toMatch(/^https:\/\//);
      expect(p.defaultModels.length).toBeGreaterThan(0);
      expect(p.defaultModels.map((m) => m.id)).toContain(p.defaultModel);
      expect(typeof p.listModels).toBe('function');
      expect(typeof p.stream).toBe('function');
      expect(typeof p.mapError).toBe('function');
    }
    expect(KEYED_PROVIDERS.map((p) => p.id)).toEqual(['anthropic', 'openai', 'gemini', 'openrouter']);
    expect(getProvider('nope').id).toBe(DEFAULT_PROVIDER);
  });
  it('every provider origin is allowed by the CSP, and the CSP has no wildcards', () => {
    for (const p of PROVIDERS) expect(CONNECT_SRC).toContain(p.origin);
    expect(CONNECT_SRC).toContain('http://127.0.0.1:11434');
    expect(CONNECT_SRC.some((h) => h.includes('*') || h === 'https:' || h === 'http:')).toBe(false);
    expect(CONNECT_SRC).toEqual([
      "'self'",
      'https://api.anthropic.com',
      'https://api.openai.com',
      'https://generativelanguage.googleapis.com',
      'https://openrouter.ai',
      'http://localhost:11434',
      'http://127.0.0.1:11434',
      'https://abacus.jasoncameron.dev',
    ]);
  });
});

describe('request builders', () => {
  it('anthropic: url, headers (incl. direct browser access) and body', () => {
    const { url, init } = anthropic.buildRequest({ key: KEYS.anthropic, model: 'claude-haiku-5-5', maxTokens: 50, prompt: 'hi', system: 'be brief' });
    expect(url).toBe(ANTHROPIC_URL);
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.method).toBe('POST');
    expect(init.headers['x-api-key']).toBe(KEYS.anthropic);
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
    expect(init.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(JSON.parse(init.body)).toEqual({
      model: 'claude-haiku-5-5',
      max_tokens: 50,
      stream: true,
      messages: [{ role: 'user', content: 'hi' }],
      system: 'be brief',
    });
    expect(JSON.parse(anthropic.buildRequest({ key: KEYS.anthropic, prompt: 'x' }).init.body).model).toBe('claude-sonnet-5-5');
  });
  it('openai: chat completions with bearer auth and max_completion_tokens', () => {
    const { url, init } = openai.buildRequest({ key: KEYS.openai, model: 'gpt-6.2-sol', maxTokens: 99, prompt: 'hi', system: 'sys' });
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.authorization).toBe(`Bearer ${KEYS.openai}`);
    expect(JSON.parse(init.body)).toEqual({
      model: 'gpt-6.2-sol',
      stream: true,
      max_completion_tokens: 99,
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'hi' },
      ],
    });
    expect(openai.buildListRequest(KEYS.openai).url).toBe('https://api.openai.com/v1/models');
  });
  it('gemini: key in x-goog-api-key header, never in the URL', () => {
    const { url, init } = gemini.buildRequest({ key: KEYS.gemini, model: 'gemini-3.8-flash', maxTokens: 10, prompt: 'hi', system: 'sys' });
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse');
    expect(url).not.toContain(KEYS.gemini);
    expect(url).not.toContain('key=');
    expect(init.headers['x-goog-api-key']).toBe(KEYS.gemini);
    expect(JSON.parse(init.body)).toEqual({
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      generationConfig: { maxOutputTokens: 10 },
      systemInstruction: { parts: [{ text: 'sys' }] },
    });
    expect(gemini.buildListRequest(KEYS.gemini).url).not.toContain(KEYS.gemini);
    expect(cleanModelId('models/gemini-4-argon')).toBe('gemini-4-argon');
    expect(cleanModelId('../../evil?x=1')).toBe('....evilx1');
  });
  it('openrouter: OpenAI-compatible body plus attribution headers', () => {
    const { url, init } = openrouter.buildRequest({ key: KEYS.openrouter, model: 'meta-llama/llama-4-maverick', maxTokens: 20, prompt: 'hi' });
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.headers.authorization).toBe(`Bearer ${KEYS.openrouter}`);
    expect(init.headers['HTTP-Referer']).toBe('https://lance6x5.github.io/prompt-library/');
    expect(init.headers['X-Title']).toBe('Promptvault');
    expect(JSON.parse(init.body)).toEqual({
      model: 'meta-llama/llama-4-maverick',
      stream: true,
      max_tokens: 20,
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(openrouter.buildListRequest().url).toBe('https://openrouter.ai/api/v1/models');
    expect(openrouter.buildListRequest().init.headers.authorization).toBeUndefined();
  });
  it('ollama: local /api/chat, no auth header', () => {
    const { url, init } = ollama.buildRequest({ model: 'llama3.2', maxTokens: 30, prompt: 'hi' });
    expect(url).toBe('http://localhost:11434/api/chat');
    expect(init.headers.authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({
      model: 'llama3.2',
      messages: [{ role: 'user', content: 'hi' }],
      stream: true,
      options: { num_predict: 30 },
    });
    expect(ollama.buildListRequest().url).toBe('http://localhost:11434/api/tags');
  });
  it('clamps max tokens', () => {
    expect(clampMaxTokens(-5)).toBe(1024);
    expect(clampMaxTokens('abc')).toBe(1024);
    expect(clampMaxTokens(10 ** 9)).toBe(64000);
  });
});

describe('stream parsers', () => {
  it('SSE: events split across chunks, comments and [DONE]', () => {
    const feed = createSseParser();
    expect(feed(': keep-alive\n\ndata: {"choices":[{"delta":{"content":"He')).toEqual([]);
    const evs = feed('llo"}}]}\r\n\r\ndata: [DONE]\n\n');
    expect(evs).toHaveLength(2);
    expect(interpretChatEvent(evs[0], openai.mapError)).toEqual({ text: 'Hello' });
    expect(interpretChatEvent(evs[1], openai.mapError)).toEqual({ done: true });
  });
  it('NDJSON: lines split across chunks', () => {
    const feed = createNdjsonParser();
    expect(feed('{"message":{"content":"Hi')).toEqual([]);
    const out = feed(' there"},"done":false}\n{"done":true,"done_reason":"stop"}\n');
    expect(out).toHaveLength(2);
    expect(interpretChunk(out[0])).toEqual({ text: 'Hi there' });
    expect(interpretChunk(out[1])).toEqual({ done: true, stopReason: 'stop' });
  });
  it('anthropic events', () => {
    expect(anthropicEvent({ event: 'content_block_delta', data: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'x' } } })).toEqual({ text: 'x' });
    expect(() => anthropicEvent({ event: 'error', data: { type: 'error', error: { type: 'overloaded_error', message: 'x' } } })).toThrow(/overloaded/);
  });
  it('gemini events: text parts and finish reason', () => {
    expect(geminiEvent({ data: { candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] } })).toEqual({ text: 'ab' });
    expect(geminiEvent({ data: { candidates: [{ content: { parts: [] }, finishReason: 'MAX_TOKENS' }] } })).toEqual({ stopReason: 'max_tokens' });
  });
});

describe('streaming end-to-end (mocked fetch)', () => {
  it('anthropic', async () => {
    const fetchImpl = mockFetch(() =>
      streamResponse([
        'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi "}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"there"}}\n\n',
        'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\nevent: message_stop\ndata: {"type":"message_stop"}\n\n',
      ])
    );
    const seen = [];
    const res = await anthropic.stream({ key: KEYS.anthropic, prompt: 'x', onText: (t) => seen.push(t), fetchImpl });
    expect(res).toEqual({ text: 'Hi there', stopReason: 'end_turn' });
    expect(seen).toEqual(['Hi ', 'there']);
  });
  it('openai', async () => {
    const fetchImpl = mockFetch(() =>
      streamResponse([
        sse({ choices: [{ delta: { role: 'assistant', content: '' } }] }),
        sse({ choices: [{ delta: { content: 'Hel' } }] }) + sse({ choices: [{ delta: { content: 'lo' } }] }),
        sse({ choices: [{ delta: {}, finish_reason: 'length' }] }) + sse('[DONE]'),
      ])
    );
    expect(await openai.stream({ key: KEYS.openai, prompt: 'x', fetchImpl })).toEqual({ text: 'Hello', stopReason: 'max_tokens' });
  });
  it('gemini', async () => {
    const fetchImpl = mockFetch(() =>
      streamResponse([
        sse({ candidates: [{ content: { parts: [{ text: 'Bon' }], role: 'model' } }] }),
        sse({ candidates: [{ content: { parts: [{ text: 'jour' }], role: 'model' }, finishReason: 'STOP' }] }),
      ])
    );
    expect(await gemini.stream({ key: KEYS.gemini, prompt: 'x', fetchImpl })).toEqual({ text: 'Bonjour', stopReason: 'stop' });
  });
  it('openrouter (incl. keep-alive comments)', async () => {
    const fetchImpl = mockFetch(() =>
      streamResponse([': OPENROUTER PROCESSING\n\n', sse({ choices: [{ delta: { content: 'Hola' }, finish_reason: 'stop' }] }), sse('[DONE]')])
    );
    expect(await openrouter.stream({ key: KEYS.openrouter, prompt: 'x', fetchImpl })).toEqual({ text: 'Hola', stopReason: 'stop' });
  });
  it('ollama (NDJSON)', async () => {
    const fetchImpl = mockFetch(() =>
      streamResponse(['{"message":{"role":"assistant","content":"Lo"},"done":false}\n{"message":{"content":"cal"},', '"done":false}\n{"message":{"content":""},"done":true,"done_reason":"stop"}\n'])
    );
    expect(await ollama.stream({ prompt: 'x', fetchImpl })).toEqual({ text: 'Local', stopReason: 'stop' });
  });
  it('in-stream errors are mapped', async () => {
    const fetchImpl = mockFetch(() => streamResponse([sse({ error: { code: 429, message: 'Rate limit exceeded' } })]));
    await expect(openrouter.stream({ key: KEYS.openrouter, prompt: 'x', fetchImpl })).rejects.toMatchObject({ kind: 'rate_limit' });
  });
  it('requires a key for keyed providers only', async () => {
    for (const p of KEYED_PROVIDERS) {
      await expect(p.stream({ key: '', prompt: 'x', fetchImpl: mockFetch(() => streamResponse([])) })).rejects.toMatchObject({ kind: 'no_key' });
    }
    await expect(ollama.stream({ prompt: 'x', fetchImpl: mockFetch(() => streamResponse([])) })).resolves.toEqual({ text: '', stopReason: null });
  });
});

describe('model listing (mocked fetch)', () => {
  it('parses each provider list format', async () => {
    const a = await anthropic.listModels(KEYS.anthropic, {
      fetchImpl: mockFetch(() => jsonResponse({ data: [{ id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5' }] })),
    });
    expect(a).toEqual([{ id: 'claude-opus-5-5', label: 'Claude Opus 5.5' }]);

    const o = await openai.listModels(KEYS.openai, {
      fetchImpl: mockFetch(() => jsonResponse({ data: [{ id: 'gpt-6.2-sol' }, { id: 'text-embedding-3-small' }, { id: 'gpt-image-2.6-flare' }] })),
    });
    expect(o.map((m) => m.id)).toEqual(['gpt-6.2-sol']);

    const g = await gemini.listModels(KEYS.gemini, {
      fetchImpl: mockFetch(() =>
        jsonResponse({
          models: [
            { name: 'models/gemini-3.8-flash', displayName: 'Gemini 3.8 Flash', supportedGenerationMethods: ['generateContent', 'countTokens'] },
            { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
          ],
        })
      ),
    });
    expect(g).toEqual([{ id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' }]);

    const r = await openrouter.listModels('', {
      fetchImpl: mockFetch(() =>
        jsonResponse({
          data: [
            { id: 'qwen/qwen3.8-flash', name: 'Qwen 3.8 Flash', architecture: { output_modalities: ['text'] } },
            { id: 'some/image-model', name: 'Img', architecture: { output_modalities: ['image'] } },
          ],
        })
      ),
    });
    expect(r).toEqual([{ id: 'qwen/qwen3.8-flash', label: 'Qwen 3.8 Flash' }]);

    const l = await ollama.listModels('', { fetchImpl: mockFetch(() => jsonResponse({ models: [{ name: 'llama3.2:latest', model: 'llama3.2:latest' }] })) });
    expect(l).toEqual([{ id: 'llama3.2:latest', label: 'llama3.2:latest' }]);
  });
  it('maps listing errors', async () => {
    await expect(
      openai.listModels(KEYS.openai, { fetchImpl: mockFetch(() => jsonResponse({ error: { code: 'invalid_api_key', message: 'Incorrect API key' } }, 401)) })
    ).rejects.toMatchObject({ kind: 'invalid_key' });
  });
});

describe('key isolation', () => {
  const fakeStorage = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  };

  it('each provider only contacts its documented host and only carries its own key', async () => {
    const ks = createKeyStore(fakeStorage());
    for (const [id, key] of Object.entries(KEYS)) ks.set(id, key);
    const allKeys = Object.values(KEYS);

    for (const p of PROVIDERS) {
      const fetchImpl = mockFetch((url, init) => (init.method === 'GET' ? jsonResponse({ data: [], models: [] }) : streamResponse([])));
      const key = p.needsKey ? ks.get(p.id) : '';
      await p.stream({ key, prompt: 'hello', fetchImpl });
      await p.listModels(key, { fetchImpl });
      expect(fetchImpl.calls.length).toBe(2);
      for (const call of fetchImpl.calls) {
        const u = new URL(call.url);
        expect(u.host).toBe(HOSTS[p.id]);
        expect(u.origin).toBe(p.origin);
        const wire = call.url + JSON.stringify(call.init.headers || {}) + String(call.init.body || '');
        for (const other of allKeys) {
          if (other !== KEYS[p.id]) expect(wire).not.toContain(other);
        }
      }
      if (p.needsKey && p.id !== 'openrouter') {
        // The key travels in a header (never in the URL) on every call.
        for (const call of fetchImpl.calls) {
          expect(call.url).not.toContain(KEYS[p.id]);
          expect(JSON.stringify(call.init.headers)).toContain(KEYS[p.id]);
        }
      }
    }
  });
});

describe('error mapping', () => {
  it('maps HTTP statuses to friendly kinds for every provider', () => {
    for (const p of KEYED_PROVIDERS) {
      expect(p.mapError(401, null).kind).toBe('invalid_key');
      expect(p.mapError(429, null).kind).toBe('rate_limit');
      expect(p.mapError(404, { error: { message: 'no such model' } }).kind).toBe('not_found');
      expect(p.mapError(500, null).kind).toBe('server');
      expect(p.mapError(503, null).kind).toBe('overloaded');
      expect(p.mapError({ status: 401 }, null)).toBeInstanceOf(ApiError);
    }
    expect(anthropic.mapError(529, null).kind).toBe('overloaded');
    expect(anthropic.mapError(400, { error: { type: 'invalid_request_error', message: 'Your credit balance is too low' } }).kind).toBe('quota');
    expect(anthropic.mapError(400, { error: { message: 'max_tokens: bad' } }).kind).toBe('bad_request');
    expect(anthropic.mapError(403, { error: { type: 'permission_error', message: 'nope' } }).kind).toBe('forbidden');
    expect(openai.mapError(429, { error: { code: 'insufficient_quota', message: 'You exceeded your current quota' } }).kind).toBe('quota');
    expect(openai.mapError(404, { error: { code: 'model_not_found', message: 'The model does not exist' } }).kind).toBe('not_found');
    expect(gemini.mapError(400, { error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' } }).kind).toBe('invalid_key');
    expect(gemini.mapError(403, { error: { status: 'PERMISSION_DENIED', message: 'denied' } }).kind).toBe('invalid_key');
    expect(gemini.mapError(429, { error: { status: 'RESOURCE_EXHAUSTED', message: 'You exceeded your current quota' } }).kind).toBe('quota');
    expect(gemini.mapError(404, { error: { status: 'NOT_FOUND', message: 'models/x is not found' } }).kind).toBe('not_found');
    expect(openrouter.mapError(402, { error: { message: 'Insufficient credits' } }).kind).toBe('quota');
    expect(openrouter.mapError(400, { error: { message: 'No endpoints found for x/y' } }).kind).toBe('not_found');
    expect(ollama.mapError(404, { error: "model 'x' not found, try pulling it first" }).kind).toBe('not_found');
    expect(ollama.mapError(403, null)).toMatchObject({ kind: 'network', message: ORIGINS_HINT });
  });
  it('maps thrown errors: network/CORS failure and user abort', () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    for (const p of PROVIDERS) {
      expect(p.mapError(new TypeError('Failed to fetch')).kind).toBe('network');
      expect(p.mapError(abort).kind).toBe('aborted');
    }
    expect(ollama.mapError(new TypeError('Failed to fetch')).message).toContain('OLLAMA_ORIGINS=https://lance6x5.github.io');
    expect(openai.mapError(new TypeError('Failed to fetch')).message).toMatch(/api\.openai\.com/);
  });
  it('rejects streams with mapped errors', async () => {
    const fetchImpl = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(ollama.stream({ prompt: 'x', fetchImpl })).rejects.toMatchObject({ kind: 'network' });
    const bad = async () => jsonResponse({ error: { type: 'authentication_error', message: 'invalid x-api-key' } }, 401);
    await expect(anthropic.stream({ key: KEYS.anthropic, prompt: 'x', fetchImpl: bad })).rejects.toMatchObject({ kind: 'invalid_key' });
  });
});
