import React from 'react';
import { useAuthStore } from '../store/auth-store';
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  Target,
  LineChart,
  Bot,
  User,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { currentScreen, setScreen, logout, user } = useAuthStore();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'investments', label: 'Investments', icon: LineChart },
    { id: 'ai', label: 'Mitra AI', icon: Bot },
  ] as const;

  const handleNav = (id: string) => {
    setScreen(id as any);
    onClose?.(); // close drawer on mobile after navigation
  };

  return (
    <aside className="w-64 border-r border-border-light bg-bg-surface flex flex-col justify-between h-full">
      <div className="flex flex-col gap-6 p-6">
        {/* Brand Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="IDBI FinSync" className="h-7 w-7 object-contain" />
            <span className="font-bold text-lg tracking-tight text-brand-primary">
              IDBI FinSync
            </span>
          </div>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-full hover:bg-bg-base transition-all text-text-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* User Card Mini */}
        {user ? (
          <div className="p-3 bg-bg-base rounded-sq-sm border border-border-light flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-xs shrink-0">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text-primary truncate">{user.email}</div>
              <div className="text-[10px] text-text-muted truncate">{user.mobileNumber}</div>
            </div>
          </div>
        ) : null}

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-sq-sm cursor-pointer ${
                  isActive
                    ? 'bg-brand-primary/5 text-brand-primary border-l-2 border-brand-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-base'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`}
                />
                <span>{item.label}</span>
                {item.id === 'ai' ? (
                  <span className="ml-auto text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-secondary/15 text-brand-secondary flex items-center gap-0.5">
                    <Sparkles className="h-2 w-2" /> Live
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border-light flex flex-col gap-2">
        <button
          onClick={() => handleNav('profile')}
          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-sq-sm cursor-pointer ${
            currentScreen === 'profile'
              ? 'bg-brand-primary/5 text-brand-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-base'
          }`}
        >
          <User className="h-4 w-4 text-text-muted shrink-0" />
          <span>My Profile</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-indicator-error hover:bg-rose-500/5 transition-all rounded-sq-sm cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
