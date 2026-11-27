import { describe, it, expect } from 'vitest';
import { getVisitCount, formatVisits, COUNTER_BASE, COUNTER_KEY, SESSION_FLAG } from './visits.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

function mockFetch(responder) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return responder(url, init);
  };
  fn.calls = calls;
  return fn;
}

const ok = (value) => ({ ok: true, status: 200, json: async () => ({ value }) });
const PROD = 'lance6x5.github.io';

describe('visit counter', () => {
  it('hits on first load, then gets for the rest of the session', async () => {
    const storage = memoryStorage();
    const fetch = mockFetch(() => ok(42));
    const env = { fetch, storage, navigator: {}, hostname: PROD };
    expect(await getVisitCount(env)).toBe(42);
    expect(await getVisitCount(env)).toBe(42);
    expect(fetch.calls.map((c) => c.url)).toEqual([
      `${COUNTER_BASE}/hit/${COUNTER_KEY}`,
      `${COUNTER_BASE}/get/${COUNTER_KEY}`,
    ]);
    expect(storage.getItem(SESSION_FLAG)).toBe('1');
  });

  it('sends no data, headers, credentials or referrer', async () => {
    const fetch = mockFetch(() => ok(1));
    await getVisitCount({ fetch, storage: memoryStorage(), navigator: {}, hostname: PROD });
    const { url, init } = fetch.calls[0];
    expect(url).not.toContain('?');
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeUndefined();
    expect(init.credentials).toBe('omit');
    expect(init.cache).toBe('no-store');
    expect(init.referrerPolicy).toBe('no-referrer');
  });

  it('returns null on failure and does not set the session flag', async () => {
    const storage = memoryStorage();
    const env = { storage, navigator: {}, hostname: PROD };
    expect(await getVisitCount({ ...env, fetch: mockFetch(() => ({ ok: false, status: 500, json: async () => ({}) })) })).toBeNull();
    expect(await getVisitCount({ ...env, fetch: mockFetch(() => Promise.reject(new TypeError('offline'))) })).toBeNull();
    expect(await getVisitCount({ ...env, fetch: mockFetch(() => ({ ok: true, json: async () => ({ error: 'x' }) })) })).toBeNull();
    expect(storage.getItem(SESSION_FLAG)).toBeNull();
  });

  it('only reads (/get) with Do Not Track, Global Privacy Control or on localhost', async () => {
    for (const env of [
      { navigator: { doNotTrack: '1' }, hostname: PROD },
      { navigator: { globalPrivacyControl: true }, hostname: PROD },
      { navigator: {}, hostname: 'localhost' },
      { navigator: {}, hostname: '127.0.0.1' },
    ]) {
      const fetch = mockFetch(() => ok(7));
      expect(await getVisitCount({ ...env, fetch, storage: memoryStorage() })).toBe(7);
      expect(fetch.calls[0].url).toBe(`${COUNTER_BASE}/get/${COUNTER_KEY}`);
    }
  });

  it('survives broken storage', async () => {
    const storage = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('denied');
      },
    };
    const fetch = mockFetch(() => ok(3));
    expect(await getVisitCount({ fetch, storage, navigator: {}, hostname: PROD })).toBe(3);
  });

  it('formats numbers', () => {
    expect(formatVisits(12345, 'en-US')).toBe('12,345');
  });
});
