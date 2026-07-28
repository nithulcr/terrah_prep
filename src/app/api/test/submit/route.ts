// ============================================
// TERRAH PREP - TEST SUBMIT API
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { usageService } from '@/lib/services/usage.service';

export async function POST(request: Request) {
  try {
    console.log('API: Submitting test...');
    const body = await request.json();
    const { batchId, answers, timeTakenSeconds } = body;

    if (!batchId || !answers) {
      return NextResponse.json({ error: 'Batch ID and answers are required' }, { status: 400 });
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

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get all questions for this batch
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('batch_id', batchId)
      .eq('is_active', true);

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this batch' }, { status: 404 });
    }

    // Calculate results
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;
    let totalMarks = 0;
    let negativeMarks = 0;

    const userAnswers: any[] = [];

    for (const question of questions) {
      const selectedOption = answers[question.id] || null;
      const isCorrect = selectedOption === question.correct_option;

      if (selectedOption === null) {
        skippedAnswers++;
      } else if (isCorrect) {
        correctAnswers++;
        totalMarks += Number(question.marks);
      } else {
        wrongAnswers++;
        totalMarks += Number(question.marks);
        negativeMarks += Number(question.negative_marks);
      }

      userAnswers.push({
        question_id: question.id,
        selected_option: selectedOption,
        is_correct: isCorrect,
        time_taken_seconds: 0, // Could be tracked per question in future
      });
    }

    const score = correctAnswers;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    // Create test result
    const { data: testResult, error: testResultError } = await supabase
      .from('test_results')
      .insert({
        user_id: user.id,
        batch_id: batchId,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        skipped_answers: skippedAnswers,
        time_taken_seconds: timeTakenSeconds || 0,
        negative_marks: negativeMarks,
        percentage,
      })
      .select()
      .single();

    if (testResultError || !testResult) {
      console.error('Error creating test result:', testResultError);
      return NextResponse.json({ error: 'Failed to save test result' }, { status: 500 });
    }

    // Create user answers
    const answersToInsert = userAnswers.map((answer) => ({
      test_result_id: testResult.id,
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
    await usageService.incrementUsage(user.id, {
      questions: totalQuestions,
      tests: 1,
    });

    // Fetch user answers with questions for detailed results
    const { data: userAnswersData, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('*, question:questions(*, category:categories(*))')
      .eq('test_result_id', testResult.id)
      .order('question_id', { ascending: true });

    const userAnswersWithQuestions = userAnswersData || [];

    return NextResponse.json({
      success: true,
      result: {
        id: testResult.id,
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        timeTakenSeconds: timeTakenSeconds || 0,
        negativeMarks,
        percentage,
        questions: userAnswersWithQuestions,
      },
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}