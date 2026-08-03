// ============================================
// Terrah Qbank - SUPABASE MIDDLEWARE CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Middleware client - for Next.js middleware
export function createMiddlewareClient() {
  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}