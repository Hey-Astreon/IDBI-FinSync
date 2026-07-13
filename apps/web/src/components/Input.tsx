import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={`w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm transition-all focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus placeholder:text-text-muted ${
          error
            ? 'border-indicator-error focus:ring-indicator-error focus:border-indicator-error'
            : ''
        } ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-indicator-error leading-none">{error}</span> : null}
    </div>
  );
};
