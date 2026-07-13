import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-sq-md border border-border-light bg-bg-surface p-6 shadow-ambient transition-all duration-300 ${
        hoverable
          ? 'hover:-translate-y-1 hover:shadow-glow-accent hover:border-brand-secondary/30'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
