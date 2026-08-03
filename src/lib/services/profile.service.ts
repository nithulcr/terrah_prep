// ============================================
// Terrah Qbank - PROFILE SERVICE
// ============================================

import { Profile } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

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
}

// ============================================
// PROFILE SERVICE
// ============================================

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(supabase: SupabaseClient, userId: string): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      console.log('=== getProfile ===');
      console.log('userId:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('Query Result - Profile:', data ? 'FOUND' : 'NOT FOUND');
      console.log('Query Error - Profile:', error);

      if (error) {
        return { profile: null, error: error.message };
      }

      // Profile might not exist yet - return null without error
      if (!data) {
        return { profile: null, error: null };
      }

      return { profile: data as Profile, error: null };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { profile: null, error: 'Failed to fetch profile' };
    }
  },

  /**
   * Create a new profile
   * This should be called automatically after signup (via trigger or server action)
   */
  async createProfile(supabase: SupabaseClient, data: ProfileCreateData): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      console.log('=== createProfile ===');
      console.log('data:', data);

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

      console.log('Query Result - Profile:', profile ? 'CREATED' : 'FAILED');
      console.log('Query Error - Profile:', error);

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: profile as Profile, error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { profile: null, error: 'Failed to create profile' };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(supabase: SupabaseClient, userId: string, data: ProfileUpdateData): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      console.log('=== updateProfile ===');
      console.log('userId:', userId);
      console.log('data:', data);

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      console.log('Query Result - Profile:', profile ? 'UPDATED' : 'FAILED');
      console.log('Query Error - Profile:', error);

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: profile as Profile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { profile: null, error: 'Failed to update profile' };
    }
  },

  /**
   * Delete user profile (for admin use)
   */
  async deleteProfile(supabase: SupabaseClient, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('=== deleteProfile ===');
      console.log('userId:', userId);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      console.log('Query Error - Delete Profile:', error);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return { success: false, error: 'Failed to delete profile' };
    }
  },

  /**
   * Check if user is admin
   */
  async isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
    try {
      const { profile, error } = await this.getProfile(supabase, userId);
      
      if (error || !profile) {
        return false;
      }

      return profile.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
};