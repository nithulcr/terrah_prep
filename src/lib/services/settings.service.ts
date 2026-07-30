// ============================================
// TERRAH PREP - SETTINGS SERVICE
// ============================================

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as browserSupabase } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

export interface AppSettings {
  // Test Configuration
  total_questions: number;
  questions_per_category: number;
  english_questions: number;
  science_questions: number;
  general_knowledge_questions: number;
  mathematics_questions: number;
  malayalam_questions: number;

  // Subscription Limits
  free_question_limit: number;
  daily_question_limit: number;
  monthly_mock_test_limit: number;

  // Test Settings
  negative_mark: number;
  test_duration_minutes: number;
  marks_per_question: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;

  // Feature Flags
  allow_bookmarks: boolean;
  allow_review: boolean;
  allow_pdf_download: boolean;
  show_explanation_after_test: boolean;

  // Additional settings can be added here
  [key: string]: any;
}

interface SettingsRow {
  setting_key: string;
  setting_value: string;
  description?: string;
}

// ============================================
// SETTINGS SERVICE
// ============================================

class SettingsServiceClass {
  private cache: AppSettings | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Convert string value to appropriate type
   */
  private convertValue(value: string): any {
    // Convert to number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }

    // Convert to boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Keep as string
    return value;
  }

  /**
   * Fetch all settings from database
   */
  async fetchSettings(supabase: SupabaseClient): Promise<AppSettings> {
    try {
      console.log('=== fetchSettings ===');
      console.log('SETTINGS QUERY: app_settings select setting_key/setting_value - BEFORE');
      
      let { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value, description')
        .order('setting_key');

      console.log('SETTINGS QUERY: app_settings select setting_key/setting_value - AFTER', {
        rowCount: data?.length ?? 0,
        error,
      });

      if (error && error.message?.includes('setting_key')) {
        console.warn('SETTINGS QUERY: Falling back to legacy key/value app_settings columns');
        const legacyResult = await supabase
          .from('app_settings')
          .select('key, value, description')
          .order('key');

        console.log('SETTINGS QUERY: app_settings select key/value - AFTER', {
          rowCount: legacyResult.data?.length ?? 0,
          error: legacyResult.error,
        });

        data = legacyResult.data?.map((row: any) => ({
          setting_key: row.key,
          setting_value: row.value,
          description: row.description,
        })) ?? null;
        error = legacyResult.error;
      }

      if (error) {
        console.error('Error fetching settings:', error);
        return this.getDefaultSettings();
      }

      if (!data || data.length === 0) {
        console.warn('No settings found in database, using defaults');
        return this.getDefaultSettings();
      }

      // Convert array to object
      const settings: AppSettings = {
        ...this.getDefaultSettings(),
      };

      (data as SettingsRow[]).forEach((row) => {
        settings[row.setting_key] = this.convertValue(row.setting_value);
      });

      // Update cache
      this.cache = settings;
      this.lastFetch = Date.now();

      console.log('Settings loaded successfully:', settings);
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get all settings (from cache if available)
   */
  async getAllSettings(supabase?: SupabaseClient): Promise<AppSettings> {
    // Return cached settings if still valid
    if (this.cache && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return this.cache;
    }

    // Fetch fresh settings
    if (!supabase) {
      console.warn('No supabase client provided, using default settings');
      return this.getDefaultSettings();
    }
    
    return this.fetchSettings(supabase);
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string, supabase?: SupabaseClient): Promise<any> {
    const settings = await this.getAllSettings(supabase);
    return settings[key];
  }

  /**
   * Update a setting (admin only) - Server-side version
   */
  async updateSetting(supabaseClient: SupabaseClient, key: string, value: any): Promise<{ success: boolean; error?: string }> {
    const client = supabaseClient;
    const settingKey = key;
    const settingValue = value;

    try {
      console.log('=== updateSetting ===');
      console.log('key:', settingKey);
      console.log('value:', settingValue);
      
      const stringValue = String(settingValue);

      const { error } = await client
        .from('app_settings')
        .update({
          setting_value: stringValue
        })
        .eq('setting_key', settingKey);

      console.log('Query Error - Update Setting:', error);

      if (error) {
        console.error('Error updating setting:', error);
        return { success: false, error: error.message };
      }

      // Invalidate cache
      this.cache = null;
      this.lastFetch = 0;

      return { success: true };
    } catch (error) {
      console.error('Error updating setting:', error);
      return { success: false, error: 'Failed to update setting' };
    }
  }

  /**
   * Update a setting (admin only) - Client-side version (backward compatibility)
   */
  async updateSettingClient(key: string, value: any): Promise<{ success: boolean; error?: string }> {
    console.warn('updateSettingClient called - using browser client (client-side only)');
    return this.updateSetting(browserSupabase, key, value);
  }

  /**
   * Refresh settings (force reload from database)
   */
  async refreshSettings(supabase: SupabaseClient): Promise<AppSettings> {
    this.cache = null;
    this.lastFetch = 0;
    return this.fetchSettings(supabase);
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): AppSettings {
    return {
      total_questions: 100,
      questions_per_category: 0,
      english_questions: 20,
      science_questions: 20,
      general_knowledge_questions: 20,
      mathematics_questions: 20,
      malayalam_questions: 20,
      free_question_limit: 100,
      daily_question_limit: 10,
      monthly_mock_test_limit: 30,
      negative_mark: 0.33,
      test_duration_minutes: 90,
      marks_per_question: 1,
      shuffle_questions: true,
      shuffle_options: true,
      allow_bookmarks: true,
      allow_review: true,
      allow_pdf_download: false,
      show_explanation_after_test: true,
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const settingsService = new SettingsServiceClass();
