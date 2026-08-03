import { supabase } from '@/lib/supabase/client';
import { LuckySpinHistory } from '@/types';

export const luckySpinService = {
  /**
   * Possible rewards for lucky spin
   */
  REWARDS: [
    { type: 'points', value: '10 Points', points: 10, probability: 30 },
    { type: 'points', value: '20 Points', points: 20, probability: 25 },
    { type: 'points', value: '50 Points', points: 50, probability: 15 },
    { type: 'plan', value: 'Starter', planSlug: 'starter', probability: 10 },
    { type: 'plan', value: 'PRO', planSlug: 'pro', probability: 5 },
    { type: 'plan', value: 'Elite', planSlug: 'elite', probability: 3 },
    { type: 'plan', value: 'Premium', planSlug: 'premium', probability: 2 },
    { type: 'none', value: 'No Reward', points: 0, probability: 10 },
  ],

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
   * Perform lucky spin
   */
  async spin(): Promise<{ success: boolean; reward?: any; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Please login to spin' };
      }

      // Check if user has enough points
      const canSpinResult = await this.canSpin();
      if (!canSpinResult) {
        return { success: false, error: `You need at least ${this.SPIN_COST} points to spin` };
      }

      // Deduct spin cost
      const { error: deductError } = await supabase.rpc('deduct_points_from_user', {
        p_user_id: user.id,
        p_points: this.SPIN_COST,
        p_transaction_type: 'lucky_spin',
        p_description: 'Lucky Spin Wheel - 100 points deducted',
      });

      if (deductError) {
        console.error('Error deducting points:', deductError);
        return { success: false, error: 'Failed to deduct points' };
      }

      // Determine reward based on probability
      const reward = this._selectReward();

      // If reward is a plan, redeem it
      if (reward.type === 'plan' && reward.planSlug) {
        const { error: redeemError } = await supabase.rpc('redeem_plan_from_spin', {
          p_user_id: user.id,
          p_plan_slug: reward.planSlug,
        });

        if (redeemError) {
          console.error('Error redeeming plan:', redeemError);
          // Still record the spin, but plan redemption failed
        }
      }

      // Record spin history
      const { error: historyError } = await supabase
        .from('lucky_spin_history')
        .insert({
          user_id: user.id,
          reward_type: reward.type,
          reward_value: reward.value,
          points_deducted: this.SPIN_COST,
        });

      if (historyError) {
        console.error('Error recording spin history:', historyError);
      }

      return { 
        success: true, 
        reward: {
          ...reward,
          pointsDeducted: this.SPIN_COST,
        }
      };
    } catch (error) {
      console.error('Error in spin:', error);
      return { success: false, error: 'Failed to spin' };
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

  /**
   * Select a reward based on probability
   */
  _selectReward(): any {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const reward of this.REWARDS) {
      cumulative += reward.probability;
      if (random <= cumulative) {
        return reward;
      }
    }

    // Fallback to no reward
    return this.REWARDS[this.REWARDS.length - 1];
  },
};