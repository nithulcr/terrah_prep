// ============================================
// TERRAH PREP - TEST SUBMIT API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { usageService } from '@/lib/services/usage.service';
import { TEST_CONFIG } from '@/config/testConfig';

export async function POST(request: Request) {
  try {
    console.log('API: Submitting test...');
    const body = await request.json();
    const { testResultId, answers, questionIds, timeTakenSeconds } = body;

    if (!testResultId || !questionIds) {
      return NextResponse.json({ error: 'Test Result ID and questionIds are required' }, { status: 400 });
    }

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

    // Get test result to find batch_id
    const { data: testResult, error: testResultError } = await supabase
      .from('test_results')
      .select('*')
      .eq('id', testResultId)
      .single();

    if (testResultError || !testResult) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }

    const batchId = testResult.batch_id;

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get questions using questionIds from request body
    // This is the ONLY source - questions that were actually sent to the user
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);

    if (questionsError || !questions || questions.length === 0) {
      console.error('SUBMIT API - No questions found for questionIds:', questionIds);
      return NextResponse.json(
        { error: 'No questions found for this test' },
        { status: 404 }
      );
    }

    console.log('SUBMIT API - Question Count:', {
      questionIdsCount: questionIds.length,
      questionsFetched: questions.length,
      questionIds: questionIds,
    });

    // Calculate results
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;
    let earnedMarks = 0;
    let negativeMarks = 0;

    const userAnswers: any[] = [];

    for (const question of questions) {
      const selectedOption = answers[question.id] || null;
      const isCorrect = selectedOption === question.correct_option;

      if (selectedOption === null) {
        skippedAnswers++;
      } else if (isCorrect) {
        correctAnswers++;
        earnedMarks++; // 1 mark for every correct answer
      } else {
        wrongAnswers++;
        negativeMarks += TEST_CONFIG.NEGATIVE_MARK;
      }

      userAnswers.push({
        question_id: question.id,
        selected_option: selectedOption,
        is_correct: isCorrect,
        time_taken_seconds: 0, // Could be tracked per question in future
      });
    }

    const finalMarks = earnedMarks - negativeMarks;
    const totalQuestions = questions.length; // Use actual questions fetched, not questionIds count

    console.log('SUBMIT API - Results Calculated:', {
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      skippedAnswers,
      earnedMarks,
      negativeMarks,
      finalMarks,
      percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    });
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    // Update test result with scores and mark as completed
    console.log('SUBMIT API - Updating test result:', { testResultId });

    // First try to update with earned_marks and final_marks
    let updateData: any = {
      score: correctAnswers,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      skipped_answers: skippedAnswers,
      time_taken_seconds: timeTakenSeconds || 0,
      negative_marks: negativeMarks,
      earned_marks: earnedMarks,
      final_marks: finalMarks,
      percentage,
      completed_at: new Date().toISOString(), // Mark as completed
    };

    let { data: updatedTestResult, error: updateError } = await supabase
      .from('test_results')
      .update(updateData)
      .eq('id', testResultId)
      .select()
      .single();

    // If update fails due to missing columns, retry without earned_marks and final_marks
    if (updateError && (updateError.message?.includes('earned_marks') || updateError.message?.includes('final_marks'))) {
      console.warn('Migration not complete, retrying without earned_marks and final_marks');
      updateData = {
        score: correctAnswers,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        skipped_answers: skippedAnswers,
        time_taken_seconds: timeTakenSeconds || 0,
        negative_marks: negativeMarks,
        percentage,
        completed_at: new Date().toISOString(),
      };

      const retryResult = await supabase
        .from('test_results')
        .update(updateData)
        .eq('id', testResultId)
        .select()
        .single();

      updatedTestResult = retryResult.data;
      updateError = retryResult.error;
    }

    console.log('SUBMIT API - Update result:', {
      updatedTestResult,
      updateError,
      hasError: !!updateError,
      hasResult: !!updatedTestResult,
    });

    if (updateError) {
      console.error("UPDATE ERROR - Full details:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });

      return NextResponse.json(
        {
          error: "Failed to save test result",
          databaseError: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        },
        { status: 500 }
      );
    }

    if (!updatedTestResult) {
      console.error("UPDATE ERROR - No result returned");
      return NextResponse.json(
        {
          error: "Failed to save test result",
          message: "No data returned after update",
        },
        { status: 500 }
      );
    }

    // Create user answers
    const answersToInsert = userAnswers.map((answer) => ({
      test_result_id: testResultId,
      ...answer,
    }));

    const { error: answersError } = await supabase
      .from('user_answers')
      .insert(answersToInsert);

    if (answersError) {
      console.error('Error saving user answers:', answersError);
      // Continue anyway, test result is saved
    }

    // Increment usage counters
    await usageService.incrementUsage(supabase, user.id, {
      questions: totalQuestions,
      tests: 1,
    });

    // Fetch user answers with questions for detailed results
    const { data: userAnswersData, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('*, question:questions(*, category:categories(*))')
      .eq('test_result_id', testResultId)
      .order('question_id', { ascending: true });

    const userAnswersWithQuestions = userAnswersData || [];

    return NextResponse.json({
      success: true,
      result: {
        id: testResultId,
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        earnedMarks,
        negativeMarks,
        finalMarks,
        timeTakenSeconds: timeTakenSeconds || 0,
        percentage,
        questions: userAnswersWithQuestions,
        flaggedQuestions: userAnswersWithQuestions
          .filter((ua: any) => ua.is_correct === false && ua.selected_option !== null)
          .map((ua: any) => ua.question),
      },
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}