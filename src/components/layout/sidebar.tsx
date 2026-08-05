'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Bookmark, 
  Flag, 
  User, 
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className = '', isOpen: isOpenProp, onToggle }: SidebarProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Use external state if provided, otherwise use internal state
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenInternal;
  const setIsOpen = onToggle || setIsOpenInternal;

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and stats'
    },
    {
      name: 'Mock Tests',
      href: '/mock-tests',
      icon: FileText,
      description: 'Practice tests'
    },
    {
      name: 'Bookmarks',
      href: '/bookmarks',
      icon: Bookmark,
      description: 'Saved questions'
    },
    {
      name: 'Review Flags',
      href: '/review-flags',
      icon: Flag,
      description: 'Flagged for review'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Account settings'
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-999 bg-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-white p-2 shadow-lg border border-slate-200"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-slate-600" />
          ) : (
            <Menu className="h-6 w-6 text-slate-600" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
            <img 
              src="/logo.png" 
              alt="Terrah Qbank" 
              className="h-8 w-8 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Terrah Qbank</h1>
              <p className="text-xs text-slate-600">Exam Qbankaration</p>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user.email}
                  </p>
                  <p className="text-xs text-slate-600">Student</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2.5
                        transition-colors duration-200
                        ${active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-blue-700' : 'text-slate-500'}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-slate-900'}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4">
            <p className="text-xs text-slate-500">
              © 2026 Terrah Qbank. All rights reserved.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}