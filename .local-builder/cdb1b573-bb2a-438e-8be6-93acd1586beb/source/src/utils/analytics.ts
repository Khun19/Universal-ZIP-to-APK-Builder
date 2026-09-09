import { Transaction, CategorySummary, MonthlySummary } from '../types';
import { CATEGORIES } from '../data/categories';

export interface FinanceSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number; // percentage
  thisMonthIncome: number;
  thisMonthExpense: number;
  thisMonthNet: number;
  lastMonthExpense: number;
  expenseChangePercent: number | null;
  transactionCount: number;
}

export function calculateFinanceSummary(transactions: Transaction[]): FinanceSummary {
  let totalIncome = 0;
  let totalExpense = 0;

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  let thisMonthIncome = 0;
  let thisMonthExpense = 0;
  let lastMonthExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      if (tx.date.startsWith(currentYearMonth)) {
        thisMonthIncome += tx.amount;
      }
    } else {
      totalExpense += tx.amount;
      if (tx.date.startsWith(currentYearMonth)) {
        thisMonthExpense += tx.amount;
      } else if (tx.date.startsWith(lastYearMonth)) {
        lastMonthExpense += tx.amount;
      }
    }
  });

  const totalBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const thisMonthNet = thisMonthIncome - thisMonthExpense;

  let expenseChangePercent: number | null = null;
  if (lastMonthExpense > 0) {
    expenseChangePercent = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
  }

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    savingsRate,
    thisMonthIncome,
    thisMonthExpense,
    thisMonthNet,
    lastMonthExpense,
    expenseChangePercent,
    transactionCount: transactions.length,
  };
}

export function getCategoryExpenseBreakdown(transactions: Transaction[]): CategorySummary[] {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  const categoryMap = new Map<string, { total: number; count: number }>();

  expenseTransactions.forEach((tx) => {
    const current = categoryMap.get(tx.category) || { total: 0, count: 0 };
    categoryMap.set(tx.category, {
      total: current.total + tx.amount,
      count: current.count + 1,
    });
  });

  const result: CategorySummary[] = [];

  categoryMap.forEach((data, categoryName) => {
    const config = CATEGORIES[categoryName as keyof typeof CATEGORIES] || CATEGORIES.Other;
    result.push({
      category: categoryName as any,
      total: data.total,
      count: data.count,
      percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      color: config.color,
      textColor: config.badgeText,
      bgLight: config.badgeBg,
    });
  });

  // Sort descending by total amount
  return result.sort((a, b) => b.total - a.total);
}

export function getMonthlySummaries(transactions: Transaction[], monthsCount = 6): MonthlySummary[] {
  const now = new Date();
  const months: { key: string; label: string }[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    months.push({ key, label });
  }

  return months.map(({ key, label }) => {
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      if (tx.date.startsWith(key)) {
        if (tx.type === 'income') {
          income += tx.amount;
        } else {
          expense += tx.amount;
        }
      }
    });

    return {
      monthKey: key,
      label,
      income,
      expense,
      net: income - expense,
    };
  });
}
