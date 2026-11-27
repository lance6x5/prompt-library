import { useEffect, useId, useRef, useState } from 'react';
import { clampMaxTokens, getProvider, KEY_NOTICE } from '../lib/providers/index.js';
import { effectiveModel } from '../lib/settings.js';
import { maskKey } from '../lib/keyStore.js';
import { copyText } from '../lib/browser.js';
import ModelFields from './ModelFields.jsx';

/** Bring-your-own-key "Run with AI" panel with streaming output. */
export default function RunPanel({ text, settings, onSettingsChange, keyStore, onRun, onGoToSettings, notify }) {
  const uid = useId();
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [error, setError] = useState(null);
  const [stopReason, setStopReason] = useState(null);
  const abortRef = useRef(null);
  const provider = getProvider(settings.provider);
  const key = provider.needsKey ? keyStore.get(provider.id) : '';

  // Abort any in-flight request when the panel unmounts or the provider changes.
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    abortRef.current?.abort();
    setError(null);
  }, [provider.id]);

  const run = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setOutput('');
    setError(null);
    setStopReason(null);
    setStatus('running');
    onRun();
    try {
      const res = await provider.stream({
        key,
        model: effectiveModel(settings, provider.id),
        maxTokens: clampMaxTokens(settings.maxTokens),
        prompt: text,
        signal: ctrl.signal,
        onText: (t) => setOutput((o) => o + t),
      });
      setStopReason(res.stopReason);
      setStatus('done');
    } catch (err) {
      if (err.kind === 'aborted') {
        setStatus('done');
        setStopReason('stopped');
      } else {
        setError(err);
        setStatus('error');
      }
    }
  };

  const missingKey = provider.needsKey && !key;

  return (
    <section className="run-panel" aria-labelledby={`${uid}-h`}>
      <h3 id={`${uid}-h`}>Run with AI</h3>
      <p className="small muted">
        {provider.needsKey && key ? `Using ${provider.shortLabel} key ${maskKey(key)}. ` : ''}
        {provider.id === 'ollama' ? 'Runs on the Ollama server on this computer. ' : ''}
        {KEY_NOTICE}
      </p>
      <ModelFields
        settings={settings}
        onChange={onSettingsChange}
        getKey={(id) => keyStore.get(id)}
        notify={notify}
        compact
      />
      {missingKey ? (
        <p>
          To run prompts with {provider.shortLabel}, add your own API key in{' '}
          <a href="#/settings" onClick={onGoToSettings}>
            Settings
          </a>
          .
        </p>
      ) : (
        <div className="actions start">
          {status === 'running' ? (
            <button type="button" className="btn danger" onClick={() => abortRef.current?.abort()}>
              Stop
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={run} disabled={!text.trim()}>
              {status === 'idle' ? 'Run' : 'Run again'}
            </button>
          )}
          {output && status !== 'running' && (
            <button
              type="button"
              className="btn"
              onClick={async () => notify((await copyText(output)) ? 'Response copied' : 'Copy failed')}
            >
              Copy response
            </button>
          )}
        </div>
      )}

      <p className="small" role="status">
        {status === 'running' && `Generating with ${provider.shortLabel}…`}
        {status === 'done' &&
          (stopReason === 'stopped'
            ? 'Stopped.'
            : stopReason === 'max_tokens'
              ? 'Response complete (hit the max tokens limit).'
              : 'Response complete.')}
      </p>
      {error && (
        <p className="error" role="alert">
          {error.message}
          {(error.kind === 'invalid_key' || error.kind === 'no_key') && (
            <>
              {' '}
              <a href="#/settings" onClick={onGoToSettings}>
                Open Settings
              </a>
            </>
          )}
        </p>
      )}
      {(output || status === 'running') && (
        <pre className="raw ai-output" aria-busy={status === 'running'} aria-label="AI response" tabIndex={0}>
          {output}
          {status === 'running' && <span className="cursor" aria-hidden="true" />}
        </pre>
      )}
    </section>
  );
}
