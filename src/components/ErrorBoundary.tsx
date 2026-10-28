import React from 'react';

// Catches render crashes anywhere below it and shows the actual error
// instead of a blank white page. Last error is kept in localStorage
// (pg_last_error) so it can be reported even after reload.
interface State {
  message: string | null;
  stack: string | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { message: null, stack: null };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack || null : null;
    try {
      localStorage.setItem('pg_last_error', JSON.stringify({ message, stack, at: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
    return { message, stack };
  }

  componentDidCatch(err: unknown) {
    console.error('[ProductGenius crash]', err);
  }

  render() {
    if (this.state.message) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-[#E8DDD8] p-6 shadow-lg space-y-3">
            <h2 className="font-display text-xl font-semibold text-[#5B1423]">
              Something went wrong
            </h2>
            <p className="text-xs text-[#5C4449]">
              The app hit an error instead of going blank. Screenshot this and send it to your developer:
            </p>
            <pre className="text-[11px] font-mono bg-[#FAF7F2] border border-[#E8DDD8] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-[#5B1423]">
              {this.state.message}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 bg-[#5B1423] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  try {
                    Object.keys(localStorage)
                      .filter(k => k.startsWith('pg_'))
                      .forEach(k => localStorage.removeItem(k));
                  } catch {
                    /* ignore */
                  }
                  window.location.reload();
                }}
                className="flex-1 py-2 bg-white border border-[#E8DDD8] text-[#5B1423] text-xs font-semibold rounded-lg cursor-pointer"
              >
                Reset Local Data + Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
