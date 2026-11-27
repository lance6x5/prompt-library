import { useId } from 'react';
import { MODELS, MAX_TOKENS_LIMIT } from '../lib/anthropic.js';

/** Model picker (3 presets + custom id) and max tokens input. */
export default function ModelFields({ settings, onChange, compact = false }) {
  const uid = useId();
  return (
    <div className={compact ? 'grid-2 compact' : 'grid-2'}>
      <div className="field">
        <label htmlFor={`${uid}-model`}>Model</label>
        <select id={`${uid}-model`} value={settings.model} onChange={(e) => onChange({ model: e.target.value })}>
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
          <option value="custom">Custom model id…</option>
        </select>
      </div>
      {settings.model === 'custom' && (
        <div className="field">
          <label htmlFor={`${uid}-custom`}>Custom model id</label>
          <input
            id={`${uid}-custom`}
            value={settings.customModel}
            onChange={(e) => onChange({ customModel: e.target.value })}
            placeholder="e.g. claude-sonnet-5-5"
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
