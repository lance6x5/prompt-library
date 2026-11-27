/**
 * Hosts the production Content Security Policy allows in connect-src
 * (used by vite.config.js). Exactly: the app itself, the bring-your-own-key
 * AI providers (src/lib/providers/*), a local Ollama server on its default
 * port, and the anonymous Abacus visit counter (src/lib/visits.js).
 * No wildcards - add a host here only together with the code that needs it.
 */
export const CONNECT_SRC = [
  "'self'",
  'https://api.anthropic.com',
  'https://api.openai.com',
  'https://generativelanguage.googleapis.com',
  'https://openrouter.ai',
  'http://localhost:11434',
  'http://127.0.0.1:11434',
  'https://abacus.jasoncameron.dev',
];
