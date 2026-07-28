// ============================================
// TERRAH PREP - TEST SETS SERVICE
// ============================================

import { settingsService } from '@/lib/services/settings.service';
import { TestSet, TestSetQuestion, UserTestAttempt, TestSetStats, Question, Category } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TEST SETS SERVICE
// ============================================

export const testSetsService = {
  /**
   * Get all test sets for a batch
   */
  async getTestSetsByBatch(supabase: SupabaseClient, batchId: number): Promise<TestSet[]> {
    try {
      console.log('=== getTestSetsByBatch ===');
      console.log('batchId:', batchId);

      const { data, error } = await supabase
        .from('test_sets')
        .select('*, batch:batches(*)')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .order('set_number', { ascending: true });

      console.log('Query Result - Test Sets:', data?.length);
      console.log('Query Error - Test Sets:', error);

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
  async getTestSet(supabase: SupabaseClient, testSetId: number): Promise<TestSet | null> {
    try {
      console.log('=== getTestSet ===');
      console.log('testSetId:', testSetId);

      const { data, error } = await supabase
        .from('test_sets')
        .select('*, batch:batches(*), test_set_questions(*, question:questions(*, category:categories(*)))')
        .eq('id', testSetId)
        .single();

      console.log('Query Result - Test Set:', data ? 'FOUND' : 'NOT FOUND');
      console.log('Query Error - Test Set:', error);

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
  async getTestSetStats(supabase: SupabaseClient, batchId: number, userId: string): Promise<TestSetStats> {
    try {
      console.log('=== getTestSetStats ===');
      console.log('batchId:', batchId);
      console.log('userId:', userId);

      // Get settings
      const settings = await settingsService.getAllSettings(supabase);
      
      // Get total active questions for this batch
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId)
        .eq('is_active', true);

      console.log('Query Result - Total Questions:', totalQuestions);

      const totalQuestionsCount = totalQuestions || 0;
      const questionsPerTest = settings.total_questions || 100;
      const totalAvailableTests = Math.floor(totalQuestionsCount / questionsPerTest);

      // Get completed attempts for this user
      const { data: completedAttempts } = await supabase
        .from('user_test_attempts')
        .select('test_set_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      console.log('Query Result - Completed Attempts:', completedAttempts?.length);

      // Get test sets for this batch to count only those belonging to this batch
      const { data: batchTestSets } = await supabase
        .from('test_sets')
        .select('id')
        .eq('batch_id', batchId);

      console.log('Query Result - Batch Test Sets:', batchTestSets?.length);

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

      console.log('Query Result - Usage Data:', usageData);

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
  async getUserTestAttempt(supabase: SupabaseClient, userId: string, testSetId: number): Promise<UserTestAttempt | null> {
    try {
      console.log('=== getUserTestAttempt ===');
      console.log('userId:', userId);
      console.log('testSetId:', testSetId);

      const { data, error } = await supabase
        .from('user_test_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('test_set_id', testSetId)
        .maybeSingle();

      console.log('Query Result - User Test Attempt:', data ? 'FOUND' : 'NOT FOUND');
      console.log('Query Error:', error);

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
  async startTestSet(supabase: SupabaseClient, userId: string, testSetId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('=== startTestSet ===');
      console.log('userId:', userId);
      console.log('testSetId:', testSetId);

      // Check if user already has an attempt
      const existingAttempt = await this.getUserTestAttempt(supabase, userId, testSetId);
      
      if (existingAttempt) {
        console.log('User already has an attempt, returning success');
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

      console.log('Query Error - Start Test Set:', error);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error starting test set:', error);
      return { success: false, error: 'Failed to start test' };
    }
  },

  /**
   * Complete a test set
   */
  async completeTestSet(supabase: SupabaseClient, userId: string, testSetId: number, testResultId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('=== completeTestSet ===');
      console.log('userId:', userId);
      console.log('testSetId:', testSetId);
      console.log('testResultId:', testResultId);

      const { error } = await supabase
        .from('user_test_attempts')
        .update({
          completed_at: new Date().toISOString(),
          test_result_id: testResultId,
        })
        .eq('user_id', userId)
        .eq('test_set_id', testSetId)
        .is('completed_at', null);

      console.log('Query Error - Complete Test Set:', error);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing test set:', error);
      return { success: false, error: 'Failed to complete test' };
    }
  },

  /**
   * Check if user can access a test set
   */
  async canAccessTestSet(supabase: SupabaseClient, userId: string, testSetId: number, userPlan: string): Promise<{ canAccess: boolean; reason?: string }> {
    try {
      console.log('=== canAccessTestSet ===');
      console.log('userId:', userId);
      console.log('testSetId:', testSetId);
      console.log('userPlan:', userPlan);

      // Free plan users can only take 1 test
      if (userPlan === 'free') {
        const { data: completedAttempts } = await supabase
          .from('user_test_attempts')
          .select('id')
          .eq('user_id', userId)
          .not('completed_at', 'is', null);

        console.log('Query Result - Completed Attempts:', completedAttempts?.length);

        const completedCount = completedAttempts?.length || 0;
        
        if (completedCount >= 1) {
          console.log('Access denied: Free plan user has completed 1 test');
          return {
            canAccess: false,
            reason: 'You have completed your free mock test. Upgrade your plan to unlock the remaining tests.',
          };
        }
      }

      // Check if user has already completed this specific test
      const existingAttempt = await this.getUserTestAttempt(supabase, userId, testSetId);
      
      if (existingAttempt?.completed_at) {
        console.log('Access denied: Test already completed');
        return {
          canAccess: false,
          reason: 'You have already completed this test.',
        };
      }

      console.log('Access granted');
      return { canAccess: true };
    } catch (error) {
      console.error('Error checking access:', error);
      return { canAccess: false, reason: 'Error checking access' };
    }
  },

  /**
   * Generate test sets for a batch (admin function)
   * This creates non-overlapping test sets from available questions
   */
  async generateTestSets(supabase: SupabaseClient, batchId: number): Promise<{ success: boolean; created: number; error?: string }> {
    try {
      console.log('=== generateTestSets ===');
      console.log('batchId:', batchId);

      // Get settings
      const settings = await settingsService.getAllSettings(supabase);
      const questionsPerTest = settings.total_questions;
      const questionsPerCategory = settings.questions_per_category || 0;

      // Get all active questions for this batch with categories
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*, category:categories(*)')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      console.log('Query Result - Questions:', questions?.length);
      console.log('Query Error - Questions:', questionsError);

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

      console.log('Total tests that can be generated:', totalTests);

      if (totalTests === 0) {
        return { success: false, created: 0, error: 'Not enough questions to create test sets' };
      }

      // Delete existing test sets for this batch
      console.log('Deleting existing test sets for batch:', batchId);
      const { error: deleteError } = await supabase
        .from('test_sets')
        .delete()
        .eq('batch_id', batchId);

      console.log('Query Error - Delete Test Sets:', deleteError);

      // Create test sets
      const testSets = [];
      for (let i = 1; i <= totalTests; i++) {
        console.log(`Creating test set ${i} of ${totalTests}...`);
        
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

        console.log('Query Result - Test Set:', testSet ? 'CREATED' : 'FAILED');
        console.log('Query Error - Create Test Set:', testSetError);

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

        console.log(`Inserting ${testSetQuestions.length} questions for test set ${i}...`);
        
        const { error: tsqError } = await supabase
          .from('test_set_questions')
          .insert(testSetQuestions);

        console.log('Query Error - Insert Test Set Questions:', tsqError);

        if (tsqError) {
          console.error('Error creating test set questions:', tsqError);
        }
      }

      console.log(`Successfully created ${testSets.length} test sets`);
      return { success: true, created: testSets.length };
    } catch (error) {
      console.error('Error generating test sets:', error);
      return { success: false, created: 0, error: 'Failed to generate test sets' };
    }
  },
};