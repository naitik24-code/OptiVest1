import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Activity, Server, Bell, Clock, Database, ChevronRight, Zap } from 'lucide-react';

export const AIOperationsDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const operations = [
    {
      title: "Scheduler Dashboard",
      description: "Manage background scheduled jobs, intervals, and statuses.",
      icon: <Clock className="w-6 h-6 text-indigo-500" />,
      path: "/scheduler-dashboard",
      color: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Background Workers",
      description: "Monitor distributed task execution nodes and server health.",
      icon: <Server className="w-6 h-6 text-blue-500" />,
      path: "/background-workers",
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "System Health",
      description: "Real-time metrics for Autonomous Intelligence Platform.",
      icon: <Activity className="w-6 h-6 text-emerald-500" />,
      path: "/system-health",
      color: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Notification Center",
      description: "View AI-generated alerts, signals, and system updates.",
      icon: <Bell className="w-6 h-6 text-amber-500" />,
      path: "/notifications",
      color: "bg-amber-50 dark:bg-amber-900/20"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
          <Zap className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Operations Center</h1>
          <p className="text-gray-500 dark:text-gray-400">Command center for OptiVest AI's Autonomous Intelligence Engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {operations.map((op, idx) => (
          <Card 
            key={idx} 
            className="hover:shadow-lg transition-all cursor-pointer border-transparent hover:border-blue-500/30 group p-6"
            onClick={() => navigate(op.path)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl ${op.color} group-hover:scale-110 transition-transform`}>
                {op.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {op.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {op.description}
                </p>
              </div>
              <div className="flex items-center h-full">
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white flex justify-between items-center overflow-hidden relative shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Database className="w-6 h-6" /> Always-On Intelligence
          </h2>
          <p className="text-blue-100 leading-relaxed">
            The Autonomous Intelligence Platform runs entirely in the background. It automatically syncs market data, recalculates AI predictions, updates the APDE decision engine, streams real-time data via WebSockets, and dispatches smart notifications without requiring manual intervention.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 translate-x-16" />
      </div>
    </div>
  );
};
