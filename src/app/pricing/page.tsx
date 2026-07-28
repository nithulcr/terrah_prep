'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Plan } from '@/types';
import { Check, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error loading plans:', error);
        return;
      }

      setPlans((data ?? []) as Plan[]);

      // Get current user's plan
      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan:plans(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subscription) {
          // @ts-ignore
          setCurrentPlan(subscription.plan?.slug || null);
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadge = (slug: string) => {
    if (slug === 'free') return null;
    if (slug === 'starter') return { text: 'POPULAR', variant: 'info' as const };
    if (slug === 'pro') return { text: 'BEST VALUE', variant: 'success' as const };
    return null;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading plans...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Unlock unlimited practice and accelerate your preparation
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          {plans.map((plan) => {
            const badge = getPlanBadge(plan.slug);
            const isCurrentPlan = currentPlan === plan.slug;

            return (
              <Card
                key={plan.id}
                className={`relative border-2 shadow-sm ${
                  plan.slug === 'pro'
                    ? 'border-blue-600 lg:scale-105'
                    : 'border-slate-200'
                }`}
              >
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant={badge.variant} className="px-4 py-1">
                      <Sparkles className="mr-1 h-3 w-3" />
                      {badge.text}
                    </Badge>
                  </div>
                )}

                <CardBody className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="mt-2 text-slate-600">{plan.description}</p>
                    <div className="mt-6">
                      <span className="text-5xl font-bold text-slate-950">₹{plan.price}</span>
                      {plan.price > 0 && (
                        <span className="ml-2 text-slate-600">
                          /{plan.duration_days ? `${plan.duration_days} days` : 'lifetime'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-sm text-slate-700">
                        {plan.daily_question_limit ?? 'Unlimited'} daily questions
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-sm text-slate-700">
                        {plan.monthly_mock_test_limit ?? 'Unlimited'} mock tests per month
                      </span>
                    </div>
                    {plan.lifetime_question_limit !== null && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">
                          {plan.lifetime_question_limit} lifetime questions
                        </span>
                      </div>
                    )}
                    {plan.allow_result_history && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">Result history</span>
                      </div>
                    )}
                    {plan.allow_pdf_download && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">PDF export</span>
                      </div>
                    )}
                    {plan.allow_analytics && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">Advanced analytics</span>
                      </div>
                    )}
                    {plan.allow_bookmarks && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">Bookmarks</span>
                      </div>
                    )}
                    {plan.allow_review_answers && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">Review answers</span>
                      </div>
                    )}
                    {plan.allow_performance_dashboard && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">Performance dashboard</span>
                      </div>
                    )}
                    {plan.priority_support && (
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm text-slate-700">Priority support</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : plan.slug === 'free' ? (
                      <Button variant="outline" className="w-full" disabled>
                        Free Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={plan.slug === 'pro' ? 'primary' : 'outline'}
                      >
                        Get Started
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}