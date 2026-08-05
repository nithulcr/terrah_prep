import { supabase } from '@/lib/supabase/client';
import { UserPoints, PointTransaction } from '@/types';

export const pointsService = {
  /**
   * Get user points
   */
  async getUserPoints(): Promise<UserPoints | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no points record exists, create one
        if (error.code === 'PGRST116') {
          const { data: newPoints, error: insertError } = await supabase
            .from('user_points')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user points:', insertError);
            // If we can't create points due to RLS, return null
            // The UI should handle this gracefully
            return null;
          }

          return newPoints;
        }

        console.error('Error fetching user points:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserPoints:', error);
      return null;
    }
  },

  /**
   * Get user point transactions
   */
  async getUserTransactions(limit: number = 50): Promise<PointTransaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // If table doesn't exist (406 error), return empty array
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.error('Point transactions table does not exist. Please apply database migrations.');
          return [];
        }
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTransactions:', error);
      return [];
    }
  },

  /**
   * Redeem points for a subscription plan
   */
  async redeemPoints(planSlug: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Please login to redeem points' };
      }

      // Define plan costs
      const planCosts: Record<string, number> = {
        'starter': 100,
        'pro': 200,
        'elite': 300,
        'premium': 400,
      };

      const pointsRequired = planCosts[planSlug];
      
      if (!pointsRequired) {
        return { success: false, error: 'Invalid plan selected' };
      }

      // Check if user has enough points
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('available_points')
        .eq('user_id', user.id)
        .single();

      if (pointsError || !userPoints) {
        return { success: false, error: 'Failed to check points balance' };
      }

      if (userPoints.available_points < pointsRequired) {
        return { 
          success: false, 
          error: `Insufficient points. You need ${pointsRequired} points but have ${userPoints.available_points} points.` 
        };
      }

      // Deduct points
      const { error: deductError } = await supabase.rpc('deduct_points_from_user', {
        p_user_id: user.id,
        p_points: pointsRequired,
        p_transaction_type: 'redemption',
        p_description: `Redeemed ${planSlug} plan (30 days)`,
      });

      if (deductError) {
        console.error('Error deducting points:', deductError);
        return { success: false, error: 'Failed to redeem points' };
      }

      // Get user's current subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      // Get plan details
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', planSlug)
        .single();

      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      // Calculate new expiry date
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (plan.duration_days || 30) * 24 * 60 * 60 * 1000);

      if (subscription) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            expires_at: expiryDate.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return { success: false, error: 'Failed to update subscription' };
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: plan.id,
            status: 'active',
            starts_at: now.toISOString(),
            expires_at: expiryDate.toISOString(),
          });

        if (insertError) {
          console.error('Error creating subscription:', insertError);
          return { success: false, error: 'Failed to create subscription' };
        }
      }

      // Update user profile with new plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan_slug: planSlug })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      return { 
        success: true, 
        message: `Successfully redeemed ${planSlug} plan for 30 days!` 
      };
    } catch (error) {
      console.error('Error in redeemPoints:', error);
      return { success: false, error: 'Failed to redeem points' };
    }
  },
};