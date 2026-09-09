import React, { useRef, useState } from 'react';
import { X, Download, Upload, RefreshCw, Trash2, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../types';
import { exportToCSV, exportToJSON, importFromJSON } from '../utils/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImport: (transactions: Transaction[]) => void;
  onResetToSample: () => void;
  onClearAll: () => void;
}

export default function DataManagementModal({
  isOpen,
  onClose,
  transactions,
  onImport,
  onResetToSample,
  onClearAll,
}: DataManagementModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJSON(file);
      onImport(imported);
      showSuccess(`Successfully imported ${imported.length} transactions!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import JSON file');
      setTimeout(() => setErrorMessage(null), 3500);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="data-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="data-modal-card"
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="data-modal-title" className="text-base font-bold text-slate-900">
              Data & Backup Management
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export, import, or reset your local transaction data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {successMessage && (
            <div className="flex items-center space-x-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Export section */}
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Export Options
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  exportToCSV(transactions);
                  showSuccess('Exported transactions to CSV');
                }}
                className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exportToJSON(transactions);
                  showSuccess('Exported backup to JSON');
                }}
                className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-sky-600" />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>

          {/* Import section */}
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Restore / Import
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Import JSON Backup File</span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Reset & Demo Data
            </span>
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Load realistic sample transactions? This will overwrite current entries.')) {
                    onResetToSample();
                    showSuccess('Sample data loaded successfully');
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Load Sample Transactions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete all transactions? This cannot be recovered.')) {
                    onClearAll();
                    showSuccess('All transactions cleared');
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Transactions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
