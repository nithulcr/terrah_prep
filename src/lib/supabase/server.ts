// ============================================
// Terrah Qbank - SUPABASE SERVER CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

// Server client - for Server Components, Server Actions, Route Handlers
export async function createServerClient() {
  const cookieStore = await cookies();
  
  // Get all cookies and pass them to Supabase
  const allCookies = cookieStore.getAll();
  console.log('Server client: All cookies:', allCookies.map(c => c.name));
  
  const cookieString = allCookies.map(c => `${c.name}=${c.value}`).join('; ');

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
          'Cookie': cookieString,
        },
      },
    }
  );
}

// For use in Server Actions and Route Handlers
export const createClientForServer = createServerClient;