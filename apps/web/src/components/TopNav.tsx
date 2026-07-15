import React from 'react';
import { useAuthStore } from '../store/auth-store';
import { NotificationCenter } from './NotificationCenter';
import { Moon, Sun, Menu } from 'lucide-react';

interface TopNavProps {
  onMenuClick: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme, currentScreen } = useAuthStore();

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard':
        return 'Overview';
      case 'accounts':
        return 'Connected Accounts';
      case 'transactions':
        return 'Transaction Ledger';
      case 'goals':
        return 'Financial Goals';
      case 'investments':
        return 'IDBI Mutual Wealth';
      case 'ai':
        return 'Mitra AI Advisor';
      case 'profile':
        return 'Profile Settings';
      case 'notifications':
        return 'Notifications';
      default:
        return 'IDBI FinSync';
    }
  };

  return (
    <header className="h-14 md:h-16 border-b border-border-light bg-bg-surface px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Hamburger — only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-sq-sm hover:bg-bg-base transition-all text-text-secondary"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-base md:text-xl font-bold tracking-tight text-text-primary capitalize truncate max-w-[180px] md:max-w-none">
          {getScreenTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
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
