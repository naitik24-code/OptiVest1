import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { Sidebar } from '../components/shared/Sidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col transition-colors duration-200 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 h-full">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
