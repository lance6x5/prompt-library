import { ISSUES_URL, REPO_URL, buildIssueUrl } from '../lib/feedback.js';

const BASE = import.meta.env.BASE_URL;

export default function AboutPage({ version }) {
  return (
    <section aria-labelledby="about-h" className="about">
      <img src={`${BASE}logo.svg`} alt="Promptvault logo" width="72" height="72" />
      <h1 id="about-h">Promptvault</h1>
      <p className="lead">Your best prompts, kept and ready.</p>
      <p>
        Version <strong>v{version}</strong>
      </p>
      <p>
        Save, tag, search and reuse AI prompts. Everything is stored locally in your browser (IndexedDB) and works
        offline. Use Import / Export to back up or move your library.
      </p>

      <h2>Keyboard shortcuts</h2>
      <table className="shortcuts">
        <tbody>
          <tr>
            <th scope="row">
              <kbd>/</kbd>
            </th>
            <td>Focus search</td>
          </tr>
          <tr>
            <th scope="row">
              <kbd>n</kbd>
            </th>
            <td>New prompt</td>
          </tr>
          <tr>
            <th scope="row">
              <kbd>↑</kbd> <kbd>↓</kbd> or <kbd>j</kbd> <kbd>k</kbd>
            </th>
            <td>Move selection in the list</td>
          </tr>
          <tr>
            <th scope="row">
              <kbd>Enter</kbd>
            </th>
            <td>Copy the selected prompt (opens the variable form if it has variables)</td>
          </tr>
          <tr>
            <th scope="row">
              <kbd>Esc</kbd>
            </th>
            <td>Clear search / close dialogs</td>
          </tr>
        </tbody>
      </table>

      <h2>Privacy</h2>
      <p>
        No accounts, no server; your prompts are stored only in this browser. The optional “Run with AI” feature sends the prompt
        you run directly from your browser to the AI provider you choose (Anthropic, OpenAI, Google Gemini, OpenRouter, or a
        local Ollama server), using your own key — each key is sent only to its own provider. The only other outside request is an
        anonymous visit count (one per browser session, via the open-source Abacus counter) that carries no prompts, key
        or other data; Do Not Track and Global Privacy Control are respected.
      </p>

      <h2>Feedback</h2>
      <p>
        <a href={buildIssueUrl('bug', { version })} target="_blank" rel="noopener">
          Report a bug
        </a>{' '}
        ·{' '}
        <a href={buildIssueUrl('feature', { version })} target="_blank" rel="noopener">
          Request a feature
        </a>{' '}
        ·{' '}
        <a href={ISSUES_URL} target="_blank" rel="noopener">
          All issues
        </a>{' '}
        ·{' '}
        <a href={REPO_URL} target="_blank" rel="noopener">
          Source
        </a>
      </p>
      <p className="small muted">Opens GitHub — a free GitHub account is required. Don't include personal data.</p>
    </section>
  );
}
