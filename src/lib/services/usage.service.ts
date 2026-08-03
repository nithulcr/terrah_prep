// ============================================
// Terrah Qbank - USAGE SERVICE (DATABASE-DRIVEN)
// ============================================
// ALL limits come from database - NO hardcoded plan checks

import { UserUsage, UsageSummary, Plan } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Default free question limit for users without a subscription
const FREE_QUESTION_LIMIT = 10;

// ============================================
// TYPES
// ============================================

export interface UsageCheckResult {
  canAccess: boolean;
  reason?: string;
  redirectTo?: string;
  usage: UsageSummary | null;
  plan: Plan | null;
}

export interface IncrementUsageData {
  questions?: number;
  tests?: number;
}

export interface PlanFeatureFlags {
  allow_result_history: boolean;
  allow_pdf_download: boolean;
  allow_analytics: boolean;
  allow_bookmarks: boolean;
  allow_review_answers: boolean;
  allow_performance_dashboard: boolean;
  priority_support: boolean;
}

// ============================================
// USAGE SERVICE
// ============================================

export const usageService = {
  /**
   * Get user usage summary with plan details
   * Returns data from database - NO hardcoded values
   */
  async getUserUsageSummary(supabase: SupabaseClient, userId: string): Promise<{ usage: UsageSummary | null; error: string | null }> {
    try {
      console.log('=== getUserUsageSummary ===');
      console.log('userId:', userId);

      // Get user profile and usage in parallel
      const [profileResult, usageResult] = await Promise.all([
        // Get profile to read plan_slug (single source of truth)
        supabase
          .from('profiles')
          .select('plan_slug')
          .eq('id', userId)
          .maybeSingle(),
        
        // Get user usage
        supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const profile = profileResult.data as { plan_slug: string } | null;
      const usage = usageResult.data as UserUsage | null;

      if (profileResult.error) {
        return { usage: null, error: profileResult.error.message };
      }

      if (!usage) {
        return { usage: null, error: 'No usage data found' };
      }

      // Get plan details using profile.plan_slug (single source of truth)
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', profile?.plan_slug || 'free')
        .maybeSingle();

      const plan = planData as Plan | null;

      const usageSummary: UsageSummary = {
        plan_slug: plan?.slug || 'free',
        daily_question_limit: plan?.daily_question_limit || 0,
        monthly_mock_test_limit: plan?.monthly_mock_test_limit || 0,
        lifetime_question_limit: plan?.lifetime_question_limit || 0,
        questions_today: usage.questions_today,
        tests_this_month: usage.tests_this_month,
        free_questions_used: usage.free_questions_used,
        subscription_expires_at: usage.subscription_expires_at,
      };

      return { usage: usageSummary, error: null };
    } catch (error) {
      console.error('Error fetching usage summary:', error);
      return { usage: null, error: 'Failed to fetch usage summary' };
    }
  },

  /**
   * Reset daily usage if it's a new day
   * Called on login to reset daily counters
   */
  async resetDailyUsageIfNeeded(supabase: SupabaseClient, userId: string): Promise<void> {
    try {
      console.log('=== resetDailyUsageIfNeeded ===');
      console.log('userId:', userId);
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('last_daily_reset')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Query Result - Usage Data:', usageData);

      if (!usageData) {
        return;
      }

      const lastReset = (usageData as any).last_daily_reset;
      
      if (lastReset !== today) {
        console.log('Resetting daily counters for user:', userId);
        // Reset daily counters
        const { error } = await supabase
          .from('user_usage')
          .update({
            questions_today: 0,
            last_daily_reset: today,
          })
          .eq('user_id', userId);

        console.log('Query Error - Reset Daily Usage:', error);
      }
    } catch (error) {
      console.error('Failed to reset daily usage:', error);
      // Don't throw - this is a non-critical operation
    }
  },

  /**
   * Reset monthly usage if it's a new month
   * Called on login to reset monthly counters
   */
  async resetMonthlyUsageIfNeeded(supabase: SupabaseClient, userId: string): Promise<void> {
    try {
      console.log('=== resetMonthlyUsageIfNeeded ===');
      console.log('userId:', userId);
      
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('last_monthly_reset')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Query Result - Usage Data:', usageData);

      if (!usageData) {
        return;
      }

      const lastReset = (usageData as any).last_monthly_reset;
      
      if (lastReset !== currentMonth) {
        console.log('Resetting monthly counters for user:', userId);
        // Reset monthly counters
        const { error } = await supabase
          .from('user_usage')
          .update({
            tests_this_month: 0,
            last_monthly_reset: currentMonth,
          })
          .eq('user_id', userId);

        console.log('Query Error - Reset Monthly Usage:', error);
      }
    } catch (error) {
      console.error('Failed to reset monthly usage:', error);
      // Don't throw - this is a non-critical operation
    }
  },

  /**
   * Get user usage with full plan details
   */
  async getUserUsageWithPlan(supabase: SupabaseClient, userId: string): Promise<{ usage: UserUsage | null; plan: Plan | null; error: string | null }> {
    try {
      console.log('=== getUserUsageWithPlan ===');
      console.log('userId:', userId);

      // Get user profile and usage in parallel
      const [profileResult, usageResult] = await Promise.all([
        // Get profile to read plan_slug (single source of truth)
        supabase
          .from('profiles')
          .select('plan_slug')
          .eq('id', userId)
          .maybeSingle(),
        
        // Get user usage
        supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const profile = profileResult.data as { plan_slug: string } | null;
      const usage = usageResult.data as UserUsage | null;

      if (profileResult.error) {
        return { usage: null, plan: null, error: profileResult.error.message };
      }

      if (!usage) {
        return { usage: null, plan: null, error: null };
      }

      // Get plan details using profile.plan_slug (single source of truth)
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', profile?.plan_slug || 'free')
        .maybeSingle();

      const plan = planData as Plan | null;

      return { usage, plan, error: null };
    } catch (error) {
      console.error('Error fetching usage:', error);
      return { usage: null, plan: null, error: 'Failed to fetch usage' };
    }
  },

  /**
   * Check if user can access questions based on their plan and usage
   * Uses database limits - NO hardcoded plan checks
   */
  async canAccessQuestions(supabase: SupabaseClient, userId: string): Promise<UsageCheckResult> {
    try {
      console.log('=== canAccessQuestions ===');
      console.log('userId:', userId);

      // Get user profile and usage in parallel
      const [profileResult, usageResult, subscriptionResult] = await Promise.all([
        // Get profile to read plan_slug (single source of truth)
        supabase
          .from('profiles')
          .select('plan_slug')
          .eq('id', userId)
          .maybeSingle(),
        
        // Get user usage
        supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),

        // Get active subscription (for expiry check only)
        supabase
          .from('subscriptions')
          .select('expires_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()
      ]);

      const profile = profileResult.data as { plan_slug: string } | null;
      const usage = usageResult.data as UserUsage | null;
      const subscription = subscriptionResult.data as any | null;

      if (profileResult.error || !profile) {
        return {
          canAccess: false,
          reason: 'Unable to verify subscription status',
          usage: null,
          plan: null,
        };
      }

      if (!usage) {
        return {
          canAccess: false,
          reason: 'No usage data found',
          usage: null,
          plan: null,
        };
      }

      // Get plan details using profile.plan_slug (single source of truth)
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', profile.plan_slug || 'free')
        .maybeSingle();

      const plan = planData as Plan | null;

      // If no plan found, user is on free plan
      if (!plan) {
        const freeLimit = FREE_QUESTION_LIMIT;
        
        if (usage.free_questions_used >= freeLimit) {
          return {
            canAccess: false,
            reason: 'Free question limit reached. Upgrade to continue.',
            redirectTo: '/pricing',
            usage: {
              plan_slug: 'free',
              daily_question_limit: 0,
              monthly_mock_test_limit: 0,
              lifetime_question_limit: freeLimit,
              questions_today: usage.questions_today,
              tests_this_month: usage.tests_this_month,
              free_questions_used: usage.free_questions_used,
              subscription_expires_at: null,
            },
            plan: null,
          };
        }

        return {
          canAccess: true,
          usage: {
            plan_slug: 'free',
            daily_question_limit: 0,
            monthly_mock_test_limit: 0,
            lifetime_question_limit: freeLimit,
            questions_today: usage.questions_today,
            tests_this_month: usage.tests_this_month,
            free_questions_used: usage.free_questions_used,
            subscription_expires_at: null,
          },
          plan: null,
        };
      }

      // Check if subscription is expired
      if (subscription?.expires_at && new Date(subscription.expires_at) < new Date()) {
        return {
          canAccess: false,
          reason: 'Subscription expired. Please renew your subscription.',
          redirectTo: '/pricing',
          usage: {
            plan_slug: plan.slug,
            daily_question_limit: plan.daily_question_limit,
            monthly_mock_test_limit: plan.monthly_mock_test_limit,
            lifetime_question_limit: plan.lifetime_question_limit,
            questions_today: usage.questions_today,
            tests_this_month: usage.tests_this_month,
            free_questions_used: usage.free_questions_used,
            subscription_expires_at: subscription.expires_at,
          },
          plan,
        };
      }

      // Check lifetime question limit
      if (plan.lifetime_question_limit !== null && plan.lifetime_question_limit !== undefined) {
        if (usage.free_questions_used >= plan.lifetime_question_limit) {
          return {
            canAccess: false,
            reason: `Lifetime question limit reached (${plan.lifetime_question_limit}/${plan.lifetime_question_limit}). Upgrade to continue.`,
            redirectTo: '/pricing',
            usage: {
              plan_slug: plan.slug,
              daily_question_limit: plan.daily_question_limit,
              monthly_mock_test_limit: plan.monthly_mock_test_limit,
              lifetime_question_limit: plan.lifetime_question_limit,
              questions_today: usage.questions_today,
              tests_this_month: usage.tests_this_month,
              free_questions_used: usage.free_questions_used,
              subscription_expires_at: subscription?.expires_at,
            },
            plan,
          };
        }
      }

      // Check daily question limit
      if (plan.daily_question_limit !== null && plan.daily_question_limit !== undefined) {
        if (usage.questions_today >= plan.daily_question_limit) {
          return {
            canAccess: false,
            reason: `Daily Question Limit Reached (${plan.daily_question_limit}/${plan.daily_question_limit}). Come back tomorrow.`,
            usage: {
              plan_slug: plan.slug,
              daily_question_limit: plan.daily_question_limit,
              monthly_mock_test_limit: plan.monthly_mock_test_limit,
              lifetime_question_limit: plan.lifetime_question_limit,
              questions_today: usage.questions_today,
              tests_this_month: usage.tests_this_month,
              free_questions_used: usage.free_questions_used,
              subscription_expires_at: subscription?.expires_at,
            },
            plan,
          };
        }
      }

      return {
        canAccess: true,
        usage: {
          plan_slug: plan.slug,
          daily_question_limit: plan.daily_question_limit,
          monthly_mock_test_limit: plan.monthly_mock_test_limit,
          lifetime_question_limit: plan.lifetime_question_limit,
          questions_today: usage.questions_today,
          tests_this_month: usage.tests_this_month,
          free_questions_used: usage.free_questions_used,
          subscription_expires_at: subscription?.expires_at,
        },
        plan,
      };
    } catch (error) {
      console.error('Error checking access:', error);
      return {
        canAccess: false,
        reason: 'Error checking access',
        usage: null,
        plan: null,
      };
    }
  },

  /**
   * Check if user can start a mock test
   * Uses database limits - NO hardcoded plan checks
   */
  async canStartMockTest(supabase: SupabaseClient, userId: string): Promise<UsageCheckResult> {
    try {
      console.log('=== canStartMockTest ===');
      console.log('userId:', userId);

      // Get user profile and usage in parallel
      const [profileResult, usageResult, subscriptionResult] = await Promise.all([
        // Get profile to read plan_slug (single source of truth)
        supabase
          .from('profiles')
          .select('plan_slug')
          .eq('id', userId)
          .maybeSingle(),
        
        // Get user usage
        supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),

        // Get active subscription (for expiry check only)
        supabase
          .from('subscriptions')
          .select('expires_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()
      ]);

      const profile = profileResult.data as { plan_slug: string } | null;
      const usage = usageResult.data as UserUsage | null;
      const subscription = subscriptionResult.data as any | null;

      if (profileResult.error || !profile) {
        return {
          canAccess: false,
          reason: 'Unable to verify subscription status',
          usage: null,
          plan: null,
        };
      }

      if (!usage) {
        return {
          canAccess: false,
          reason: 'No usage data found',
          usage: null,
          plan: null,
        };
      }

      // Get plan details using profile.plan_slug (single source of truth)
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', profile.plan_slug || 'free')
        .maybeSingle();

      const plan = planData as Plan | null;

      // If no plan found, user is on free plan
      if (!plan) {
        const freeLimit = FREE_QUESTION_LIMIT;
        
        // Free users can only take Test 1 (mock test limit = 0 means only test 1)
        // This is handled by the mock test availability logic
        return {
          canAccess: true,
          usage: {
            plan_slug: 'free',
            daily_question_limit: 0,
            monthly_mock_test_limit: 0,
            lifetime_question_limit: freeLimit,
            questions_today: usage.questions_today,
            tests_this_month: usage.tests_this_month,
            free_questions_used: usage.free_questions_used,
            subscription_expires_at: null,
          },
          plan: null,
        };
      }

      // Check if subscription is expired
      if (subscription?.expires_at && new Date(subscription.expires_at) < new Date()) {
        return {
          canAccess: false,
          reason: 'Subscription expired. Please renew your subscription.',
          redirectTo: '/pricing',
          usage: {
            plan_slug: plan.slug,
            daily_question_limit: plan.daily_question_limit,
            monthly_mock_test_limit: plan.monthly_mock_test_limit,
            lifetime_question_limit: plan.lifetime_question_limit,
            questions_today: usage.questions_today,
            tests_this_month: usage.tests_this_month,
            free_questions_used: usage.free_questions_used,
            subscription_expires_at: subscription.expires_at,
          },
          plan,
        };
      }

      // Check monthly mock test limit from database
      if (plan.monthly_mock_test_limit !== null && plan.monthly_mock_test_limit !== undefined) {
        if (usage.tests_this_month >= plan.monthly_mock_test_limit) {
          return {
            canAccess: false,
            reason: `Monthly Mock Test Limit Reached (${plan.monthly_mock_test_limit}/${plan.monthly_mock_test_limit}). Upgrade or wait for next month.`,
            redirectTo: '/pricing',
            usage: {
              plan_slug: plan.slug,
              daily_question_limit: plan.daily_question_limit,
              monthly_mock_test_limit: plan.monthly_mock_test_limit,
              lifetime_question_limit: plan.lifetime_question_limit,
              questions_today: usage.questions_today,
              tests_this_month: usage.tests_this_month,
              free_questions_used: usage.free_questions_used,
              subscription_expires_at: subscription?.expires_at,
            },
            plan,
          };
        }
      }

      return {
        canAccess: true,
        usage: {
          plan_slug: plan.slug,
          daily_question_limit: plan.daily_question_limit,
          monthly_mock_test_limit: plan.monthly_mock_test_limit,
          lifetime_question_limit: plan.lifetime_question_limit,
          questions_today: usage.questions_today,
          tests_this_month: usage.tests_this_month,
          free_questions_used: usage.free_questions_used,
          subscription_expires_at: subscription?.expires_at,
        },
        plan,
      };
    } catch (error) {
      console.error('Error checking access:', error);
      return {
        canAccess: false,
        reason: 'Error checking access',
        usage: null,
        plan: null,
      };
    }
  },

  /**
   * Increment usage counters after test completion
   * Tracks questions and tests from database
   */
  async incrementUsage(supabase: SupabaseClient, userId: string, data: IncrementUsageData): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('=== incrementUsage ===');
      console.log('userId:', userId);
      console.log('data:', data);

      // First, get current usage
      const { data: currentUsage, error: fetchError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Query Result - Current Usage:', currentUsage);
      console.log('Query Error - Fetch Usage:', fetchError);

      if (fetchError || !currentUsage) {
        return { success: false, error: fetchError?.message ?? 'Failed to fetch current usage' };
      }

      const updates: any = {};

      if (data.questions && data.questions > 0) {
        updates.questions_today = (currentUsage as any).questions_today + data.questions;
        updates.free_questions_used = (currentUsage as any).free_questions_used + data.questions;
      }

      if (data.tests && data.tests > 0) {
        updates.tests_this_month = (currentUsage as any).tests_this_month + data.tests;
      }

      const { error } = await supabase
        .from('user_usage')
        .update(updates)
        .eq('user_id', userId);

      console.log('Query Error - Update Usage:', error);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating usage:', error);
      return { success: false, error: 'Failed to update usage' };
    }
  },

  /**
   * Get user usage by subscription ID (for admin)
   */
  async getUsageBySubscription(supabase: SupabaseClient, subscriptionId: number): Promise<{ usage: UserUsage | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .maybeSingle();

      console.log('Query Result - Usage by Subscription:', data);
      console.log('Query Error - Usage:', error);

      return { usage: data as UserUsage | null, error: error?.message ?? null };
    } catch (error) {
      console.error('Error fetching usage:', error);
      return { usage: null, error: 'Failed to fetch usage' };
    }
  },

  /**
   * Reset user usage (for admin)
   */
  async resetUserUsage(supabase: SupabaseClient, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('=== resetUserUsage ===');
      console.log('userId:', userId);

      const { error } = await supabase
        .from('user_usage')
        .update({
          questions_today: 0,
          tests_this_month: 0,
          free_questions_used: 0,
          last_daily_reset: new Date().toISOString().split('T')[0],
          last_monthly_reset: new Date().toISOString().slice(0, 7),
        })
        .eq('user_id', userId);

      console.log('Query Error - Reset Usage:', error);

      return { success: !error, error: error?.message ?? null };
    } catch (error) {
      console.error('Error resetting usage:', error);
      return { success: false, error: 'Failed to reset usage' };
    }
  },
};