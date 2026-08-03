// ============================================
// Terrah Qbank - PROFILE HELPERS
// ============================================

import { Profile, Subscription, SubscriptionPlan } from '@/types';

// ============================================
// PROFILE CREATION HELPERS
// ============================================

/**
 * Prepare profile data for creation after signup
 * This should be called automatically via Supabase trigger or server action
 */
export function prepareProfileData(userId: string, email: string, fullName?: string) {
  return {
    id: userId,
    email,
    full_name: fullName || null,
    role: 'user' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Validate profile data before creation
 */
export function validateProfileData(data: Partial<Profile>): { valid: boolean; error?: string } {
  if (!data.id) {
    return { valid: false, error: 'User ID is required' };
  }

  if (!data.email) {
    return { valid: false, error: 'Email is required' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

// ============================================
// SUBSCRIPTION HELPERS
// ============================================

/**
 * Get remaining tests based on subscription plan and completed attempts
 * 
 * @param plan - User's subscription plan
 * @param completedAttempts - Number of completed mock test attempts
 * @returns Number of remaining tests (Infinity for unlimited)
 */
export function getRemainingTests(plan: SubscriptionPlan, completedAttempts: number): number {
  // Free plan: 1 test
  if (plan === 'free') {
    return Math.max(0, 1 - completedAttempts);
  }

  // Starter plan: 10 tests per month
  if (plan === 'starter') {
    return Math.max(0, 10 - completedAttempts);
  }

  // Pro plan: 30 tests per month
  if (plan === 'pro') {
    return Math.max(0, 30 - completedAttempts);
  }

  // Elite plan: unlimited
  if (plan === 'elite') {
    return Infinity;
  }

  // Default: 0
  return 0;
}

/**
 * Check if user can take a test based on their subscription and remaining tests
 */
export function canTakeTest(
  plan: SubscriptionPlan,
  completedAttempts: number,
  isFreeTest: boolean = false
): boolean {
  // Free tests are always accessible
  if (isFreeTest) {
    return true;
  }

  const remaining = getRemainingTests(plan, completedAttempts);
  return remaining > 0 || remaining === Infinity;
}

/**
 * Get subscription plan display name
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    premium: 'Premium',
    elite: 'Elite',
  };

  return names[plan] || 'Unknown';
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) {
    return false;
  }

  return (
    subscription.status === 'active' &&
    !!subscription.expires_at &&
    new Date(subscription.expires_at) > new Date()
  );
}

/**
 * Get days until subscription expires
 */
export function getDaysUntilExpiry(subscription: Subscription | null): number | null {
  if (!subscription || !subscription.expires_at) {
    return null;
  }

  const now = new Date();
  const expiryDate = new Date(subscription.expires_at);
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
