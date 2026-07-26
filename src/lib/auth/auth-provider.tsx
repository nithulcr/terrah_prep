// ============================================
// TERRAH PREP - AUTH PROVIDER CONTEXT
// ============================================

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile, Subscription } from '@/types';
import { profileService } from '@/lib/services/profile.service';
import { subscriptionService } from '@/lib/services/subscription.service';

// ============================================
// TYPES
// ============================================

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  // ============================================
  // FETCH PROFILE
  // ============================================

  const fetchProfile = async (userId: string) => {
    try {
      const { profile: userProfile, error } = await profileService.getProfile(userId);
      
      // Only log actual errors, not missing profiles (which is expected right after signup)
      if (error) {
        console.error('Error fetching profile:', error);
      }
      
     console.log("Fetched Profile:", userProfile);
setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  // ============================================
  // FETCH SUBSCRIPTION
  // ============================================

  const fetchSubscription = async (userId: string) => {
    try {
      const { subscription: userSubscription, error } = await subscriptionService.getUserSubscription(userId);
      
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

  // Expose refresh function globally for admin setup
  useEffect(() => {
    (window as any).refreshAuthProfile = async () => {
      if (user?.id) {
        await refreshProfile();
      }
    };
  }, [user, refreshProfile]);

  // ============================================
  // SIGN OUT
  // ============================================

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
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
        setUser(session?.user ?? null);
        setLoading(false); // Don't wait for profile/subscription

        if (session?.user) {
          // Fetch profile and subscription asynchronously (non-blocking)
          fetchProfile(session.user.id);
          fetchSubscription(session.user.id);
        } else {
          // Clear data when user signs out
          setProfile(null);
          setSubscription(null);
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
    loading,
    signOut: handleSignOut,
    refreshProfile,
    refreshSubscription,
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