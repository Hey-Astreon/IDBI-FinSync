import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React boundary exception captured:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base p-6 text-center text-text-primary">
          <div className="max-w-md rounded-sq-lg border border-border-light bg-bg-surface p-8 shadow-ambient flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-brand-secondary">
              Something went wrong.
            </h2>
            <p className="text-sm text-text-secondary">
              IDBI FinSync encountered an unexpected execution fault. Please refresh the browser
              session or contact client support.
            </p>
            {this.state.error ? (
              <pre className="text-[10px] text-left p-3 bg-bg-base rounded border border-border-light text-rose-500 overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            ) : null}
            <button
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center justify-center rounded-sq-sm bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-all focus:outline-none"
            >
              Reload Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
