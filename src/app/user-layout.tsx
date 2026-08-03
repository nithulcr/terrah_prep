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
      <main className="pb-6 pt-16 lg:pt-22">
        {children}
      </main>
    </div>
  );
}
