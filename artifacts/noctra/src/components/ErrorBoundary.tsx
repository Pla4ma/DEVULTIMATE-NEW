import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "var(--surface-0)" }}
        >
          <div className="max-w-md w-full text-center space-y-5">
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}
            >
              <AlertTriangle size={22} style={{ color: "var(--color-danger)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Something went wrong
              </h1>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {this.state.error.message || "An unexpected error occurred."}
              </p>
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
