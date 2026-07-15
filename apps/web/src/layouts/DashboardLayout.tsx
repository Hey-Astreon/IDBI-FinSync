import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { useAuthStore } from '../store/auth-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { currentScreen } = useAuthStore();

  const closeDrawer = useCallback(() => setIsMobileDrawerOpen(false), []);

  // Close drawer on route change — deferred to avoid setState-in-render
  useEffect(() => {
    const id = setTimeout(closeDrawer, 0);
    return () => clearTimeout(id);
  }, [currentScreen, closeDrawer]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = isMobileDrawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  return (
    <div className="flex min-h-screen bg-bg-base transition-colors duration-300">
      {/* ── Desktop Sidebar (always visible ≥ md) ── */}
      <div className="hidden md:flex md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen">
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar Drawer Overlay ── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={closeDrawer}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          {/* Drawer panel */}
          <div
            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-2xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={closeDrawer} />
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onMenuClick={() => setIsMobileDrawerOpen(true)} />
        <main className="p-4 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
