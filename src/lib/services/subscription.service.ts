import { SupabaseClient } from '@supabase/supabase-js';
import { Subscription, Plan } from '@/types';

export interface SubscriptionCreateData { 
  user_id: string; 
  plan_id: number; 
  status: Subscription['status']; 
  starts_at?: string; 
  expires_at?: string; 
}

export const subscriptionService = {
  async getUserSubscription(supabase: SupabaseClient, userId: string) { 
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    console.log('Query Result - Subscription:', data ? 'FOUND' : 'NOT FOUND');
    console.log('Query Error - Subscription:', error);
    
    return { subscription: data as Subscription | null, error: error?.message ?? null }; 
  },
  
  async getSubscriptionPlan(supabase: SupabaseClient, userId: string) { 
    const { subscription, error } = await this.getUserSubscription(supabase, userId); 
    return { plan: subscription?.plan as Plan | null ?? null, subscription, error }; 
  },
  
  async createSubscription(supabase: SupabaseClient, values: SubscriptionCreateData) { 
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(values)
      .select('*, plan:plans(*)')
      .single();
    
    console.log('Query Result - Created Subscription:', data ? 'CREATED' : 'FAILED');
    console.log('Query Error - Create Subscription:', error);
    
    return { subscription: data as Subscription | null, error: error?.message ?? null }; 
  },
};