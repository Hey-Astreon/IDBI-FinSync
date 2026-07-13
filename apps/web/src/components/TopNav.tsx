import React from 'react';
import { useAuthStore } from '../store/auth-store';
import { NotificationCenter } from './NotificationCenter';
import { Moon, Sun } from 'lucide-react';

export const TopNav: React.FC = () => {
  const { theme, toggleTheme, currentScreen } = useAuthStore();

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard':
        return 'Overview';
      case 'transactions':
        return 'Transaction Ledger';
      case 'goals':
        return 'Financial Goals';
      case 'investments':
        return 'IDBI Mutual Wealth';
      case 'ai':
        return 'Mitra Financial Companion';
      case 'profile':
        return 'Profile Settings';
      default:
        return 'IDBI FinSync';
    }
  };

  return (
    <header className="h-16 border-b border-border-light bg-bg-surface px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary capitalize">
          {getScreenTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-border-light bg-bg-surface hover:bg-opacity-80 transition-all text-text-secondary hover:text-text-primary"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Real-Time Notification center Drawer */}
        <NotificationCenter />
      </div>
    </header>
  );
};
