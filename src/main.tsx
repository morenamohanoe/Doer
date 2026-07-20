import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}


class GlobalErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    if (error.message && error.message.includes('Database')) {
      return { hasError: true, errorMessage: 'Database connection unavailable. Please try again later.' };
    }
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <h2>Something went wrong.</h2>
          <p style={{ color: 'red' }}>{this.state.errorMessage}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

const queryClient = new QueryClient();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalErrorBoundary><App /></GlobalErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
