/**
 * Tiny, safe Markdown renderer for prompt previews.
 * All input is HTML-escaped FIRST, then a small subset of Markdown is
 * converted. Links are restricted to http(s)/mailto, so the output is safe to
 * inject with dangerouslySetInnerHTML.
 */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(text) {
  // `text` is already escaped. Protect inline code spans first.
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, url) => {
    const decoded = url.replace(/&amp;/g, '&');
    if (!/^(https?:|mailto:)/i.test(decoded)) return label;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\{\{\s*([A-Za-z_][\w.-]*)\s*\}\}/g, '<span class="md-var">{{$1}}</span>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

export function renderMarkdown(src = '') {
  const lines = escapeHtml(src).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null; // 'ul' | 'ol'
  let inCode = false;
  let code = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join('<br>'))}</p>`);
    para = [];
  };
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };

  for (const line of lines) {
    if (inCode) {
      if (/^```/.test(line)) {
        out.push(`<pre><code>${code.join('\n')}</code></pre>`);
        inCode = false;
        code = [];
      } else code.push(line);
      continue;
    }
    if (/^```/.test(line)) {
      flushPara();
      closeList();
      inCode = true;
      continue;
    }
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      flushPara();
      closeList();
      const level = m[1].length;
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
      flushPara();
      if (list !== 'ul') {
        closeList();
        out.push('<ul>');
        list = 'ul';
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara();
      if (list !== 'ol') {
        closeList();
        out.push('<ol>');
        list = 'ol';
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
      flushPara();
      closeList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if (/^\s*$/.test(line)) {
      flushPara();
      closeList();
    } else {
      closeList();
      para.push(line);
    }
  }
  if (inCode) out.push(`<pre><code>${code.join('\n')}</code></pre>`);
  flushPara();
  closeList();
  return out.join('\n');
}
