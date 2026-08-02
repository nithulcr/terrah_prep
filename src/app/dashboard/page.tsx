'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Calendar, BookOpen, ClipboardList, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Plan, UserUsage } from '@/types';
import UserLayout from '@/app/user-layout';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      // Get profile and usage in parallel
      const [profileResult, usageResult, subscriptionResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .maybeSingle(),
        
        supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle(),

        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .maybeSingle()
      ]);

      const profile = profileResult.data as any;
      const usageData = usageResult.data as UserUsage | null;
      const subscriptionData = subscriptionResult.data as any;

      if (usageData) {
        setUsage(usageData);
        setSubscription(subscriptionData);
        
        // Get plan using profile.plan_slug (single source of truth)
        if (profile?.plan_slug) {
          const { data: planData } = await supabase
            .from('plans')
            .select('*')
            .eq('slug', profile.plan_slug)
            .maybeSingle();

          if (planData) {
            setPlan(planData as Plan);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTests = () => {
    if (!plan || !usage) return 0;
    const limit = plan.monthly_mock_test_limit;
    if (limit === null || limit === undefined) return null; // Unlimited
    return Math.max(0, limit - usage.tests_this_month);
  };

  const getRemainingDailyQuestions = () => {
    if (!plan || !usage) return 0;
    const limit = plan.daily_question_limit;
    if (limit === null || limit === undefined) return null; // Unlimited
    return Math.max(0, limit - usage.questions_today);
  };

  const getRemainingLifetimeQuestions = () => {
    if (!plan || !usage) return 0;
    const limit = plan.lifetime_question_limit;
    if (limit === null || limit === undefined) return null; // Unlimited
    return Math.max(0, limit - usage.free_questions_used);
  };

  const isSubscriptionActive = subscription && 
    subscription.status === 'active' && 
    (!subscription.expires_at || new Date(subscription.expires_at) >= new Date());

  const getDaysUntilExpiry = () => {
    if (!subscription?.expires_at) return null;
    const expiryDate = new Date(subscription.expires_at);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <UserLayout>
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Welcome back, {user?.email?.split('@')[0]}!
              </h1>
              <p className="mt-3 text-lg text-slate-600">
                Track your progress and continue your preparation
              </p>
            </div>
            {loading ? (
              <div className="h-8 bg-slate-200 rounded animate-pulse w-24"></div>
            ) : plan && (
              <Badge variant="warning" className="text-sm">
                {plan.name}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          /* Stats Grid Skeleton */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-slate-200 shadow-sm">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-20"></div>
                      <div className="h-8 bg-slate-200 rounded animate-pulse w-16"></div>
                    </div>
                    <div className="h-12 w-12 bg-slate-200 rounded-lg animate-pulse"></div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          /* Stats Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Tests Taken</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {usage?.tests_this_month || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              {getRemainingTests() !== null && (
                <p className="text-sm text-slate-600 mt-2">
                  {getRemainingTests()} remaining this month
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Questions Attempted</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {usage?.questions_today || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
              {getRemainingDailyQuestions() !== null && (
                <p className="text-sm text-slate-600 mt-2">
                  {getRemainingDailyQuestions()} remaining today
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Accuracy</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">0%</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Complete tests to see accuracy
              </p>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Current Plan</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {plan?.name || 'FREE'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              {getDaysUntilExpiry() !== null && (
                <p className="text-sm text-slate-600 mt-2">
                  {getDaysUntilExpiry()} days until expiry
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="primary"
                  onClick={() => window.location.href = '/mock-tests'}
                >
                  Take Mock Test
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = '/pricing'}
                >
                  Upgrade Plan
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Tests</h2>
              <div className="text-center py-8">
                <p className="text-slate-600">No tests taken yet</p>
                <Button 
                  className="mt-4" 
                  variant="primary"
                  onClick={() => window.location.href = '/mock-tests'}
                >
                  Start Your First Test
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    </UserLayout>
  );
}
