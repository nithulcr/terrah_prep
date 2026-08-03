// ============================================
// Terrah Qbank - PAYMENT SERVICE
// ============================================

import { Plan, Subscription, UserUsage } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface PaymentVerificationData {
  userId: string;
  planSlug: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  status: 'success' | 'failed' | 'pending';
}

export interface SubscriptionActivationResult {
  success: boolean;
  subscription?: Subscription;
  usage?: UserUsage;
  error?: string;
}

// ============================================
// PAYMENT SERVICE
// ============================================

export const paymentService = {
  /**
   * Verify payment and activate subscription
   * This should be called from a secure server-side payment webhook
   */
  async verifyAndActivateSubscription(supabase: SupabaseClient, data: PaymentVerificationData): Promise<SubscriptionActivationResult> {
    try {
      console.log('=== verifyAndActivateSubscription ===');
      console.log('data:', data);

      // Validate payment status
      if (data.status !== 'success') {
        return {
          success: false,
          error: 'Payment not successful',
        };
      }

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', data.planSlug)
        .eq('is_active', true)
        .single();

      console.log('Query Result - Plan:', plan);
      console.log('Query Error - Plan:', planError);

      if (planError || !plan) {
        return {
          success: false,
          error: 'Plan not found or inactive',
        };
      }

      const planData = plan as Plan;

      // Validate amount (optional check)
      if (data.amount && data.amount !== Number(planData.price)) {
        return {
          success: false,
          error: 'Payment amount mismatch',
        };
      }

      // Activate subscription using database function
      const { data: subscription, error: activationError } = await supabase
        .rpc('activate_subscription', {
          p_user_id: data.userId,
          p_plan_slug: data.planSlug,
          p_started_at: new Date().toISOString(),
        });

      console.log('Query Result - Subscription:', subscription);
      console.log('Query Error - Activation:', activationError);

      if (activationError || !subscription) {
        return {
          success: false,
          error: activationError?.message ?? 'Failed to activate subscription',
        };
      }

      const activatedSubscription = subscription as Subscription;

      // Get updated usage
      const { data: usage, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', data.userId)
        .single();

      console.log('Query Result - Usage:', usage);
      console.log('Query Error - Usage:', usageError);

      if (usageError || !usage) {
        return {
          success: false,
          error: 'Failed to fetch user usage',
        };
      }

      const userUsage = usage as UserUsage;

      return {
        success: true,
        subscription: activatedSubscription,
        usage: userUsage,
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: 'Payment verification failed',
      };
    }
  },

  /**
   * Get available plans for purchase
   */
  async getAvailablePlans(supabase: SupabaseClient): Promise<{ plans: Plan[]; error: string | null }> {
    try {
      console.log('=== getAvailablePlans ===');
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      console.log('Query Result - Plans:', data?.length);
      console.log('Query Error - Plans:', error);

      if (error) {
        return { plans: [], error: error.message };
      }

      return { plans: (data ?? []) as Plan[], error: null };
    } catch (error) {
      console.error('Error fetching plans:', error);
      return { plans: [], error: 'Failed to fetch plans' };
    }
  },

  /**
   * Get plan by slug
   */
  async getPlanBySlug(supabase: SupabaseClient, slug: string): Promise<{ plan: Plan | null; error: string | null }> {
    try {
      console.log('=== getPlanBySlug ===');
      console.log('slug:', slug);

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      console.log('Query Result - Plan:', data ? 'FOUND' : 'NOT FOUND');
      console.log('Query Error - Plan:', error);

      if (error) {
        return { plan: null, error: error.message };
      }

      return { plan: data as Plan, error: null };
    } catch (error) {
      console.error('Error fetching plan:', error);
      return { plan: null, error: 'Failed to fetch plan' };
    }
  },

  /**
   * Cancel subscription (downgrade to free at expiry)
   */
  async cancelSubscription(supabase: SupabaseClient, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('=== cancelSubscription ===');
      console.log('userId:', userId);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      console.log('Query Error - Cancel Subscription:', error);

      return { success: !error, error: error?.message ?? null };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  },

  /**
   * Extend subscription (admin function)
   */
  async extendSubscription(supabase: SupabaseClient, userId: string, days: number): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('=== extendSubscription ===');
      console.log('userId:', userId);
      console.log('days:', days);

      // Get current active subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      console.log('Query Result - Subscription:', subscription ? 'FOUND' : 'NOT FOUND');
      console.log('Query Error - Get Subscription:', subError);

      if (subError || !subscription) {
        return { success: false, error: 'No active subscription found' };
      }

      const currentExpiry = subscription.expires_at ? new Date(subscription.expires_at) : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          expires_at: newExpiry.toISOString(),
        })
        .eq('id', subscription.id);

      console.log('Query Error - Extend Subscription:', error);

      return { success: !error, error: error?.message ?? null };
    } catch (error) {
      console.error('Error extending subscription:', error);
      return { success: false, error: 'Failed to extend subscription' };
    }
  },

  /**
   * Get subscription history for a user
   */
  async getSubscriptionHistory(supabase: SupabaseClient, userId: string): Promise<{ subscriptions: Subscription[]; error: string | null }> {
    try {
      console.log('=== getSubscriptionHistory ===');
      console.log('userId:', userId);

      // Get subscription history (for historical records)
      // Note: Current plan should be read from profiles.plan_slug, not from subscription history
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('Query Result - Subscriptions:', data?.length);
      console.log('Query Error - Subscriptions:', error);

      if (error) {
        return { subscriptions: [], error: error.message };
      }

      return { subscriptions: (data ?? []) as Subscription[], error: null };
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      return { subscriptions: [], error: 'Failed to fetch subscription history' };
    }
  },
};