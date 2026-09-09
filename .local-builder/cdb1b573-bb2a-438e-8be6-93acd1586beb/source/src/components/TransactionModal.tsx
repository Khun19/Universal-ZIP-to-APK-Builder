import React, { useState, useEffect } from 'react';
import { X, Check, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORIES, ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialData?: Transaction | null;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    date?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDate(initialData.date);
      setNote(initialData.note || '');
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  // When type changes, switch default category if needed
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income' && !INCOME_CATEGORIES.includes(category)) {
      setCategory('Salary');
    } else if (newType === 'expense' && !EXPENSE_CATEGORIES.includes(category)) {
      setCategory('Food');
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length > 80) {
      newErrors.title = 'Title cannot exceed 80 characters';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    } else if (numAmount > 10000000) {
      newErrors.amount = 'Amount is too large';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave(
      {
        title: title.trim(),
        amount: parseFloat(parseFloat(amount).toFixed(2)),
        type,
        category,
        date,
        note: note.trim() ? note.trim() : undefined,
      },
      initialData?.id
    );
    onClose();
  };

  if (!isOpen) return null;

  const visibleCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div
      id="transaction-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="transaction-modal-card"
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              {initialData ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {initialData ? 'Update the details below' : 'Log a new expense or income item'}
            </p>
          </div>
          <button
            id="close-modal-button"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Income / Expense Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                id="type-expense-button"
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span>Expense</span>
              </button>
              <button
                id="type-income-button"
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Amount ($) *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                $
              </div>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                className={`block w-full pl-9 pr-4 py-2.5 text-lg font-bold text-slate-900 rounded-xl border ${
                  errors.amount ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-slate-800 focus:ring-slate-800'
                } bg-white placeholder-slate-300 focus:outline-none focus:ring-2`}
                autoFocus={!initialData}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.amount}</p>
            )}
          </div>

          {/* Title Field */}
          <div>
            <label htmlFor="tx-title" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Title / Description *
            </label>
            <input
              id="tx-title"
              type="text"
              placeholder="e.g., Grocery Shopping, Monthly Rent, Bonus"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              className={`block w-full px-3.5 py-2 text-sm text-slate-900 rounded-xl border ${
                errors.title ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:border-slate-800 focus:ring-slate-800'
              } bg-white placeholder-slate-400 focus:outline-none focus:ring-2`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.title}</p>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Category *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {visibleCategories.map((catName) => {
                const config = CATEGORIES[catName];
                const Icon = config.icon;
                const isSelected = category === catName;

                return (
                  <button
                    key={catName}
                    id={`cat-select-${catName.toLowerCase()}`}
                    type="button"
                    onClick={() => setCategory(catName)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg mb-1 ${
                        isSelected ? 'bg-white/20 text-white' : `${config.badgeBg} ${config.badgeText}`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium truncate w-full">{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="tx-date" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              className="block w-full px-3.5 py-2 text-sm text-slate-900 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.date}</p>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label htmlFor="tx-note" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Optional Note
            </label>
            <textarea
              id="tx-note"
              rows={2}
              placeholder="Add payment method, invoice number, or extra details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="block w-full px-3.5 py-2 text-sm text-slate-900 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="cancel-tx-button"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              id="save-tx-button"
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Save Changes' : 'Add Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
