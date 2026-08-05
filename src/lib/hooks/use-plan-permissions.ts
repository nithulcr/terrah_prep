// ============================================
// Terrah Qbank - PLAN PERMISSIONS HOOK
// ============================================

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { Plan } from '@/types';

export interface PlanPermissions {
  canBookmark: boolean;
  canReviewAnswers: boolean;
  canAnalytics: boolean;
  canPerformanceDashboard: boolean;
  canPdfDownload: boolean;
  canPreviousYearQuestions: boolean;
  canPrioritySupport: boolean;
  canResultHistory: boolean;
}

/**
 * Hook to check user's plan permissions
 * Returns permission flags based on the user's current plan
 * 
 * @returns PlanPermissions object with all permission flags
 * 
 * @example
 * const { canBookmark, canReviewAnswers } = usePlanPermissions();
 * 
 * if (!canBookmark) {
 *   // Show upgrade prompt
 * }
 */
export function usePlanPermissions(): PlanPermissions & { loading: boolean } {
  const { profile, subscription } = useAuth();

  const plan = useMemo(() => {
    // Get plan from subscription or profile
    return (subscription?.plan || (profile as any)?.plan) as Plan | undefined;
  }, [subscription, profile]);

  const isLoading = !profile || !plan;

  const permissions = useMemo(() => {
    // Default to FREE plan permissions if no profile or plan not loaded yet
    if (!profile?.plan_slug || !plan) {
      return {
        canBookmark: false,
        canReviewAnswers: false,
        canAnalytics: false,
        canPerformanceDashboard: false,
        canPdfDownload: false,
        canPreviousYearQuestions: false,
        canPrioritySupport: false,
        canResultHistory: false,
      };
    }

    return {
      canBookmark: plan.allow_bookmarks || false,
      canReviewAnswers: plan.allow_review_answers || false,
      canAnalytics: false, // Removed - use Performance Dashboard instead
      canPerformanceDashboard: plan.allow_performance_dashboard || false,
      canPdfDownload: plan.allow_pdf_download || false,
      canPreviousYearQuestions: plan.allow_previous_year_questions || false,
      canPrioritySupport: plan.priority_support || false,
      canResultHistory: plan.allow_result_history || false,
    };
  }, [profile, plan]);

  return {
    ...permissions,
    loading: isLoading,
  };
}

/**
 * Get upgrade message for a specific feature
 * @param feature - The feature name
 * @returns Upgrade message
 */
export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    bookmark: 'Bookmarks are available in PRO, ELITE and PREMIUM plans.',
    reviewAnswers: 'Review Answers are available in PRO, ELITE and PREMIUM plans.',
    analytics: 'Analytics Dashboard is available in PRO, ELITE and PREMIUM plans.',
    performanceDashboard: 'Performance Dashboard is available in PRO, ELITE and PREMIUM plans.',
    pdfDownload: 'PDF Downloads are available in PRO, ELITE and PREMIUM plans.',
    previousYearQuestions: 'Previous Year Questions are available in PRO, ELITE and PREMIUM plans.',
    prioritySupport: 'Priority Support is available in ELITE and PREMIUM plans.',
    resultHistory: 'Result History is available in PRO, ELITE and PREMIUM plans.',
  };

  return messages[feature] || 'This feature requires a plan upgrade.';
}

/**
 * Get the minimum plan required for a feature
 * @param feature - The feature name
 * @returns Minimum plan name
 */
export function getMinimumPlan(feature: string): string {
  const minimumPlans: Record<string, string> = {
    bookmark: 'PRO',
    reviewAnswers: 'PRO',
    analytics: 'PRO',
    performanceDashboard: 'PRO',
    pdfDownload: 'PRO',
    previousYearQuestions: 'PRO',
    prioritySupport: 'ELITE',
    resultHistory: 'PRO',
  };

  return minimumPlans[feature] || 'PRO';
}