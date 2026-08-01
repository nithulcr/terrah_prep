'use client';

import { ReactNode } from 'react';
import { UserHeader } from '@/components/layout/user-header';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* User Header */}
      <UserHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
