/** Generate a reasonably unique id (crypto.randomUUID when available). */
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
