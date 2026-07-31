'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { UserHeader } from '@/components/layout/user-header';
import { Menu } from 'lucide-react';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* User Header */}
        <UserHeader />

        {/* Desktop Toggle Button */}
        <div className="hidden lg:block fixed top-4 left-4 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg bg-white p-2 shadow-lg border border-slate-200 hover:bg-slate-50"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
