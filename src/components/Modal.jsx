import { useEffect, useId, useRef } from 'react';

/**
 * Accessible modal built on the native <dialog> element (focus trapping,
 * Escape-to-close and inert background come for free).
 */
export default function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    const previouslyFocused = document.activeElement;
    if (d && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    }
    return () => {
      if (d?.open) d.close();
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`modal${wide ? ' wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
