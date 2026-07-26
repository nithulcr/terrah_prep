import { supabase } from '@/lib/supabase/client';
import { Subscription, Plan } from '@/types';
export interface SubscriptionCreateData { user_id: string; plan_id: string; status: Subscription['status']; starts_at?: string; expires_at?: string; }
export const subscriptionService = {
  async getUserSubscription(userId: string) { const { data, error } = await supabase.from('subscriptions').select('*, plan:plans(*)').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(); return { subscription: data as Subscription | null, error: error?.message ?? null }; },
  async getSubscriptionPlan(userId: string) { const { subscription, error } = await this.getUserSubscription(userId); return { plan: subscription?.plan as Plan | null ?? null, subscription, error }; },
  async createSubscription(values: SubscriptionCreateData) { const { data, error } = await supabase.from('subscriptions').insert(values).select('*, plan:plans(*)').single(); return { subscription: data as Subscription | null, error: error?.message ?? null }; },
};
