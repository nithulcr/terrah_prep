// ============================================
// TERRAH PREP - SUPABASE BROWSER CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Browser client - for client-side operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export type SupabaseClient = typeof supabase;