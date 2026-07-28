// ============================================
// TERRAH PREP - AUTH PROVIDER CONTEXT
// ============================================

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile, Subscription, UsageSummary } from '@/types';
import { profileService } from '@/lib/services/profile.service';
import { subscriptionService } from '@/lib/services/subscription.service';
import { usageService } from '@/lib/services/usage.service';

// ============================================
// TYPES
// ============================================

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  subscription: Subscription | null;
  usage: UsageSummary | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // FETCH PROFILE
  // ============================================

  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthProvider: Fetching profile for user:', userId);
      const { profile: userProfile, error } = await profileService.getProfile(supabase, userId);
      
      // Only log actual errors, not missing profiles (which is expected right after signup)
      if (error) {
        console.error('AuthProvider: Error fetching profile:', error);
      }
      
      console.log('AuthProvider: Profile fetched:', userProfile);
      setProfile(userProfile);
    } catch (error) {
      console.error('AuthProvider: Error fetching profile:', error);
      setProfile(null);
    }
  };

  // Log session changes
  useEffect(() => {
    if (user) {
      console.log('AuthProvider: User session active:', user.email);
      
      // Check if cookies are set
      if (typeof document !== 'undefined') {
        const allCookies = document.cookie;
        console.log('AuthProvider: All cookies:', allCookies);
        
        const cookies = document.cookie.split(';').map(c => c.trim());
        const hasAuthCookie = cookies.some(c => c.includes('sb-access-token'));
        console.log('AuthProvider: Has sb-access-token cookie:', hasAuthCookie);
        
        // Check Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('AuthProvider: Current session:', session ? 'EXISTS' : 'NULL');
          if (session) {
            console.log('AuthProvider: Session expires at:', new Date(session.expires_at! * 1000));
          }
        });
      }
    }
  }, [user]);

  // ============================================
  // FETCH SUBSCRIPTION
  // ============================================

  const fetchSubscription = async (userId: string) => {
    try {
      const { subscription: userSubscription, error } = await subscriptionService.getUserSubscription(supabase, userId);
      
      if (error || !userSubscription) {
        // Subscription is optional, so we don't log errors
        setSubscription(null);
        return;
      }

      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  // ============================================
  // FETCH USAGE
  // ============================================

  const fetchUsage = async (userId: string) => {
    try {
      // Reset daily usage if needed (non-critical, won't throw)
      await usageService.resetDailyUsageIfNeeded(supabase, userId);
      
      // Fetch usage summary
      const { usage: userUsage, error } = await usageService.getUserUsageSummary(supabase, userId);
      
      // Usage is optional - never fail login if it's missing
      if (error || !userUsage) {
        // Silently set usage to null - user can still use the app
        setUsage(null);
        return;
      }

      setUsage(userUsage);
    } catch (error) {
      // Never fail login due to usage fetch errors
      // This handles the case where user_usage table doesn't exist yet
      console.error('Error fetching usage (non-critical):', error);
      setUsage(null);
    }
  };

  // ============================================
  // REFRESH FUNCTIONS
  // ============================================

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const refreshSubscription = async () => {
    if (user?.id) {
      await fetchSubscription(user.id);
    }
  };

  const refreshUsage = async () => {
    if (user?.id) {
      await fetchUsage(user.id);
    }
  };

  // Expose refresh function globally for admin setup
  useEffect(() => {
    (window as any).refreshAuthProfile = async () => {
      if (user?.id) {
        await refreshProfile();
      }
    };
  }, [user, refreshProfile]);

  // Expose refresh usage function globally
  useEffect(() => {
    (window as any).refreshAuthUsage = async () => {
      if (user?.id) {
        await refreshUsage();
      }
    };
  }, [user, refreshUsage]);

  // ============================================
  // SIGN OUT
  // ============================================

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setUsage(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // ============================================
  // AUTH STATE LISTENER
  // ============================================

  useEffect(() => {
    // Get initial session - set loading false immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false); // Don't wait for profile/subscription
      
      // Fetch profile and subscription asynchronously (non-blocking)
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSubscription(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
        
        setUser(session?.user ?? null);
        setLoading(false); // Don't wait for profile/subscription

      if (session?.user) {
        // Fetch profile and subscription asynchronously (non-blocking)
        console.log('AuthProvider: Fetching data for user:', session.user.id);
        fetchProfile(session.user.id);
        fetchSubscription(session.user.id);
        fetchUsage(session.user.id);
      } else {
        // Clear data when user signs out
        console.log('AuthProvider: Clearing user data');
        setProfile(null);
        setSubscription(null);
        setUsage(null);
      }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AuthContextType = {
    user,
    profile,
    subscription,
    usage,
    loading,
    signOut: handleSignOut,
    refreshProfile,
    refreshSubscription,
    refreshUsage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}


