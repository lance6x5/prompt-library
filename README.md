<p align="center">
  <img src="public/wordmark.svg" alt="Promptvault" width="360" />
</p>

# Promptvault

**Your best prompts, kept and ready.**

![Visits](https://abacus.jasoncameron.dev/get/lance6x5.github.io/prompt-library/shield)

A **Silverlight DevTech** project · © 2026 Silverlight DevTech. Source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

More apps: [lance6x5.github.io](https://lance6x5.github.io/)

Promptvault is a local-first prompt library: save, organize, tag, search and reuse AI prompts right in your browser, then export them as JSON. It runs 100% client-side on GitHub Pages — no accounts, no server, your prompts stay in your browser (the only outside request is an anonymous visit count, plus optional AI runs with your own key, sent straight to the provider you choose) — and works offline as an installable PWA.

Live app: https://lance6x5.github.io/prompt-library/

## Features

- **Prompt records** — title, multi-line body, tags, category, target model, notes, favorite flag, created/updated timestamps and usage count.
- **Template variables** — write `{{variable_name}}` in a prompt; "Use" opens a form to fill the values, previews the result and copies the completed prompt.
- **Organization** — categories, tag management (create, rename, merge, delete), tag filters with AND/OR matching, Favorites and Recently used views.
- **Search** — instant fuzzy full-text search (Fuse.js) across title, body, tags and notes.
- **Keyboard shortcuts** — `/` focuses search, `n` creates a new prompt, `↑`/`↓` (or `j`/`k`) select, `Enter` copies the selected prompt.
- **Editing** — Markdown-friendly editor with a preview toggle, version history (last 10 edits per prompt, restorable) and duplicate.
- **Import / export** — export all or a filtered selection to JSON (documented schema version), import with duplicate detection (skip, overwrite or keep both), copy a single prompt as Markdown.
- **Run with AI (optional)** — bring your own key for **Anthropic (Claude), OpenAI, Google Gemini or OpenRouter** (one key for Llama, Mistral, DeepSeek, Qwen and more), or use **Ollama** for local models with no key. Streamed output with a Stop button, per-provider key slots, suggested models plus "Refresh models" and custom model ids, and clear errors (invalid key, rate limit, quota, model not found, overloaded, network/CORS). See [Security](#security).
- **Example library** — about 60 ready-made prompts across writing, coding, career, learning, productivity, data & analysis, creative and communication, many from the public-domain [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) collection (CC0 1.0). Find them under **Browse examples** (tag `#example`). Existing users are offered new examples once via a dismissible banner; nothing in your library is overwritten.
- **Storage** — IndexedDB, seeded with the example library on first run (versioned, so upgrades only ever add new examples, skipping duplicates). "Reset all data" with a confirmation step.
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

"Run with AI" uses a **bring-your-own-key (BYOK)** model: requests go **directly from your browser** to the AI provider
you choose. Promptvault has no server and never sees your keys or prompts.

| Provider | Key | Requests go only to |
| --- | --- | --- |
| Anthropic (Claude) | your Anthropic key | `https://api.anthropic.com` |
| OpenAI (GPT) | your OpenAI key | `https://api.openai.com` |
| Google Gemini | your Gemini API key | `https://generativelanguage.googleapis.com` |
| OpenRouter (Llama, Mistral, DeepSeek, Qwen…) | your OpenRouter key | `https://openrouter.ai` |
| Ollama (local models) | none | `http://localhost:11434` on your own computer |

- **One key slot per provider.** Each key is only ever sent to its own provider's API (a unit test checks that every
  provider's requests go only to its documented host and carry only its own key). Gemini keys travel in the
  `x-goog-api-key` header, never in the URL.
- **Memory-only by default.** Keys disappear when the tab closes. You can opt in to **"Remember on this device"** per
  provider, which stores that key in `localStorage` — anyone with access to that browser (or a malicious extension)
  could read it. Keys are masked in the UI (only the last 4 characters are shown, e.g. `••••abcd`); **Forget key**
  removes one key and **Forget all keys** removes them all. Your last provider and model are remembered; keys are not
  (unless you opted in).
- **Browser-direct access has risks.** Any key used from browser code is visible to that browser (dev tools,
  extensions, anyone with access to the device). That is acceptable here only because each user supplies their own
  key. Anthropic requires the `anthropic-dangerous-direct-browser-access: true` header for direct browser (CORS)
  calls for exactly this reason.
- **Create dedicated keys with spending limits** for use with this app — in the
  [Anthropic Console](https://platform.claude.com/settings/keys), [OpenAI dashboard](https://platform.openai.com/api-keys),
  [Google AI Studio](https://aistudio.google.com/apikey) or [OpenRouter](https://openrouter.ai/settings/keys) — and
  revoke a key if you think it was exposed.
- **Ollama** runs models locally and needs no key, but only works on the same computer as the browser. Ollama blocks
  web pages by default; allow this site's origin when you start it:

  ```bash
  OLLAMA_ORIGINS=https://lance6x5.github.io ollama serve
  ```

  (On Windows/macOS set `OLLAMA_ORIGINS` as an environment variable for the Ollama app, then restart it.) Some
  browsers may still block an HTTPS page from calling `http://localhost`.
- **Content Security Policy.** The production build ships a CSP whose `connect-src` allows exactly: `'self'`,
  `https://api.anthropic.com`, `https://api.openai.com`, `https://generativelanguage.googleapis.com`,
  `https://openrouter.ai`, `http://localhost:11434`, `http://127.0.0.1:11434` and the anonymous visit counter
  `https://abacus.jasoncameron.dev` (see [Privacy & analytics](#privacy--analytics)) — no wildcards. The counter code is
  separate from the BYOK code and never receives your keys, prompts or any other data.
- **Model lists don't go stale.** Each provider has a small list of suggested models (checked against the provider's
  docs on 2026-11-27), a **Refresh models** button that asks the provider for the models your key can use, and a
  free-text custom model id.

**Never commit API keys** (or `.env` files — they are git-ignored). Keys in a public repo are scraped within minutes
and can run up charges.

## Privacy & analytics

Promptvault counts **one anonymous page load per browser session** using the open-source [Abacus](https://github.com/JasonLovesDoggo/abacus) counter. That is the only outside request besides the optional "Run with AI" calls you make yourself to the provider you choose.

- No cookies, no personal data stored, and nothing from the app (prompts, settings, API keys) is sent — just a plain request with no referrer.
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
    providers/         BYOK AI providers (fetch + SSE/NDJSON streaming, no SDKs)
      anthropic.js, openai.js, gemini.js, openrouter.js, ollama.js, common.js, index.js
    csp.js             hosts allowed by the production CSP connect-src
    db.js              IndexedDB persistence
    feedback.js        GitHub issue URL builder
    visits.js          anonymous Abacus visit counter
    keyStore.js        per-provider keys: in-memory / opt-in localStorage
    seed.js            versioned example prompts + upgrade logic
    seedLibrary.js     example prompt texts (imported CC0 + original)
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

Third-party dependencies keep their own licenses. The imported example prompts are public domain (CC0 1.0); see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## Trademarks

Promptvault and its logo are trademarks of Silverlight DevTech. The license covers the code only, not the names
or logos, so forks must use a different name and logo.
