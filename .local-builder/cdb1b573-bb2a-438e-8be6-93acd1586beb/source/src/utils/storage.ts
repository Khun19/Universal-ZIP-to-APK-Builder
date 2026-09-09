import { Transaction } from '../types';
import { generateSampleTransactions } from '../data/sampleTransactions';

const STORAGE_KEY = 'finance_tracker_transactions_v2';

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateSampleTransactions();
      saveTransactions(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array saved, return empty
    if (Array.isArray(parsed)) {
      return [];
    }
    const initial = generateSampleTransactions();
    saveTransactions(initial);
    return initial;
  } catch (err) {
    console.error('Failed to load transactions from localStorage:', err);
    return generateSampleTransactions();
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage:', err);
  }
}

export function exportToCSV(transactions: Transaction[]): void {
  const headers = ['ID', 'Title', 'Type', 'Category', 'Amount', 'Date', 'Note'];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    t.amount.toFixed(2),
    `"${t.date}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(transactions: Transaction[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `finance_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importFromJSON(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid JSON: expected array of transactions');
        }
        // Basic validation
        const validTransactions: Transaction[] = parsed.filter(
          (t) => t && typeof t.title === 'string' && typeof t.amount === 'number' && (t.type === 'income' || t.type === 'expense')
        );
        resolve(validTransactions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
