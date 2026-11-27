<p align="center">
  <img src="public/wordmark.svg" alt="Promptvault" width="360" />
</p>

# Promptvault

**Your best prompts, kept and ready.**

![Visits](https://abacus.jasoncameron.dev/get/lance6x5.github.io/prompt-library/shield)

A **Silverlight DevTech** project · © 2026 Silverlight DevTech. Source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

More apps: [lance6x5.github.io](https://lance6x5.github.io/)

Promptvault is a local-first prompt library: save, organize, tag, search and reuse AI prompts right in your browser, then export them as JSON. It runs 100% client-side on GitHub Pages — no accounts, no server, your prompts stay in your browser (the only outside request is an anonymous visit count, plus optional AI runs with your own key) — and works offline as an installable PWA.

Live app: https://lance6x5.github.io/prompt-library/

## Features

- **Prompt records** — title, multi-line body, tags, category, target model, notes, favorite flag, created/updated timestamps and usage count.
- **Template variables** — write `{{variable_name}}` in a prompt; "Use" opens a form to fill the values, previews the result and copies the completed prompt.
- **Organization** — categories, tag management (create, rename, merge, delete), tag filters with AND/OR matching, Favorites and Recently used views.
- **Search** — instant fuzzy full-text search (Fuse.js) across title, body, tags and notes.
- **Keyboard shortcuts** — `/` focuses search, `n` creates a new prompt, `↑`/`↓` (or `j`/`k`) select, `Enter` copies the selected prompt.
- **Editing** — Markdown-friendly editor with a preview toggle, version history (last 10 edits per prompt, restorable) and duplicate.
- **Import / export** — export all or a filtered selection to JSON (documented schema version), import with duplicate detection (skip, overwrite or keep both), copy a single prompt as Markdown.
- **Run with AI (optional)** — bring your own Anthropic API key and run a prompt directly from the browser with streamed output. See [Security](#security).
- **Storage** — IndexedDB, seeded with 5 example prompts on first run. "Reset all data" with a confirmation step.
- **Quality** — responsive (375px and up), light/dark mode via `prefers-color-scheme` (plus a manual override), keyboard accessible with visible focus states.

## Local development

Requires Node 22+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173/prompt-library/)
npm test         # run unit tests once (vitest run)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Deploy (GitHub Pages)

Deployment is automated by `.github/workflows/deploy.yml`, which installs, tests, builds and deploys on every push to `main` (and can be run manually via *workflow_dispatch*).

One-time setup: **Repo Settings → Pages → Source: "GitHub Actions"**.

The Vite `base` is `/prompt-library/`; change it in `vite.config.js` if you fork under a different repo name.

## Export file format

```jsonc
{
  "format": "promptvault.prompts",
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "prompts": [
    {
      "id": "uuid", "title": "…", "body": "…", "tags": ["…"], "category": "…",
      "model": "…", "notes": "…", "favorite": false,
      "createdAt": 0, "updatedAt": 0, "usageCount": 0, "lastUsedAt": null,
      "history": [{ "savedAt": 0, "title": "…", "body": "…", "tags": [], "category": "", "model": "", "notes": "" }]
    }
  ]
}
```

Timestamps are epoch milliseconds. A bare array of prompt objects is also accepted on import. Duplicates are detected by matching `id` or identical title + body.

## Security

"Run with AI" uses a **bring-your-own-key (BYOK)** model:

- You paste your own Anthropic API key in **Settings**. It is never part of this repository, never hard-coded, and is sent **only** to `https://api.anthropic.com`.
- By default the key is kept **in memory only** and disappears when the tab closes. You can opt in to **"Remember on this device"**, which stores it in `localStorage` — anyone with access to that browser (or a malicious extension) could read it.
- The key is masked in the UI (only the last 4 characters are shown, e.g. `••••abcd`), and **Forget key** removes it immediately.
- Requests use the `anthropic-dangerous-direct-browser-access: true` header, which the API requires for direct browser (CORS) calls. It is "dangerous" because browser-side keys are exposed to the browser; that is acceptable here only because each user supplies their own key.
- The production build ships a Content Security Policy whose `connect-src` allows only the app itself, `https://api.anthropic.com` and the anonymous visit counter `https://abacus.jasoncameron.dev` (see [Privacy & analytics](#privacy--analytics)). The counter code is separate from the BYOK code and never receives your key, prompts or any other data.

**Never commit API keys** (or `.env` files — they are git-ignored). Keys in a public repo are scraped within minutes and can run up charges. **Create a dedicated key with a spending limit** in the Anthropic Console for use with this app, and revoke it if you think it was exposed.

## Privacy & analytics

Promptvault counts **one anonymous page load per browser session** using the open-source [Abacus](https://github.com/JasonLovesDoggo/abacus) counter. That is the only outside request besides the optional "Run with AI" calls you make yourself.

- No cookies, no personal data stored, and nothing from the app (prompts, settings, API key) is sent — just a plain request with no referrer.
- **Do Not Track** and **Global Privacy Control** are respected: with either enabled, your visit is not counted (the total is only read). Local development (`localhost`) is never counted.
- Like any web request, it reveals your IP address to the counter service.
- The count is approximate (it includes bots and is not unique visitors) and public — see the badge above.

## Feedback & issues

Found a bug or have an idea? Use the **Feedback** menu in the app header, or go straight to GitHub:

- [All issues](https://github.com/lance6x5/prompt-library/issues)
- [Report a bug](https://github.com/lance6x5/prompt-library/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/lance6x5/prompt-library/issues/new?template=feature_request.yml)

The in-app links open a pre-filled GitHub issue form (app version and, for bugs, your browser string) — a free GitHub account is required, and no prompt data is ever included. See [CONTRIBUTING.md](CONTRIBUTING.md) for the triage flow.

## Versioning

Promptvault follows [Semantic Versioning](https://semver.org/). The current version is shown in the app footer and About page.

- **MAJOR** — breaking data/schema change (e.g. a new export `schemaVersion` that older versions can't read).
- **MINOR** — new features, backwards compatible.
- **PATCH** — bug fixes.

Changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Project structure

```
src/
  App.jsx              app state, routing, shortcuts
  components/          React views (list, detail, editor, dialogs, settings…)
  lib/                 pure logic modules + unit tests
    anthropic.js       BYOK Messages API client (fetch + SSE streaming)
    db.js              IndexedDB persistence
    feedback.js        GitHub issue URL builder
    visits.js          anonymous Abacus visit counter
    keyStore.js        in-memory / opt-in localStorage key handling
    markdown.js        safe Markdown renderer
    prompt.js          prompt records, version history
    schema.js          export/import schema + duplicate handling
    search.js          Fuse.js fuzzy search
    tags.js, filter.js tag operations and view filters
    template.js        {{variable}} parsing and filling
public/                logo, favicon and PWA icons (SVG)
```

## License

Promptvault is **source-available**, not OSI-approved open source. It is licensed under the
[PolyForm Noncommercial License 1.0.0](LICENSE.md) (SPDX: `PolyForm-Noncommercial-1.0.0`).

- **Free for noncommercial use**: personal, educational, research, nonprofit and other noncommercial use.
- **Commercial use requires a separate commercial license** from Silverlight DevTech. This includes selling it,
  hosting it as a paid service, or using it inside a business product. To ask about one, open a
  [GitHub issue](https://github.com/lance6x5/prompt-library/issues) on this repo.
- **Redistributing?** Keep [LICENSE.md](LICENSE.md) and its `Required Notice` line with every copy.

Third-party dependencies keep their own licenses.

## Trademarks

Promptvault and its logo are trademarks of Silverlight DevTech. The license covers the code only, not the names
or logos, so forks must use a different name and logo.
