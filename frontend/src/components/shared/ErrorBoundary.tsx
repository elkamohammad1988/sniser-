import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Catches render-phase errors anywhere in the tree
 * and shows a recovery UI instead of an empty white screen. Errors are also
 * reported to the console so they surface in browser devtools and any
 * configured error-tracking integrations (Sentry, etc.).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Always surface the error to the console (prod + dev) so it is never
    // silently swallowed, and emit an `app:error` event that a monitoring
    // integration (Sentry, LogRocket, a custom listener) can subscribe to.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:error", { detail: { error, info } }));
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-bg px-6 text-center"
      >
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-green">
            Something went wrong
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            We hit an unexpected error.
          </h1>
          <p className="mt-3 text-sm text-white/70">
            The page failed to render. Try again, or head back home — if it
            keeps happening, please let us know.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-full bg-brand-green px-5 py-2 text-sm font-semibold text-bg transition-colors hover:bg-brand-greenDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
