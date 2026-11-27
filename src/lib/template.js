/**
 * Template variables use the {{variable_name}} syntax.
 * Names may contain letters, digits, underscores, dashes and dots.
 */
const VAR_RE = /\{\{\s*([A-Za-z_][\w.-]*)\s*\}\}/g;

/** Return the unique variable names in order of first appearance. */
export function extractVariables(text = '') {
  const seen = new Set();
  const out = [];
  for (const m of String(text).matchAll(VAR_RE)) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

/**
 * Replace variables with supplied values. Missing values are left as the
 * original {{placeholder}} so the user can see what still needs filling.
 */
export function fillTemplate(text = '', values = {}) {
  return String(text).replace(VAR_RE, (whole, name) => {
    const v = values[name];
    return v === undefined || v === null || v === '' ? whole : String(v);
  });
}

/** Turn "user_name" into "User name" for form labels. */
export function humanizeVariable(name) {
  const s = String(name).replace(/[_.-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
