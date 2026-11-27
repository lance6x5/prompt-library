import { useState } from 'react';
import Modal from './Modal.jsx';

/** Confirmation step for destructive actions. Optionally require typing a word. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, requireText, onConfirm, onClose }) {
  const [typed, setTyped] = useState('');
  const blocked = Boolean(requireText) && typed.trim() !== requireText;

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (blocked) return;
          onClose();
          onConfirm();
        }}
      >
        <p>{message}</p>
        {requireText && (
          <p>
            <label htmlFor="confirm-text">
              Type <strong>{requireText}</strong> to confirm
            </label>
            <input id="confirm-text" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus />
          </p>
        )}
        <div className="actions">
          <button type="button" className="btn" onClick={onClose} autoFocus={!requireText}>
            Cancel
          </button>
          <button type="submit" className={`btn ${danger ? 'danger' : 'primary'}`} disabled={blocked}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
