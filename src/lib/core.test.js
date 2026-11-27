import { describe, it, expect } from 'vitest';
import { extractVariables, fillTemplate, humanizeVariable } from './template.js';
import { renderMarkdown, escapeHtml } from './markdown.js';
import {
  createPrompt,
  applyEdit,
  restoreVersion,
  duplicatePrompt,
  markUsed,
  normalizeTags,
  promptToMarkdown,
  HISTORY_LIMIT,
} from './prompt.js';
import { tagCounts, renameTag, mergeTags, deleteTag, addTag, changedPrompts } from './tags.js';
import { filterByTags, filterByView, sortPrompts, categories } from './filter.js';
import { parseHash, href } from './router.js';
import { seedPrompts } from './seed.js';

describe('template variables', () => {
  it('extracts unique variables in order', () => {
    expect(extractVariables('Hi {{name}}, {{ topic }} and {{name}} {{a.b-c}}')).toEqual(['name', 'topic', 'a.b-c']);
    expect(extractVariables('no vars {single} {{ }}')).toEqual([]);
  });
  it('fills values and leaves missing ones', () => {
    expect(fillTemplate('Hi {{name}} re {{topic}}', { name: 'Ana' })).toBe('Hi Ana re {{topic}}');
    expect(fillTemplate('{{x}}{{x}}', { x: '$&1' })).toBe('$&1$&1');
  });
  it('humanizes names', () => {
    expect(humanizeVariable('word_limit')).toBe('Word limit');
  });
});

describe('markdown', () => {
  it('escapes HTML so output is safe', () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });
  it('blocks javascript: links', () => {
    const html = renderMarkdown('[x](javascript:alert(1)) [ok](https://example.com)');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://example.com"');
  });
  it('renders headings, lists, emphasis, code and variables', () => {
    const html = renderMarkdown('# Title\n\n- one\n- **two**\n\n1. a\n\n*it* `c<d`\n\n```\n<x>\n```\n\n{{v}}');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<ul>\n<li>one</li>\n<li><strong>two</strong></li>\n</ul>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<em>it</em>');
    expect(html).toContain('<code>c&lt;d</code>');
    expect(html).toContain('<pre><code>&lt;x&gt;</code></pre>');
    expect(html).toContain('<span class="md-var">{{v}}</span>');
  });
  it('escapeHtml handles quotes', () => {
    expect(escapeHtml(`"'&`)).toBe('&quot;&#39;&amp;');
  });
});

describe('prompt records', () => {
  it('creates with defaults and normalized tags', () => {
    const p = createPrompt({ title: '  T ', tags: 'A, b ,a,,' }, 1000);
    expect(p.title).toBe('T');
    expect(p.tags).toEqual(['a', 'b']);
    expect(p.createdAt).toBe(1000);
    expect(p.usageCount).toBe(0);
    expect(p.history).toEqual([]);
    expect(normalizeTags(['X', 'x'])).toEqual(['x']);
  });
  it('keeps the last 10 versions and restores', () => {
    let p = createPrompt({ title: 'v0', body: 'b0' }, 1);
    for (let i = 1; i <= 12; i++) p = applyEdit(p, { title: `v${i}`, body: `b${i}` }, 1 + i);
    expect(p.history).toHaveLength(HISTORY_LIMIT);
    expect(p.history[0].title).toBe('v11');
    expect(p.history[9].title).toBe('v2');
    const r = restoreVersion(p, 0, 100);
    expect(r.title).toBe('v11');
    expect(r.history[0].title).toBe('v12');
    expect(r.updatedAt).toBe(100);
  });
  it('does not add history when nothing versioned changed', () => {
    const p = createPrompt({ title: 'a', body: 'b' }, 1);
    const q = applyEdit(p, { title: 'a', favorite: true }, 5);
    expect(q.history).toHaveLength(0);
    expect(q.favorite).toBe(true);
  });
  it('duplicates with new id and reset stats', () => {
    const p = markUsed(createPrompt({ title: 'a', body: 'b', favorite: true }, 1), 2);
    const d = duplicatePrompt(p, 3);
    expect(d.id).not.toBe(p.id);
    expect(d.title).toBe('a (copy)');
    expect(d.usageCount).toBe(0);
    expect(d.favorite).toBe(false);
    expect(p.usageCount).toBe(1);
    expect(p.lastUsedAt).toBe(2);
  });
  it('serializes to markdown', () => {
    const md = promptToMarkdown(createPrompt({ title: 'T', body: 'Body', tags: ['x'], category: 'C', notes: 'N' }));
    expect(md).toContain('# T');
    expect(md).toContain('**Tags:** x');
    expect(md).toContain('## Notes');
  });
});

describe('tags', () => {
  const ps = [
    createPrompt({ id: '1', tags: ['a', 'b'] }),
    createPrompt({ id: '2', tags: ['b', 'c'] }),
    createPrompt({ id: '3', tags: [] }),
  ];
  it('counts', () => {
    expect(tagCounts(ps)).toEqual([
      { tag: 'a', count: 1 },
      { tag: 'b', count: 2 },
      { tag: 'c', count: 1 },
    ]);
  });
  it('renames, merges, deletes, adds', () => {
    expect(renameTag(ps, 'b', 'B2').map((p) => p.tags)).toEqual([['a', 'b2'], ['b2', 'c'], []]);
    expect(mergeTags(ps, ['a', 'c'], 'b').map((p) => p.tags)).toEqual([['b'], ['b'], []]);
    expect(deleteTag(ps, 'b').map((p) => p.tags)).toEqual([['a'], ['c'], []]);
    const added = addTag(ps, 'New', ['3']);
    expect(added[2].tags).toEqual(['new']);
    expect(changedPrompts(ps, added).map((p) => p.id)).toEqual(['3']);
  });
});

describe('filters', () => {
  const ps = [
    createPrompt({ id: '1', title: 'B', tags: ['x', 'y'], category: 'Cat', favorite: true, lastUsedAt: 5, updatedAt: 1, usageCount: 3 }),
    createPrompt({ id: '2', title: 'A', tags: ['y'], lastUsedAt: 9, updatedAt: 2 }),
    createPrompt({ id: '3', title: 'C', tags: ['z'], updatedAt: 3 }),
  ];
  it('AND / OR tags', () => {
    expect(filterByTags(ps, ['x', 'y'], 'and').map((p) => p.id)).toEqual(['1']);
    expect(filterByTags(ps, ['x', 'z'], 'or').map((p) => p.id)).toEqual(['1', '3']);
    expect(filterByTags(ps, [], 'and')).toHaveLength(3);
  });
  it('views', () => {
    expect(filterByView(ps, { type: 'favorites' }).map((p) => p.id)).toEqual(['1']);
    expect(filterByView(ps, { type: 'recent' }).map((p) => p.id)).toEqual(['2', '1']);
    expect(filterByView(ps, { type: 'category', name: 'Cat' }).map((p) => p.id)).toEqual(['1']);
    expect(filterByView(ps, { type: 'category', name: '' }).map((p) => p.id)).toEqual(['2', '3']);
  });
  it('sorts and lists categories', () => {
    expect(sortPrompts(ps, 'title').map((p) => p.id)).toEqual(['2', '1', '3']);
    expect(sortPrompts(ps, 'updated').map((p) => p.id)).toEqual(['3', '2', '1']);
    expect(sortPrompts(ps, 'usage')[0].id).toBe('1');
    expect(categories(ps)).toEqual(['Cat']);
  });
});

describe('router', () => {
  it('parses hashes', () => {
    expect(parseHash('')).toEqual({ name: 'list', view: { type: 'all' } });
    expect(parseHash('#/favorites').view.type).toBe('favorites');
    expect(parseHash('#/category/My%20Cat')).toEqual({ name: 'list', view: { type: 'category', name: 'My Cat' } });
    expect(parseHash('#/prompt/abc')).toEqual({ name: 'detail', id: 'abc' });
    expect(parseHash('#/settings').name).toBe('settings');
    expect(parseHash('#/nope').name).toBe('notfound');
    expect(href('edit', 'a b')).toBe('#/edit/a%20b');
  });
});

describe('seed', () => {
  it('provides 5 example prompts with variables', () => {
    const s = seedPrompts(1e12);
    expect(s).toHaveLength(5);
    expect(new Set(s.map((p) => p.id)).size).toBe(5);
    expect(s.every((p) => extractVariables(p.body).length > 0)).toBe(true);
  });
});
