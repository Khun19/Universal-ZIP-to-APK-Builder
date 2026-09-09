import { useState } from 'react';
import { CategorySummary } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface CategoryDonutChartProps {
  categories: CategorySummary[];
  totalExpense: number;
}

export default function CategoryDonutChart({ categories, totalExpense }: CategoryDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (categories.length === 0 || totalExpense === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <span className="text-xl">📊</span>
        </div>
        <p className="text-sm font-medium text-slate-600">No expense records found</p>
        <p className="text-xs text-slate-400 mt-1">Add expenses to see category distribution</p>
      </div>
    );
  }

  // Calculate SVG donut chart parameters
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  const activeCategory = hoveredIndex !== null ? categories[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {categories.map((cat, idx) => {
            const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += cat.percentage;

            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={cat.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={cat.color}
                strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.45,
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
          {activeCategory ? (
            <>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-1">
                {activeCategory.category}
              </span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">
                {formatCurrency(activeCategory.total)}
              </span>
              <span className="text-xs font-medium text-slate-500 mt-0.5">
                {formatPercent(activeCategory.percentage)}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-500">Total Spent</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">
                {formatCurrency(totalExpense)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-2 max-h-60 overflow-y-auto pr-1">
        {categories.map((cat, idx) => {
          const config = CATEGORIES[cat.category] || CATEGORIES.Other;
          const Icon = config.icon;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={cat.category}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                isHovered
                  ? 'bg-slate-100 ring-1 ring-slate-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className={`p-1 rounded-md ${config.badgeBg} ${config.badgeText}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium text-slate-800 truncate">
                  {cat.category}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-right flex-shrink-0 pl-2">
                <span className="text-xs font-semibold text-slate-500 w-12 text-right">
                  {formatPercent(cat.percentage)}
                </span>
                <span className="text-sm font-bold text-slate-900 w-20 text-right">
                  {formatCurrency(cat.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
