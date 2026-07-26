// ============================================
// TERRAH PREP - PROFILE SERVICE
// ============================================

import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types';

// ============================================
// TYPES
// ============================================

export interface ProfileCreateData {
  id: string;
  email: string;
  full_name?: string;
  role?: 'user' | 'admin';
}

export interface ProfileUpdateData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

// ============================================
// PROFILE SERVICE
// ============================================

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { profile: null, error: error.message };
      }

      // Profile might not exist yet - return null without error
      if (!data) {
        return { profile: null, error: null };
      }

      return { profile: data as Profile, error: null };
    } catch (error) {
      return { profile: null, error: 'Failed to fetch profile' };
    }
  },

  /**
   * Create a new profile
   * This should be called automatically after signup (via trigger or server action)
   */
  async createProfile(data: ProfileCreateData): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role || 'user',
        })
        .select()
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: profile as Profile, error: null };
    } catch (error) {
      return { profile: null, error: 'Failed to create profile' };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: profile as Profile, error: null };
    } catch (error) {
      return { profile: null, error: 'Failed to update profile' };
    }
  },

  /**
   * Delete user profile (for admin use)
   */
  async deleteProfile(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to delete profile' };
    }
  },

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { profile, error } = await this.getProfile(userId);
      
      if (error || !profile) {
        return false;
      }

      return profile.role === 'admin';
    } catch (error) {
      return false;
    }
  },
};