// ============================================
// TERRAH PREP - SETTINGS SERVICE
// ============================================
// Only maintenance_mode is stored in app_settings.
// All test configuration values are in src/config/testConfig.ts

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface AppSettings {
  maintenance_mode: boolean;
  [key: string]: any;
}

interface SettingsRow {
  setting_key: string;
  setting_value: string;
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
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  }

  /**
   * Fetch maintenance_mode from database
   */
  async fetchSettings(supabase: SupabaseClient): Promise<AppSettings> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'maintenance_mode');

      if (error) {
        console.error('Error fetching settings:', error);
        return this.getDefaultSettings();
      }

      const settings: AppSettings = this.getDefaultSettings();

      if (data && data.length > 0) {
        (data as SettingsRow[]).forEach((row) => {
          settings[row.setting_key] = this.convertValue(row.setting_value);
        });
      }

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
  async getAllSettings(supabase?: SupabaseClient): Promise<AppSettings> {
    if (this.cache && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return this.cache;
    }

    if (!supabase) {
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
   * Update a setting (admin only)
   */
  async updateSetting(supabaseClient: SupabaseClient, key: string, value: any): Promise<{ success: boolean; error?: string }> {
    try {
      const stringValue = String(value);

      const { error } = await supabaseClient
        .from('app_settings')
        .update({ setting_value: stringValue })
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
      maintenance_mode: false,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const settingsService = new SettingsServiceClass();