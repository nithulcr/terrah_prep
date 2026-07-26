'use client';

import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useAuth } from '@/lib/auth/use-auth';
import { BookOpen, CalendarDays, ChevronRight, Trophy, TrendingUp } from 'lucide-react';

const statCards = [
  { label: 'Tests Taken', value: '0', icon: BookOpen, iconClass: 'bg-blue-100 text-blue-600' },
  { label: 'Questions Attempted', value: '0', icon: Trophy, iconClass: 'bg-purple-100 text-purple-600' },
  { label: 'Accuracy', value: '0%', icon: TrendingUp, iconClass: 'bg-emerald-100 text-emerald-600' },
];

export default function DashboardPage() {
  const { profile, subscription } = useAuth();
  const planName = subscription?.plan?.name ?? 'Free';
  const displayName = profile?.role === 'admin' ? 'Admin' : profile?.full_name?.split(' ')[0] || 'Student';

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-6 px-4 py-12 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome back, {displayName}!</h1>
            <p className="mt-3 text-lg text-slate-600">Track your progress and continue your preparation</p>
          </div>
          <Badge variant={subscription?.status === 'active' ? 'success' : 'warning'}>{planName} Plan</Badge>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {statCards.map(({ label, value, icon: Icon, iconClass }) => (
            <Card key={label} className="border border-slate-200 shadow-sm">
              <CardBody className="flex items-center justify-between p-6">
                <div><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-4xl font-bold text-slate-950">{value}</p></div>
                <div className={`rounded-xl p-4 ${iconClass}`}><Icon className="h-7 w-7" /></div>
              </CardBody>
            </Card>
          ))}
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="flex items-center justify-between p-6">
              <div><p className="text-sm text-slate-600">Current Plan</p><p className="mt-2 text-3xl font-bold text-slate-950">{planName}</p></div>
              <div className="rounded-xl bg-amber-100 p-4 text-amber-600"><CalendarDays className="h-7 w-7" /></div>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Card className="border border-slate-200 shadow-sm lg:col-span-2">
          <CardBody className="p-6 sm:p-8">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-950">Recent Tests</h2><span className="text-sm font-medium text-blue-600">View All</span></div>
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <BookOpen className="h-12 w-12 text-slate-400" />
              <p className="mt-5 text-slate-600">No tests taken yet</p>
              <Link href="/mock-tests" className="mt-5"><Button>Take Your First Test</Button></Link>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm"><CardBody className="p-6"><h2 className="text-2xl font-bold text-slate-950">Quick Actions</h2><div className="mt-5 space-y-2"><Link href="/mock-tests" className="block"><Button className="w-full"><BookOpen className="mr-2 h-4 w-4" />Take Mock Test</Button></Link><Link href="/pricing" className="block"><Button variant="secondary" className="w-full"><TrendingUp className="mr-2 h-4 w-4" />Upgrade Plan</Button></Link></div></CardBody></Card>
          <Card className="border border-slate-200 shadow-sm"><CardBody className="p-6"><h2 className="text-2xl font-bold text-slate-950">Performance</h2><div className="mt-6 flex items-center justify-between text-sm"><span className="text-slate-600">Overall Accuracy</span><strong>0%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-0 rounded-full bg-blue-600" /></div><Link href="/mock-tests" className="mt-5 flex items-center text-sm font-medium text-blue-600">Start practicing <ChevronRight className="ml-1 h-4 w-4" /></Link></CardBody></Card>
        </div>
      </section>
    </main>
  );
}
