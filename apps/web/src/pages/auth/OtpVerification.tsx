import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth-store';
import { useToastStore } from '../../store/toast-store';
import { apiClient } from '../../api/client';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const OtpVerification: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { otpPendingUserId, otpPurpose, setScreen, setOtpPending } = useAuthStore();
  const { addToast } = useToastStore();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationError(null);

    if (!otpPendingUserId) {
      setValidationError('No pending verification session found.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/otp/verify', {
        userId: otpPendingUserId,
        code,
        purpose: otpPurpose || 'SIGNUP',
      });

      const { isValid } = response.data.data;

      if (isValid) {
        addToast(
          'success',
          'Verification Successful',
          'Your mobile number is verified. You can now login.',
        );
        // Clean up OTP state and redirect to login
        setOtpPending(null, null);
        setScreen('login');
      } else {
        setValidationError('Invalid or expired OTP code.');
        addToast('error', 'Verification Failed', 'Invalid OTP code.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Verification failed.';
      setValidationError(errorMsg);
      addToast('error', 'Verification Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!otpPendingUserId) return;
    setIsLoading(true);
    setValidationError(null);
    try {
      const response = await apiClient.post('/auth/otp/request', {
        userId: otpPendingUserId,
        purpose: otpPurpose || 'SIGNUP',
      });

      addToast('success', 'OTP Resent', 'A new code has been generated.');

      const generatedCode = response.data.data?.code;
      if (generatedCode) {
        addToast('info', 'OTP Generated (Dev Mode)', `Your test code is: ${generatedCode}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to resend OTP.';
      setValidationError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base p-6 text-text-primary transition-colors duration-300">
      <div className="w-full max-w-md rounded-sq-lg border border-border-light bg-bg-surface p-8 shadow-ambient flex flex-col gap-6">
        <div>
          <button
            onClick={() => {
              setOtpPending(null, null);
              setScreen('register');
            }}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-semibold transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Register</span>
          </button>
        </div>

        <div className="text-center flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-brand-primary">Verify OTP</h1>
          <p className="text-sm text-text-secondary">Enter the 6-digit confirmation code.</p>
          <div className="mt-1 text-xs font-semibold px-2.5 py-1 rounded bg-brand-primary/5 text-brand-primary border border-brand-primary/10 self-center">
            Demo Mode: Enter <span className="font-mono font-bold select-all">123456</span> to
            verify
          </div>
        </div>

        {validationError ? (
          <div className="flex items-center gap-2.5 p-3 rounded-sq-sm bg-indicator-error/5 border border-indicator-error/15 text-xs text-indicator-error">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        ) : null}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <Input
            id="code"
            type="text"
            label="Verification Code"
            placeholder="XXXXXX"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            disabled={isLoading}
            className="text-center tracking-[0.5em] text-lg font-mono font-bold"
          />

          <Button type="submit" isLoading={isLoading} className="w-full mt-2">
            Confirm Verification
          </Button>
        </form>

        <div className="text-center text-xs text-text-secondary">
          Didn&apos;t receive the code?{' '}
          <button
            onClick={handleResend}
            className="font-semibold text-brand-primary hover:underline cursor-pointer"
            disabled={isLoading}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};
