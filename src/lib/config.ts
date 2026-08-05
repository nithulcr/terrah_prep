// ============================================
// Terrah Qbank - APPLICATION CONFIGURATION
// ============================================

const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  app: {
    url:
      process.env.NEXT_PUBLIC_APP_URL ||
      (isDevelopment
        ? 'http://localhost:3000'
        : 'https://terrah-Qbankare.vercel.app'),
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
      'Missing Supabase environment variables. Please check your environment variables.\n' +
      'Required:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
}