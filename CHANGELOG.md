# Changelog

All notable changes to Promptvault are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/lance6x5/prompt-library/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lance6x5/prompt-library/releases/tag/v1.0.0
