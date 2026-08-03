import { Plan } from '@/types';

export interface PlanFeature {
  name: string;
  available: boolean;
}

export interface PlanWithFeatures extends Plan {
  features: PlanFeature[];
  displayDuration: string;
  displayQuestionsPerDay?: string;
  displayMockTestsPerMonth?: string;
  displayLifetimeQuestions: string;
}

/**
 * All possible features that can be displayed on plan cards
 */
const ALL_FEATURES = [
  { key: 'allow_bookmarks', name: 'Bookmarks' },
  { key: 'allow_review_answers', name: 'Review Answers' },
  { key: 'allow_performance_dashboard', name: 'Performance Dashboard' },
  { key: 'allow_pdf_download', name: 'PDF Downloads' },
  { key: 'allow_previous_year_questions', name: 'Previous Year Question Papers' },
  { key: 'priority_support', name: 'Priority Support' },
] as const;

/**
 * Generates a list of all features for a plan with their availability status
 * @param plan - The plan object from Supabase
 * @returns Array of all plan features with availability status
 */
export function getPlanFeatures(plan: Plan): PlanFeature[] {
  return ALL_FEATURES.map(feature => ({
    name: feature.name,
    available: plan[feature.key] as boolean,
  }));
}

/**
 * Formats the duration for display
 * @param durationDays - Duration in days (null for lifetime)
 * @returns Formatted duration string
 */
export function getPlanDuration(durationDays: number | null): string {
  if (durationDays === null || durationDays === undefined) {
    return 'Lifetime';
  }
  return `${durationDays} Days`;
}

/**
 * Formats the questions per day for display
 * @param limit - Daily question limit (null or 0 for unlimited)
 * @returns Formatted string
 */
export function getQuestionsPerDay(limit: number | null): string {
  if (limit === null || limit === 0) {
    return 'Unlimited Questions / Day';
  }
  return `${limit} Questions / Day`;
}

/**
 * Formats the mock tests per month for display
 * @param limit - Monthly mock test limit (null or 0 for unlimited)
 * @returns Formatted string
 */
export function getMockTestsPerMonth(limit: number | null): string {
  if (limit === null || limit === 0) {
    return 'Unlimited Mock Tests / Month';
  }
  return `${limit} Mock Tests / Month`;
}

/**
 * Formats the lifetime questions for display
 * @param limit - Lifetime question limit (null for unlimited)
 * @returns Formatted string
 */
export function getLifetimeQuestions(limit: number | null): string {
  if (limit === null || limit === 0) {
    return 'Unlimited Lifetime Questions';
  }
  return `${limit} Lifetime Questions`;
}

/**
 * Check if a limit represents unlimited access
 * @param limit - The limit value
 * @returns True if unlimited
 */
export function isUnlimited(limit: number | null): boolean {
  return limit === null || limit === 0;
}

/**
 * Enhanced plan object with computed display properties
 * @param plan - The plan object from Supabase
 * @returns Plan with additional display properties
 */
export function enhancePlan(plan: Plan): PlanWithFeatures {
  return {
    ...plan,
    features: getPlanFeatures(plan),
    displayDuration: getPlanDuration(plan.duration_days),
    displayQuestionsPerDay: getQuestionsPerDay(plan.daily_question_limit),
    displayMockTestsPerMonth: getMockTestsPerMonth(plan.monthly_mock_test_limit),
    displayLifetimeQuestions: getLifetimeQuestions(plan.lifetime_question_limit),
  };
}

/**
 * Sort plans in the desired order: FREE, STARTER, PRO, ELITE, PREMIUM
 * @param plans - Array of plans
 * @returns Sorted array of plans
 */
export function sortPlans(plans: Plan[]): Plan[] {
  const planOrder = ['free', 'starter', 'pro', 'elite', 'premium'];
    
    return plans.sort((a, b) => {
      const indexA = planOrder.indexOf(a.slug);
      const indexB = planOrder.indexOf(b.slug);
      
      // If plan slug is not in the order list, put it at the end
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      
      return orderA - orderB;
    });
  }

/**
 * Check if a plan is the ELITE plan
 * @param plan - The plan object
 * @returns True if the plan is ELITE
 */
export function isElitePlan(plan: Plan): boolean {
  return plan.slug.toLowerCase() === 'elite';
}

/**
 * Check if a plan is the FREE plan
 * @param plan - The plan object
 * @returns True if the plan is FREE
 */
export function isFreePlan(plan: Plan): boolean {
  return plan.slug.toLowerCase() === 'free';
}