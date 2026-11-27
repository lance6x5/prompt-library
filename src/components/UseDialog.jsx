import { useId, useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import RunPanel from './RunPanel.jsx';
import { extractVariables, fillTemplate, humanizeVariable } from '../lib/template.js';
import { copyText } from '../lib/browser.js';

/** "Use" flow: fill {{variables}}, then copy the result or run it with AI. */
export default function UseDialog({ prompt, startRun, settings, onSettingsChange, keyStore, onUsed, notify, onClose }) {
  const uid = useId();
  const vars = useMemo(() => extractVariables(prompt.body), [prompt.body]);
  const [values, setValues] = useState(() => Object.fromEntries(vars.map((v) => [v, ''])));
  const [showRun, setShowRun] = useState(Boolean(startRun));
  const filled = fillTemplate(prompt.body, values);
  const missing = vars.filter((v) => !String(values[v] ?? '').trim());

  const copy = async (e) => {
    e?.preventDefault();
    const ok = await copyText(filled);
    if (ok) {
      onUsed(prompt);
      notify(missing.length ? `Copied (${missing.length} variable${missing.length === 1 ? '' : 's'} left empty)` : 'Completed prompt copied');
      onClose();
    } else notify('Copy failed - your browser blocked clipboard access.');
  };

  return (
    <Modal title={`Use: ${prompt.title}`} onClose={onClose} wide>
      <form onSubmit={copy}>
        {vars.length > 0 ? (
          <fieldset className="vars">
            <legend>Fill in the variables</legend>
            {vars.map((v, i) => {
              const long = /text|body|code|content|notes|document|input|description/i.test(v);
              const id = `${uid}-v-${i}`;
              return (
                <div className="field" key={v}>
                  <label htmlFor={id}>
                    {humanizeVariable(v)} <code className="small">{`{{${v}}}`}</code>
                  </label>
                  {long ? (
                    <textarea
                      id={id}
                      rows={4}
                      value={values[v]}
                      autoFocus={i === 0}
                      onChange={(e) => setValues((s) => ({ ...s, [v]: e.target.value }))}
                    />
                  ) : (
                    <input
                      id={id}
                      value={values[v]}
                      autoFocus={i === 0}
                      autoComplete="off"
                      onChange={(e) => setValues((s) => ({ ...s, [v]: e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
          </fieldset>
        ) : (
          <p className="small muted">This prompt has no variables.</p>
        )}

        <div className="field">
          <span className="label" id={`${uid}-prev`}>
            Completed prompt
          </span>
          <pre className="raw preview-out" aria-labelledby={`${uid}-prev`}>
            {filled}
          </pre>
          {missing.length > 0 && (
            <p className="small muted">
              Still empty: {missing.map((m) => `{{${m}}}`).join(', ')}
            </p>
          )}
        </div>

        <div className="actions">
          <button type="button" className="btn" aria-expanded={showRun} onClick={() => setShowRun((s) => !s)}>
            {showRun ? 'Hide AI panel' : 'Run with AI…'}
          </button>
          <button type="submit" className="btn primary" autoFocus={vars.length === 0}>
            Copy completed prompt
          </button>
        </div>
      </form>

      {showRun && (
        <RunPanel
          text={filled}
          settings={settings}
          onSettingsChange={onSettingsChange}
          keyStore={keyStore}
          onRun={() => onUsed(prompt)}
          onGoToSettings={onClose}
          notify={notify}
        />
      )}
    </Modal>
  );
}
