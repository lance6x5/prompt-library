/**
 * Registry of bring-your-own-key AI providers. Every provider exports:
 *   { id, label, needsKey, keyHelpUrl, origin, defaultModels, defaultModel,
 *     listModels(key), stream({ key, model, maxTokens, system?, prompt, signal, onText }),
 *     mapError(res | status | err, body?) }
 * A key is only ever passed to its own provider, which only talks to its own origin.
 */
import anthropic from './anthropic.js';
import openai from './openai.js';
import gemini from './gemini.js';
import openrouter from './openrouter.js';
import ollama from './ollama.js';

export { ApiError, clampMaxTokens, DEFAULT_MAX_TOKENS, MAX_TOKENS_LIMIT } from './common.js';

export const PROVIDERS = [anthropic, openai, gemini, openrouter, ollama];
export const PROVIDER_IDS = PROVIDERS.map((p) => p.id);
export const KEYED_PROVIDERS = PROVIDERS.filter((p) => p.needsKey);
export const DEFAULT_PROVIDER = 'anthropic';

export const KEY_NOTICE = 'Your keys are stored only in your browser and sent only to the AI provider you choose.';

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS.find((p) => p.id === DEFAULT_PROVIDER);
}
