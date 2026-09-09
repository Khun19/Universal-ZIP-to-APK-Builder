import { ArrowDownRight, ArrowUpRight, Plus, ChevronRight, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Transaction, ViewTab, CategorySummary, MonthlySummary } from '../types';
import { FinanceSummary } from '../utils/analytics';
import { formatCurrency, formatPercent } from '../utils/formatters';
import TransactionItem from './TransactionItem';
import CategoryDonutChart from './charts/CategoryDonutChart';
import MonthlyBarChart from './charts/MonthlyBarChart';

interface DashboardViewProps {
  summary: FinanceSummary;
  recentTransactions: Transaction[];
  categoryBreakdown: CategorySummary[];
  monthlyData: MonthlySummary[];
  onOpenAddModal: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onNavigateTab: (tab: ViewTab) => void;
}

export default function DashboardView({
  summary,
  recentTransactions,
  categoryBreakdown,
  monthlyData,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onNavigateTab,
}: DashboardViewProps) {
  const isPositiveBalance = summary.totalBalance >= 0;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Financial Overview Cards */}
      <section aria-label="Financial Summary Cards">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Balance Card */}
          <div
            id="stat-card-balance"
            className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white shadow-md relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Balance
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-medium flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Net Worth</span>
              </span>
            </div>

            <div className="my-4">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formatCurrency(summary.totalBalance)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Savings rate: <span className="text-emerald-400 font-bold">{formatPercent(summary.savingsRate)}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span>This Month Net:</span>
              <span className={summary.thisMonthNet >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {summary.thisMonthNet >= 0 ? '+' : ''}{formatCurrency(summary.thisMonthNet)}
              </span>
            </div>
          </div>

          {/* Total Income Card */}
          <div
            id="stat-card-income"
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Income
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="my-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This month: <span className="font-semibold text-emerald-600">{formatCurrency(summary.thisMonthIncome)}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>All-time inflow</span>
              <span className="font-semibold text-emerald-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            </div>
          </div>

          {/* Total Expense Card */}
          <div
            id="stat-card-expense"
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="my-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(summary.totalExpense)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This month: <span className="font-semibold text-rose-600">{formatCurrency(summary.thisMonthExpense)}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>vs Last Month</span>
              {summary.expenseChangePercent !== null ? (
                <span className={`font-semibold flex items-center ${
                  summary.expenseChangePercent > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {summary.expenseChangePercent > 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      +{summary.expenseChangePercent.toFixed(1)}%
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 mr-1" />
                      {summary.expenseChangePercent.toFixed(1)}%
                    </>
                  )}
                </span>
              ) : (
                <span className="text-slate-400">Baseline</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Charts and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending by Category Card (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Spending by Category</h3>
              <p className="text-xs text-slate-500">Distribution of all logged expenses</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center transition-colors"
            >
              <span>Detailed view</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <CategoryDonutChart
            categories={categoryBreakdown}
            totalExpense={summary.totalExpense}
          />
        </div>

        {/* Monthly Spending Trend (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Monthly Cash Flow</h3>
              <span className="text-xs font-medium text-slate-500">Last 6 Months</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparison between total monthly income and expenses
            </p>
            <MonthlyBarChart data={monthlyData} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Average monthly spend:</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(
                monthlyData.length > 0
                  ? monthlyData.reduce((sum, d) => sum + d.expense, 0) / monthlyData.length
                  : 0
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <section aria-label="Recent Transactions" className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest activity from your ledger</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="dashboard-view-all-tx-btn"
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="dashboard-add-tx-btn"
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm font-semibold text-slate-700">No transactions recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Add your first transaction to start tracking your personal finances.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => (
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
