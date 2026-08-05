'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Users, BookOpen, DollarSign, TrendingUp, Settings, Calendar, Trophy, Flag } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalTests: number;
  totalQuestions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  freeUsers: number;
}

interface PlanStats {
  name: string;
  count: number;
  revenue: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAdminStats();
    }
  }, [user]);

  const loadAdminStats = async () => {
    try {
      setLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total tests
      const { count: totalTests } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true });

      // Get total questions
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions with user profiles (single source of truth: profiles.plan_slug)
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, status')
        .eq('status', 'active');

      const activeSubscriptions = subscriptions?.length ?? 0;

      // Get user profiles to determine plan_slug
      const userIds = subscriptions?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, plan_slug')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.plan_slug]) || []);

      // Get all plans for revenue calculation
      const { data: plans } = await supabase
        .from('plans')
        .select('*');

      const plansMap = new Map(plans?.map(p => [p.slug, p]) || []);

      const freeUsers = subscriptions?.filter(s => profilesMap.get(s.user_id) === 'free').length ?? 0;

      // Calculate revenue (simplified - sum of all active paid subscriptions)
      const totalRevenue = subscriptions?.reduce((sum: number, s) => {
        const planSlug = profilesMap.get(s.user_id);
        const plan = plansMap.get(planSlug || '');
        if (plan && plan.slug !== 'free') {
          return sum + Number(plan.price);
        }
        return sum;
      }, 0) ?? 0;

      // Get plan-wise stats from profiles (single source of truth)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('plan_slug');

      const planCounts: Record<string, { count: number; revenue: number }> = {};
      
      allProfiles?.forEach((profile) => {
        const plan = plansMap.get(profile.plan_slug || 'free');
        const planName = plan?.name || 'Unknown';
        const planSlug = plan?.slug || 'free';
        
        if (!planCounts[planName]) {
          planCounts[planName] = { count: 0, revenue: 0 };
        }
        planCounts[planName].count++;
        if (planSlug !== 'free') {
          planCounts[planName].revenue += Number(plan?.price || 0);
        }
      });

      const planStatsArray = Object.entries(planCounts).map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }));

      setStats({
        totalUsers: totalUsers || 0,
        totalTests: totalTests || 0,
        totalQuestions: totalQuestions || 0,
        totalRevenue,
        activeSubscriptions,
        freeUsers,
      });

      setPlanStats(planStatsArray);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Manage your platform and monitor performance
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats?.totalUsers}</p>
                </div>
                <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
                  <Users className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Tests</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats?.totalTests}</p>
                </div>
                <div className="rounded-xl bg-green-100 p-4 text-green-600">
                  <BookOpen className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">₹{stats?.totalRevenue}</p>
                </div>
                <div className="rounded-xl bg-purple-100 p-4 text-purple-600">
                  <DollarSign className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Subscriptions</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats?.activeSubscriptions}</p>
                </div>
                <div className="rounded-xl bg-amber-100 p-4 text-amber-600">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Free Users</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats?.freeUsers}</p>
                </div>
                <div className="rounded-xl bg-gray-100 p-4 text-gray-600">
                  <Users className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Questions</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats?.totalQuestions}</p>
                </div>
                <div className="rounded-xl bg-red-100 p-4 text-red-600">
                  <BookOpen className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Plan-wise Stats */}
        <div className="mb-8">
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-950">Plan-wise Distribution</h2>
              <div className="space-y-4">
                {planStats.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-sm text-slate-600">{plan.count} users</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{plan.revenue}</p>
                      <p className="text-sm text-slate-600">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-950">Quick Actions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/questions">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Manage Questions</p>
                      <p className="text-sm text-slate-600">Add, edit, delete questions</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/admin/categories">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-green-100 p-3 text-green-600">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Manage Categories</p>
                      <p className="text-sm text-slate-600">Organize question categories</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/admin/plans">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Manage Plans</p>
                      <p className="text-sm text-slate-600">Create and edit subscription plans</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Manage Users</p>
                      <p className="text-sm text-slate-600">View and manage users</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/admin/question-reports">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-100 p-3 text-red-600">
                      <Flag className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Question Reports</p>
                      <p className="text-sm text-slate-600">Review and manage reports</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/dashboard/results">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-green-100 p-3 text-green-600">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">View Results</p>
                      <p className="text-sm text-slate-600">Check test results and analytics</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}