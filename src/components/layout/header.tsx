'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth/use-auth';
import AnimatedButton from "@/components/AnimatedButton";


export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/mock-tests', label: 'Mock Tests' },
    { href: '/bookmarks', label: 'Bookmarks' },

  ];

  return (
    <header className="fixed w-full shadow-sm header py-3 top-0 z-50 ">
      <div className="max-w-[1400px] mx-auto  z-9 relative">
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="TerrahQbank" className="w-[200px] md:w-[260px] h-auto" />
          </Link>



          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">

                <AnimatedButton href="/dashboard" label=" Dashboard" className="w-fit" />


                <AnimatedButton onClick={handleSignOut} label="Sign Out" className="w-fit btn-2" />
                {profile?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="primary" size="md" className="uppercase">
                      Admin
                    </Button>
                  </Link>
                )}

              </div>
            ) : (
              <div className="flex items-center space-x-3">

                <div className="flex items-center flex-wrap justify-center gap-2">
                  <AnimatedButton href="/auth/login" label="Login" className="w-fit" />
                  <AnimatedButton href="/auth/login" label="Sign Up" className="w-fit btn-2" />

                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-black px-4">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${isActive(link.href)
                    ? 'bg-blue-100/10 text-blue-600'
                    : 'text-gray-300 hover:bg-gray-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                {user ? (
                  <>


                    <AnimatedButton href="/dashboard" label=" Dashboard" className="w-fit" />
                    <AnimatedButton onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }} label=" Sign Out" className="w-fit btn-2" />

                    {profile?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Admin Panel
                        </Button>
                      </Link>
                    )}

                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};