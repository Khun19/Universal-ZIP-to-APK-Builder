export type TransactionType = 'income' | 'expense';

export type Category =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Health'
  | 'Education'
  | 'Salary'
  | 'Other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export type ViewTab = 'dashboard' | 'transactions' | 'analytics';

export type DatePreset = 'all' | 'this-month' | 'last-month' | 'this-year' | 'custom';

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export interface TransactionFilter {
  search: string;
  type: 'all' | TransactionType;
  category: 'all' | Category;
  datePreset: DatePreset;
  startDate?: string;
  endDate?: string;
  sortBy: SortOption;
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
  color: string;
  textColor: string;
  bgLight: string;
}

export interface MonthlySummary {
  monthKey: string; // 'YYYY-MM'
  label: string;    // 'Jan', 'Feb', etc.
  income: number;
  expense: number;
  net: number;
}
