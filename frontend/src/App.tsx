import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AnimatedRoutes } from './AnimatedRoutes';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
