import { useEffect, useId, useRef, useState } from 'react';
import { buildIssueUrl } from '../lib/feedback.js';

/**
 * "Feedback" disclosure menu. Opens pre-filled GitHub issue forms in a new
 * tab. Only the app version and browser string are sent - never user data.
 */
export default function FeedbackMenu({ version }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const menuId = useId();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="feedback" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="btn"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        Feedback
      </button>
      {open && (
        <div id={menuId} className="feedback-menu">
          <ul>
            <li>
              <a
                href={buildIssueUrl('bug', { version, userAgent: ua })}
                target="_blank"
                rel="noopener"
                onClick={() => setOpen(false)}
              >
                Report a bug
              </a>
            </li>
            <li>
              <a
                href={buildIssueUrl('feature', { version })}
                target="_blank"
                rel="noopener"
                onClick={() => setOpen(false)}
              >
                Request a feature
              </a>
            </li>
          </ul>
          <p className="small muted">Opens GitHub — a free GitHub account is required. Don't include personal data.</p>
        </div>
      )}
    </div>
  );
}
