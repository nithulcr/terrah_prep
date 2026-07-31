import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { testSetsService } from '@/lib/services/test-sets.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const testSetId = Number(resolvedParams.id);

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

    // Get test set details
    const testSet = await testSetsService.getTestSetById(supabase, testSetId);
    if (!testSet) {
      return NextResponse.json({ error: 'Test set not found' }, { status: 404 });
    }

    // Get user's plan from profile (single source of truth)
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_slug')
      .eq('id', user.id)
      .maybeSingle();

    const userPlan = profile?.plan_slug || 'free';

    // Check if user can access this test set
    const { canAccess, reason } = await testSetsService.canAccessTestSet(supabase, user.id, testSetId, userPlan);
    
    if (!canAccess) {
      return NextResponse.json({ 
        error: reason,
        redirectTo: '/pricing'
      }, { status: 403 });
    }

    // Start the test set
    const { success, error } = await testSetsService.startTestSet(supabase, user.id, testSetId);
    
    if (!success) {
      return NextResponse.json({ error: error || 'Failed to start test' }, { status: 500 });
    }

    // Get questions for this test set
    const testSetWithQuestions = await testSetsService.getTestSetById(supabase, testSetId);
    
    if (!testSetWithQuestions || !testSetWithQuestions.questions || testSetWithQuestions.questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this test set' }, { status: 404 });
    }

    // Return test set with questions
    return NextResponse.json({
      success: true,
      testSet: testSetWithQuestions,
      batch: testSet.batch,
    });
  } catch (error) {
    console.error('Error starting test set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
