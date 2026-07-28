// ============================================
// TERRAH PREP - SETTINGS SERVICE
// ============================================

import { supabase } from '@/lib/supabase/client';

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
  async fetchSettings(): Promise<AppSettings> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value, description')
        .order('setting_key');

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

      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get all settings (from cache if available)
   */
  async getAllSettings(): Promise<AppSettings> {
    // Return cached settings if still valid
    if (this.cache && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return this.cache;
    }

    // Fetch fresh settings
    return this.fetchSettings();
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string): Promise<any> {
    const settings = await this.getAllSettings();
    return settings[key];
  }

  /**
   * Update a setting (admin only)
   */
  async updateSetting(key: string, value: any): Promise<{ success: boolean; error?: string }> {
    try {
      const stringValue = String(value);

      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: stringValue
        })
        .eq('setting_key', key);

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
   * Refresh settings (force reload from database)
   */
  async refreshSettings(): Promise<AppSettings> {
    this.cache = null;
    this.lastFetch = 0;
    return this.fetchSettings();
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

