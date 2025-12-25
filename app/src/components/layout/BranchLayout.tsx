import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import BranchSidebar from './BranchSidebar';
import BranchTopBar from './BranchTopBar';

interface BranchLayoutProps {
  children?: ReactNode;
}

export default function BranchLayout({ children }: BranchLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <BranchSidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <BranchTopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
