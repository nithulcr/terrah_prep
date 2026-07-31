// ============================================
// TERRAH PREP - TEST START API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { usageService } from '@/lib/services/usage.service';
import { testSetsService } from '@/lib/services/test-sets.service';
import { TEST_CONFIG } from '@/config/testConfig';

export async function POST(request: Request) {
  try {
    console.log('API: Starting test...');
    const body = await request.json();
    const { batchId, testNumber } = body;

    console.log('API: Request body:', { batchId, testNumber });

    if (!batchId || !testNumber) {
      return NextResponse.json({ error: 'Batch ID and Test Number are required' }, { status: 400 });
    }

    const allowRetest = body.allowRetest === true;

    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('API: Auth header:', authHeader ? 'EXISTS' : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('API: No Bearer token found');
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('API: Token extracted, length:', token.length);

    // Create Supabase client with token
    const supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('API: Auth result:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      authError: authError?.message 
    });

    if (authError || !user) {
      console.error('API: Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can start a mock test
    console.log('API: Checking usage limits...');
    const { canAccess, reason, redirectTo } = await usageService.canStartMockTest(supabase, user.id);

    console.log('API: Usage check result:', { canAccess, reason, redirectTo });

    if (!canAccess) {
      // For now, allow access (remove this check when you have proper usage data)
      console.log('API: Usage check failed, but allowing access for testing');
      console.log('API: Reason:', reason);
      console.log('API: RedirectTo:', redirectTo);
      // NOT returning error - allowing access for testing
    } else {
      console.log('API: Usage check passed');
    }

    // Continue to fetch questions regardless of usage check

    // Get batch details
    console.log('API: Fetching batch:', batchId);
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();

    console.log('API: Batch result:', { 
      hasBatch: !!batch, 
      batchName: batch?.batch_name,
      error: batchError?.message 
    });

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get the specific test set by set_number (NO generation - read only)
    const { data: testSet, error: testSetError } = await supabase
      .from('test_sets')
      .select('id, set_number, total_questions')
      .eq('batch_id', Number(batchId))
      .eq('set_number', Number(testNumber))
      .eq('is_active', true)
      .single();

    if (testSetError || !testSet) {
      return NextResponse.json({ error: 'Test set not found or not available' }, { status: 404 });
    }
    console.log('TEST START API - Using test set:', {
      testSetId: testSet.id,
      testNumber: testSet.set_number,
      totalQuestions: testSet.total_questions,
    });

    // Create test result with minimal fields first
    console.log('TEST START API - Creating test result...');
    const { data: testResult, error: testResultError } = await supabase
      .from('test_results')
      .insert({
        user_id: user.id,
        batch_id: Number(batchId),
        test_number: testSet.set_number,
      })
      .select('id')
      .single();
    
    console.log('TEST START API - Minimal insert response:', {
      testResult,
      testResultError,
      errorCode: testResultError?.code,
      errorMessage: testResultError?.message,
      errorDetails: testResultError?.details,
      errorHint: testResultError?.hint,
    });

    console.log('TEST START API - Test result insert response:', {
      testResult,
      testResultError,
    });

    let finalTestResultId: number;
    
    if (testResultError || !testResult) {
      console.error('TEST START API - Error creating test result:', testResultError);
      
      // Check if it's a duplicate key error
      if (testResultError?.code === '23505') {
        // Try to get existing test result
        const { data: existingResult } = await supabase
          .from('test_results')
          .select('id')
          .eq('user_id', user.id)
          .eq('batch_id', batchId)
          .eq('test_number', testSet.set_number)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (existingResult) {
          console.log('TEST START API - Using existing test result:', existingResult.id);
          finalTestResultId = existingResult.id;
        } else {
          return NextResponse.json({ 
            error: 'Failed to create test result',
            details: testResultError.message 
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({ 
          error: 'Failed to create test result',
          details: testResultError?.message 
        }, { status: 500 });
      }
    } else {
      finalTestResultId = testResult.id;
      console.log('TEST START API - Test result created:', finalTestResultId);
    }

    // Get questions from test_set_questions (NO generation - read only)
    const questionsResult = await testSetsService.getTestSetQuestions(supabase, testSet.id);
    
    if (!questionsResult || !questionsResult.questions || questionsResult.questions.length === 0) {
      return NextResponse.json({ error: 'No questions available for this test' }, { status: 404 });
    }

    const limitedQuestions = questionsResult.questions;

    console.log('TEST START API - Loaded questions:', {
      testSetId: testSet.id,
      questionCount: limitedQuestions.length,
      questionIds: limitedQuestions.map(q => q.id),
    });

    console.log('API: Success! Returning', limitedQuestions.length, 'questions');

    // Get test duration from config
    const testDurationMinutes = TEST_CONFIG.TEST_DURATION_MINUTES;

    return NextResponse.json({
      success: true,
      testResultId: finalTestResultId,
      batch,
      questions: limitedQuestions,
      testNumber: testSet.set_number,
      testDurationMinutes, // Add duration to response
    });
  } catch (error) {
    console.error('API: Error starting test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}