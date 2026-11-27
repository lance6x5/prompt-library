import { useId, useRef, useState, useEffect } from 'react';
import { PROVIDERS, getProvider, MAX_TOKENS_LIMIT } from '../lib/providers/index.js';
import { selectedModel, withProviderValue } from '../lib/settings.js';

/**
 * Provider picker, model picker (verified defaults + "Refresh models" list +
 * custom id) and max tokens input. `getKey(id)` returns that provider's key.
 */
export default function ModelFields({ settings, onChange, getKey, notify, compact = false }) {
  const uid = useId();
  const provider = getProvider(settings.provider);
  const sel = selectedModel(settings, provider.id);
  const fetched = settings.fetchedModels?.[provider.id] || [];
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => setListError(''), [provider.id]);

  const defaultIds = new Set(provider.defaultModels.map((m) => m.id));
  const extra = fetched.filter((m) => !defaultIds.has(m.id));
  const known = defaultIds.has(sel) || extra.some((m) => m.id === sel) || sel === 'custom';

  const refresh = async () => {
    const key = getKey?.(provider.id) || '';
    if (provider.needsKey && !key) {
      setListError(`Add your ${provider.shortLabel} key in Settings to load its model list.`);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setListError('');
    try {
      const list = await provider.listModels(key, { signal: ctrl.signal });
      onChange(withProviderValue(settings, 'fetchedModels', provider.id, list.slice(0, 500)));
      notify?.(`Loaded ${list.length} ${provider.shortLabel} model${list.length === 1 ? '' : 's'}`);
    } catch (err) {
      if (err.kind !== 'aborted') setListError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'grid-2 compact' : 'grid-2'}>
      <div className="field">
        <label htmlFor={`${uid}-provider`}>Provider</label>
        <select id={`${uid}-provider`} value={provider.id} onChange={(e) => onChange({ provider: e.target.value })}>
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <div className="field-head">
          <label htmlFor={`${uid}-model`}>Model</label>
          <button type="button" className="link-btn small" onClick={refresh} disabled={loading} aria-describedby={`${uid}-list-status`}>
            {loading ? 'Loading…' : 'Refresh models'}
          </button>
        </div>
        <select
          id={`${uid}-model`}
          value={known ? sel : 'custom'}
          onChange={(e) => onChange(withProviderValue(settings, 'models', provider.id, e.target.value))}
        >
          <optgroup label="Suggested">
            {provider.defaultModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </optgroup>
          {extra.length > 0 && (
            <optgroup label="From your account">
              {extra.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label && m.label !== m.id ? `${m.label} (${m.id})` : m.id}
                </option>
              ))}
            </optgroup>
          )}
          <option value="custom">Custom model id…</option>
        </select>
        <p id={`${uid}-list-status`} className={listError ? 'error small' : 'visually-hidden'} role={listError ? 'alert' : undefined}>
          {listError}
        </p>
      </div>
      {(sel === 'custom' || !known) && (
        <div className="field">
          <label htmlFor={`${uid}-custom`}>Custom model id</label>
          <input
            id={`${uid}-custom`}
            value={settings.customModels?.[provider.id] ?? (known ? '' : sel)}
            onChange={(e) =>
              onChange({
                ...withProviderValue(settings, 'customModels', provider.id, e.target.value),
                ...withProviderValue(settings, 'models', provider.id, 'custom'),
              })
            }
            placeholder={`e.g. ${provider.defaultModel}`}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      )}
      <div className="field">
        <label htmlFor={`${uid}-max`}>Max tokens</label>
        <input
          id={`${uid}-max`}
          type="number"
          min="1"
          max={MAX_TOKENS_LIMIT}
          step="1"
          inputMode="numeric"
          value={settings.maxTokens}
          onChange={(e) => onChange({ maxTokens: e.target.value === '' ? '' : Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
