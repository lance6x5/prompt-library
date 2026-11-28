# Changelog

All notable changes to Promptvault are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-11-27

### Added
- "Install app" button in the header. It appears only when the browser can install the app and it isn't installed yet (Chrome, Edge, Android), shows "Share > Add to Home Screen" steps on iPhone/iPad, and disappears once installed.

## [1.3.1] - 2026-11-27

### Changed
- Footer studio credit now uses the Silverlight DevTech company mark (the "47 Ag" periodic-table tile), replacing the interim crescent mark.

## [1.3.0] - 2026-11-27

### Added

- **More AI providers** for "Run with AI", all bring-your-own-key and browser-direct: OpenAI, Google Gemini, OpenRouter (one key for Llama, Mistral, DeepSeek, Qwen and more) and Ollama for local models (no key; requires `OLLAMA_ORIGINS=https://lance6x5.github.io`), alongside Anthropic.
- Provider abstraction in `src/lib/providers/` (one module per provider: request builder, SSE/NDJSON stream parser, model listing, error mapping).
- Per-provider key slots: memory-only by default, opt-in "Remember on this device" per provider, masked display, "Forget key" per provider and "Forget all keys".
- Model picker per provider: suggested models checked against each provider's docs, a "Refresh models" button that loads the models your key can use, and a custom model id. The last provider and model are remembered (keys are not, unless you opt in).
- Clear per-provider errors for invalid key, rate limit, quota/billing, model not found, overloaded/5xx, network/CORS failure (with an `OLLAMA_ORIGINS` hint for Ollama) and user abort.
- **57 new example prompts**: 42 curated from the public-domain [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) collection (CC0 1.0, credited in each prompt's notes and in `THIRD-PARTY-NOTICES.md`) and 15 original prompts that show off `{{variables}}` (meeting summary, tone rewrite, PR review, study plan, PRD outline, SQL explainer, bug triage and more), across Writing, Coding, Career, Learning, Productivity, Data & Analysis, Creative and Communication.
- "Browse examples" view (`#/examples`) listing every prompt tagged `#example`, with an "Add any missing examples" action.
- Versioned example set (seed version 2): existing users see a dismissible, non-blocking banner ("N new example prompts are available — Add them / No thanks"); adding skips anything with the same title and text, and never changes or deletes existing prompts.
- `THIRD-PARTY-NOTICES.md`.

### Changed

- Content Security Policy `connect-src` now allows exactly `'self'`, `https://api.anthropic.com`, `https://api.openai.com`, `https://generativelanguage.googleapis.com`, `https://openrouter.ai`, `http://localhost:11434`, `http://127.0.0.1:11434` and `https://abacus.jasoncameron.dev`.
- Settings page: provider picker with "Get a key" links for each provider and an Ollama setup note. The notice now reads "Your keys are stored only in your browser and sent only to the AI provider you choose."
- Anthropic: added Claude Fable 5.2 to the suggested models; behaviour and the `anthropic-dangerous-direct-browser-access` header are unchanged. A key remembered by earlier versions keeps working.
- Fresh installs and "Reset all data" → "Add example prompts" now get the full example set (about 60 prompts).
- README Security section rewritten for multiple providers; README features list updated.

## [1.2.0] - 2026-11-27

### Added

- `LICENSE.md`: Promptvault is now source-available under the PolyForm Noncommercial License 1.0.0.
- Studio credit in the footer: Silverlight DevTech mark, copyright, a link to the license, and a "More apps" link to the apps homepage (https://lance6x5.github.io/).
- `author` / `copyright` meta tags, plus README License and Trademarks sections and a contribution licensing note.

### Changed

- Licensed under PolyForm Noncommercial 1.0.0 (`license` / `author` fields in `package.json`). Previous versions shipped without a license file (all rights reserved); this is the first license.

## [1.1.0] - 2026-11-27

### Added

- Anonymous visit counter in the footer (e.g. "12,345 visits") via the open-source [Abacus](https://github.com/JasonLovesDoggo/abacus) service: one count per browser session, read-only with Do Not Track / Global Privacy Control and on localhost, no cookies, no referrer and no app data sent; fails silently. Visits badge and "Privacy & analytics" section in the README.

### Changed

- Production Content Security Policy `connect-src` now also allows `https://abacus.jasoncameron.dev`.
- About page privacy text and README updated to mention the anonymous visit count.

## [1.0.0] - 2026-11-27

### Added

- Prompt library with title, body, tags, category, target model, notes, favorite flag, timestamps and usage count, stored in IndexedDB and seeded with 5 example prompts.
- `{{variable}}` templates with a fill-in form, live preview and copy of the completed prompt.
- Categories, Favorites and Recently used views; tag management (create, rename, merge, delete) and AND/OR tag filters.
- Instant fuzzy full-text search (Fuse.js) and keyboard shortcuts (`/`, `n`, `↑`/`↓`, `Enter`).
- Markdown editor with preview toggle, version history (last 10 edits, restorable) and duplicate.
- JSON export (all or filtered selection, schema version 1), import with duplicate detection (skip / overwrite / keep both), copy as Markdown.
- Optional "Run with AI" using your own Anthropic API key: in-memory key by default with opt-in "Remember on this device", masked display, Forget key, model picker (Opus 5.5 / Sonnet 5.5 / Haiku 5.5 / custom id), max tokens, streamed responses, clear errors for invalid key, rate limit, overload, quota exceeded and network failure.
- In-app feedback menu ("Report a bug" / "Request a feature") that opens pre-filled GitHub issue forms; bug report and feature request issue templates.
- Installable PWA with offline app shell, light/dark themes, Promptvault branding and logo, "Reset all data" with confirmation.
- Production Content Security Policy limiting network access to the app and `api.anthropic.com`.
- GitHub Actions workflow that tests, builds and deploys to GitHub Pages.

[Unreleased]: https://github.com/lance6x5/prompt-library/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/lance6x5/prompt-library/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/lance6x5/prompt-library/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/lance6x5/prompt-library/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/lance6x5/prompt-library/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/lance6x5/prompt-library/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/lance6x5/prompt-library/releases/tag/v1.0.0
