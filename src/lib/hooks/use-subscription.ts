// ============================================
// TERRAH PREP - SUBSCRIPTION HOOKS
// ============================================

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { usageService } from '@/lib/services/usage.service';
import { paymentService } from '@/lib/services/payment.service';
import { UsageCheckResult, PlanFeatureFlags } from '@/lib/services/usage.service';

// ============================================
// TYPES
// ============================================

export interface UseSubscriptionReturn {
  // Data
  subscription: ReturnType<typeof useAuth>['subscription'];
  usage: ReturnType<typeof useAuth>['usage'];
  plan: any;
  
  // Loading states
  isLoading: boolean;
  
  // Feature checks
  canAccessQuestions: boolean;
  canStartMockTest: boolean;
  canViewResults: boolean;
  canDownloadPdf: boolean;
  canUseAnalytics: boolean;
  canUseBookmarks: boolean;
  canReviewAnswers: boolean;
  canUsePerformanceDashboard: boolean;
  hasPrioritySupport: boolean;
  
  // Usage limits
  questionsRemaining: number | null;
  testsRemaining: number | null;
  freeQuestionsRemaining: number | null;
  
  // Actions
  checkQuestionAccess: () => Promise<UsageCheckResult>;
  checkMockTestAccess: () => Promise<UsageCheckResult>;
  refreshUsage: () => Promise<void>;
  activateSubscription: (planSlug: string) => Promise<{ success: boolean; error?: string }>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFeatureFlags(plan: any): PlanFeatureFlags | null {
  if (!plan) return null;
  
  return {
    allow_result_history: plan.allow_result_history ?? false,
    allow_pdf_download: plan.allow_pdf_download ?? false,
    allow_analytics: plan.allow_analytics ?? false,
    allow_bookmarks: plan.allow_bookmarks ?? false,
    allow_review_answers: plan.allow_review_answers ?? false,
    allow_performance_dashboard: plan.allow_performance_dashboard ?? false,
    priority_support: plan.priority_support ?? false,
  };
}

function calculateRemaining(
  used: number | null | undefined,
  limit: number | null | undefined
): number | null {
  if (limit === null || limit === undefined) return null; // Unlimited
  if (used === null || used === undefined) return limit;
  return Math.max(0, limit - used);
}

// ============================================
// HOOK
// ============================================

export function useSubscription(): UseSubscriptionReturn {
  const { user, subscription, usage, refreshUsage } = useAuth();
  
  const plan = subscription?.plan ?? null;
  const features = getFeatureFlags(plan);
  
  // Calculate remaining quotas
  const questionsRemaining = calculateRemaining(
    usage?.questions_today,
    plan?.daily_question_limit
  );
  
  const testsRemaining = calculateRemaining(
    usage?.tests_this_month,
    plan?.monthly_mock_test_limit
  );
  
  const freeQuestionsRemaining = calculateRemaining(
    usage?.free_questions_used,
    plan?.lifetime_question_limit
  );
  
  // Check access
  const [canAccessQuestions, setCanAccessQuestions] = useState(false);
  const [canStartMockTest, setCanStartMockTest] = useState(false);
  
  // Update access checks when usage changes
  useEffect(() => {
    if (!usage || !plan) {
      setCanAccessQuestions(false);
      setCanStartMockTest(false);
      return;
    }
    
    // Check question access
    let canAccess = true;
    
    // Check lifetime limit (FREE plan)
    if (plan.lifetime_question_limit !== null && plan.lifetime_question_limit !== undefined) {
      if (usage.free_questions_used >= plan.lifetime_question_limit) {
        canAccess = false;
      }
    }
    
    // Check daily limit (paid plans)
    if (plan.daily_question_limit !== null && plan.daily_question_limit !== undefined) {
      if (usage.questions_today >= plan.daily_question_limit) {
        canAccess = false;
      }
    }
    
    setCanAccessQuestions(canAccess);
    
    // Check mock test access
    let canTest = true;
    
    if (plan.monthly_mock_test_limit !== null && plan.monthly_mock_test_limit !== undefined) {
      if (usage.tests_this_month >= plan.monthly_mock_test_limit) {
        canTest = false;
      }
    }
    
    setCanStartMockTest(canTest);
  }, [usage, plan]);
  
  // Check access functions
  const checkQuestionAccess = useCallback(async () => {
    const result = await usageService.canAccessQuestions(user?.id || '');
    return result;
  }, [user?.id]);
  
  const checkMockTestAccess = useCallback(async () => {
    const result = await usageService.canStartMockTest(user?.id || '');
    return result;
  }, [user?.id]);
  
  // Activate subscription
  const activateSubscription = useCallback(async (planSlug: string) => {
    // This should be called from a server action after payment
    // For now, we'll just refresh the usage
    await refreshUsage();
    return { success: true };
  }, [refreshUsage]);
  
  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!subscription?.user_id) {
      return { success: false, error: 'No active subscription' };
    }
    
    const result = await paymentService.cancelSubscription(subscription.user_id);
    
    if (result.success) {
      await refreshUsage();
    }
    
    return { success: result.success, error: result.error ?? undefined };
  }, [subscription, refreshUsage]);
  
  return {
    // Data
    subscription,
    usage,
    plan: plan ?? null,
    
    // Loading states
    isLoading: false,
    
    // Feature checks
    canAccessQuestions,
    canStartMockTest,
    canViewResults: features?.allow_result_history ?? false,
    canDownloadPdf: features?.allow_pdf_download ?? false,
    canUseAnalytics: features?.allow_analytics ?? false,
    canUseBookmarks: features?.allow_bookmarks ?? false,
    canReviewAnswers: features?.allow_review_answers ?? false,
    canUsePerformanceDashboard: features?.allow_performance_dashboard ?? false,
    hasPrioritySupport: features?.priority_support ?? false,
    
    // Usage limits
    questionsRemaining,
    testsRemaining,
    freeQuestionsRemaining,
    
    // Actions
    checkQuestionAccess,
    checkMockTestAccess,
    refreshUsage,
    activateSubscription,
    cancelSubscription,
  };
}