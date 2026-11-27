import { useId, useState } from 'react';
import { maskKey } from '../lib/keyStore.js';
import { KEYED_PROVIDERS, KEY_NOTICE, getProvider } from '../lib/providers/index.js';
import ModelFields from './ModelFields.jsx';

const hostOf = (origin) => origin.replace(/^https?:\/\//, '');

/** One provider's key slot: status, forget, replace, remember-on-device. */
function KeySlot({ provider, keyStore, onKeyChange, notify }) {
  const uid = useId();
  const [draft, setDraft] = useState('');
  const [remember, setRemember] = useState(keyStore.isRemembered(provider.id));
  const savedKey = keyStore.get(provider.id);
  const name = provider.shortLabel;

  const saveKey = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    keyStore.set(provider.id, draft, remember);
    setDraft('');
    onKeyChange();
    notify(remember ? `${name} key saved on this device` : `${name} key saved for this tab only`);
  };

  const toggleRemember = (checked) => {
    setRemember(checked);
    if (savedKey) {
      keyStore.setRemember(provider.id, checked);
      onKeyChange();
      notify(checked ? `${name} key will be remembered on this device` : `${name} key removed from device storage (kept for this tab)`);
    }
  };

  return (
    <details className="key-slot" open={Boolean(savedKey) || undefined}>
      <summary>
        <strong>{provider.label}</strong>{' '}
        <span className="small muted">{savedKey ? `key ${maskKey(savedKey)}` : 'no key'}</span>
      </summary>
      <p className="small muted">
        Sent only to <code>{hostOf(provider.origin)}</code>.{' '}
        <a href={provider.keyHelpUrl} target="_blank" rel="noopener noreferrer">
          Get a {name} key
        </a>{' '}
        (create a dedicated key with a spending limit).
      </p>
      {savedKey ? (
        <div className="key-status">
          <p>
            Current key: <code aria-label={`Key ending in ${savedKey.slice(-4)}`}>{maskKey(savedKey)}</code>{' '}
            <span className="small muted">
              ({keyStore.isRemembered(provider.id) ? 'remembered on this device' : 'in memory only — cleared when this tab closes'})
            </span>
          </p>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              keyStore.forget(provider.id);
              setRemember(false);
              onKeyChange();
              notify(`${name} key forgotten`);
            }}
          >
            Forget key
          </button>
        </div>
      ) : (
        <p className="small">No key set.</p>
      )}

      <form onSubmit={saveKey} className="key-form">
        <div className="field">
          <label htmlFor={`${uid}-key`}>{savedKey ? `Replace ${name} API key` : `${name} API key`}</label>
          <input
            id={`${uid}-key`}
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            spellCheck="false"
            placeholder="Paste your key"
          />
        </div>
        <div className="field checkbox-field">
          <label>
            <input type="checkbox" checked={remember} onChange={(e) => toggleRemember(e.target.checked)} /> Remember on
            this device
          </label>
          {remember && (
            <p className="warning small" role="note">
              Warning: the key will be saved in this browser's localStorage. Anyone with access to this browser or device
              (including browser extensions) could read it. Use only on a personal device.
            </p>
          )}
        </div>
        <button type="submit" className="btn primary" disabled={!draft.trim()}>
          Save key
        </button>
      </form>
    </details>
  );
}

/** Appearance + bring-your-own-key AI settings. */
export default function SettingsPage({ settings, onChange, keyStore, onKeyChange, notify }) {
  const uid = useId();
  const [slotsVersion, setSlotsVersion] = useState(0);
  const active = getProvider(settings.provider);
  const anyKey = KEYED_PROVIDERS.some((p) => keyStore.has(p.id));

  return (
    <section aria-labelledby={`${uid}-h`}>
      <h1 id={`${uid}-h`}>Settings</h1>

      <div className="panel">
        <h2>Appearance</h2>
        <div className="field">
          <label htmlFor={`${uid}-theme`}>Theme</label>
          <select id={`${uid}-theme`} value={settings.theme} onChange={(e) => onChange({ theme: e.target.value })}>
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <h2>Run with AI (bring your own key)</h2>
        <p className="notice" role="note">
          <strong>{KEY_NOTICE}</strong>
        </p>
        <p className="small muted">
          Prompts go directly from your browser to the provider you pick; Promptvault has no server. Each key is kept in its
          own slot and is only ever sent to that provider's API.
        </p>

        <h3>Provider and model</h3>
        <ModelFields settings={settings} onChange={onChange} getKey={(id) => keyStore.get(id)} notify={notify} />
        {active.needsKey ? (
          <p className="small muted">
            Need a key?{' '}
            <a href={active.keyHelpUrl} target="_blank" rel="noopener noreferrer">
              Get a {active.shortLabel} API key
            </a>
            .
          </p>
        ) : (
          <div className="notice small" role="note">
            <p>
              <strong>Ollama runs models locally and needs no key.</strong> It only works on the same computer that runs
              Ollama, and Ollama must allow this site's origin. Start it with:
            </p>
            <pre className="raw">OLLAMA_ORIGINS=https://lance6x5.github.io ollama serve</pre>
            <p>
              Then pull a model (for example <code>ollama pull llama3.2</code>) and press “Refresh models”.{' '}
              <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer">
                Download Ollama
              </a>
              .
            </p>
          </div>
        )}

        <h3>API keys</h3>
        <div className="key-slots" key={slotsVersion}>
          {KEYED_PROVIDERS.map((p) => (
            <KeySlot key={p.id} provider={p} keyStore={keyStore} onKeyChange={onKeyChange} notify={notify} />
          ))}
        </div>
        <div className="actions start">
          <button
            type="button"
            className="btn danger"
            disabled={!anyKey}
            onClick={() => {
              keyStore.forgetAll();
              setSlotsVersion((v) => v + 1);
              onKeyChange();
              notify('All keys forgotten');
            }}
          >
            Forget all keys
          </button>
        </div>
      </div>
    </section>
  );
}
