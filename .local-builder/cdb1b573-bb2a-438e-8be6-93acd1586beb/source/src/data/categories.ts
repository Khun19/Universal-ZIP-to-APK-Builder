import {
  Utensils,
  Car,
  ShoppingBag,
  ReceiptText,
  Film,
  HeartPulse,
  GraduationCap,
  Wallet,
  MoreHorizontal,
  LucideIcon
} from 'lucide-react';
import { Category, TransactionType } from '../types';

export interface CategoryInfo {
  name: Category;
  icon: LucideIcon;
  color: string;       // HEX color
  badgeBg: string;     // Tailwind classes
  badgeText: string;   // Tailwind classes
  badgeBorder: string; // Tailwind classes
  defaultType: TransactionType;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  Food: {
    name: 'Food',
    icon: Utensils,
    color: '#f97316', // orange-500
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    defaultType: 'expense',
  },
  Transport: {
    name: 'Transport',
    icon: Car,
    color: '#0284c7', // sky-600
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    defaultType: 'expense',
  },
  Shopping: {
    name: 'Shopping',
    icon: ShoppingBag,
    color: '#ec4899', // pink-500
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700',
    badgeBorder: 'border-pink-200',
    defaultType: 'expense',
  },
  Bills: {
    name: 'Bills',
    icon: ReceiptText,
    color: '#ef4444', // red-500
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
    defaultType: 'expense',
  },
  Entertainment: {
    name: 'Entertainment',
    icon: Film,
    color: '#8b5cf6', // purple-500
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    defaultType: 'expense',
  },
  Health: {
    name: 'Health',
    icon: HeartPulse,
    color: '#10b981', // emerald-500
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    defaultType: 'expense',
  },
  Education: {
    name: 'Education',
    icon: GraduationCap,
    color: '#6366f1', // indigo-500
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    defaultType: 'expense',
  },
  Salary: {
    name: 'Salary',
    icon: Wallet,
    color: '#059669', // emerald-600
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    defaultType: 'income',
  },
  Other: {
    name: 'Other',
    icon: MoreHorizontal,
    color: '#64748b', // slate-500
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    defaultType: 'expense',
  },
};

export const ALL_CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Salary',
  'Other',
];

export const EXPENSE_CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

export const INCOME_CATEGORIES: Category[] = [
  'Salary',
  'Other',
];
