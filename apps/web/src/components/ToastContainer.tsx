import React from 'react';
import { useToastStore } from '../store/toast-store';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'text-brand-accent';
        let borderColor = 'border-border-light';
        let bgGlow = '';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
          borderColor = 'border-emerald-500/20';
          bgGlow = 'shadow-[0px_4px_24px_rgba(16,185,129,0.08)]';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-500';
          borderColor = 'border-amber-500/20';
          bgGlow = 'shadow-[0px_4px_24px_rgba(245,158,11,0.08)]';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          iconColor = 'text-rose-500';
          borderColor = 'border-rose-500/20';
          bgGlow = 'shadow-[0px_4px_24px_rgba(244,63,94,0.08)]';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-sq-md border bg-bg-surface ${borderColor} ${bgGlow} transition-all duration-300 transform translate-y-0 scale-100 hover:translate-x-[-4px]`}
          >
            <div className="mt-0.5">
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight text-text-primary">
                {toast.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary transition-colors mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
