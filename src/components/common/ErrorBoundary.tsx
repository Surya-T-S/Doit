import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Doit UI error boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            padding: 'var(--space-8)',
            textAlign: 'center',
            gap: 'var(--space-3)',
            color: 'var(--text-secondary)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--danger-subtle)',
              color: 'var(--danger)',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', maxWidth: 400, color: 'var(--text-tertiary)' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{ marginTop: 'var(--space-2)' }}
          >
            <RotateCcw size={14} style={{ marginRight: 6 }} />
            Reload Doit
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
