/**
 * In-app feedback: builds pre-filled GitHub "new issue" URLs.
 * No tokens, no API calls - the user submits the issue with their own GitHub
 * account. Only the app version and a trimmed browser string are included;
 * never any prompt data.
 */
export const REPO_URL = 'https://github.com/lance6x5/prompt-library';
export const ISSUES_URL = `${REPO_URL}/issues`;
const MAX_ENV = 120;

function trimEnv(ua) {
  const s = String(ua || '').replace(/\s+/g, ' ').trim();
  return s.length > MAX_ENV ? s.slice(0, MAX_ENV - 1) + '…' : s;
}

/**
 * @param {'bug'|'feature'} kind
 * @param {{ version: string, userAgent?: string }} info
 */
export function buildIssueUrl(kind, { version, userAgent } = {}) {
  const params = new URLSearchParams();
  if (kind === 'bug') {
    params.set('template', 'bug_report.yml');
    params.set('title', '[Bug]: ');
    if (version) params.set('version', version);
    const env = trimEnv(userAgent);
    if (env) params.set('environment', env);
  } else {
    params.set('template', 'feature_request.yml');
    params.set('title', '[Feature]: ');
    if (version) params.set('version', version);
  }
  return `${ISSUES_URL}/new?${params.toString()}`;
}
