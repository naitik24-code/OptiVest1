import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-500 shadow-xl shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] mb-2 font-heading tracking-tight">
          403 — Access Denied
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-md mb-8 leading-relaxed font-mono">
          Administrative Privileges Required. This section is restricted to OptiVest Founders, Systems Engineers, and Platform Administrators.
        </p>
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Investor Dashboard</span>
        </Link>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
