import { useState, useMemo, useEffect } from 'react';
import { Transaction, ViewTab } from './types';
import { loadTransactions, saveTransactions } from './utils/storage';
import { generateSampleTransactions } from './data/sampleTransactions';
import {
  calculateFinanceSummary,
  getCategoryExpenseBreakdown,
  getMonthlySummaries,
} from './utils/analytics';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import AnalyticsView from './components/AnalyticsView';
import TransactionModal from './components/TransactionModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import DataManagementModal from './components/DataManagementModal';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Sync to localStorage whenever transactions change
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // Memoized calculations
  const summary = useMemo(
    () => calculateFinanceSummary(transactions),
    [transactions]
  );

  const categoryBreakdown = useMemo(
    () => getCategoryExpenseBreakdown(transactions),
    [transactions]
  );

  const monthlyData = useMemo(
    () => getMonthlySummaries(transactions, 6),
    [transactions]
  );

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [transactions]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === existingId
            ? { ...t, ...txData }
            : t
        )
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingTx) return;
    setTransactions((prev) => prev.filter((t) => t.id !== deletingTx.id));
    setDeletingTx(null);
  };

  const handleImportTransactions = (imported: Transaction[]) => {
    setTransactions(imported);
  };

  const handleResetToSample = () => {
    const freshSample = generateSampleTransactions();
    setTransactions(freshSample);
  };

  const handleClearAll = () => {
    setTransactions([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-slate-900 selection:text-white font-sans antialiased">
      {/* Top App Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAddModal={handleOpenAddModal}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        transactionCount={transactions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            recentTransactions={recentTransactions}
            categoryBreakdown={categoryBreakdown}
            monthlyData={monthlyData}
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={setDeletingTx}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={setDeletingTx}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            summary={summary}
            categoryBreakdown={categoryBreakdown}
            monthlyData={monthlyData}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTx}
      />

      <DeleteConfirmModal
        isOpen={!!deletingTx}
        transaction={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        transactions={transactions}
        onImport={handleImportTransactions}
        onResetToSample={handleResetToSample}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
