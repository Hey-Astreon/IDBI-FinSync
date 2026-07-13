import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/auth-store';
import { apiClient } from './api/client';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';

// ─── Lazy Loaded Route Pages ──────────────────────────────────────────────────

const Login = React.lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = React.lazy(() =>
  import('./pages/auth/Register').then((m) => ({ default: m.Register })),
);
const OtpVerification = React.lazy(() =>
  import('./pages/auth/OtpVerification').then((m) => ({ default: m.OtpVerification })),
);
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const Accounts = React.lazy(() =>
  import('./pages/Accounts').then((m) => ({ default: m.Accounts })),
);
const Transactions = React.lazy(() =>
  import('./pages/Transactions').then((m) => ({ default: m.Transactions })),
);
const Goals = React.lazy(() => import('./pages/Goals').then((m) => ({ default: m.Goals })));
const Investments = React.lazy(() =>
  import('./pages/Investments').then((m) => ({ default: m.Investments })),
);
const Notifications = React.lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications })),
);
const AiAssistant = React.lazy(() =>
  import('./pages/AiAssistant').then((m) => ({ default: m.AiAssistant })),
);
const Profile = React.lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));

// ─── Screen Suspense Wrapper ──────────────────────────────────────────────────

const ScreenSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense
    fallback={
      <div className="flex h-64 w-full items-center justify-center animate-pulse">
        <svg className="animate-spin h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4"
          />
        </svg>
      </div>
    }
  >
    {children}
  </React.Suspense>
);

function App() {
  const { currentScreen, setScreen, setToken, setUser, token, theme } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Synchronize current state document theme on mount
    document.documentElement.setAttribute('data-theme', theme);

    const initializeSession = async () => {
      try {
        // Attempt silent access token recovery using HttpOnly refresh cookie
        const response = await apiClient.post('/auth/refresh');
        const { token: newAccessToken } = response.data.data;
        setToken(newAccessToken);

        // Fetch user profile info
        const profileResponse = await apiClient.get('/user/profile');
        setUser(profileResponse.data.data);

        setScreen('dashboard');
      } catch {
        // Safe to ignore: user is anonymous and must log in manually
        setScreen('login');
      } finally {
        setIsInitializing(false);
      }
    };

    const t = setTimeout(() => {
      initializeSession();
    }, 0);
    return () => clearTimeout(t);
  }, [theme, setScreen, setToken, setUser]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-brand-primary">
        <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // Route protection wrapper
  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <ScreenSuspense>
            <Login />
          </ScreenSuspense>
        );
      case 'register':
        return (
          <ScreenSuspense>
            <Register />
          </ScreenSuspense>
        );
      case 'otp':
        return (
          <ScreenSuspense>
            <OtpVerification />
          </ScreenSuspense>
        );
      case 'dashboard':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <Dashboard />
            </ScreenSuspense>
          </DashboardLayout>
        );
      case 'accounts':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <Accounts />
            </ScreenSuspense>
          </DashboardLayout>
        );
      case 'transactions':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <Transactions />
            </ScreenSuspense>
          </DashboardLayout>
        );
      case 'goals':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <Goals />
            </ScreenSuspense>
          </DashboardLayout>
        );
      case 'investments':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <Investments />
            </ScreenSuspense>
          </DashboardLayout>
        );
      case 'ai':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <AiAssistant />
            </ScreenSuspense>
          </DashboardLayout>
        );
      case 'notifications':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <Notifications />
            </ScreenSuspense>
          </DashboardLayout>
        );
      case 'profile':
        if (!token) return <Login />;
        return (
          <DashboardLayout>
            <ScreenSuspense>
              <Profile />
            </ScreenSuspense>
          </DashboardLayout>
        );
      default:
        // Protected routes fallback
        if (!token) {
          return <Login />;
        }
        return (
          <DashboardLayout>
            <div className="flex flex-col gap-6 p-6 rounded-sq-md border border-border-light bg-bg-surface shadow-ambient">
              <h3 className="text-lg font-semibold tracking-tight text-text-primary capitalize">
                {currentScreen} Screen Placeholder
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                IDBI FinSync foundation architecture is complete. Ready to mount banking modules for
                this section.
              </p>
            </div>
          </DashboardLayout>
        );
    }
  };

  return (
    <ErrorBoundary>
      {renderScreen()}
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
