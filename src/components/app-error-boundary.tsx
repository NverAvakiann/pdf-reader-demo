import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  failed: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main
        id="main-content"
        className="grid min-h-screen place-items-center bg-paper px-6 text-ink"
      >
        <div className="max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Read Room
          </p>
          <h1 className="mt-3 font-serif text-3xl">The reader needs to restart</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your papers and saved reading data are still in this browser.
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            onClick={this.reload}
          >
            Reload reader
          </button>
        </div>
      </main>
    );
  }
}
