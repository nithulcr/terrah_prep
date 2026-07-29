import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { mockTestsService } from '@/lib/services/mock-tests.service';
import { settingsService } from '@/lib/services/settings.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ testNumber: string }> }
) {
  try {
    const resolvedParams = await params;
    const testNumber = Number(resolvedParams.testNumber);
    const body = await request.json();
    const { batchId, allowRetest } = body;

    if (!batchId || !testNumber || testNumber < 1) {
      return NextResponse.json({ error: 'Batch ID and valid test number are required' }, { status: 400 });
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

    // Check if user can access this test
    const { canAccess, reason } = await mockTestsService.canAccessTest(supabase, user.id, Number(batchId), testNumber, allowRetest);

    if (!canAccess) {
      return NextResponse.json({
        error: reason,
        redirectTo: '/pricing'
      }, { status: 403 });
    }

    // Start the test (create test result)
    const { success, testResultId, error: startError } = await mockTestsService.startTest(supabase, user.id, Number(batchId), testNumber);
    console.log({
      success,
      testResultId,
      startError,
    });

    if (!success) {
      return NextResponse.json({ error: startError || 'Failed to start test' }, { status: 500 });
    }

    // Get questions for this test
    const settings = await settingsService.getAllSettings(supabase);
    const questions = await mockTestsService.getTestQuestions(supabase, Number(batchId), testNumber, settings.shuffle_questions);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this test' }, { status: 404 });
    }

    // Return test data
    return NextResponse.json({
      success: true,
      test: {
        testNumber,
        name: `Test ${testNumber}`,
        totalQuestions: questions.length,
        testResultId,
      },
      questions,
      batchId: Number(batchId),
    });
  } catch (error: any) {
    console.error("START API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}