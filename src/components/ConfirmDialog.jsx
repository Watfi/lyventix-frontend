import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, variant = 'danger' }) {
  useEffect(() => {
    if (open) {
      const handler = (e) => { if (e.key === 'Escape') onCancel(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto
          ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          {variant === 'danger'
            ? <Trash2 size={22} className="text-red-600 dark:text-red-400" />
            : <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400" />}
        </div>

        {/* Text */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {title || '¿Estás seguro?'}
          </h3>
          {message && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600
              text-slate-700 dark:text-slate-300 font-medium text-sm
              hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-colors
              ${variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            Confirmar
          </button>
        </div>

        {/* Close X */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
