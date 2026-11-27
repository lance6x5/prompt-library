import { describe, it, expect } from 'vitest';
import {
  buildRequest,
  mapHttpError,
  mapThrownError,
  createSseParser,
  interpretEvent,
  streamMessage,
  clampMaxTokens,
  API_URL,
  DEFAULT_MODEL,
  MODELS,
} from './anthropic.js';

const KEY = 'test-key-not-real-abcd';

describe('request building', () => {
  it('sets required headers and a streaming body', () => {
    const { url, init } = buildRequest({ apiKey: KEY, model: 'claude-haiku-5-5', maxTokens: 50, prompt: 'hi' });
    expect(url).toBe(API_URL);
    expect(init.method).toBe('POST');
    expect(init.headers['x-api-key']).toBe(KEY);
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
    expect(init.headers['content-type']).toBe('application/json');
    expect(init.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(JSON.parse(init.body)).toEqual({
      model: 'claude-haiku-5-5',
      max_tokens: 50,
      stream: true,
      messages: [{ role: 'user', content: 'hi' }],
    });
  });
  it('defaults model and clamps tokens', () => {
    expect(JSON.parse(buildRequest({ apiKey: KEY, prompt: 'x' }).init.body).model).toBe(DEFAULT_MODEL);
    expect(DEFAULT_MODEL).toBe('claude-sonnet-5-5');
    expect(MODELS.map((m) => m.id)).toEqual(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5']);
    expect(clampMaxTokens(-5)).toBe(1024);
    expect(clampMaxTokens('abc')).toBe(1024);
    expect(clampMaxTokens(10 ** 9)).toBe(64000);
  });
});

describe('error mapping', () => {
  it('maps statuses to friendly kinds', () => {
    expect(mapHttpError(401, null).kind).toBe('invalid_key');
    expect(mapHttpError(429, null).kind).toBe('rate_limit');
    expect(mapHttpError(529, null).kind).toBe('overloaded');
    expect(
      mapHttpError(400, { error: { type: 'invalid_request_error', message: 'Your credit balance is too low' } }).kind
    ).toBe('quota');
    expect(mapHttpError(400, { error: { message: 'Billing issue' } }).kind).toBe('quota');
    expect(mapHttpError(400, { error: { message: 'max_tokens: bad' } }).kind).toBe('bad_request');
    expect(mapHttpError(500, null).kind).toBe('server');
  });
  it('maps fetch TypeError to network failure', () => {
    expect(mapThrownError(new TypeError('Failed to fetch')).kind).toBe('network');
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    expect(mapThrownError(abort).kind).toBe('aborted');
  });
});

describe('SSE parsing', () => {
  it('handles events split across chunks', () => {
    const feed = createSseParser();
    const a = feed('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"He');
    expect(a).toEqual([]);
    const b = feed('llo"}}\n\nevent: ping\ndata: {"type":"ping"}\n\n');
    expect(b).toHaveLength(2);
    expect(interpretEvent(b[0])).toEqual({ text: 'Hello' });
    expect(interpretEvent(b[1])).toEqual({});
  });
  it('throws mapped errors for error events', () => {
    expect(() => interpretEvent({ event: 'error', data: { type: 'error', error: { type: 'overloaded_error', message: 'x' } } })).toThrow(
      /overloaded/
    );
  });
});

function sseResponse(chunks) {
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

describe('streamMessage', () => {
  it('streams text deltas', async () => {
    const chunks = [
      'event: message_start\ndata: {"type":"message_start","message":{}}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi "}}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"there"}}\n\n',
      'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\nevent: message_stop\ndata: {"type":"message_stop"}\n\n',
    ];
    const seen = [];
    const res = await streamMessage({
      apiKey: KEY,
      prompt: 'x',
      onText: (t) => seen.push(t),
      fetchImpl: async () => sseResponse(chunks),
    });
    expect(res).toEqual({ text: 'Hi there', stopReason: 'end_turn' });
    expect(seen).toEqual(['Hi ', 'there']);
  });
  it('rejects with mapped HTTP errors', async () => {
    const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({ error: { type: 'authentication_error' } }) });
    await expect(streamMessage({ apiKey: KEY, prompt: 'x', fetchImpl })).rejects.toMatchObject({ kind: 'invalid_key' });
  });
  it('rejects with network error on fetch TypeError', async () => {
    const fetchImpl = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(streamMessage({ apiKey: KEY, prompt: 'x', fetchImpl })).rejects.toMatchObject({ kind: 'network' });
  });
  it('requires a key', async () => {
    await expect(streamMessage({ apiKey: '', prompt: 'x' })).rejects.toMatchObject({ kind: 'no_key' });
  });
});
