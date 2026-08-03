// ============================================
// Terrah Qbank - TEST PROGRESS SERVICE
// ============================================
// Handles test progress, resume, and retest functionality

import { SupabaseClient } from '@supabase/supabase-js';

export interface TestProgress {
  testResultId: number;
  userId: string;
  batchId: number;
  testNumber: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  answers: Record<number, string>;
  bookmarks: number[];
  reviewFlags: number[];
  currentQuestionIndex: number;
  timeRemaining: number;
  startedAt: string;
  completedAt?: string;
  attemptNumber: number;
}

export const testProgressService = {
  /**
   * Get test progress for resuming
   */
  async getTestProgress(supabase: SupabaseClient, userId: string, batchId: number, testNumber: number): Promise<TestProgress | null> {
    try {
      const { data: testResult, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId)
        .eq('batch_id', batchId)
        .eq('test_number', testNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !testResult) {
        return null;
      }

      // Determine status
      let status: TestProgress['status'] = 'not_started';
      if (testResult.completed_at) {
        status = 'completed';
      } else if (testResult.started_at) {
        status = 'in_progress';
      }

      return {
        testResultId: testResult.id,
        userId: testResult.user_id,
        batchId: testResult.batch_id,
        testNumber: testResult.test_number,
        status,
        answers: testResult.answers || {},
        bookmarks: testResult.bookmarks || [],
        reviewFlags: testResult.review_flags || [],
        currentQuestionIndex: testResult.current_question_index || 0,
        timeRemaining: testResult.time_remaining || 0,
        startedAt: testResult.started_at,
        completedAt: testResult.completed_at || undefined,
        attemptNumber: testResult.attempt_number || 1,
      };
    } catch (error) {
      console.error('Error getting test progress:', error);
      return null;
    }
  },

  /**
   * Save test progress
   */
  async saveTestProgress(supabase: SupabaseClient, progress: Partial<TestProgress>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('test_results')
        .update({
          answers: progress.answers,
          bookmarks: progress.bookmarks,
          review_flags: progress.reviewFlags,
          current_question_index: progress.currentQuestionIndex,
          time_remaining: progress.timeRemaining,
        })
        .eq('id', progress.testResultId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving test progress:', error);
      return { success: false, error: 'Failed to save progress' };
    }
  },

  /**
   * Get attempt history for a test
   */
  async getAttemptHistory(supabase: SupabaseClient, userId: string, batchId: number, testNumber: number): Promise<TestProgress[]> {
    try {
      const { data: attempts, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId)
        .eq('batch_id', batchId)
        .eq('test_number', testNumber)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error || !attempts) {
        return [];
      }

      return attempts.map((attempt) => ({
        testResultId: attempt.id,
        userId: attempt.user_id,
        batchId: attempt.batch_id,
        testNumber: attempt.test_number,
        status: 'completed' as const,
        answers: attempt.answers || {},
        bookmarks: attempt.bookmarks || [],
        reviewFlags: attempt.review_flags || [],
        currentQuestionIndex: attempt.current_question_index || 0,
        timeRemaining: attempt.time_remaining || 0,
        startedAt: attempt.started_at,
        completedAt: attempt.completed_at,
        attemptNumber: attempt.attempt_number || 1,
      }));
    } catch (error) {
      console.error('Error getting attempt history:', error);
      return [];
    }
  },

  /**
   * Get performance stats for a test
   */
  async getPerformanceStats(supabase: SupabaseClient, userId: string, batchId: number, testNumber: number): Promise<{
    averageScore: number;
    highestScore: number;
    attempts: number;
    bestTime: number;
    accuracy: number;
  }> {
    try {
      const { data: attempts, error } = await supabase
        .from('test_results')
        .select('score, percentage, time_taken_seconds, total_questions')
        .eq('user_id', userId)
        .eq('batch_id', batchId)
        .eq('test_number', testNumber)
        .not('completed_at', 'is', null);

      if (error || !attempts || attempts.length === 0) {
        return {
          averageScore: 0,
          highestScore: 0,
          attempts: 0,
          bestTime: 0,
          accuracy: 0,
        };
      }

      const scores = attempts.map(a => a.percentage || 0);
      const times = attempts.map(a => a.time_taken_seconds || 0);
      const totalCorrect = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
      const totalQuestions = attempts.reduce((sum, a) => sum + (a.total_questions || 0), 0);

      return {
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        highestScore: Math.max(...scores),
        attempts: attempts.length,
        bestTime: Math.min(...times),
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      };
    } catch (error) {
      console.error('Error getting performance stats:', error);
      return {
        averageScore: 0,
        highestScore: 0,
        attempts: 0,
        bestTime: 0,
        accuracy: 0,
      };
    }
  },
};