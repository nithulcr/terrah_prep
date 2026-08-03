// ============================================
// Terrah Qbank - AUTHENTICATION SERVICE
// ============================================

import { supabase } from '@/lib/supabase/client';
import { config } from '@/lib/config';

export interface AuthResult {
  success: boolean;
  error?: string;
  data?: {
    user: any;
    session: any;
  };
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

// ============================================
// EMAIL AUTHENTICATION
// ============================================

export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
        emailRedirectTo: `${config.app.url}/auth/verify-email`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Note: Profile creation should be handled by a database trigger
    // If RLS is enabled, client-side insert will fail
    // Create a trigger in Supabase: CREATE TRIGGER create_profile_after_signup...
    // Or use a server action with service role key

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign up',
    };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign in',
    };
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign out',
    };
  }
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.app.url}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during password reset',
    };
  }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during password update',
    };
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session, error: null };
  } catch (error) {
    return { session: null, error: 'Failed to get session' };
  }
}

// ============================================
// GOOGLE AUTHENTICATION (TEMPORARILY DISABLED)
// ============================================

/**
 * Google OAuth sign-in
 * 
 * TEMPORARILY DISABLED - Uncomment when ready to enable
 * 
 * To enable:
 * 1. Configure Google OAuth in Supabase Dashboard
 * 2. Uncomment this function
 * 3. Add Google login button to UI
 */
// export async function signInWithGoogle(): Promise<AuthResult> {
//   try {
//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: `${config.app.url}/auth/callback`,
//       },
//     });
//
//     if (error) {
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//
//     return {
//       success: true,
//       data: {
//         user: null,
//         session: null,
//       },
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: 'An unexpected error occurred during Google sign in',
//     };
//   }
// }