'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Check, X, Crown, Star } from 'lucide-react';
import { Plan } from '@/types';
import { sortPlans, enhancePlan, isElitePlan, isFreePlan, PlanWithFeatures } from '@/lib/utils/planHelpers';
import UserLayout from '@/app/user-layout';

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
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
        // Sort plans in the desired order and enhance with features
        const sortedPlans = sortPlans(plansData);
        const enhancedPlans = sortedPlans.map(plan => enhancePlan(plan));
        setPlans(enhancedPlans);
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
              Select the perfect plan for your Qbankaration needs
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
          <div className="grid gap-x-6 gap-y-10  lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.slug;
              const isElite = isElitePlan(plan);
              const isPremium = plan.slug.toLowerCase() === 'premium';
              
              return (
                <Card 
                  key={plan.id} 
                  className={`flex flex-col border-2 ${
                    isCurrentPlan 
                      ? 'border-blue-500 shadow-lg' 
                      : isPremium 
                      ? 'border-purple-500 shadow-md' 
                      : 'border-slate-200 shadow-sm'
                  }`}
                >
                  <CardBody className="flex flex-col flex-1 p-6 relative">
                    {isCurrentPlan && (
                      <Badge variant="success" className="absolute top-[-15px] left-[20px]" >
                        Current Plan
                      </Badge>
                    )}
                    
                    {isElite && !isCurrentPlan && (
                      <Badge variant="warning" className="absolute top-[-15px] left-[20px]">
                        <Star className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    )}
                    
                    {isPremium && !isCurrentPlan && (
                      <Badge variant="info" className="absolute top-[-15px] left-[20px]">
                        <Crown className="mr-1 h-3 w-3" />
                        Best Value
                      </Badge>
                    )}
                    
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    
                    <p className="mt-2 text-sm text-slate-600">
                      {plan.description || 'No description'}
                    </p>

                    <div className="mt-4 ">
                      <span className="text-3xl font-bold text-slate-900">
                        ₹{plan.price}
                      </span>
                      <span className="text-slate-600">
                        / {plan.displayDuration}
                      </span>
                    </div>

                    <div className="mt-6 flex-1 space-y-3">
                      {/* Lifetime Questions - always show */}
                      <div className="flex items-center text-sm">
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        <span>{plan.displayLifetimeQuestions}</span>
                      </div>

                      {/* Questions per Day - always show */}
                      <div className="flex items-center text-sm">
                        {plan.daily_question_limit && plan.daily_question_limit > 0 ? (
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                        ) : (
                          <X className="mr-2 h-4 w-4 text-red-500" />
                        )}
                        <span className={!plan.daily_question_limit || plan.daily_question_limit === 0 ? 'opacity-40' : ''}>
                          {plan.displayQuestionsPerDay}
                        </span>
                      </div>

                      {/* Mock Tests per Month - always show */}
                      <div className="flex items-center text-sm">
                        {plan.monthly_mock_test_limit && plan.monthly_mock_test_limit > 0 ? (
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                        ) : (
                          <X className="mr-2 h-4 w-4 text-red-500" />
                        )}
                        <span className={!plan.monthly_mock_test_limit || plan.monthly_mock_test_limit === 0 ? 'opacity-40' : ''}>
                          {plan.displayMockTestsPerMonth}
                        </span>
                      </div>

                      {/* Dynamic features from helper function - all features with check or X */}
                      {plan.features.map((feature, index) => (
                        <div key={index} className={`flex items-center text-sm ${!feature.available ? 'opacity-40' : ''}`}>
                          {feature.available ? (
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                          ) : (
                            <X className="mr-2 h-4 w-4 text-red-500" />
                          )}
                          <span>{feature.name}</span>
                        </div>
                      ))}
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
