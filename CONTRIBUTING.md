# Contributing to Promptvault

Thanks for helping improve Promptvault!

## Reporting bugs and requesting features

Use the **Feedback** menu in the app, or open an issue using one of the
[issue forms](https://github.com/lance6x5/prompt-library/issues/new/choose). Please never include personal data or API keys.

## Triage flow

1. **New issue** — every issue from the forms is labelled `triage` (plus `bug` or `enhancement`).
2. **Triage** — the maintainer reviews it, removes `triage`, and relabels as needed (e.g. confirms `bug`, adds priority, or closes as duplicate / won't fix).
3. **Work** — changes happen on a branch (e.g. `fix/123-import-error` or `feat/45-folders`) and are submitted as a pull request whose description references the issue with `Fixes #N`, so the issue closes automatically on merge.
4. **Release** — user-facing changes are recorded under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md); on release they move to a dated version section, `package.json` is bumped following SemVer (see README), and a tag + GitHub release is published.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

Keep logic in small, tested modules under `src/lib/`, and make sure `npm test` and `npm run build` pass before opening a PR. Never commit secrets or `.env` files.
