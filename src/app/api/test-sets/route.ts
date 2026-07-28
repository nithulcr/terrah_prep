import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { testSetsService } from '@/lib/services/test-sets.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const userId = searchParams.get('userId');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { 'Authorization': `Bearer ${token}` } },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIdToUse = userId || user.id;

    // Get test sets and stats in parallel
    const [testSets, stats] = await Promise.all([
      testSetsService.getTestSetsByBatch(Number(batchId)),
      testSetsService.getTestSetStats(Number(batchId), userIdToUse),
    ]);

    // Get user attempts for all test sets
    const testSetIds = testSets.map(ts => ts.id);
    const { data: attempts } = await supabase
      .from('user_test_attempts')
      .select('test_set_id, completed_at')
      .eq('user_id', userIdToUse)
      .in('test_set_id', testSetIds);

    const attemptMap = new Map((attempts || []).map((a: any) => [a.test_set_id, a]));

    // Enrich test sets with attempt info
    const enrichedTestSets = testSets.map(testSet => {
      const attempt = attemptMap.get(testSet.id);
      let status: 'available' | 'started' | 'completed' | 'locked' = 'available';
      
      if (attempt?.completed_at) {
        status = 'completed';
      } else if (attempt?.started_at) {
        status = 'started';
      }

      return {
        ...testSet,
        status,
        hasAttempted: !!attempt,
      };
    });

    return NextResponse.json({
      success: true,
      testSets: enrichedTestSets,
      stats,
    });
  } catch (error) {
    console.error('Error fetching test sets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}