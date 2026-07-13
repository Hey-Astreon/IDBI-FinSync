import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-sq-sm px-4 py-2';
  let variantStyles = '';

  if (variant === 'primary') {
    // deep forest green
    variantStyles = 'bg-brand-primary text-white hover:bg-opacity-95 focus:ring-border-focus';
  } else if (variant === 'secondary') {
    variantStyles =
      'bg-bg-surface border border-border-light text-text-primary hover:bg-opacity-80 focus:ring-border-light';
  } else if (variant === 'danger') {
    variantStyles = 'bg-indicator-error text-white hover:bg-opacity-95 focus:ring-rose-500';
  } else if (variant === 'ghost') {
    variantStyles =
      'text-text-secondary hover:text-text-primary hover:bg-bg-surface focus:ring-border-light';
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
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
      ) : null}
      {children}
    </button>
  );
};
