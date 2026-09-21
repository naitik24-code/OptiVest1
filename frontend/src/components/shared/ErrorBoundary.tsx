import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Component Tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[var(--text-main)]">Application Recovery Mode</h1>
              <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                An unexpected UI rendering anomaly occurred. OptiVest state has been preserved safely.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-left font-mono text-[11px] text-rose-400 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" /> Reload Session
              </button>
              <a
                href="/dashboard"
                className="px-4 py-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] font-semibold text-xs flex items-center justify-center gap-1.5 hover:border-emerald-500 transition-all"
              >
                <Home className="w-4 h-4" /> Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
