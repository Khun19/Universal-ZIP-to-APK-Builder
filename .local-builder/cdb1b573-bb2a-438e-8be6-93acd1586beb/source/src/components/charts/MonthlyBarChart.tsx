import { useState } from 'react';
import { MonthlySummary } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface MonthlyBarChartProps {
  data: MonthlySummary[];
}

export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const [activeBar, setActiveBar] = useState<MonthlySummary | null>(null);

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400 text-sm">
        No monthly historical data available yet.
      </div>
    );
  }

  // Determine max value for Y-axis scale
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  return (
    <div className="w-full">
      {/* Legend & Hover Info Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-4 text-xs font-medium text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span>Income</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span>Expenses</span>
          </div>
        </div>

        {activeBar && (
          <div className="text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg flex items-center space-x-2 animate-fade-in shadow-sm">
            <span className="font-semibold">{activeBar.label}:</span>
            <span className="text-emerald-300">+{formatCurrency(activeBar.income)}</span>
            <span className="text-slate-400">|</span>
            <span className="text-rose-300">-{formatCurrency(activeBar.expense)}</span>
            <span className="text-slate-400">|</span>
            <span className="text-white font-medium">Net {formatCurrency(activeBar.net)}</span>
          </div>
        )}
      </div>

      {/* Bars container */}
      <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-4 pb-1 border-b border-slate-200">
        {data.map((item) => {
          const incomeHeight = maxVal > 0 ? (item.income / maxVal) * 100 : 0;
          const expenseHeight = maxVal > 0 ? (item.expense / maxVal) * 100 : 0;
          const isSelected = activeBar?.monthKey === item.monthKey;

          return (
            <div
              key={item.monthKey}
              className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all ${
                isSelected ? 'opacity-100 scale-105' : 'hover:opacity-90'
              }`}
              onMouseEnter={() => setActiveBar(item)}
              onMouseLeave={() => setActiveBar(null)}
              onClick={() => setActiveBar(item)}
            >
              {/* Dual bars */}
              <div className="w-full flex items-end justify-center space-x-1 sm:space-x-1.5 h-full">
                {/* Income Bar */}
                <div
                  className="w-1/2 max-w-[18px] bg-emerald-500 rounded-t-md transition-all duration-300 relative group"
                  style={{ height: `${Math.max(incomeHeight, 3)}%` }}
                  title={`${item.label} Income: ${formatCurrency(item.income)}`}
                />
                {/* Expense Bar */}
                <div
                  className="w-1/2 max-w-[18px] bg-rose-500 rounded-t-md transition-all duration-300 relative group"
                  style={{ height: `${Math.max(expenseHeight, 3)}%` }}
                  title={`${item.label} Expense: ${formatCurrency(item.expense)}`}
                />
              </div>

              {/* Month label */}
              <span className={`text-[11px] mt-2 font-medium transition-colors ${
                isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
