'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { BookOpen, Mail, CheckCircle, AlertCircle } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // Redirect to dashboard if already verified
  useEffect(() => {
    if (!authLoading && user?.email_confirmed_at) {
      router.replace('/dashboard');
    } else if (!authLoading && user?.email) {
      setEmail(user.email);
    }
  }, [user, authLoading, router]);

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam === 'otp_expired' || errorParam === 'access_denied') {
      setError('The verification link has expired or is invalid. Please request a new one.');
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    // Don't try to resend if user is already verified
    if (user?.email_confirmed_at) {
      setError('Your email is already verified. Redirecting...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1500);
      return;
    }

    if (!email) {
      setError('Email address is required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Verification email sent! Please check your inbox.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <BookOpen className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Terrah Qbank</span>
            </Link>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600">
              We've sent a verification link to <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              {message}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>You'll be redirected to your dashboard</li>
            </ol>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              loading={loading}
              variant="outline"
              className="w-full"
            >
              Resend Verification Email
            </Button>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}><VerifyEmailContent /></Suspense>;
}
