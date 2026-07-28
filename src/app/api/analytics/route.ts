// ============================================
// TERRAH PREP - ANALYTICS API
// ============================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage.service';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has analytics permission
    const { plan } = await usageService.getUserUsageWithPlan(supabase, user.id);
    
    if (!plan || !plan.allow_analytics) {
      return NextResponse.json(
        { error: 'Analytics are not available in your current plan. Please upgrade to Premium or Elite.' },
        { status: 403 }
      );
    }

    // Get all test results for the user
    const { data: testResults, error: testResultsError } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (testResultsError) {
      console.error('Error fetching test results:', testResultsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get all user answers with questions
    const { data: userAnswers, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('*, question:questions(*, category:categories(*))')
      .in('test_result_id', (testResults ?? []).map((r) => r.id));

    if (userAnswersError) {
      console.error('Error fetching user answers:', userAnswersError);
    }

    // Calculate analytics
    const totalTests = testResults?.length ?? 0;
    const totalQuestions = testResults?.reduce((sum, r) => sum + r.total_questions, 0) ?? 0;
    const totalCorrect = testResults?.reduce((sum, r) => sum + r.correct_answers, 0) ?? 0;
    const totalWrong = testResults?.reduce((sum, r) => sum + r.wrong_answers, 0) ?? 0;
    const totalSkipped = testResults?.reduce((sum, r) => sum + r.skipped_answers, 0) ?? 0;
    const averageScore = totalTests > 0 
      ? Math.round(testResults!.reduce((sum, r) => sum + r.percentage, 0) / totalTests)
      : 0;
    const highestScore = totalTests > 0 
      ? Math.max(...testResults!.map((r) => r.percentage))
      : 0;

    // Category-wise performance
    const categoryPerformance: Record<string, { total: number; correct: number; wrong: number; skipped: number }> = {};
    
    userAnswers?.forEach((answer: any) => {
      const categoryName = answer.question?.category?.name || 'Unknown';
      
      if (!categoryPerformance[categoryName]) {
        categoryPerformance[categoryName] = {
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
        };
      }
      
      categoryPerformance[categoryName].total++;
      
      if (answer.is_correct) {
        categoryPerformance[categoryName].correct++;
      } else if (answer.selected_option === null) {
        categoryPerformance[categoryName].skipped++;
      } else {
        categoryPerformance[categoryName].wrong++;
      }
    });

    // Calculate category accuracy
    const categoryAnalytics = Object.entries(categoryPerformance).map(([category, stats]) => ({
      category,
      total: stats.total,
      correct: stats.correct,
      wrong: stats.wrong,
      skipped: stats.skipped,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    // Difficulty analysis
    const difficultyPerformance: Record<string, { total: number; correct: number }> = {};
    
    userAnswers?.forEach((answer: any) => {
      const difficulty = answer.question?.difficulty || 'unknown';
      
      if (!difficultyPerformance[difficulty]) {
        difficultyPerformance[difficulty] = {
          total: 0,
          correct: 0,
        };
      }
      
      difficultyPerformance[difficulty].total++;
      
      if (answer.is_correct) {
        difficultyPerformance[difficulty].correct++;
      }
    });

    const difficultyAnalytics = Object.entries(difficultyPerformance).map(([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    // Recent performance trend (last 10 tests)
    const recentTests = (testResults ?? []).slice(0, 10).reverse();
    const performanceTrend = recentTests.map((result) => ({
      date: result.created_at,
      score: result.percentage,
    }));

    // Weak and strong areas
    const weakAreas = categoryAnalytics
      .filter((cat) => cat.accuracy < 50)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    const strongAreas = categoryAnalytics
      .filter((cat) => cat.accuracy >= 80)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    return NextResponse.json({
      overview: {
        totalTests,
        totalQuestions,
        totalCorrect,
        totalWrong,
        totalSkipped,
        averageScore,
        highestScore,
      },
      categoryAnalytics,
      difficultyAnalytics,
      performanceTrend,
      weakAreas,
      strongAreas,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}