import { useState, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-60' : 'ml-0'
        }`}
      >
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
