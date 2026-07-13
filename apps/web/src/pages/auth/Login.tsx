import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth-store';
import { useToastStore } from '../../store/toast-store';
import { apiClient } from '../../api/client';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Moon, Sun, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { setToken, setUser, setScreen, theme, toggleTheme } = useAuthStore();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationError(null);

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        deviceId: 'web-browser-session', // Constant fallback for browser client
        deviceName: 'Chrome Browser',
      });

      const { token, user } = response.data.data;
      setToken(token);
      setUser(user);

      addToast('success', 'Welcome Back', 'Authenticated successfully.');
      setScreen('dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to authenticate.';
      const errorCode = err.response?.data?.error?.code;

      if (errorCode === 'VAL_001') {
        setValidationError('Invalid email format or credentials.');
      } else {
        setValidationError(errorMsg);
      }

      addToast('error', 'Login Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setValidationError(null);

    const demoEmail = 'demo@finsync.com';
    const demoPassword = 'password123';

    try {
      // 1. Try to Login
      const loginResponse = await apiClient.post('/auth/login', {
        email: demoEmail,
        password: demoPassword,
        deviceId: 'web-browser-session',
        deviceName: 'Chrome Browser',
      });

      const { token, user } = loginResponse.data.data;
      setToken(token);
      setUser(user);
      addToast('success', 'Logged In as Demo User', 'Welcome to IDBI FinSync demo!');
      setScreen('dashboard');
    } catch {
      // 2. If user doesn't exist, register them on the fly!
      try {
        // Register User
        const registerResponse = await apiClient.post('/auth/register', {
          fullName: 'Demo User',
          email: demoEmail,
          password: demoPassword,
          mobileNumber: '9999999999',
        });
        const user = registerResponse.data.data.user;

        // Request OTP
        await apiClient.post('/auth/otp/request', {
          userId: user.id,
          purpose: 'SIGNUP',
        });

        // Verify OTP using the bypass code we created
        await apiClient.post('/auth/otp/verify', {
          userId: user.id,
          code: '123456',
          purpose: 'SIGNUP',
        });

        // Login again!
        const loginResponse = await apiClient.post('/auth/login', {
          email: demoEmail,
          password: demoPassword,
          deviceId: 'web-browser-session',
          deviceName: 'Chrome Browser',
        });

        const { token, user: loggedUser } = loginResponse.data.data;
        setToken(token);
        setUser(loggedUser);
        addToast('success', 'Demo User Created & Authenticated', 'Welcome to IDBI FinSync demo!');
        setScreen('dashboard');
      } catch (innerErr: any) {
        const errorMsg =
          innerErr.response?.data?.error?.message || 'Failed to initialize demo session.';
        setValidationError(errorMsg);
        addToast('error', 'Demo Sign In Failed', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base p-6 text-text-primary transition-colors duration-300">
      {/* Theme Toggle Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-full border border-border-light bg-bg-surface hover:bg-opacity-80 transition-all shadow-ambient"
      >
        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-md rounded-sq-lg border border-border-light bg-bg-surface p-8 shadow-ambient flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-brand-primary">IDBI FinSync</h1>
          <p className="text-sm text-text-secondary">One Financial Life. Connected.</p>
        </div>

        {validationError ? (
          <div className="flex items-center gap-2.5 p-3 rounded-sq-sm bg-indicator-error/5 border border-indicator-error/15 text-xs text-indicator-error">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button type="submit" isLoading={isLoading} className="w-full mt-2">
            Sign In
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border-light"></div>
            <span className="flex-shrink mx-4 text-text-secondary text-xs font-semibold">Or</span>
            <div className="flex-grow border-t border-border-light"></div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoLogin}
            isLoading={isLoading}
            className="w-full border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary-dark transition-all"
          >
            Sign In as Guest / Demo
          </Button>
        </form>

        <div className="text-center text-xs text-text-secondary mt-2">
          New to IDBI FinSync?{' '}
          <button
            onClick={() => setScreen('register')}
            className="font-semibold text-brand-primary hover:underline cursor-pointer"
            disabled={isLoading}
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};
