import { describe, it, expect } from 'vitest';
import { buildExport, parseImport, analyzeImport, resolveImport, EXPORT_FORMAT, SCHEMA_VERSION } from './schema.js';
import { createPrompt } from './prompt.js';
import { buildIssueUrl, ISSUES_URL } from './feedback.js';
import { createKeyStore, maskKey, KEY_STORAGE } from './keyStore.js';

describe('export / import schema', () => {
  const existing = [createPrompt({ id: 'a', title: 'Alpha', body: 'one' }), createPrompt({ id: 'b', title: 'Beta', body: 'two' })];

  it('builds a versioned export', () => {
    const ex = buildExport(existing, '1.0.0', new Date('2026-01-01T00:00:00Z'));
    expect(ex.format).toBe(EXPORT_FORMAT);
    expect(ex.schemaVersion).toBe(SCHEMA_VERSION);
    expect(ex.appVersion).toBe('1.0.0');
    expect(ex.exportedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(ex.prompts).toHaveLength(2);
  });

  it('round-trips through JSON', () => {
    const parsed = parseImport(JSON.parse(JSON.stringify(buildExport(existing, '1.0.0'))));
    expect(parsed.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('rejects bad files and newer schemas', () => {
    expect(() => parseImport({ foo: 1 })).toThrow();
    expect(() => parseImport({ format: 'other', prompts: [] })).toThrow();
    expect(() => parseImport({ format: EXPORT_FORMAT, schemaVersion: 99, prompts: [] })).toThrow(/schema version/);
    expect(parseImport([{ title: 'x', body: 'y' }, null, 5])).toHaveLength(1);
  });

  it('detects duplicates by id or title+body', () => {
    const incoming = [
      createPrompt({ id: 'a', title: 'Alpha changed', body: 'x' }),
      createPrompt({ id: 'zz', title: 'beta ', body: 'two' }),
      createPrompt({ id: 'new', title: 'New', body: 'n' }),
    ];
    const { fresh, duplicates } = analyzeImport(existing, incoming);
    expect(fresh.map((p) => p.id)).toEqual(['new']);
    expect(duplicates.map((d) => d.existing.id)).toEqual(['a', 'b']);
  });

  it('resolves with skip / overwrite / keep-both', () => {
    const incoming = [createPrompt({ id: 'a', title: 'Alpha v2', body: 'one!' }), createPrompt({ id: 'n', title: 'N', body: 'n' })];
    const skip = resolveImport(existing, incoming, 'skip');
    expect(skip).toMatchObject({ added: 1, overwritten: 0, skipped: 1 });
    expect(skip.toPut.map((p) => p.id)).toEqual(['n']);

    const over = resolveImport(existing, incoming, 'overwrite');
    expect(over).toMatchObject({ added: 1, overwritten: 1, skipped: 0 });
    expect(over.toPut.find((p) => p.id === 'a').title).toBe('Alpha v2');

    const both = resolveImport(existing, incoming, 'keep-both');
    expect(both).toMatchObject({ added: 2, overwritten: 0, skipped: 0 });
    const copy = both.toPut.find((p) => p.title === 'Alpha v2 (imported)');
    expect(copy.id).not.toBe('a');
  });
});

describe('feedback URLs', () => {
  it('builds a bug report URL with version and environment', () => {
    const url = new URL(buildIssueUrl('bug', { version: '1.0.0', userAgent: 'Mozilla/5.0  (Test)' }));
    expect(url.origin + url.pathname).toBe(`${ISSUES_URL}/new`);
    expect(url.searchParams.get('template')).toBe('bug_report.yml');
    expect(url.searchParams.get('title')).toBe('[Bug]: ');
    expect(url.searchParams.get('version')).toBe('1.0.0');
    expect(url.searchParams.get('environment')).toBe('Mozilla/5.0 (Test)');
  });
  it('builds a feature request URL without environment', () => {
    const url = new URL(buildIssueUrl('feature', { version: '1.0.0', userAgent: 'UA' }));
    expect(url.searchParams.get('template')).toBe('feature_request.yml');
    expect(url.searchParams.get('title')).toBe('[Feature]: ');
    expect(url.searchParams.has('environment')).toBe(false);
  });
  it('trims long user agents and encodes', () => {
    const url = buildIssueUrl('bug', { version: '1.0.0', userAgent: 'x&y '.repeat(100) });
    expect(url.length).toBeLessThan(400);
    expect(new URL(url).searchParams.get('environment').length).toBeLessThanOrEqual(120);
  });
});

describe('key store', () => {
  const fakeStorage = () => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      _m: m,
    };
  };
  const SAMPLE = 'test-key-not-real-1234';

  it('keeps the key in memory by default', () => {
    const s = fakeStorage();
    const ks = createKeyStore(s);
    ks.set(SAMPLE);
    expect(ks.get()).toBe(SAMPLE);
    expect(s._m.has(KEY_STORAGE)).toBe(false);
    expect(createKeyStore(s).get()).toBe('');
  });
  it('persists only when remembered, and forgets', () => {
    const s = fakeStorage();
    const ks = createKeyStore(s);
    ks.set(SAMPLE, true);
    expect(createKeyStore(s).get()).toBe(SAMPLE);
    ks.setRemember(false);
    expect(s._m.has(KEY_STORAGE)).toBe(false);
    expect(ks.get()).toBe(SAMPLE);
    ks.forget();
    expect(ks.get()).toBe('');
  });
  it('masks all but the last 4 characters', () => {
    expect(maskKey(SAMPLE)).toBe('••••1234');
    expect(maskKey('')).toBe('');
  });
});
