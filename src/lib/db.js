/**
 * IndexedDB persistence for prompts (no dependencies).
 * DB "promptvault", object store "prompts" keyed by id.
 * Falls back to an in-memory store if IndexedDB is unavailable (e.g. some
 * private-browsing modes) so the app still works for the session.
 */
const DB_NAME = 'promptvault';
const DB_VERSION = 1;
const STORE = 'prompts';
const SEEDED_FLAG = 'promptvault.seeded';

let dbPromise = null;
const memory = new Map();
let useMemory = false;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') throw new Error('IndexedDB unavailable');
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
    } catch (err) {
      reject(err);
    }
  }).catch((err) => {
    console.warn('Promptvault: falling back to in-memory storage.', err);
    useMemory = true;
    return null;
  });
  return dbPromise;
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    Promise.resolve(fn(store)).then((r) => (result = r));
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transaction aborted'));
  });
}

export async function getAll() {
  try {
    const db = await openDb();
    if (useMemory || !db) return [...memory.values()];
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('getAll failed', err);
    return [...memory.values()];
  }
}

/** Insert or update one or many prompts. */
export async function putMany(prompts) {
  for (const p of prompts) memory.set(p.id, p);
  try {
    const db = await openDb();
    if (useMemory || !db) return;
    await tx(db, 'readwrite', (store) => {
      for (const p of prompts) store.put(p);
    });
  } catch (err) {
    console.error('putMany failed', err);
    throw new Error('Could not save to browser storage.');
  }
}

export const put = (p) => putMany([p]);

export async function remove(id) {
  memory.delete(id);
  try {
    const db = await openDb();
    if (useMemory || !db) return;
    await tx(db, 'readwrite', (store) => store.delete(id));
  } catch (err) {
    console.error('remove failed', err);
    throw new Error('Could not delete from browser storage.');
  }
}

export async function clearAll() {
  memory.clear();
  try {
    const db = await openDb();
    if (useMemory || !db) return;
    await tx(db, 'readwrite', (store) => store.clear());
  } catch (err) {
    console.error('clear failed', err);
    throw new Error('Could not clear browser storage.');
  }
}

export function wasSeeded() {
  try {
    return localStorage.getItem(SEEDED_FLAG) === '1';
  } catch {
    return false;
  }
}

export function markSeeded(value = true) {
  try {
    if (value) localStorage.setItem(SEEDED_FLAG, '1');
    else localStorage.removeItem(SEEDED_FLAG);
  } catch {
    /* ignore */
  }
}
