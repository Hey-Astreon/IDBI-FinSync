import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  otpPendingUserId: string | null;
  otpPurpose: string | null;
  currentScreen:
    | 'login'
    | 'register'
    | 'otp'
    | 'dashboard'
    | 'accounts'
    | 'goals'
    | 'transactions'
    | 'investments'
    | 'ai'
    | 'profile'
    | 'notifications';
  theme: 'light' | 'dark';
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setOtpPending: (userId: string | null, purpose: string | null) => void;
  setScreen: (screen: AuthState['currentScreen']) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  otpPendingUserId: null,
  otpPurpose: null,
  currentScreen: 'login',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',

  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setOtpPending: (userId, purpose) => set({ otpPendingUserId: userId, otpPurpose: purpose }),
  setScreen: (screen) => set({ currentScreen: screen }),

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  logout: () =>
    set({
      user: null,
      token: null,
      otpPendingUserId: null,
      otpPurpose: null,
      currentScreen: 'login',
    }),
}));
