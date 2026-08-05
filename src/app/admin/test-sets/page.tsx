'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { RefreshCw, CheckCircle } from 'lucide-react';

export default function AdminTestSetsPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [testSetCounts, setTestSetCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('ADMIN TEST SETS PAGE QUERY: batches select - BEFORE');
      const { data: batchesData } = await supabase
        .from('batches')
        .select('*')
        .order('batch_number');

      console.log('ADMIN TEST SETS PAGE QUERY: batches select - AFTER', {
        rowCount: batchesData?.length ?? 0,
      });

      if (batchesData) {
        setBatches(batchesData);
        
        const counts: Record<number, number> = {};
        for (const batch of batchesData) {
          console.log('ADMIN TEST SETS PAGE QUERY: test_sets count - BEFORE', {
            batchId: batch.id,
          });
          const { count, error } = await supabase
            .from('test_sets')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id);
          console.log('ADMIN TEST SETS PAGE QUERY: test_sets count - AFTER', {
            batchId: batch.id,
            count,
            error,
          });
          counts[batch.id] = count || 0;
        }
        setTestSetCounts(counts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTestSets = async (batchId: number) => {
    try {
      setGenerating(batchId);
      setMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      const response = await fetch('/api/admin/test-sets/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to generate' });
        return;
      }

      setMessage({ type: 'success', text: data.message });
      console.log('ADMIN TEST SETS PAGE API: generate response', data);
      await loadData();
    } catch (error) {
      console.error('ADMIN TEST SETS PAGE API: generate failed', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to generate test sets',
      });
    } finally {
      setGenerating(null);
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
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Test Sets Management
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Generate and manage test sets for batches
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-6 rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {batches.map((batch) => {
            const count = testSetCounts[batch.id] || 0;
            const hasTestSets = count > 0;

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
                      <div className="mt-3 flex items-center gap-4">
                        <div>
                          <span className="text-sm text-slate-600">Test Sets: </span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        {hasTestSets && (
                          <Badge variant="success">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Generated
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => generateTestSets(batch.id)}
                      disabled={generating === batch.id}
                    >
                      {generating === batch.id ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {hasTestSets ? 'Regenerate' : 'Generate'} Test Sets
                        </>
                      )}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {batches.length === 0 && (
          <Card>
            <CardBody className="p-12 text-center">
              <p className="text-slate-600">No batches available</p>
            </CardBody>
          </Card>
        )}
      </section>
    </main>
  );
}
