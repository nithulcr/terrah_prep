'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { TestSet, TestSetStats } from '@/types';
import { Trophy, Lock, Play, CheckCircle } from 'lucide-react';

export default function MockTestsPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [testSetsMap, setTestSetsMap] = useState<Record<number, TestSet[]>>({});
  const [statsMap, setStatsMap] = useState<Record<number, TestSetStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadBatches();
    }
  }, [user]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const { data: batchesData } = await supabase
        .from('batches')
        .select('*')
        .eq('is_active', true)
        .order('batch_number');

      if (batchesData) {
        setBatches(batchesData);
        // Load test sets and stats for each batch
        await loadTestSetsForBatches(batchesData);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTestSetsForBatches = async (batchesData: any[]) => {
    const testSetsMapTemp: Record<number, TestSet[]> = {};
    const statsMapTemp: Record<number, TestSetStats> = {};

    for (const batch of batchesData) {
      try {
        const [testSets, stats] = await Promise.all([
          fetchTestSets(batch.id),
          fetchStats(batch.id),
        ]);

        testSetsMapTemp[batch.id] = testSets;
        statsMapTemp[batch.id] = stats;
      } catch (error) {
        console.error(`Error loading test sets for batch ${batch.id}:`, error);
      }
    }

    setTestSetsMap(testSetsMapTemp);
    setStatsMap(statsMapTemp);
  };

  const fetchTestSets = async (batchId: number): Promise<TestSet[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch(`/api/test-sets?batchId=${batchId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.testSets || [];
    } catch (error) {
      console.error('Error fetching test sets:', error);
      return [];
    }
  };

  const fetchStats = async (batchId: number): Promise<TestSetStats> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          totalQuestions: 0,
          questionsPerTest: 100,
          totalAvailableTests: 0,
          completedTests: 0,
          remainingTests: 0,
          currentPlan: 'free',
        };
      }

      const response = await fetch(`/api/test-sets/stats?batchId=${batchId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        return {
          totalQuestions: 0,
          questionsPerTest: 100,
          totalAvailableTests: 0,
          completedTests: 0,
          remainingTests: 0,
          currentPlan: 'free',
        };
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalQuestions: 0,
        questionsPerTest: 100,
        totalAvailableTests: 0,
        completedTests: 0,
        remainingTests: 0,
        currentPlan: 'free',
      };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'started':
        return <Badge variant="info">Continue</Badge>;
      case 'locked':
        return <Badge variant="danger">Locked</Badge>;
      default:
        return <Badge variant="primary">Start</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'started':
        return <Play className="h-5 w-5 text-blue-600" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-red-600" />;
      default:
        return <Play className="h-5 w-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-20">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Mock Tests
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Practice with structured test sets
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {batches.length === 0 ? (
          <Card>
            <CardBody className="p-12 text-center">
              <Trophy className="mx-auto h-16 w-16 text-slate-400" />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                No test batches available
              </h3>
              <p className="mt-2 text-slate-600">
                Check back later for new test batches
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6">
            {batches.map((batch) => {
              const testSets = testSetsMap[batch.id] || [];
              const stats = statsMap[batch.id];
              const isSelected = selectedBatch === batch.id;

              return (
                <Card key={batch.id} className="border border-slate-200 shadow-sm">
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {batch.batch_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {batch.description || 'No description'}
                        </p>
                      </div>
                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        onClick={() => setSelectedBatch(isSelected ? null : batch.id)}
                      >
                        {isSelected ? 'Hide Tests' : 'View Tests'}
                      </Button>
                    </div>

                    {/* Stats */}
                    {stats && (
                      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-blue-50 p-3 text-center">
                          <p className="text-xs text-slate-600">Total Questions</p>
                          <p className="text-lg font-bold text-blue-600">
                            {stats.totalQuestions}
                          </p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 text-center">
                          <p className="text-xs text-slate-600">Questions per Test</p>
                          <p className="text-lg font-bold text-green-600">
                            {stats.questionsPerTest}
                          </p>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-3 text-center">
                          <p className="text-xs text-slate-600">Available Tests</p>
                          <p className="text-lg font-bold text-purple-600">
                            {stats.totalAvailableTests}
                          </p>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-3 text-center">
                          <p className="text-xs text-slate-600">Remaining</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {stats.remainingTests}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Test Sets */}
                    {isSelected && (
                      <div className="mt-6 space-y-3">
                        {testSets.length === 0 ? (
                          <Card className="border border-slate-200">
                            <CardBody className="p-6 text-center">
                              <p className="text-slate-600">No test sets available for this batch</p>
                            </CardBody>
                          </Card>
                        ) : (
                          testSets.map((testSet) => (
                            <Card key={testSet.id} className="border border-slate-200">
                              <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(testSet.status)}
                                    <div>
                                      <h4 className="font-semibold text-slate-900">
                                        {testSet.name}
                                      </h4>
                                      <p className="text-sm text-slate-600">
                                        {testSet.total_questions} questions
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(testSet.status)}
                                    {testSet.status !== 'locked' && testSet.status !== 'completed' && (
                                      <Link href={`/mock-tests/${testSet.id}`}>
                                        <Button size="sm">
                                          {testSet.status === 'started' ? 'Continue' : 'Start'}
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}