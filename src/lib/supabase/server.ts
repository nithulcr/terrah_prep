// ============================================
// Terrah Qbank - SUPABASE SERVER CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

// Server client - for Server Components, Server Actions, Route Handlers
// This helper reads BOTH cookies AND Authorization header
export async function createServerClient(request?: Request) {
  const cookieStore = await cookies();
  
  // Get all cookies and pass them to Supabase
  const allCookies = cookieStore.getAll();
  const cookieString = allCookies.map(c => `${c.name}=${c.value}`).join('; ');

  // Get Authorization header from request if available
  let authHeader = '';
  if (request) {
    authHeader = request.headers.get('Authorization') || '';
  }

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
          'X-Client-Info': 'terrah-Qbank-server',
          'Cookie': cookieString,
          ...(authHeader && { 'Authorization': authHeader }),
        },
      },
    }
  );
}

// For use in Server Actions and Route Handlers
export const createClientForServer = createServerClient;

// ============================================
// UNIFIED AUTHENTICATION HELPER
// ============================================

export interface AuthenticatedUser {
  user: any;
  profile: any;
  supabase: any;
  error?: string | null;
}

/**
 * Authenticate user and check if admin
 * Use this in ALL admin API routes
 * 
 * @param request - The request object
 * @returns Authenticated user with profile and supabase client, or error
 */
export async function authenticateAdmin(request: Request): Promise<AuthenticatedUser> {
  try {
    // Use createServerClient which reads BOTH cookies and Authorization header
    const supabase = await createServerClient(request);

    // Try to get user from session (works with both cookies and Bearer token)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth failed:', authError?.message);
      return {
        user: null,
        profile: null,
        supabase: null,
        error: 'Unauthorized'
      };
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError?.message);
      return {
        user,
        profile: null,
        supabase,
        error: 'No profile found'
      };
    }

    // Check if admin
    if (profile.role !== 'admin') {
      console.error('Not admin:', profile.role);
      return {
        user,
        profile,
        supabase,
        error: 'Forbidden - Admin access required'
      };
    }

    return {
      user,
      profile,
      supabase,
      error: undefined
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      user: null,
      profile: null,
      supabase: null,
      error: 'Authentication failed'
    };
  }
}
