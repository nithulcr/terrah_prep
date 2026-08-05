'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Footer, Header } from '@/components/layout';

interface LayoutContentProps {
  children: ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  
  return (
    <>
      {!isAdminPage && <Header />}
      {!isAdminPage && <main className="flex-grow">{children}</main>}
      {isAdminPage && children}
      {!isAdminPage && <Footer />}
    </>
  );
}
