'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle } from 'lucide-react';

export default function SetupAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    } else if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, router]);

  const checkAdminStatus = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (data?.role === 'admin') {
      setIsAdmin(true);
      setMessage('You are already an admin! Redirecting to admin panel...');
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    }
  };

  const handlePromoteToAdmin = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Successfully promoted to admin! Refreshing profile...');
        // Refresh the session and profile to get updated role
        setTimeout(async () => {
          await supabase.auth.refreshSession();
          // Call the global refresh function
          if (typeof window !== 'undefined' && (window as any).refreshAuthProfile) {
            await (window as any).refreshAuthProfile();
          }
          setTimeout(() => {
            router.push('/admin');
          }, 1500);
        }, 1000);
      } else {
        setError(data.error || 'Failed to promote to admin');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardBody className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Setup
          </h1>
          
          <p className="text-gray-600 mb-6">
            Promote your account to admin to access the admin panel
          </p>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isAdmin && !message && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Current User:</h3>
                <p className="text-sm text-blue-800">Email: {user?.email}</p>
                <p className="text-sm text-blue-800">Role: Regular User</p>
              </div>

              <Button
                onClick={handlePromoteToAdmin}
                loading={loading}
                className="w-full"
                size="lg"
              >
                <Shield className="h-5 w-5 mr-2" />
                Promote to Admin
              </Button>

              <p className="text-xs text-gray-500">
                This will grant you full access to the admin panel where you can manage questions, categories, and more.
              </p>
            </div>
          )}

          {isAdmin && !message && (
            <Button
              onClick={() => router.push('/admin')}
              className="w-full"
              size="lg"
            >
              Go to Admin Panel
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}