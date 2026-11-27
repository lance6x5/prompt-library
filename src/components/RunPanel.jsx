import { useEffect, useId, useRef, useState } from 'react';
import { streamMessage, clampMaxTokens } from '../lib/anthropic.js';
import { effectiveModel } from '../lib/settings.js';
import { maskKey } from '../lib/keyStore.js';
import { copyText } from '../lib/browser.js';
import ModelFields from './ModelFields.jsx';

/** Bring-your-own-key "Run with AI" panel with streaming output. */
export default function RunPanel({ text, settings, onSettingsChange, apiKey, onRun, onGoToSettings, notify }) {
  const uid = useId();
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [error, setError] = useState(null);
  const [stopReason, setStopReason] = useState(null);
  const abortRef = useRef(null);

  // Abort any in-flight request when the panel unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

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
      const res = await streamMessage({
        apiKey,
        model: effectiveModel(settings),
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

  if (!apiKey) {
    return (
      <section className="run-panel" aria-labelledby={`${uid}-h`}>
        <h3 id={`${uid}-h`}>Run with AI</h3>
        <p>
          To run prompts, add your own Anthropic API key in{' '}
          <a href="#/settings" onClick={onGoToSettings}>
            Settings
          </a>
          .
        </p>
        <p className="small muted">Your key is stored only in your browser and sent only to the AI provider.</p>
      </section>
    );
  }

  return (
    <section className="run-panel" aria-labelledby={`${uid}-h`}>
      <h3 id={`${uid}-h`}>Run with AI</h3>
      <p className="small muted">
        Using key {maskKey(apiKey)}. Your key is stored only in your browser and sent only to the AI provider.
      </p>
      <ModelFields settings={settings} onChange={onSettingsChange} compact />
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

      <p className="small" role="status">
        {status === 'running' && 'Generating…'}
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
          {error.kind === 'invalid_key' && (
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
