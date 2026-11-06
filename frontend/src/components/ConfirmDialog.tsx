import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  onCancel,
  onConfirm,
}) => {
  const { isDark } = useTheme();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 animate-fadeIn"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
          isDark ? 'border-[#2e2e2e] bg-[#1a1a1a] text-white' : 'border-[#e8e8e8] bg-white text-[#202020]'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="font-polysans text-xl font-medium">{title}</h2>
            <p id="confirm-dialog-message" className={`mt-2 text-sm leading-6 ${isDark ? 'text-[#b5b5b5]' : 'text-[#555]'}`}>
              {message}
            </p>
          </div>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff682c] ${
              isDark ? 'border-[#3a3a3a] text-white hover:bg-[#242424]' : 'border-[#e2e2e2] text-[#303030] hover:bg-[#f7f7f7]'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
};
