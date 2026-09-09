import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  transaction,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div
      id="delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="delete-modal-card"
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900 mb-1">
          Delete Transaction?
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Are you sure you want to delete <span className="font-semibold text-slate-800">"{transaction.title}"</span> ({formatCurrency(transaction.amount)})? This action cannot be undone.
        </p>

        <div className="flex items-center justify-end space-x-2.5">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
