'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardBody, Badge, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Profile, Subscription, Plan } from '@/types';
import { Search, Mail, Calendar, Shield, UserPlus } from 'lucide-react';

interface UserWithSubscription extends Profile {
  subscription?: Subscription & { plan?: Plan };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

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

      // Load subscriptions for each user
      const usersWithSubscriptions = await Promise.all(
        (profiles ?? []).map(async (profile) => {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

          return {
            ...profile,
            subscription: subscription as any,
          };
        })
      );

      setUsers(usersWithSubscriptions);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserPlan = (user: UserWithSubscription) => {
    return user.subscription?.plan?.name || 'Free';
  };

  const getUserStatus = (user: UserWithSubscription) => {
    if (user.role === 'admin') return 'admin';
    return user.subscription?.status || 'inactive';
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
                        <Badge variant={user.subscription?.plan?.slug === 'free' ? 'default' : 'info'}>
                          {getUserPlan(user)}
                        </Badge>
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
                            {selectedUser.subscription.plan?.name || 'N/A'}
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
    </main>
  );
}