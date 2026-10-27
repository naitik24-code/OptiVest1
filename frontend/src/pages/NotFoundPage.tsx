import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-4 text-center transition-colors duration-200">
      <div className="inst-card p-12 max-w-lg w-full relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(255,90,31,0.05)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
        
        <div className="w-20 h-20 mx-auto rounded-[16px] bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,90,31,0.2)]">
          <AlertTriangle className="w-10 h-10" />
        </div>
        
        <h1 className="text-[42px] font-extrabold font-heading text-[var(--text-main)] leading-tight tracking-tight mb-2">
          <span className="text-[var(--primary)]">404</span> Not Found
        </h1>
        
        <p className="text-[14px] font-mono text-[var(--text-muted)] mt-2 mb-10 max-w-sm mx-auto leading-relaxed">
          The requested system route does not exist or has been relocated in the OptiVest architecture.
        </p>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <button className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-[var(--primary)] hover:bg-[#ff7a45] text-[#08090b] text-[14px] font-bold font-mono rounded-[8px] shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-all cursor-pointer">
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
