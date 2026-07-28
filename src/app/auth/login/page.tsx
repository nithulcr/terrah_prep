'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardBody } from '@/components/ui';
import { signIn } from '@/lib/auth/auth';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { BookOpen, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in - IMMEDIATE redirect
  useEffect(() => {
    console.log('LoginPage: Redirect check - user:', !!user, 'authLoading:', authLoading);
    
    // Redirect immediately if user exists, regardless of authLoading
    if (user) {
      console.log('LoginPage: User already authenticated, redirecting to /dashboard');
      // Use window.location for hard redirect to ensure navigation
      window.location.href = '/dashboard';
    }
  }, [user, router]);

  // If user is logged in, don't render the login form at all
  if (user) {
    console.log('LoginPage: User is logged in, not rendering login form');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Login: Attempting login for', email);
    
    const result = await signIn(email, password);
    
    console.log('Login: Sign in result:', result);
    
    if (result.success) {
      // Wait for session to be established to avoid race conditions
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Login: Session after sign in:', session);
      
      if (session) {
        console.log('Login: Redirecting to /dashboard');
        router.replace('/dashboard');
      } else {
        // Session not yet available, wait briefly and check again
        console.log('Login: No session yet, waiting 500ms');
        setTimeout(() => {
          console.log('Login: Redirecting to /dashboard after delay');
          router.replace('/dashboard');
        }, 500);
      }
    } else {
      console.error('Login: Sign in failed:', result.error);
      setError(result.error || 'Failed to sign in');
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    // Google sign-in temporarily disabled
    setError('Google sign-in is temporarily unavailable');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <BookOpen className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Terrah Prep</span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to continue your preparation</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                loading={loading}
                size="lg"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-700">
              Sign up for free
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}