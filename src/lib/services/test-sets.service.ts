// ============================================
// TERRAH PREP - TEST SETS SERVICE
// ============================================

import { supabase } from '@/lib/supabase/client';
import { settingsService } from '@/lib/services/settings.service';
import { TestSet, TestSetQuestion, UserTestAttempt, TestSetStats, Question, Category } from '@/types';

// ============================================
// TEST SETS SERVICE
// ============================================

export const testSetsService = {
  /**
   * Get all test sets for a batch
   */
  async getTestSetsByBatch(batchId: number): Promise<TestSet[]> {
    try {
      const { data, error } = await supabase
        .from('test_sets')
        .select('*, batch:batches(*)')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .order('set_number', { ascending: true });

      if (error) {
        console.error('Error fetching test sets:', error);
        return [];
      }

      return (data ?? []) as TestSet[];
    } catch (error) {
      console.error('Error fetching test sets:', error);
      return [];
    }
  },

  /**
   * Get a single test set with questions
   */
  async getTestSet(testSetId: number): Promise<TestSet | null> {
    try {
      const { data, error } = await supabase
        .from('test_sets')
        .select('*, batch:batches(*), test_set_questions(*, question:questions(*, category:categories(*)))')
        .eq('id', testSetId)
        .single();

      if (error || !data) {
        return null;
      }

      const testSet = data as any;
      return {
        ...testSet,
        questions: testSet.test_set_questions || [],
      };
    } catch (error) {
      console.error('Error fetching test set:', error);
      return null;
    }
  },

  /**
   * Get test set statistics for a batch
   */
  async getTestSetStats(batchId: number, userId: string): Promise<TestSetStats> {
    try {
      // Get settings
      const settings = await settingsService.getAllSettings();
      
      // Get total active questions for this batch
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId)
        .eq('is_active', true);

      const totalQuestionsCount = totalQuestions || 0;
      const questionsPerTest = settings.total_questions || 100;
      const totalAvailableTests = Math.floor(totalQuestionsCount / questionsPerTest);

      // Get completed attempts for this user
      const { data: completedAttempts } = await supabase
        .from('user_test_attempts')
        .select('test_set_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      // Get test sets for this batch to count only those belonging to this batch
      const { data: batchTestSets } = await supabase
        .from('test_sets')
        .select('id')
        .eq('batch_id', batchId);

      const batchTestSetIds = new Set((batchTestSets || []).map((ts: any) => ts.id));
      
      const completedTests = completedAttempts?.filter((attempt: any) => 
        batchTestSetIds.has(attempt.test_set_id)
      ).length || 0;

      // Get user's plan
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('subscription:subscriptions(plan:plans(*))')
        .eq('user_id', userId)
        .maybeSingle();

      const subscription = (usageData as any)?.subscription;
      const plan = subscription?.plan;
      const currentPlan = plan?.slug || 'free';

      return {
        totalQuestions: totalQuestionsCount,
        questionsPerTest: questionsPerTest,
        totalAvailableTests: totalAvailableTests,
        completedTests,
        remainingTests: totalAvailableTests - completedTests,
        currentPlan,
      };
    } catch (error) {
      console.error('Error fetching test set stats:', error);
      return {
        totalQuestions: 0,
        questionsPerTest: 100,
        totalAvailableTests: 0,
        completedTests: 0,
        remainingTests: 0,
        currentPlan: 'free',
      };
    }
  },

  /**
   * Get user's test attempt for a specific test set
   */
  async getUserTestAttempt(userId: string, testSetId: number): Promise<UserTestAttempt | null> {
    try {
      const { data, error } = await supabase
        .from('user_test_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('test_set_id', testSetId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as UserTestAttempt;
    } catch (error) {
      console.error('Error fetching user test attempt:', error);
      return null;
    }
  },

  /**
   * Start a test set (create attempt record)
   */
  async startTestSet(userId: string, testSetId: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already has an attempt
      const existingAttempt = await this.getUserTestAttempt(userId, testSetId);
      
      if (existingAttempt) {
        return { success: true }; // Already started
      }

      // Create new attempt
      const { error } = await supabase
        .from('user_test_attempts')
        .insert({
          user_id: userId,
          test_set_id: testSetId,
          started_at: new Date().toISOString(),
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to start test' };
    }
  },

  /**
   * Complete a test set
   */
  async completeTestSet(userId: string, testSetId: number, testResultId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_test_attempts')
        .update({
          completed_at: new Date().toISOString(),
          test_result_id: testResultId,
        })
        .eq('user_id', userId)
        .eq('test_set_id', testSetId)
        .is('completed_at', null);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to complete test' };
    }
  },

  /**
   * Check if user can access a test set
   */
  async canAccessTestSet(userId: string, testSetId: number, userPlan: string): Promise<{ canAccess: boolean; reason?: string }> {
    try {
      // Free plan users can only take 1 test
      if (userPlan === 'free') {
        const { data: completedAttempts } = await supabase
          .from('user_test_attempts')
          .select('id')
          .eq('user_id', userId)
          .not('completed_at', 'is', null);

        const completedCount = completedAttempts?.length || 0;
        
        if (completedCount >= 1) {
          return {
            canAccess: false,
            reason: 'You have completed your free mock test. Upgrade your plan to unlock the remaining tests.',
          };
        }
      }

      // Check if user has already completed this specific test
      const existingAttempt = await this.getUserTestAttempt(userId, testSetId);
      
      if (existingAttempt?.completed_at) {
        return {
          canAccess: false,
          reason: 'You have already completed this test.',
        };
      }

      return { canAccess: true };
    } catch (error) {
      return { canAccess: false, reason: 'Error checking access' };
    }
  },

  /**
   * Generate test sets for a batch (admin function)
   * This creates non-overlapping test sets from available questions
   */
  async generateTestSets(batchId: number): Promise<{ success: boolean; created: number; error?: string }> {
    try {
      // Get settings
      const settings = await settingsService.getAllSettings();
      const questionsPerTest = settings.total_questions;
      const questionsPerCategory = settings.questions_per_category || 0;

      // Get all active questions for this batch with categories
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*, category:categories(*)')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (questionsError || !questions || questions.length === 0) {
        return { success: false, created: 0, error: 'No questions found for this batch' };
      }

      // Group questions by category
      const questionsByCategory = questions.reduce((acc, q) => {
        const categoryId = q.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(q);
        return acc;
      }, {} as Record<number, any[]>);

      // Calculate how many complete test sets we can make
      const categoryIds = Object.keys(questionsByCategory).map(Number);
      const minQuestionsPerCategory = Math.min(...categoryIds.map(id => questionsByCategory[id].length));
      
      let totalTests: number;
      if (questionsPerCategory > 0) {
        // If questions_per_category is set, calculate based on that
        totalTests = Math.floor(minQuestionsPerCategory / questionsPerCategory);
      } else {
        // Otherwise, calculate based on total questions
        totalTests = Math.floor(questions.length / questionsPerTest);
      }

      if (totalTests === 0) {
        return { success: false, created: 0, error: 'Not enough questions to create test sets' };
      }

      // Delete existing test sets for this batch
      await supabase
        .from('test_sets')
        .delete()
        .eq('batch_id', batchId);

      // Create test sets
      const testSets = [];
      for (let i = 1; i <= totalTests; i++) {
        const { data: testSet, error: testSetError } = await supabase
          .from('test_sets')
          .insert({
            batch_id: batchId,
            set_number: i,
            name: `Test Set ${i}`,
            total_questions: questionsPerTest,
            is_active: true,
          })
          .select()
          .single();

        if (testSetError || !testSet) {
          console.error('Error creating test set:', testSetError);
          continue;
        }

        testSets.push(testSet);

        // Select questions for this test set
        const selectedQuestions: any[] = [];
        
        if (questionsPerCategory > 0) {
          // Select questions_per_category from each category
          for (const categoryId of categoryIds) {
            const categoryQuestions = questionsByCategory[categoryId];
            const startIndex = (i - 1) * questionsPerCategory;
            const endIndex = startIndex + questionsPerCategory;
            
            // Get questions for this test set (no overlap)
            const selected = categoryQuestions.slice(startIndex, endIndex);
            selectedQuestions.push(...selected);
          }
        } else {
          // Select questionsPerTest total questions without overlap
          const startIndex = (i - 1) * questionsPerTest;
          const endIndex = startIndex + questionsPerTest;
          selectedQuestions.push(...questions.slice(startIndex, endIndex));
        }

        // Insert test set questions
        const testSetQuestions = selectedQuestions.map((q, index) => ({
          test_set_id: testSet.id,
          question_id: q.id,
          question_order: index + 1,
        }));

        const { error: tsqError } = await supabase
          .from('test_set_questions')
          .insert(testSetQuestions);

        if (tsqError) {
          console.error('Error creating test set questions:', tsqError);
        }
      }

      return { success: true, created: testSets.length };
    } catch (error) {
      console.error('Error generating test sets:', error);
      return { success: false, created: 0, error: 'Failed to generate test sets' };
    }
  },
};