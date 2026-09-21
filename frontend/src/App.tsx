import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AdminRoute } from './components/shared/AdminRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Investor Pages
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { MarketsPage } from './pages/MarketsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { InsightsPage } from './pages/InsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PaperTradingDashboardPage } from './pages/PaperTradingDashboardPage';
import { PaperWalletPage } from './pages/PaperWalletPage';
import { PaperPerformancePage } from './pages/PaperPerformancePage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin / Engineering Pages
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminPortfoliosPage } from './pages/AdminPortfoliosPage';
import { AIConfigurationPage } from './pages/AIConfigurationPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { TrainingQueueMonitorPage } from './pages/TrainingQueueMonitorPage';
import { MLOpsDashboardPage } from './pages/MLOpsDashboardPage';
import { ResearchAnalyticsPage } from './pages/ResearchAnalyticsPage';
import { AIValidationPage } from './pages/AIValidationPage';
import { BenchmarkDashboardPage } from './pages/BenchmarkDashboardPage';
import { StrategyComparisonPage } from './pages/StrategyComparisonPage';
import { ModelHealthPage } from './pages/ModelHealthPage';
import { SchedulerDashboardPage } from './pages/SchedulerDashboardPage';
import { BackgroundWorkersPage } from './pages/BackgroundWorkersPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import AutonomousCommandCenterPage from './pages/AutonomousCommandCenterPage';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing */}
                <Route path="/" element={<LandingPage />} />

                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                {/* Protected Application Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    {/* Investor Routes */}
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/portfolio" element={<PortfolioPage />} />
                    <Route path="/markets" element={<MarketsPage />} />
                    <Route path="/watchlist" element={<WatchlistPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route path="/paper-trading" element={<PaperTradingDashboardPage />} />
                    <Route path="/paper-wallet" element={<PaperWalletPage />} />
                    <Route path="/paper-performance" element={<PaperPerformancePage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />

                    {/* Admin Protected Console Routes */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin/dashboard" element={<AdminOverviewPage />} />
                      <Route path="/admin/users" element={<AdminUsersPage />} />
                      <Route path="/admin/portfolios" element={<AdminPortfoliosPage />} />
                      <Route path="/admin/mlops" element={<MLOpsDashboardPage />} />
                      <Route path="/admin/ai-config" element={<AIConfigurationPage />} />
                      <Route path="/admin/training-queue" element={<TrainingQueueMonitorPage />} />
                      <Route path="/admin/model-health" element={<ModelHealthPage />} />
                      <Route path="/admin/model-comparison" element={<ModelComparisonPage />} />
                      <Route path="/admin/research" element={<ResearchAnalyticsPage />} />
                      <Route path="/admin/ai-validation" element={<AIValidationPage />} />
                      <Route path="/admin/benchmark" element={<BenchmarkDashboardPage />} />
                      <Route path="/admin/strategy-comparison" element={<StrategyComparisonPage />} />
                      <Route path="/admin/autonomous" element={<AutonomousCommandCenterPage />} />
                      <Route path="/admin/scheduler" element={<SchedulerDashboardPage />} />
                      <Route path="/admin/system-health" element={<SystemHealthPage />} />
                      <Route path="/admin/workers" element={<BackgroundWorkersPage />} />
                      <Route path="/admin/notifications" element={<NotificationCenterPage />} />
                      <Route path="/admin/settings" element={<SettingsPage />} />
                    </Route>
                  </Route>
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
