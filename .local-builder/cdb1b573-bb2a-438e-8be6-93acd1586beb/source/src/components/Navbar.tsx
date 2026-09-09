import { Plus, Database, WalletCards, LayoutDashboard, Receipt, BarChart3 } from 'lucide-react';
import { ViewTab } from '../types';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
  onOpenDataModal: () => void;
  transactionCount: number;
}

export default function Navbar({
  currentTab,
  onTabChange,
  onOpenAddModal,
  onOpenDataModal,
  transactionCount,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <WalletCards className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  FinanceFlow
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Local & Private
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Personal Income & Expense Tracker
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              id="nav-dashboard-tab"
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-transactions-tab"
              type="button"
              onClick={() => onTabChange('transactions')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'transactions'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Transactions</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {transactionCount}
              </span>
            </button>
            <button
              id="nav-analytics-tab"
              type="button"
              onClick={() => onTabChange('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="open-data-modal-btn"
              type="button"
              onClick={onOpenDataModal}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Data & Backup Options"
              aria-label="Data & Backup Options"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              id="header-add-transaction-btn"
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
