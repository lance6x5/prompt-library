import { useId, useState } from 'react';
import { maskKey } from '../lib/keyStore.js';
import ModelFields from './ModelFields.jsx';

/** Appearance + bring-your-own-key AI settings. */
export default function SettingsPage({ settings, onChange, keyStore, onKeyChange, notify }) {
  const uid = useId();
  const [draft, setDraft] = useState('');
  const [remember, setRemember] = useState(keyStore.isRemembered());
  const savedKey = keyStore.get();

  const saveKey = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    keyStore.set(draft, remember);
    setDraft('');
    onKeyChange();
    notify(remember ? 'Key saved on this device' : 'Key saved for this tab only');
  };

  const toggleRemember = (checked) => {
    setRemember(checked);
    if (savedKey) {
      keyStore.setRemember(checked);
      onKeyChange();
      notify(checked ? 'Key will be remembered on this device' : 'Key removed from device storage (kept for this tab)');
    }
  };

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
          <strong>Your key is stored only in your browser and sent only to the AI provider.</strong>
        </p>
        <p className="small muted">
          Prompts are sent directly from your browser to <code>api.anthropic.com</code>. Create a dedicated key with a
          spending limit in the{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
            Anthropic Console
          </a>
          .
        </p>

        {savedKey ? (
          <div className="key-status">
            <p>
              Current key: <code aria-label={`Key ending in ${savedKey.slice(-4)}`}>{maskKey(savedKey)}</code>{' '}
              <span className="small muted">
                ({keyStore.isRemembered() ? 'remembered on this device' : 'in memory only — cleared when this tab closes'})
              </span>
            </p>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                keyStore.forget();
                setRemember(false);
                onKeyChange();
                notify('Key forgotten');
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
            <label htmlFor={`${uid}-key`}>{savedKey ? 'Replace API key' : 'Anthropic API key'}</label>
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
                Warning: the key will be saved in this browser's localStorage. Anyone with access to this browser or
                device (including browser extensions) could read it. Use only on a personal device.
              </p>
            )}
          </div>
          <button type="submit" className="btn primary" disabled={!draft.trim()}>
            Save key
          </button>
        </form>

        <h3>Defaults</h3>
        <ModelFields settings={settings} onChange={onChange} />
      </div>
    </section>
  );
}
