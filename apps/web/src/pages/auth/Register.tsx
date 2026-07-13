import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth-store';
import { useToastStore } from '../../store/toast-store';
import { apiClient } from '../../api/client';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { setScreen, setOtpPending } = useAuthStore();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Perform Registration API call
      const response = await apiClient.post('/auth/register', {
        email,
        mobileNumber,
        password,
      });

      const user = response.data.data;
      addToast('success', 'Account Created', 'Please verify your mobile number.');

      // 2. Request OTP for verification
      const otpResponse = await apiClient.post('/auth/otp/request', {
        userId: user.id,
        purpose: 'SIGNUP',
      });

      setOtpPending(user.id, 'SIGNUP');

      // If in development/testing mode, retrieve OTP from response to auto-fill or display to the developer
      const generatedCode = otpResponse.data.data?.code;
      if (generatedCode) {
        addToast('info', 'OTP Generated (Dev Mode)', `Your test code is: ${generatedCode}`);
      }

      setScreen('otp');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Registration failed.';
      const details = err.response?.data?.error?.details;

      if (details && details.length > 0) {
        setValidationError(details[0].message);
      } else {
        setValidationError(errorMsg);
      }

      addToast('error', 'Registration Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base p-6 text-text-primary transition-colors duration-300">
      <div className="w-full max-w-md rounded-sq-lg border border-border-light bg-bg-surface p-8 shadow-ambient flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-brand-primary">Register</h1>
          <p className="text-sm text-text-secondary">Join IDBI FinSync financial ecosystem.</p>
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
            id="mobileNumber"
            type="tel"
            label="Mobile Number"
            placeholder="+91XXXXXXXXXX"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Min 8 chars, numbers & symbols"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <div className="p-3 bg-bg-base rounded-sq-sm border border-border-light flex flex-col gap-1 text-[11px] leading-relaxed text-text-secondary">
            <div className="font-semibold text-text-primary flex items-center gap-1.5 mb-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Password Security Requirements</span>
            </div>
            <p>• Must be at least 8 characters long</p>
            <p>• Must contain at least one uppercase & lowercase letter</p>
            <p>• Must contain at least one number & one special symbol</p>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-text-secondary mt-2">
          Already have an account?{' '}
          <button
            onClick={() => setScreen('login')}
            className="font-semibold text-brand-primary hover:underline cursor-pointer"
            disabled={isLoading}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
