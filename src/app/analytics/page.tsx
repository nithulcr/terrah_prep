'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useAuth } from '@/lib/auth/use-auth';
import { TrendingUp, Trophy, Target, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import UserLayout from '@/app/user-layout';

interface CategoryAnalytics {
  category: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
}

interface DifficultyAnalytics {
  difficulty: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface PerformanceTrend {
  date: string;
  score: number;
}

interface AnalyticsData {
  overview: {
    totalTests: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    totalSkipped: number;
    averageScore: number;
    highestScore: number;
  };
  categoryAnalytics: CategoryAnalytics[];
  difficultyAnalytics: DifficultyAnalytics[];
  performanceTrend: PerformanceTrend[];
  weakAreas: CategoryAnalytics[];
  strongAreas: CategoryAnalytics[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to load analytics');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-blue-600';
    if (accuracy >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <UserLayout>
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </main>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <main className="mx-auto max-w-2xl p-6">
          <Card>
            <CardBody className="p-8 text-center">
              <h1 className="text-2xl font-bold">Error</h1>
              <p className="mt-3 text-slate-600">{error}</p>
              <Link href="/pricing">
                <Button className="mt-6">Upgrade Plan</Button>
              </Link>
            </CardBody>
          </Card>
        </main>
      </UserLayout>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <UserLayout>
      <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Performance Analytics
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Detailed insights into your preparation journey
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Overview Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Tests</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{analytics.overview.totalTests}</p>
                </div>
                <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
                  <Trophy className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Average Score</p>
                  <p className={`mt-2 text-3xl font-bold ${getScoreColor(analytics.overview.averageScore)}`}>
                    {analytics.overview.averageScore}%
                  </p>
                </div>
                <div className="rounded-xl bg-green-100 p-4 text-green-600">
                  <Target className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Highest Score</p>
                  <p className={`mt-2 text-3xl font-bold ${getScoreColor(analytics.overview.highestScore)}`}>
                    {analytics.overview.highestScore}%
                  </p>
                </div>
                <div className="rounded-xl bg-purple-100 p-4 text-purple-600">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Questions</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{analytics.overview.totalQuestions}</p>
                </div>
                <div className="rounded-xl bg-amber-100 p-4 text-amber-600">
                  <BarChart3 className="h-7 w-7" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Category Performance */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-950">Category Performance</h2>
              {analytics.categoryAnalytics.length === 0 ? (
                <p className="text-center text-slate-600">No data available yet</p>
              ) : (
                <div className="space-y-4">
                  {analytics.categoryAnalytics.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{category.category}</span>
                        <span className={`text-sm font-semibold ${getAccuracyColor(category.accuracy)}`}>
                          {category.accuracy}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            category.accuracy >= 80 ? 'bg-green-600' :
                            category.accuracy >= 60 ? 'bg-blue-600' :
                            category.accuracy >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${category.accuracy}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs text-slate-600">
                        <span>Total: {category.total}</span>
                        <span className="text-green-600">Correct: {category.correct}</span>
                        <span className="text-red-600">Wrong: {category.wrong}</span>
                        <span className="text-gray-600">Skipped: {category.skipped}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Difficulty Analysis */}
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-950">Difficulty Analysis</h2>
              {analytics.difficultyAnalytics.length === 0 ? (
                <p className="text-center text-slate-600">No data available yet</p>
              ) : (
                <div className="space-y-4">
                  {analytics.difficultyAnalytics.map((difficulty) => (
                    <div key={difficulty.difficulty} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 capitalize">{difficulty.difficulty}</span>
                        <span className={`text-sm font-semibold ${getAccuracyColor(difficulty.accuracy)}`}>
                          {difficulty.accuracy}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            difficulty.accuracy >= 80 ? 'bg-green-600' :
                            difficulty.accuracy >= 60 ? 'bg-blue-600' :
                            difficulty.accuracy >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${difficulty.accuracy}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs text-slate-600">
                        <span>Total: {difficulty.total}</span>
                        <span className="text-green-600">Correct: {difficulty.correct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Weak and Strong Areas */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl font-bold text-slate-950">Weak Areas</h2>
              </div>
              {analytics.weakAreas.length === 0 ? (
                <p className="text-center text-slate-600">No weak areas identified yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.weakAreas.map((area) => (
                    <div key={area.category} className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                      <span className="font-medium text-slate-900">{area.category}</span>
                      <span className="text-sm font-semibold text-red-600">{area.accuracy}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-slate-950">Strong Areas</h2>
              </div>
              {analytics.strongAreas.length === 0 ? (
                <p className="text-center text-slate-600">No strong areas identified yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.strongAreas.map((area) => (
                    <div key={area.category} className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                      <span className="font-medium text-slate-900">{area.category}</span>
                      <span className="text-sm font-semibold text-green-600">{area.accuracy}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Performance Trend */}
        {analytics.performanceTrend.length > 0 && (
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-950">Recent Performance Trend</h2>
              <div className="space-y-2">
                {analytics.performanceTrend.map((trend, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      {new Date(trend.date).toLocaleDateString()}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            trend.score >= 80 ? 'bg-green-600' :
                            trend.score >= 60 ? 'bg-blue-600' :
                            trend.score >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${trend.score}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${getScoreColor(trend.score)}`}>
                      {trend.score}%
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </section>
    </main>
    </UserLayout>
  );
}
