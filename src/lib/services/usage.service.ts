// ============================================
// TERRAH PREP - USAGE SERVICE
// ============================================

import { supabase } from '@/lib/supabase/client';
import { settingsService } from '@/lib/services/settings.service';
import { UserUsage, UsageSummary, Plan } from '@/types';

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
   * Uses direct queries instead of RPC to avoid database function dependency
   */
  async getUserUsageSummary(userId: string): Promise<{ usage: UsageSummary | null; error: string | null }> {
    try {
      // Get user usage with subscription and plan
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('*, subscription:subscriptions(plan:plans(*))')
        .eq('user_id', userId)
        .maybeSingle();

      if (usageError) {
        return { usage: null, error: usageError.message };
      }

      if (!usageData) {
        return { usage: null, error: 'No usage data found' };
      }

      const usage = usageData as UserUsage;
      const subscription = (usageData as any).subscription;
      const plan = subscription?.plan as Plan | null;

      // If no active subscription, return basic usage with settings from database
      if (!plan) {
        const settings = await settingsService.getAllSettings();
        return {
          usage: {
            plan_slug: 'free',
            daily_question_limit: 0,
            monthly_mock_test_limit: 0,
            lifetime_question_limit: settings.free_question_limit,
            questions_today: usage.questions_today,
            tests_this_month: usage.tests_this_month,
            free_questions_used: usage.free_questions_used,
            subscription_expires_at: null,
          },
          error: null,
        };
      }

      const usageSummary: UsageSummary = {
        plan_slug: plan.slug,
        daily_question_limit: plan.daily_question_limit,
        monthly_mock_test_limit: plan.monthly_mock_test_limit,
        lifetime_question_limit: plan.lifetime_question_limit,
        questions_today: usage.questions_today,
        tests_this_month: usage.tests_this_month,
        free_questions_used: usage.free_questions_used,
        subscription_expires_at: usage.subscription_expires_at,
      };

      return { usage: usageSummary, error: null };
    } catch (error) {
      return { usage: null, error: 'Failed to fetch usage summary' };
    }
  },

  /**
   * Reset daily usage if it's a new day
   * Called on login to reset daily counters
   */
  async resetDailyUsageIfNeeded(userId: string): Promise<void> {
    try {
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
        // Reset daily counters
        await supabase
          .from('user_usage')
          .update({
            questions_today: 0,
            last_daily_reset: today,
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to reset daily usage:', error);
      // Don't throw - this is a non-critical operation
    }
  },

  /**
   * Get user usage with full plan details
   */
  async getUserUsageWithPlan(userId: string): Promise<{ usage: UserUsage | null; plan: Plan | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*, subscription:subscriptions(plan:plans(*))')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { usage: null, plan: null, error: error.message };
      }

      if (!data) {
        return { usage: null, plan: null, error: null };
      }

      const usage = data as UserUsage;
      // @ts-ignore - Supabase nested relation typing limitation
      const plan = (data as any).subscription?.plan || null;

      return { usage, plan, error: null };
    } catch (error) {
      return { usage: null, plan: null, error: 'Failed to fetch usage' };
    }
  },

  /**
   * Check if user can access questions based on their plan and usage
   */
  async canAccessQuestions(userId: string): Promise<UsageCheckResult> {
    try {
      const { usage, error } = await this.getUserUsageSummary(userId);

      if (error || !usage) {
        return {
          canAccess: false,
          reason: 'Unable to verify subscription status',
          usage: null,
          plan: null,
        };
      }

      // Get plan details
      const planQuery = await supabase
        .from('plans')
        .select('*')
        .eq('slug', usage.plan_slug)
        .single();

      if (planQuery.error || !planQuery.data) {
        return {
          canAccess: false,
          reason: 'Plan not found',
          usage,
          plan: null,
        };
      }

      const selectedPlan = planQuery.data as Plan;

      // Check lifetime question limit (for FREE plan)
      // Use app_settings.free_question_limit for FREE plan, otherwise use plan's limit
      let effectiveLifetimeLimit = selectedPlan.lifetime_question_limit;
      
      // For FREE plan, use the free_question_limit from app_settings
      if (selectedPlan.slug === 'free') {
        const settings = await settingsService.getAllSettings();
        effectiveLifetimeLimit = settings.free_question_limit;
        console.log('Using FREE plan limit from settings:', effectiveLifetimeLimit);
      }
      
      if (effectiveLifetimeLimit !== null && effectiveLifetimeLimit !== undefined) {
        if (usage.free_questions_used >= effectiveLifetimeLimit) {
          return {
            canAccess: false,
            reason: `You have completed your free practice questions. Upgrade to continue learning.`,
            redirectTo: '/pricing',
            usage,
            plan: selectedPlan,
          };
        }
      }

      // Check daily question limit (for paid plans)
      if (selectedPlan.daily_question_limit !== null && selectedPlan.daily_question_limit !== undefined) {
        if (usage.questions_today >= selectedPlan.daily_question_limit) {
          return {
            canAccess: false,
            reason: `Daily Question Limit Reached. Come back tomorrow.`,
            usage,
            plan: selectedPlan,
          };
        }
      }

      return {
        canAccess: true,
        usage,
        plan: selectedPlan,
      };
    } catch (error) {
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
   */
  async canStartMockTest(userId: string): Promise<UsageCheckResult> {
    try {
      const { usage, error } = await this.getUserUsageSummary(userId);

      if (error || !usage) {
        return {
          canAccess: false,
          reason: 'Unable to verify subscription status',
          usage: null,
          plan: null,
        };
      }

      // Get plan details
      const planQuery = await supabase
        .from('plans')
        .select('*')
        .eq('slug', usage.plan_slug)
        .single();

      if (planQuery.error || !planQuery.data) {
        return {
          canAccess: false,
          reason: 'Plan not found',
          usage,
          plan: null,
        };
      }

      const selectedPlan = planQuery.data as Plan;

      // Check monthly mock test limit
      if (selectedPlan.monthly_mock_test_limit !== null && selectedPlan.monthly_mock_test_limit !== undefined) {
        if (usage.tests_this_month >= selectedPlan.monthly_mock_test_limit) {
          return {
            canAccess: false,
            reason: `Monthly Mock Test Limit Reached. Renew or upgrade your subscription.`,
            redirectTo: '/pricing',
            usage,
            plan: selectedPlan,
          };
        }
      }

      return {
        canAccess: true,
        usage,
        plan: selectedPlan,
      };
    } catch (error) {
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
   */
  async incrementUsage(userId: string, data: IncrementUsageData): Promise<{ success: boolean; error: string | null }> {
    try {
      // First, get current usage
      const { data: currentUsage, error: fetchError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

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

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to update usage' };
    }
  },

  /**
   * Get user usage by subscription ID (for admin)
   */
  async getUsageBySubscription(subscriptionId: number): Promise<{ usage: UserUsage | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .maybeSingle();

      return { usage: data as UserUsage | null, error: error?.message ?? null };
    } catch (error) {
      return { usage: null, error: 'Failed to fetch usage' };
    }
  },

  /**
   * Reset user usage (for admin)
   */
  async resetUserUsage(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_usage')
        .update({
          questions_today: 0,
          tests_this_month: 0,
          free_questions_used: 0,
          last_daily_reset: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', userId);

      return { success: !error, error: error?.message ?? null };
    } catch (error) {
      return { success: false, error: 'Failed to reset usage' };
    }
  },
};