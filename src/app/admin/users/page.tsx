'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardBody, Badge, Input, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Profile, Subscription, Plan } from '@/types';
import { Search, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface UserWithSubscription extends Profile {
  subscription?: Subscription & { plan?: Plan };
}

const loadPlans = async (setPlans: React.Dispatch<React.SetStateAction<Plan[]>>) => {
  try {
    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (plansError) {
      console.error('Error loading plans:', plansError);
      return;
    }

    setPlans(plansData ?? []);
  } catch (error) {
    console.error('Error loading plans:', error);
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, number>>({});
  const { showSuccess, showError, ToastContainer } = useToast();

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error loading users:', profilesError);
        return;
      }

      // Load plans to map plan_slug to plan_id
      const plansMap = new Map(plans.map(p => [p.slug, p.id]));

      // Load subscriptions for each user
      const usersWithSubscriptions = await Promise.all(
        (profiles ?? []).map(async (profile) => {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

          return {
            ...profile,
            subscription: subscription as Subscription & { plan?: Plan },
          };
        })
      );

      setUsers(usersWithSubscriptions);

      // Initialize selected plans with current plan_slug from profiles (single source of truth)
      // Only set if not already selected (preserves changes across refreshes)
      setSelectedPlans((prev) => {
        const newSelectedPlans = { ...prev };
        usersWithSubscriptions.forEach((user) => {
          if (user.plan_slug && !newSelectedPlans[user.id]) {
            const planId = plansMap.get(user.plan_slug);
            if (planId) {
              newSelectedPlans[user.id] = planId;
            }
          }
        });
        return newSelectedPlans;
      });
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans(setPlans);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserStatus = (user: UserWithSubscription) => {
    if (user.role === 'admin') return 'admin';
    return user.subscription?.status || 'inactive';
  };

  const getCurrentPlanName = (user: UserWithSubscription): string => {
    // Use profile.plan_slug to get plan name (single source of truth)
    if (user.plan_slug) {
      const plan = plans.find(p => p.slug === user.plan_slug);
      if (plan) return plan.name;
    }
    return 'N/A';
  };

  const handlePlanChange = (userId: string, planId: string) => {
    setSelectedPlans((prev) => ({
      ...prev,
      [userId]: parseInt(planId),
    }));
  };

  const handleSavePlan = async (user: UserWithSubscription) => {
    const selectedPlanId = selectedPlans[user.id];

    if (!selectedPlanId) {
      showError('Error', 'Please select a plan first');
      return;
    }

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);

    if (!selectedPlan) {
      showError('Error', 'Selected plan not found');
      return;
    }

    setSavingUserId(user.id);

    try {
      // Check if subscription already exists
      const { data: existingSubscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error checking subscription:', subscriptionError);
        showError('Error', 'Failed to check existing subscription');
        setSavingUserId(null);
        return;
      }

      const now = new Date().toISOString();
      const isFreePlan = selectedPlan.slug === 'free';
      
      // Calculate expires_at
      let expiresAt: string | null = null;
      if (!isFreePlan && selectedPlan.duration_days) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + selectedPlan.duration_days);
        expiresAt = expirationDate.toISOString();
      }

      // Update plan_slug in profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ plan_slug: selectedPlan.slug })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('Error updating profile plan_slug:', profileUpdateError);
        showError('Error', 'Failed to update user plan');
        setSavingUserId(null);
        return;
      }

      if (existingSubscription) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: selectedPlan.id,
            status: 'active',
            starts_at: now,
            updated_at: now,
            expires_at: expiresAt,
          })
          .eq('id', existingSubscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          showError('Error', 'Failed to update subscription');
          setSavingUserId(null);
          return;
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: selectedPlan.id,
            status: 'active',
            starts_at: now,
            expires_at: expiresAt,
          });

        if (insertError) {
          console.error('Error creating subscription:', insertError);
          showError('Error', 'Failed to create subscription');
          setSavingUserId(null);
          return;
        }
      }

      // Refresh users list
      await loadUsers();

      // Re-initialize selected plans with the new plan
      setSelectedPlans((prev) => ({
        ...prev,
        [user.id]: selectedPlan.id,
      }));

      showSuccess('Success', `Plan updated to ${selectedPlan.name} for ${user.email}`);
    } catch (error) {
      console.error('Error saving plan:', error);
      showError('Error', 'Failed to save plan');
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading users...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-12 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Manage Users
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              View and manage user accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Users Table */}
        <Card className="border border-slate-200 shadow-sm">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="p-4 font-semibold text-slate-900">User</th>
                    <th className="p-4 font-semibold text-slate-900">Email</th>
                    <th className="p-4 font-semibold text-slate-900">Plan</th>
                    <th className="p-4 font-semibold text-slate-900">Status</th>
                    <th className="p-4 font-semibold text-slate-900">Joined</th>
                    <th className="p-4 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.full_name || 'No name'}
                            </p>
                            <p className="text-sm text-slate-600">
                              {user.phone || 'No phone'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{user.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedPlans[user.id]?.toString() || ''}
                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                            className="w-40"
                          >
                            <option value="">Select plan</option>
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id.toString()}>
                                {plan.name}
                              </option>
                            ))}
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleSavePlan(user)}
                            disabled={savingUserId === user.id}
                          >
                            {savingUserId === user.id ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getUserStatus(user) === 'active' ? 'success' : 'warning'}>
                          {getUserStatus(user)}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardBody className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-950">User Details</h2>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Close
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* User Info */}
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-900">Profile Information</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-600">Full Name</p>
                        <p className="font-medium text-slate-900">{selectedUser.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="font-medium text-slate-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Phone</p>
                        <p className="font-medium text-slate-900">{selectedUser.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Role</p>
                        <Badge variant={selectedUser.role === 'admin' ? 'danger' : 'info'}>
                          {selectedUser.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-900">Subscription</h3>
                    {selectedUser.subscription ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-slate-600">Plan</p>
                          <p className="font-medium text-slate-900">
                            {getCurrentPlanName(selectedUser)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Status</p>
                          <Badge variant={selectedUser.subscription.status === 'active' ? 'success' : 'warning'}>
                            {selectedUser.subscription.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Started At</p>
                          <p className="font-medium text-slate-900">
                            {new Date(selectedUser.subscription.starts_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Expires At</p>
                          <p className="font-medium text-slate-900">
                            {selectedUser.subscription.expires_at
                              ? new Date(selectedUser.subscription.expires_at).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600">No active subscription</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </section>

      <ToastContainer />
    </main>
  );
}