'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Check, Crown } from 'lucide-react';
import { Plan } from '@/types';
import UserLayout from '@/app/user-layout';

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
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (plansData) {
        setPlans(plansData);
      }

      // Load user's current plan from profile (single source of truth)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_slug')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.plan_slug) {
          setCurrentPlan(profile.plan_slug);
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planSlug: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    // TODO: Integrate with payment gateway
    alert(`Payment integration required for plan: ${planSlug}`);
  };

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
    <UserLayout>
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Choose Your Plan
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Select the perfect plan for your preparation needs
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {plans.length === 0 ? (
          <Card>
            <CardBody className="p-12 text-center">
              <p className="text-slate-600">No plans available at the moment</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.slug;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`border-2 ${
                    isCurrentPlan 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-slate-200 shadow-sm'
                  }`}
                >
                  <CardBody className="p-6">
                    {isCurrentPlan && (
                      <Badge variant="success" className="mb-3">
                        Current Plan
                      </Badge>
                    )}
                    
                    <h3 className="text-xl font-semibold text-slate-900">
                      {plan.name}
                    </h3>
                    
                    <p className="mt-2 text-sm text-slate-600">
                      {plan.description || 'No description'}
                    </p>

                    <div className="mt-4">
                      <span className="text-3xl font-bold text-slate-900">
                        ₹{plan.price}
                      </span>
                      <span className="text-slate-600">
                        /{plan.duration_days} days
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center text-sm">
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        <span>
                          {plan.daily_question_limit === null || plan.daily_question_limit === 0
                            ? 'Unlimited'
                            : plan.daily_question_limit
                          } questions/day
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        <span>
                          {plan.monthly_mock_test_limit === null || plan.monthly_mock_test_limit === 0
                            ? 'Unlimited'
                            : plan.monthly_mock_test_limit
                          } mock tests/month
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        <span>
                          {plan.lifetime_question_limit === null || plan.lifetime_question_limit === 0
                            ? 'Unlimited'
                            : plan.lifetime_question_limit
                          } lifetime questions
                        </span>
                      </div>

                      {plan.allow_result_history && (
                        <div className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>View Results History</span>
                        </div>
                      )}

                      {plan.allow_pdf_download && (
                        <div className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>PDF Download</span>
                        </div>
                      )}

                      {plan.allow_analytics && (
                        <div className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Analytics Dashboard</span>
                        </div>
                      )}

                      {plan.allow_bookmarks && (
                        <div className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Bookmarks</span>
                        </div>
                      )}

                      {plan.allow_review_answers && (
                        <div className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Review Answers</span>
                        </div>
                      )}

                      {plan.allow_performance_dashboard && (
                        <div className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Performance Dashboard</span>
                        </div>
                      )}

                      {plan.priority_support && (
                        <div className="flex items-center text-sm">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Priority Support</span>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full mt-6"
                      variant={isCurrentPlan ? 'outline' : 'primary'}
                      onClick={() => handleSelectPlan(plan.slug)}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        <>
                          <Crown className="mr-2 h-4 w-4" />
                          Select Plan
                        </>
                      )}
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </UserLayout>
  );
}
