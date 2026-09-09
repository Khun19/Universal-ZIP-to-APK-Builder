import { LayoutDashboard, Receipt, BarChart3, Plus } from 'lucide-react';
import { ViewTab } from '../types';

interface BottomNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
}

export default function BottomNav({
  currentTab,
  onTabChange,
  onOpenAddModal,
}: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {/* Dashboard button */}
        <button
          id="mobile-nav-dashboard"
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px] ${
            currentTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-1">Dashboard</span>
        </button>

        {/* Transactions button */}
        <button
          id="mobile-nav-transactions"
          type="button"
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px] ${
            currentTab === 'transactions' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className={`w-5 h-5 ${currentTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-1">Transactions</span>
        </button>

        {/* Center Prominent Add Button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            id="mobile-center-add-btn"
            type="button"
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/25 active:scale-95 transition-transform ring-4 ring-white"
            aria-label="Add transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Analytics button */}
        <button
          id="mobile-nav-analytics"
          type="button"
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px] ${
            currentTab === 'analytics' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${currentTab === 'analytics' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-1">Analytics</span>
        </button>
      </div>
    </div>
  );
}
