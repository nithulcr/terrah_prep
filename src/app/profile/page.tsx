'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Calendar, BookOpen, ClipboardList, TrendingUp } from 'lucide-react';
import { Plan, UserUsage } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('*, subscription:subscriptions(plan:plans(*))')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (usageData) {
        setUsage(usageData as UserUsage);
        const subscriptionData = (usageData as any).subscription;
        setSubscription(subscriptionData);
        
        if (subscriptionData?.plan) {
          setPlan(subscriptionData.plan as Plan);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-20">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            View your subscription and usage details
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Plan */}
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Current Plan</h2>
                <Badge variant={isSubscriptionActive ? 'success' : 'danger'}>
                  {isSubscriptionActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {plan ? (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Price:</span>
                      <span className="font-semibold">₹{plan.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-semibold">{plan.duration_days} days</span>
                    </div>
                    {subscription?.expires_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Expires:</span>
                        <span className="font-semibold">
                          {new Date(subscription.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Free Plan</h3>
                  <p className="mt-1 text-sm text-slate-600">No active subscription</p>
                </div>
              )}

              <div className="mt-6">
                <Button 
                  className="w-full" 
                  variant="primary"
                  onClick={() => window.location.href = '/pricing'}
                >
                  {plan ? 'Upgrade Plan' : 'Get Started'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Usage Statistics */}
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Usage Statistics</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <ClipboardList className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Monthly Tests</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {usage?.tests_this_month || 0} / {plan?.monthly_mock_test_limit === 0 ? 'N/A' : plan?.monthly_mock_test_limit || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {getRemainingTests() !== null && (
                    <Badge variant={getRemainingTests() === 0 ? 'danger' : 'success'}>
                      {getRemainingTests() === 0 ? 'Limit Reached' : `${getRemainingTests()} left`}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Daily Questions</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {usage?.questions_today || 0} / {plan?.daily_question_limit === 0 ? 'N/A' : plan?.daily_question_limit || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {getRemainingDailyQuestions() !== null && (
                    <Badge variant={getRemainingDailyQuestions() === 0 ? 'danger' : 'success'}>
                      {getRemainingDailyQuestions() === 0 ? 'Limit Reached' : `${getRemainingDailyQuestions()} left`}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Lifetime Questions</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {usage?.free_questions_used || 0} / {plan?.lifetime_question_limit === 0 ? 'N/A' : plan?.lifetime_question_limit || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {getRemainingLifetimeQuestions() !== null && (
                    <Badge variant={getRemainingLifetimeQuestions() === 0 ? 'danger' : 'success'}>
                      {getRemainingLifetimeQuestions() === 0 ? 'Limit Reached' : `${getRemainingLifetimeQuestions()} left`}
                    </Badge>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    </main>
  );
}