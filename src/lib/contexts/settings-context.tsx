// ============================================
// TERRAH PREP - SETTINGS CONTEXT
// ============================================
// Only manages maintenance_mode from app_settings.
// All test configuration values are in src/config/testConfig.ts

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsService, AppSettings } from '@/lib/services/settings.service';
import { supabase } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
}

// ============================================
// CONTEXT
// ============================================

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for storage events (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settings_updated') {
        // Refresh settings when another tab updates them
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Load settings from service
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getAllSettings(supabase);
      setSettings(data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh settings (force reload)
   */
  const refreshSettings = async () => {
    await loadSettings();
  };

  /**
   * Update a setting
   */
  const updateSetting = async (key: string, value: any): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const result = await settingsService.updateSetting(supabase, key, value);
      
      if (result.success) {
        // Refresh settings after update
        await loadSettings();
        
        // Notify other tabs
        localStorage.setItem('settings_updated', Date.now().toString());
      } else {
        setError(result.error || 'Failed to update setting');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'Failed to update setting';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings,
    updateSetting,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useSettings() {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
}

// ============================================
// HELPER HOOK - Get single setting
// ============================================

export function useSetting(key: string) {
  const { settings, loading } = useSettings();
  
  return {
    value: settings?.[key],
    loading,
  };
}