import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Calendar,
  X,
  RotateCcw,
  ReceiptText,
} from 'lucide-react';
import { Transaction, TransactionType, Category, DatePreset, SortOption } from '../types';
import { ALL_CATEGORIES, CATEGORIES } from '../data/categories';
import { formatCurrency } from '../utils/formatters';
import TransactionItem from './TransactionItem';

interface TransactionsViewProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
}

export default function TransactionsView({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionsViewProps) {
  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (typeFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (datePreset !== 'all') count++;
    if (datePreset === 'custom' && (startDate || endDate)) count++;
    return count;
  }, [search, typeFilter, categoryFilter, datePreset, startDate, endDate]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  // Filter & Sort logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    return transactions
      .filter((tx) => {
        // Search
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchTitle = tx.title.toLowerCase().includes(query);
          const matchCat = tx.category.toLowerCase().includes(query);
          const matchNote = tx.note?.toLowerCase().includes(query);
          if (!matchTitle && !matchCat && !matchNote) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
          return false;
        }

        // Date filter
        if (datePreset === 'this-month' && !tx.date.startsWith(currentYearMonth)) {
          return false;
        }
        if (datePreset === 'last-month' && !tx.date.startsWith(lastYearMonth)) {
          return false;
        }
        if (datePreset === 'this-year' && !tx.date.startsWith(currentYear)) {
          return false;
        }
        if (datePreset === 'custom') {
          if (startDate && tx.date < startDate) return false;
          if (endDate && tx.date > endDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
        }
        if (sortBy === 'date-asc') {
          return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
        }
        if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, search, typeFilter, categoryFilter, datePreset, startDate, endDate, sortBy]);

  // Aggregate totals for the filtered list
  const { filteredIncome, filteredExpense, filteredNet } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return {
      filteredIncome: income,
      filteredExpense: expense,
      filteredNet: income - expense,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header & Search / Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Transactions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, filter, and inspect your full transaction history
          </p>
        </div>

        <button
          id="transactions-add-btn"
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors self-stretch sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Search & Filter Bar Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Search input and Quick Type pills */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-transactions-input"
              type="text"
              placeholder="Search by title, note, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Type Filter Selector */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl flex-shrink-0">
            <button
              id="filter-type-all"
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              id="filter-type-expense"
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              id="filter-type-income"
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Toggle More Filters Button */}
          <button
            id="toggle-filters-btn"
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              showAdvancedFilters || activeFiltersCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Advanced Filters (Category, Date Range, Sorting) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
            {/* Category Dropdown */}
            <div>
              <label htmlFor="filter-category-select" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                id="filter-category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="all">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Preset Dropdown */}
            <div>
              <label htmlFor="filter-date-select" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Date Period
              </label>
              <select
                id="filter-date-select"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            {/* Sort Order Dropdown */}
            <div>
              <label htmlFor="filter-sort-select" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Sort By
              </label>
              <select
                id="filter-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (Highest First)</option>
                <option value="amount-asc">Amount (Lowest First)</option>
              </select>
            </div>

            {/* Custom Date Range Inputs (Shown when preset is 'custom') */}
            {datePreset === 'custom' && (
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label htmlFor="filter-start-date" className="block text-[11px] font-medium text-slate-500 mb-1">
                    From Date
                  </label>
                  <input
                    id="filter-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="filter-end-date" className="block text-[11px] font-medium text-slate-500 mb-1">
                    To Date
                  </label>
                  <input
                    id="filter-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Summary Banner & Reset */}
        <div className="flex flex-wrap items-center justify-between pt-1 text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-3">
            <span>
              Showing <strong className="text-slate-900">{filteredTransactions.length}</strong> of{' '}
              {transactions.length}
            </span>
            <span>•</span>
            <span>
              Inflow: <strong className="text-emerald-600">+{formatCurrency(filteredIncome)}</strong>
            </span>
            <span>•</span>
            <span>
              Outflow: <strong className="text-rose-600">-{formatCurrency(filteredExpense)}</strong>
            </span>
          </div>

          {activeFiltersCount > 0 && (
            <button
              id="reset-filters-btn"
              type="button"
              onClick={handleResetFilters}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <section aria-label="Transactions List">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/90 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No matching transactions found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {activeFiltersCount > 0
                ? 'Try adjusting or clearing your search and filters to see more results.'
                : 'Your transaction record book is currently empty. Log your first expense or income now.'}
            </p>
            {activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                Clear all filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Add Transaction
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
