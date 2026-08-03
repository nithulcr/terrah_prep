'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { usePoints } from '@/context/PointsContext';
import { User, Mail, Phone, Calendar, Trophy, TrendingUp, Award } from 'lucide-react';
import UserLayout from '@/app/user-layout';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { points, transactions, availablePoints, loading: pointsLoading } = usePoints();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="mx-auto max-w-4xl p-6">
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-1/2"></div>
            <div className="h-64 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Profile</h1>

        <div className="grid gap-6">
          {/* Profile Information */}
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </h2>
                  <p className="text-slate-600">{user?.email}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium text-slate-900">{user?.email}</p>
                  </div>
                </div>

                {profile?.phone && (
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <p className="font-medium text-slate-900">{profile.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Member Since</p>
                    <p className="font-medium text-slate-900">
                      {new Date(profile?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                  <Award className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Role</p>
                    <p className="font-medium text-slate-900 capitalize">{profile?.role}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Points Overview */}
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <h3 className="text-xl font-semibold text-slate-900">My Points</h3>
              </div>

              {pointsLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-6 text-center">
                    <TrendingUp className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                    <p className="text-sm text-slate-600 mb-1">Available Points</p>
                    <p className="text-3xl font-bold text-blue-600">{availablePoints}</p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-6 text-center">
                    <Trophy className="mx-auto h-8 w-8 text-green-600 mb-2" />
                    <p className="text-sm text-slate-600 mb-1">Total Earned</p>
                    <p className="text-3xl font-bold text-green-600">
                      {points?.total_points || 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-purple-50 p-6 text-center">
                    <Award className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                    <p className="text-sm text-slate-600 mb-1">Used Points</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {(points?.total_points || 0) - (points?.available_points || 0)}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={() => window.location.href = '/rewards'}
                  className="w-full md:w-auto"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Visit Rewards Center
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Recent Transactions */}
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Transactions</h3>

              {transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No transactions yet. Start reporting questions to earn points!
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{transaction.description}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{transaction.transaction_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {transactions.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/rewards'}
                  >
                    View All Transactions
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}