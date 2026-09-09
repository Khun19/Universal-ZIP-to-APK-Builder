import { ArrowDownRight, ArrowUpRight, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { FinanceSummary } from '../utils/analytics';
import { MonthlySummary, CategorySummary } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { CATEGORIES } from '../data/categories';
import CategoryDonutChart from './charts/CategoryDonutChart';
import MonthlyBarChart from './charts/MonthlyBarChart';

interface AnalyticsViewProps {
  summary: FinanceSummary;
  categoryBreakdown: CategorySummary[];
  monthlyData: MonthlySummary[];
}

export default function AnalyticsView({
  summary,
  categoryBreakdown,
  monthlyData,
}: AnalyticsViewProps) {
  const topCategory = categoryBreakdown[0] || null;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Financial Analytics & Statistics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Deep-dive visual reports into your cash flow, category distributions, and trends
        </p>
      </div>

      {/* Highlights Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Savings Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Savings Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {formatPercent(summary.savingsRate)}
            </span>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, summary.savingsRate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Expense Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Top Category
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {topCategory ? (
              <>
                <span className="text-2xl font-black text-slate-900 truncate block">
                  {topCategory.category}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {formatCurrency(topCategory.total)} ({formatPercent(topCategory.percentage)})
                </p>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400">None yet</span>
            )}
          </div>
        </div>

        {/* Average Monthly Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Monthly Spend
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(
                monthlyData.length > 0
                  ? monthlyData.reduce((acc, m) => acc + m.expense, 0) / monthlyData.length
                  : 0
              )}
            </span>
            <p className="text-xs text-slate-500 mt-1">Across recorded months</p>
          </div>
        </div>

        {/* Net Cash Position */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Margin
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(summary.totalBalance)}
            </span>
            <p className="text-xs text-slate-500 mt-1">Total revenue minus total cost</p>
          </div>
        </div>
      </div>

      {/* Row 1: Donut Chart & Category Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Donut */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Category Allocation
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Visual breakdown of all expense outflows by category
          </p>

          <CategoryDonutChart
            categories={categoryBreakdown}
            totalExpense={summary.totalExpense}
          />
        </div>

        {/* Category Progress Bars */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Detailed Category Ranking
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Spending volume ranked from highest to lowest
          </p>

          {categoryBreakdown.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No expenses recorded to rank.
            </div>
          ) : (
            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
              {categoryBreakdown.map((cat) => {
                const config = CATEGORIES[cat.category] || CATEGORIES.Other;
                const Icon = config.icon;

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-md ${config.badgeBg} ${config.badgeText}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800">{cat.category}</span>
                        <span className="text-[11px] text-slate-400">
                          ({cat.count} {cat.count === 1 ? 'item' : 'items'})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{formatCurrency(cat.total)}</span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {formatPercent(cat.percentage)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(1, cat.percentage))}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Monthly Cash Flow Trends Bar Chart */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Monthly Income vs Expenses Trend
            </h3>
            <p className="text-xs text-slate-500">
              Historical monthly cash inflows and outflows across the past 6 calendar months
            </p>
          </div>
        </div>

        <MonthlyBarChart data={monthlyData} />
      </div>
    </div>
  );
}
