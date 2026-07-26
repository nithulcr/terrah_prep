// ============================================
// TERRAH PREP - SUPABASE SERVER CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

// Server client - for Server Components, Server Actions, Route Handlers
export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'terrah-prep-server',
        },
      },
    }
  );
}

// For use in Server Actions and Route Handlers
export const createClientForServer = createServerClient;