import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

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
import { DecisionCenterPage } from './pages/DecisionCenterPage';
import { DecisionHistoryPage } from './pages/DecisionHistoryPage';
import { DecisionReplayPage } from './pages/DecisionReplayPage';
import { MarketRegimePage } from './pages/MarketRegimePage';
import { ScenarioSimulatorPage } from './pages/ScenarioSimulatorPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { PaperTradingPage } from './pages/PaperTradingPage';
import { PredictionExplorerPage } from './pages/PredictionExplorerPage';
import { PredictionHistoryPage } from './pages/PredictionHistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin / Engineering Pages
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminPortfoliosPage } from './pages/AdminPortfoliosPage';
import { AIConfigurationPage } from './pages/AIConfigurationPage';
import { AIModelsPage } from './pages/AIModelsPage';
import { AIReadinessDashboardPage } from './pages/AIReadinessDashboardPage';
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

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: 'easeOut' as const }
};

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Landing */}
        <Route path="/" element={<motion.div {...pageTransition} className="w-full h-full"><LandingPage /></motion.div>} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<motion.div {...pageTransition}><LoginPage /></motion.div>} />
          <Route path="/register" element={<motion.div {...pageTransition}><RegisterPage /></motion.div>} />
          <Route path="/forgot-password" element={<motion.div {...pageTransition}><ForgotPasswordPage /></motion.div>} />
        </Route>

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Investor Routes */}
            <Route path="/dashboard" element={<motion.div {...pageTransition}><DashboardPage /></motion.div>} />
            <Route path="/portfolio" element={<motion.div {...pageTransition}><PortfolioPage /></motion.div>} />
            <Route path="/markets" element={<motion.div {...pageTransition}><MarketsPage /></motion.div>} />
            <Route path="/watchlist" element={<motion.div {...pageTransition}><WatchlistPage /></motion.div>} />
            <Route path="/insights" element={<motion.div {...pageTransition}><InsightsPage /></motion.div>} />
            <Route path="/paper-trading" element={<motion.div {...pageTransition}><PaperTradingDashboardPage /></motion.div>} />
            <Route path="/paper-wallet" element={<motion.div {...pageTransition}><PaperWalletPage /></motion.div>} />
            <Route path="/paper-performance" element={<motion.div {...pageTransition}><PaperPerformancePage /></motion.div>} />
            <Route path="/analytics" element={<motion.div {...pageTransition}><AnalyticsPage /></motion.div>} />
            <Route path="/profile" element={<motion.div {...pageTransition}><ProfilePage /></motion.div>} />
            <Route path="/settings" element={<motion.div {...pageTransition}><SettingsPage /></motion.div>} />
            <Route path="/decision-center" element={<motion.div {...pageTransition}><DecisionCenterPage /></motion.div>} />
            <Route path="/decision-history" element={<motion.div {...pageTransition}><DecisionHistoryPage /></motion.div>} />
            <Route path="/decision-replay" element={<motion.div {...pageTransition}><DecisionReplayPage /></motion.div>} />
            <Route path="/market-regime" element={<motion.div {...pageTransition}><MarketRegimePage /></motion.div>} />
            <Route path="/scenario-simulator" element={<motion.div {...pageTransition}><ScenarioSimulatorPage /></motion.div>} />
            <Route path="/backtesting" element={<motion.div {...pageTransition}><BacktestingPage /></motion.div>} />
            <Route path="/paper-trading/terminal" element={<motion.div {...pageTransition}><PaperTradingPage /></motion.div>} />
            <Route path="/predictions" element={<motion.div {...pageTransition}><PredictionExplorerPage /></motion.div>} />
            <Route path="/prediction-history" element={<motion.div {...pageTransition}><PredictionHistoryPage /></motion.div>} />

            {/* Admin Protected Console Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<motion.div {...pageTransition}><AdminOverviewPage /></motion.div>} />
              <Route path="/admin/users" element={<motion.div {...pageTransition}><AdminUsersPage /></motion.div>} />
              <Route path="/admin/portfolios" element={<motion.div {...pageTransition}><AdminPortfoliosPage /></motion.div>} />
              <Route path="/admin/mlops" element={<motion.div {...pageTransition}><MLOpsDashboardPage /></motion.div>} />
              <Route path="/admin/ai-config" element={<motion.div {...pageTransition}><AIConfigurationPage /></motion.div>} />
              <Route path="/admin/ai-models" element={<motion.div {...pageTransition}><AIModelsPage /></motion.div>} />
              <Route path="/admin/ai-readiness" element={<motion.div {...pageTransition}><AIReadinessDashboardPage /></motion.div>} />
              <Route path="/admin/training-queue" element={<motion.div {...pageTransition}><TrainingQueueMonitorPage /></motion.div>} />
              <Route path="/admin/model-health" element={<motion.div {...pageTransition}><ModelHealthPage /></motion.div>} />
              <Route path="/admin/model-comparison" element={<motion.div {...pageTransition}><ModelComparisonPage /></motion.div>} />
              <Route path="/admin/research" element={<motion.div {...pageTransition}><ResearchAnalyticsPage /></motion.div>} />
              <Route path="/admin/ai-validation" element={<motion.div {...pageTransition}><AIValidationPage /></motion.div>} />
              <Route path="/admin/benchmark" element={<motion.div {...pageTransition}><BenchmarkDashboardPage /></motion.div>} />
              <Route path="/admin/strategy-comparison" element={<motion.div {...pageTransition}><StrategyComparisonPage /></motion.div>} />
              <Route path="/admin/autonomous" element={<motion.div {...pageTransition}><AutonomousCommandCenterPage /></motion.div>} />
              <Route path="/admin/scheduler" element={<motion.div {...pageTransition}><SchedulerDashboardPage /></motion.div>} />
              <Route path="/admin/system-health" element={<motion.div {...pageTransition}><SystemHealthPage /></motion.div>} />
              <Route path="/admin/workers" element={<motion.div {...pageTransition}><BackgroundWorkersPage /></motion.div>} />
              <Route path="/admin/notifications" element={<motion.div {...pageTransition}><NotificationCenterPage /></motion.div>} />
              <Route path="/admin/settings" element={<motion.div {...pageTransition}><SettingsPage /></motion.div>} />
            </Route>
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<motion.div {...pageTransition}><NotFoundPage /></motion.div>} />
      </Routes>
    </AnimatePresence>
  );
};
