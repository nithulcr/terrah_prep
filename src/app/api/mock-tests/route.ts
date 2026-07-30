import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { mockTestsService } from '@/lib/services/mock-tests.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

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
    console.log('MOCK TESTS API QUERY: auth.getUser - BEFORE');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('MOCK TESTS API QUERY: auth.getUser - AFTER', {
      hasUser: !!user,
      userId: user?.id,
      error: authError,
    });
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get available tests and stats
    console.log('MOCK TESTS API: getAvailableTests - BEFORE', {
      batchId: Number(batchId),
      userId: user.id,
    });
    const result = await mockTestsService.getAvailableTests(supabase, Number(batchId), user.id);
    console.log('MOCK TESTS API: getAvailableTests - AFTER', {
      testsCount: result.tests.length,
      stats: result.stats,
      categoryCounts: result.categoryCounts.length,
    });

    return NextResponse.json({
      success: true,
      tests: result.tests,
      stats: result.stats,
      categoryCounts: result.categoryCounts,
    });
  } catch (error) {
    console.error('Error fetching mock tests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
