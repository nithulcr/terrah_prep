// ============================================
// Terrah Qbank - SUBSCRIPTION SERVICE (SINGLE SOURCE OF TRUTH)
// ============================================
// ALL subscription logic - database-driven, NO hardcoded values

import { SupabaseClient } from '@supabase/supabase-js';
import { Plan, Profile, UserUsage, UsageSummary } from '@/types';

// Default free question limit for users without a subscription
const FREE_QUESTION_LIMIT = 10;

// ============================================
// TYPES
// ============================================

export interface SubscriptionInfo {
  subscription: any | null;
  plan: Plan | null;
  profile: Profile | null;
  usage: UserUsage | null;
  summary: UsageSummary | null;
  error?: string | null;
}

export interface PlanLimits {
  daily_question_limit: number | null;
  monthly_mock_test_limit: number | null;
  lifetime_question_limit: number | null;
}

export interface RemainingQuota {
  dailyQuestionsRemaining: number | null;
  monthlyTestsRemaining: number | null;
  lifetimeQuestionsRemaining: number | null;
}

// ============================================
// SUBSCRIPTION SERVICE
// ============================================

export const subscriptionService = {
  /**
   * Get user's complete subscription information
   * Single source of truth for all subscription data
   */
  async getUserSubscription(supabase: SupabaseClient, userId: string): Promise<SubscriptionInfo> {
    try {
      console.log('=== getUserSubscription ===');
      console.log('userId:', userId);

      // Get user profile and usage in parallel
      const [profileResult, usageResult, subscriptionResult] = await Promise.all([
        // Get profile to read plan_slug (single source of truth)
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        
        // Get user usage
        supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),

        // Get active subscription (for status and dates only)
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()
      ]);

      const profile = profileResult.data as Profile | null;
      const usage = usageResult.data as UserUsage | null;
      const subscription = subscriptionResult.data as any | null;

      if (profileResult.error || !profile) {
        return {
          subscription: null,
          plan: null,
          profile: null,
          usage: null,
          summary: null,
          error: profileResult.error?.message || 'Profile not found',
        };
      }

      // Get plan details using profile.plan_slug (single source of truth)
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', profile.plan_slug || 'free')
        .maybeSingle();

      const plan = planData as Plan | null;

      if (!usage) {
        return {
          subscription,
          plan,
          profile,
          usage: null,
          summary: null,
          error: 'Usage data not found',
        };
      }

      // Build usage summary
      const summary: UsageSummary = {
        plan_slug: plan?.slug || 'free',
        daily_question_limit: plan?.daily_question_limit || 0,
        monthly_mock_test_limit: plan?.monthly_mock_test_limit || 0,
        lifetime_question_limit: plan?.lifetime_question_limit || 0,
        questions_today: usage.questions_today,
        tests_this_month: usage.tests_this_month,
        free_questions_used: usage.free_questions_used,
        subscription_expires_at: usage.subscription_expires_at,
      };

      return {
        subscription,
        plan,
        profile,
        usage,
        summary,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        subscription: null,
        plan: null,
        profile: null,
        usage: null,
        summary: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get current plan for user
   */
  async getCurrentPlan(supabase: SupabaseClient, userId: string): Promise<Plan | null> {
    const { plan } = await this.getUserSubscription(supabase, userId);
    return plan;
  },

  /**
   * Get plan limits for user
   */
  async getPlanLimits(supabase: SupabaseClient, userId: string): Promise<PlanLimits> {
    const { plan } = await this.getUserSubscription(supabase, userId);
    
    if (!plan) {
      // Free plan - use default
      return {
        daily_question_limit: 0,
        monthly_mock_test_limit: 0,
        lifetime_question_limit: FREE_QUESTION_LIMIT,
      };
    }

    return {
      daily_question_limit: plan.daily_question_limit,
      monthly_mock_test_limit: plan.monthly_mock_test_limit,
      lifetime_question_limit: plan.lifetime_question_limit,
    };
  },

  /**
   * Check if user's plan is expired
   */
  async isPlanExpired(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { subscription } = await this.getUserSubscription(supabase, userId);
    
    if (!subscription || !subscription.expires_at) {
      return false;
    }

    return new Date(subscription.expires_at) < new Date();
  },

  /**
   * Get remaining monthly mock tests
   */
  async getRemainingMonthlyTests(supabase: SupabaseClient, userId: string): Promise<number | null> {
    const { summary } = await this.getUserSubscription(supabase, userId);
    
    if (!summary) {
      return 0;
    }

    const limit = summary.monthly_mock_test_limit;
    if (limit === null || limit === undefined) {
      return null; // Unlimited
    }

    return Math.max(0, limit - summary.tests_this_month);
  },

  /**
   * Get remaining daily questions
   */
  async getRemainingDailyQuestions(supabase: SupabaseClient, userId: string): Promise<number | null> {
    const { summary } = await this.getUserSubscription(supabase, userId);
    
    if (!summary) {
      return 0;
    }

    const limit = summary.daily_question_limit;
    if (limit === null || limit === undefined) {
      return null; // Unlimited
    }

    return Math.max(0, limit - summary.questions_today);
  },

  /**
   * Get remaining lifetime questions
   */
  async getRemainingLifetimeQuestions(supabase: SupabaseClient, userId: string): Promise<number | null> {
    const { summary } = await this.getUserSubscription(supabase, userId);
    
    if (!summary) {
      return 0;
    }

    const limit = summary.lifetime_question_limit;
    if (limit === null || limit === undefined) {
      return null; // Unlimited
    }

    return Math.max(0, limit - summary.free_questions_used);
  },

  /**
   * Check if user can start a mock test
   * Uses database limits - NO hardcoded checks
   */
  async canStartMockTest(supabase: SupabaseClient, userId: string): Promise<{
    canAccess: boolean;
    reason?: string;
    redirectTo?: string;
    remainingTests: number | null;
  }> {
    try {
      console.log('=== canStartMockTest ===');
      console.log('userId:', userId);

      // Reset monthly counters if needed
      await this.resetMonthlyCounters(supabase, userId);

      // Get subscription info
      const { summary, plan } = await this.getUserSubscription(supabase, userId);

      if (!summary) {
        return {
          canAccess: false,
          reason: 'Unable to verify subscription status',
          remainingTests: 0,
        };
      }

      // Check if subscription is expired
      const isExpired = await this.isPlanExpired(supabase, userId);
      if (isExpired) {
        return {
          canAccess: false,
          reason: 'Subscription expired. Please renew your subscription.',
          redirectTo: '/pricing',
          remainingTests: 0,
        };
      }

      // Check monthly mock test limit
      const monthlyLimit = summary.monthly_mock_test_limit;
      if (monthlyLimit !== null && monthlyLimit !== undefined) {
        const remaining = monthlyLimit - summary.tests_this_month;
        if (remaining <= 0) {
          return {
            canAccess: false,
            reason: `Monthly Mock Test Limit Reached (${monthlyLimit}/${monthlyLimit}). Upgrade or wait for next month.`,
            redirectTo: '/pricing',
            remainingTests: 0,
          };
        }
      }

      return {
        canAccess: true,
        remainingTests: monthlyLimit !== null && monthlyLimit !== undefined ? monthlyLimit - summary.tests_this_month : null,
      };
    } catch (error) {
      console.error('Error checking mock test access:', error);
      return {
        canAccess: false,
        reason: 'Error checking access',
        remainingTests: 0,
      };
    }
  },

  /**
   * Increment mock test usage
   */
  async incrementMockUsage(supabase: SupabaseClient, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('=== incrementMockUsage ===');
      console.log('userId:', userId);

      // Reset monthly counters if needed
      await this.resetMonthlyCounters(supabase, userId);

      // Increment tests_this_month
      const { error } = await supabase
        .rpc('increment_monthly_tests', { p_user_id: userId });

      if (error) {
        console.error('Error incrementing mock usage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error incrementing mock usage:', error);
      return { success: false, error: 'Failed to increment usage' };
    }
  },

  /**
   * Increment question usage
   */
  async incrementQuestionUsage(supabase: SupabaseClient, userId: string, count: number): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('=== incrementQuestionUsage ===');
      console.log('userId:', userId);
      console.log('count:', count);

      // Reset daily counters if needed
      await this.resetDailyCounters(supabase, userId);

      // Increment questions_today and free_questions_used
      const { error } = await supabase
        .rpc('increment_question_usage', { 
          p_user_id: userId, 
          p_count: count 
        });

      if (error) {
        console.error('Error incrementing question usage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error incrementing question usage:', error);
      return { success: false, error: 'Failed to increment usage' };
    }
  },

  /**
   * Reset daily counters if it's a new day
   */
  async resetDailyCounters(supabase: SupabaseClient, userId: string): Promise<void> {
    try {
      console.log('=== resetDailyCounters ===');
      console.log('userId:', userId);

      const today = new Date().toISOString().split('T')[0];
      
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('last_daily_reset')
        .eq('user_id', userId)
        .maybeSingle();

      if (!usageData) {
        return;
      }

      const lastReset = (usageData as any).last_daily_reset;
      
      if (lastReset !== today) {
        console.log('Resetting daily counters for user:', userId);
        await supabase
          .from('user_usage')
          .update({
            questions_today: 0,
            last_daily_reset: today,
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to reset daily counters:', error);
    }
  },

  /**
   * Reset monthly counters if it's a new month
   */
  async resetMonthlyCounters(supabase: SupabaseClient, userId: string): Promise<void> {
    try {
      console.log('=== resetMonthlyCounters ===');
      console.log('userId:', userId);

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('last_monthly_reset')
        .eq('user_id', userId)
        .maybeSingle();

      if (!usageData) {
        return;
      }

      const lastReset = (usageData as any).last_monthly_reset;
      
      if (lastReset !== currentMonth) {
        console.log('Resetting monthly counters for user:', userId);
        await supabase
          .from('user_usage')
          .update({
            tests_this_month: 0,
            last_monthly_reset: currentMonth,
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to reset monthly counters:', error);
    }
  },

  /**
   * Check and handle expired subscriptions
   * Should be called periodically (e.g., on login)
   */
  async checkAndHandleExpiredSubscriptions(supabase: SupabaseClient): Promise<{ processed: number }> {
    try {
      console.log('=== checkAndHandleExpiredSubscriptions ===');

      // Find expired subscriptions
      const { data: expiredSubscriptions, error } = await supabase
        .from('subscriptions')
        .select('id, user_id, expires_at')
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'active');

      if (error || !expiredSubscriptions) {
        return { processed: 0 };
      }

      console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      // Update each expired subscription
      for (const sub of expiredSubscriptions) {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', sub.id);

        console.log(`Marked subscription ${sub.id} as expired for user ${sub.user_id}`);
      }

      return { processed: expiredSubscriptions.length };
    } catch (error) {
      console.error('Error handling expired subscriptions:', error);
      return { processed: 0 };
    }
  },
};