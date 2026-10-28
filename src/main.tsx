import { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Jarvis Core Caught Unhandled Runtime Exception:', error, errorInfo);
  }

  handleQuickReload = () => {
    window.location.reload();
  };

  handleSafeReset = () => {
    try {
      localStorage.removeItem('jarvis_gov_schemes');
      localStorage.removeItem('jarvis_gov_schemes_auto_sync');
      localStorage.removeItem('jarvis_gov_schemes_last_sync');
      localStorage.removeItem('jarvis_contacts');
      localStorage.removeItem('jarvis_schedule');
      localStorage.removeItem('jarvis_incoming_messages');
      localStorage.removeItem('jarvis_categories');
      localStorage.removeItem('jarvis_safe_trusted_mode_config');
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  handleFullReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl mb-4 shadow-[0_0_25px_rgba(6,182,212,0.3)] animate-pulse">
            ⚡
          </div>
          <h1 className="text-xl font-bold text-cyan-300 mb-1">JARVIS AI Assistant</h1>
          <p className="text-xs text-slate-400 font-mono mb-4">
            Core Engine Auto-Recovery Active
          </p>
          <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
            App initialize hone me temporary pareshani aayi. Niche diye button se Jarvis ko turant reload karein.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={this.handleQuickReload}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>⚡ Quick Reload Jarvis</span>
            </button>
            <button
              onClick={this.handleSafeReset}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🧹 Safe Cache Reset & Reload</span>
            </button>
          </div>
          {this.state.error && (
            <p className="mt-6 text-[11px] font-mono text-slate-500 max-w-md truncate bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              Diagnostic: {this.state.error.message || String(this.state.error)}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for offline support & Play Store PWA / PWABuilder compliance
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('JARVIS PWA ServiceWorker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('JARVIS ServiceWorker registration skipped/failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
