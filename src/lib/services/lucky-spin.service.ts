import { supabase } from '@/lib/supabase/client';
import { LuckySpinHistory } from '@/types';

export const luckySpinService = {
  SPIN_COST: 100,

  /**
   * Check if user can spin (has enough points)
   */
  async canSpin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data: userPoints, error } = await supabase
        .from('user_points')
        .select('available_points')
        .eq('user_id', user.id)
        .single();

      if (error || !userPoints) {
        return false;
      }

      return userPoints.available_points >= this.SPIN_COST;
    } catch (error) {
      console.error('Error in canSpin:', error);
      return false;
    }
  },

  /**
   * Get user's available points
   */
  async getAvailablePoints(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return 0;
      }

      const { data: userPoints, error } = await supabase
        .from('user_points')
        .select('available_points')
        .eq('user_id', user.id)
        .single();

      if (error || !userPoints) {
        return 0;
      }

      return userPoints.available_points;
    } catch (error) {
      console.error('Error in getAvailablePoints:', error);
      return 0;
    }
  },

  /**
   * Perform lucky spin using RPC function
   */
  async spin(): Promise<{ success: boolean; reward?: any; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Please login to spin' };
      }

      // Call the RPC function
      const { data, error } = await supabase.rpc('spin_lucky_wheel', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error calling spin_lucky_wheel:', error);
        return { success: false, error: 'Something went wrong. Please try again.' };
      }

      // Parse the JSON result
      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result.success) {
        if (result.error === 'NOT_ENOUGH_POINTS') {
          return { 
            success: false, 
            error: result.message || 'You need at least 100 points to spin the Lucky Wheel.'
          };
        }
        return { success: false, error: result.message || 'Something went wrong. Please try again.' };
      }

      return { 
        success: true, 
        reward: {
          type: result.reward_type,
          value: result.reward_value,
          pointsDeducted: result.points_deducted,
        }
      };
    } catch (error) {
      console.error('Error in spin:', error);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  },

  /**
   * Get spin history
   */
  async getSpinHistory(limit: number = 20): Promise<LuckySpinHistory[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('lucky_spin_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching spin history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSpinHistory:', error);
      return [];
    }
  },
};