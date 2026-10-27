import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Server, Bell, Clock, Database, ChevronRight, Zap } from 'lucide-react';

export const AIOperationsDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const operations = [
    {
      title: "Scheduler Dashboard",
      description: "Manage background scheduled jobs, intervals, and statuses.",
      icon: <Clock className="w-5 h-5 text-[var(--secondary)]" />,
      path: "/admin/scheduler",
      color: "bg-[var(--secondary)]/10 border-[var(--secondary)]/20"
    },
    {
      title: "Background Workers",
      description: "Monitor distributed task execution nodes and server health.",
      icon: <Server className="w-5 h-5 text-[#a855f7]" />,
      path: "/admin/workers",
      color: "bg-[#a855f7]/10 border-[#a855f7]/20"
    },
    {
      title: "System Health",
      description: "Real-time metrics for Autonomous Intelligence Platform.",
      icon: <Activity className="w-5 h-5 text-[var(--success)]" />,
      path: "/admin/system-health",
      color: "bg-[var(--success)]/10 border-[var(--success)]/20"
    },
    {
      title: "Notification Center",
      description: "View AI-generated alerts, signals, and system updates.",
      icon: <Bell className="w-5 h-5 text-[var(--primary)]" />,
      path: "/admin/notifications",
      color: "bg-[var(--primary)]/10 border-[var(--primary)]/20"
    }
  ];

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="w-[48px] h-[48px] rounded-[12px] bg-[var(--surface2)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-[var(--secondary)]" />
        </div>
        <div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">System Operations Center</h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">Command center for OptiVest AI's Autonomous Intelligence Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {operations.map((op, idx) => (
          <div 
            key={idx} 
            className="inst-card p-[20px] cursor-pointer group flex items-center gap-4"
            onClick={() => navigate(op.path)}
          >
            <div className={`w-[48px] h-[48px] rounded-[10px] border ${op.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              {op.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-bold font-heading text-[var(--text-main)] mb-[4px] group-hover:text-[var(--primary)] transition-colors">
                {op.title}
              </h3>
              <p className="text-[13px] text-[var(--text-muted)] font-mono leading-relaxed">
                {op.description}
              </p>
            </div>
            <div className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 inst-card p-[32px] bg-gradient-to-r from-[rgba(76,139,255,0.05)] to-transparent border-[rgba(76,139,255,0.2)] overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-[20px] font-bold mb-[12px] flex items-center gap-2 text-[var(--text-main)] font-heading">
            <Database className="w-5 h-5 text-[var(--secondary)]" /> Always-On Intelligence
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] leading-relaxed font-mono">
            The Autonomous Intelligence Platform runs entirely in the background. It automatically syncs market data, recalculates AI predictions, updates the APDE decision engine, streams real-time data via WebSockets, and dispatches smart notifications without requiring manual intervention.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIOperationsDashboardPage;
