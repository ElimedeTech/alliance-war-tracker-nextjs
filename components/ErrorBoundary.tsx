'use client';

/**
 * ErrorBoundary.tsx
 *
 * React class-based error boundary. Catches unhandled errors in any child
 * component tree and displays a recovery UI instead of crashing the whole app.
 *
 * Three pre-built wrappers for common use cases:
 *   <AppErrorBoundary>       — wraps the whole app
 *   <ModalErrorBoundary>     — wraps a modal so a crash there doesn't kill the main UI
 *   <BattlegroupErrorBoundary bgIndex={0}> — wraps a single BG so others keep working
 */

import React, { Component, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional label shown in the default fallback (e.g. "Battlegroup 1") */
  label?: string;
  /** Called when an error is caught — use for logging */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─── Core boundary ───────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <DefaultFallback error={this.state.error} label={this.props.label} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

// ─── Default fallback UI ─────────────────────────────────────────────────────

function DefaultFallback({
  error,
  label,
  onReset,
}: {
  error: Error;
  label?: string;
  onReset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 my-2">
      <div className="flex items-start gap-3">
        <span className="text-red-400 text-xl shrink-0">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-red-300 font-black text-sm uppercase tracking-wide">
            {label ? `${label} failed to load` : 'Something went wrong'}
          </p>
          <p className="text-red-400/70 text-xs mt-1 font-mono break-all">
            {error.message}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onReset}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-black rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pre-built wrappers ───────────────────────────────────────────────────────

/** Wraps the whole app. Shows a full-page recovery screen on crash. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
          <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-black text-red-300 uppercase tracking-wide mb-2">
              App Error
            </h1>
            <p className="text-slate-400 text-sm mb-1">
              Something unexpected went wrong. Your war data is safe in Firebase.
            </p>
            <p className="text-red-400/60 text-xs font-mono mb-6 break-all">
              {error.message}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-black rounded-xl text-sm transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/** Wraps a modal so a crash inside it doesn't kill the main war recording UI. */
export function ModalErrorBoundary({ children, name }: { children: ReactNode; name?: string }) {
  return (
    <ErrorBoundary label={name ?? 'Modal'}>
      {children}
    </ErrorBoundary>
  );
}

/** Wraps a single battlegroup panel so a crash in BG1 doesn't affect BG2/BG3. */
export function BattlegroupErrorBoundary({ children, bgIndex }: { children: ReactNode; bgIndex: number }) {
  return (
    <ErrorBoundary label={`Battlegroup ${bgIndex + 1}`}>
      {children}
    </ErrorBoundary>
  );
}