# Third-party notices

Promptvault itself is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). This file lists
third-party material that ships with it. npm dependencies (React, Fuse.js and others) keep their own licenses,
which are included in their packages.

## Example prompts from awesome-chatgpt-prompts

- **Source:** [f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) (`prompts.csv`), by
  Fatih Kadir Akın and contributors.
- **License:** the prompt content and data in that repository (`prompts.csv`, `PROMPTS.md` and user-submitted
  prompt text) is dedicated to the public domain under
  [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) — see the repository's
  [`LICENSE`](https://github.com/f/awesome-chatgpt-prompts/blob/main/LICENSE) and
  [`LICENSE-CC0`](https://github.com/f/awesome-chatgpt-prompts/blob/main/LICENSE-CC0) files. (The repository's
  website source code is MIT-licensed; none of that code is used here.)
- **What we use:** 42 prompts curated for the "Browse examples" set in `src/lib/seedLibrary.js` (`IMPORTED`). They were
  lightly edited: placeholders converted to `{{variable}}` syntax, wording tidied, and a title, category, tags and a
  target model of "Any" added. Each one is marked in its notes with
  "Source: awesome-chatgpt-prompts (CC0 1.0)" and the original prompt name.

Attribution is not required under CC0, but we are grateful to the project and its contributors and credit them here.
The edited prompts remain free for anyone to use.

The other example prompts (`ORIGINAL` in `src/lib/seedLibrary.js`, and the five original v1.0 examples in
`src/lib/seed.js`) were written for Promptvault.
