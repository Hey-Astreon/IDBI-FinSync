import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useToastStore } from '../store/toast-store';
import { apiClient } from '../api/client';
import { User, UserPreferences } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Skeleton } from '../components/Skeleton';
import {
  User as UserIcon,
  ShieldCheck,
  ToggleLeft,
  Bell,
  Sun,
  Moon,
  Info,
  LogOut,
  Settings,
} from 'lucide-react';

interface UserProfileData extends User {
  preferences: UserPreferences | null;
}

export const Profile: React.FC = () => {
  const { setUser, logout, theme, setTheme } = useAuthStore();
  const { addToast } = useToastStore();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Preference states
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/user/profile');
      const data: UserProfileData = res.data.data;
      setProfileData(data);
      setEmail(data.email);
      setMobileNumber(data.mobileNumber);
      if (data.preferences) {
        setNotificationsEnabled(data.preferences.notificationsEnabled);
        setBiometricsEnabled(data.preferences.biometricsEnabled);
      }
    } catch {
      addToast('error', 'Fetch Failed', 'Failed to retrieve profile information.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const t = setTimeout(() => fetchProfile(), 0);
    return () => clearTimeout(t);
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('warning', 'Invalid Email', 'Email cannot be blank.');
      return;
    }
    // Indian mobile number validation matching backend regex: ^\+91[6-9]\d{9}$
    const mobileRegex = /^\+91[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      addToast(
        'warning',
        'Invalid Mobile',
        'Mobile number must be in +91XXXXXXXXXX format starting with 6-9.',
      );
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await apiClient.put('/user/profile', {
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
      });
      const updatedUser = res.data.data;
      setUser(updatedUser);
      setProfileData((prev) => (prev ? { ...prev, ...updatedUser } : null));
      addToast('success', 'Profile Updated', 'Personal information updated successfully.');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Failed to update personal details.';
      addToast('error', 'Update Failed', msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePreferences = async (updates: Partial<UpdatePreferencesDTO>) => {
    setIsUpdatingPreferences(true);
    try {
      const res = await apiClient.patch('/user/preferences', updates);
      const newPrefs = res.data.data;
      setProfileData((prev) => (prev ? { ...prev, preferences: newPrefs } : null));
      if (updates.theme) {
        setTheme(updates.theme);
      }
      addToast('success', 'Preferences Saved', 'Your application preferences have been updated.');
    } catch {
      addToast('error', 'Update Failed', 'Could not sync settings updates with the server.');
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
        <Skeleton variant="text" className="w-1/4 h-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Personal Info Card ───────────────────────────────────────────── */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border-light">
              <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Personal Details</h3>
                <p className="text-xs text-text-muted">Manage your primary contact information.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <Input
                id="profile-email"
                type="email"
                label="Email Address"
                placeholder="yourname@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isUpdatingProfile}
              />
              <Input
                id="profile-mobile"
                type="text"
                label="Mobile Number (India)"
                placeholder="+919876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                disabled={isUpdatingProfile}
              />

              <Button type="submit" isLoading={isUpdatingProfile} className="text-xs self-end">
                Save Changes
              </Button>
            </form>
          </Card>

          {/* ── App Preferences Card ────────────────────────────────────────── */}
          <Card className="flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border-light">
              <div className="h-10 w-10 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">App Preferences</h3>
                <p className="text-xs text-text-muted">Adjust system styling and alerts options.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Theme Preference */}
              <div className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-text-primary">Interface Theme</span>
                  <span className="text-[10px] text-text-muted">
                    Switch between Light and Dark aesthetics.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-bg-base border border-border-light rounded px-1.5 py-1">
                  <button
                    onClick={() => handleUpdatePreferences({ theme: 'light' })}
                    disabled={isUpdatingPreferences}
                    className={`p-1.5 rounded transition-all ${
                      theme === 'light'
                        ? 'bg-bg-surface text-brand-primary shadow-sm font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    title="Light Theme"
                  >
                    <Sun className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUpdatePreferences({ theme: 'dark' })}
                    disabled={isUpdatingPreferences}
                    className={`p-1.5 rounded transition-all ${
                      theme === 'dark'
                        ? 'bg-bg-surface text-brand-primary shadow-sm font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    title="Dark Theme"
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-text-primary">Email Alerts</span>
                  <span className="text-[10px] text-text-muted">
                    Receive transaction alerts and goal updates.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const next = !notificationsEnabled;
                    setNotificationsEnabled(next);
                    handleUpdatePreferences({ notificationsEnabled: next });
                  }}
                  disabled={isUpdatingPreferences}
                  className={`p-1 transition-all rounded ${
                    notificationsEnabled ? 'text-brand-primary' : 'text-text-muted'
                  }`}
                  aria-label="Toggle email alerts"
                >
                  <Bell className="h-5 w-5" />
                </button>
              </div>

              {/* Biometrics Toggle */}
              <div className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-text-primary">Biometric Sync</span>
                  <span className="text-[10px] text-text-muted">
                    Enable fingerprint or face unlock where supported.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const next = !biometricsEnabled;
                    setBiometricsEnabled(next);
                    handleUpdatePreferences({ biometricsEnabled: next });
                  }}
                  disabled={isUpdatingPreferences}
                  className={`p-1 transition-all rounded ${
                    biometricsEnabled ? 'text-brand-primary' : 'text-text-muted'
                  }`}
                  aria-label="Toggle biometric login"
                >
                  <ToggleLeft className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Sidebar context cards ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* KYC Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border-light">
              <ShieldCheck className="h-5 w-5 text-brand-primary" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                IDBI Security Status
              </h4>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">KYC Status</span>
                <span
                  className={`font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                    profileData.kycStatus === 'VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : profileData.kycStatus === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-rose-500/10 text-rose-600'
                  }`}
                >
                  {profileData.kycStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Risk Profile</span>
                <span className="font-extrabold text-text-primary uppercase text-[10px]">
                  {profileData.riskTier}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Member Since</span>
                <span className="font-semibold text-text-primary">
                  {new Date(profileData.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </div>

            {profileData.kycStatus !== 'VERIFIED' && (
              <div className="p-3 bg-amber-500/5 rounded border border-amber-500/10 flex items-start gap-2 text-[10px] leading-relaxed text-text-secondary">
                <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Please complete document uploads to verify your identity and enable high-volume
                  transactions.
                </span>
              </div>
            )}
          </Card>

          {/* Session settings */}
          <Card className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border-light">
              Session Management
            </h4>
            <div className="text-xs text-text-secondary leading-relaxed">
              You are securely signed in. Remember to log out if you are accessing IDBI FinSync from
              a shared public device.
            </div>
            <Button variant="danger" onClick={logout} className="text-xs w-full py-2">
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── Local Types mapping ──────────────────────────────────────────────────────

interface UpdatePreferencesDTO {
  theme?: 'light' | 'dark';
  notificationsEnabled?: boolean;
  biometricsEnabled?: boolean;
}
