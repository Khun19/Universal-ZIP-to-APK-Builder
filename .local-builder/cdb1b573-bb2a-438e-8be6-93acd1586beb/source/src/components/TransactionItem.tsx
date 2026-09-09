import { Edit2, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { CATEGORIES } from '../data/categories';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TransactionItemProps {
  key?: string | number;
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export default function TransactionItem({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const categoryConfig = CATEGORIES[transaction.category] || CATEGORIES.Other;
  const Icon = categoryConfig.icon;
  const isIncome = transaction.type === 'income';

  return (
    <div
      id={`transaction-item-${transaction.id}`}
      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300/80 hover:shadow-xs transition-all"
    >
      {/* Left: Category Icon & Details */}
      <div className="flex items-center space-x-3.5 min-w-0 flex-1 mr-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryConfig.badgeBg} ${categoryConfig.badgeText} border ${categoryConfig.badgeBorder}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {transaction.title}
            </h4>
            <span
              className={`hidden xs:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                categoryConfig.badgeBg
              } ${categoryConfig.badgeText}`}
            >
              {transaction.category}
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500">
            <span>{formatDate(transaction.date)}</span>
            {transaction.note && (
              <>
                <span>•</span>
                <span className="truncate max-w-[140px] sm:max-w-[240px] text-slate-400">
                  {transaction.note}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        <div className="text-right">
          <span
            className={`text-sm sm:text-base font-bold tracking-tight ${
              isIncome ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </span>
          <p className="text-[10px] uppercase font-semibold text-slate-400">
            {isIncome ? 'Income' : 'Expense'}
          </p>
        </div>

        {/* Action buttons (always visible on mobile, hover effect on desktop) */}
        <div className="flex items-center space-x-1 pl-1 sm:opacity-75 sm:group-hover:opacity-100 transition-opacity">
          <button
            id={`edit-tx-${transaction.id}`}
            type="button"
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit transaction"
            aria-label={`Edit ${transaction.title}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            id={`delete-tx-${transaction.id}`}
            type="button"
            onClick={() => onDelete(transaction)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete transaction"
            aria-label={`Delete ${transaction.title}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
