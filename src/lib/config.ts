// ============================================
// TERRAH PREP - APPLICATION CONFIGURATION
// ============================================

export const config = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
} as const;

// Validation helper
export function validateConfig() {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file. ' +
      'Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
}