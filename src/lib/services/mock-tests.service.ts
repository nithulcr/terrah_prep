// ============================================
// TERRAH PREP - MOCK TESTS SERVICE
// ============================================
// This service handles test availability and access control
// All question operations are handled by testSetsService
// ALL unlock logic is database-driven - NO hardcoded rules

import { TEST_CONFIG } from '@/config/testConfig';
import { testSetsService } from '@/lib/services/test-sets.service';
import { subscriptionService } from '@/lib/services/subscription.service';
import { testProgressService } from '@/lib/services/test-progress.service';
import { TestSetStats, DynamicTest } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CategoryQuestionCount {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  count: number;
}

export const mockTestsService = {
  /**
   * Get available tests for a batch
   * Reads from test_sets table - does NOT generate questions
   * ALL unlock logic is database-driven
   */
  async getAvailableTests(
    supabase: SupabaseClient,
    batchId: number,
    userId: string
  ): Promise<{
    tests: DynamicTest[];
    stats: TestSetStats;
    categoryCounts: CategoryQuestionCount[];
  }> {
    try {
      console.log('=== getAvailableTests ===');
      console.log('userId:', userId);
      console.log('batchId:', batchId);

      // Get questions per test from config
      const questionsPerTest = TEST_CONFIG.TOTAL_QUESTIONS;
      console.log('Questions per test (from config):', questionsPerTest);

      // Get all active questions for this batch
      console.log('MOCK TESTS QUERY: questions select active category counts - BEFORE', {
        batchId,
      });
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, category_id, category:categories(*)')
        .eq('batch_id', batchId)
        .eq('is_active', true);

      console.log('MOCK TESTS QUERY: questions select active category counts - AFTER', {
        rowCount: questions?.length ?? 0,
        error: questionsError,
      });

      if (questionsError) {
        console.error('MOCK TESTS QUERY ERROR: questions select active category counts', questionsError);
      }

      if (questionsError || !questions || questions.length === 0) {
        console.log('No questions found for batch');
        return {
          tests: [],
          stats: {
            totalQuestions: 0,
            questionsPerTest: questionsPerTest,
            totalAvailableTests: 0,
            availableTests: 0,
            completedTests: 0,
            remainingTests: 0,
            currentPlan: 'free',
          },
          categoryCounts: [],
        };
      }

      // Count questions per category
      const categoryCountsMap = new Map<number, CategoryQuestionCount>();
      questions.forEach((q: any) => {
        const categoryId = q.category_id;
        if (!categoryCountsMap.has(categoryId)) {
          categoryCountsMap.set(categoryId, {
            categoryId,
            categoryName: q.category?.name || 'Unknown',
            categorySlug: q.category?.slug || 'unknown',
            count: 0,
          });
        }
        categoryCountsMap.get(categoryId)!.count++;
      });

      const categoryCounts = Array.from(categoryCountsMap.values());

      // Get user's completed tests
      console.log('MOCK TESTS QUERY: test_results select completed tests - BEFORE', {
        batchId,
        userId,
      });
      const { data: completedResults, error: completedResultsError } = await supabase
        .from('test_results')
        .select('test_number, score, percentage, completed_at')
        .eq('user_id', userId)
        .eq('batch_id', batchId)
        .not('test_number', 'is', null)
        .order('test_number', { ascending: true });

      console.log('MOCK TESTS QUERY: test_results select completed tests - AFTER', {
        rowCount: completedResults?.length ?? 0,
        error: completedResultsError,
      });

      if (completedResultsError) {
        console.error('MOCK TESTS QUERY ERROR: test_results select completed tests', completedResultsError);
      }

      const completedTestMap = new Map(
        (completedResults || []).map((r: any) => [r.test_number, r])
      );

      const completedTests = completedTestMap.size;

      // Get user's subscription and plan from database
      console.log('MOCK TESTS QUERY: subscription service - BEFORE', {
        userId,
      });
      const subscriptionInfo = await subscriptionService.getUserSubscription(supabase, userId);
      
      console.log('MOCK TESTS QUERY: subscription service - AFTER', {
        plan: subscriptionInfo.plan?.slug,
        subscriptionActive: !!subscriptionInfo.subscription,
      });

      const plan = subscriptionInfo.plan;
      const summary = subscriptionInfo.summary;
      
      // Determine current plan
      const currentPlan = plan?.slug || 'free';
      console.log('Current Plan:', currentPlan);

      // Get total available tests from test_sets table (SOURCE OF TRUTH)
      const { count: totalAvailableTests, error: testSetCountError } = await testSetsService.getTestSetCount(supabase, batchId);

      if (testSetCountError) {
        console.error('MOCK TESTS QUERY ERROR: test_sets active count', testSetCountError);
      }

      console.log('Total available tests (from test_sets):', totalAvailableTests);

      // ============================================
      // NEW UNLOCK LOGIC - FULLY DATABASE-DRIVEN
      // ============================================
      
      // Get monthly limit from database
      const monthlyLimit = plan?.monthly_mock_test_limit;
      
      // Calculate available tests based on plan limits
      // availableTests = MIN(generated tests, monthly limit)
      let availableTests = totalAvailableTests || 0;
      
      if (monthlyLimit !== null && monthlyLimit !== undefined && monthlyLimit > 0) {
        // Paid plan: limit by monthly_mock_test_limit
        availableTests = Math.min(availableTests, monthlyLimit);
        console.log('Paid plan - Available tests:', availableTests, '(MIN of', totalAvailableTests, 'and', monthlyLimit, ')');
      } else {
        // Free plan: only 1 test total
        availableTests = Math.min(availableTests, 1);
        console.log('Free plan - Available tests:', availableTests, '(MIN of', totalAvailableTests, 'and 1)');
      }

      console.log('Final available tests:', availableTests);

      // Check if user has remaining monthly quota
      const hasRemainingQuota = !monthlyLimit || (summary && summary.tests_this_month < monthlyLimit);
      console.log('Has remaining quota:', hasRemainingQuota, 'Tests this month:', summary?.tests_this_month, 'Limit:', monthlyLimit);

      // Generate test list with progress tracking
      // Show ALL tests (up to 30), but mark as locked if beyond user's limit
      const tests: DynamicTest[] = [];
      const maxTestsToShow = Math.min(totalAvailableTests || 0, 30); // Show max 30 tests
      
      for (let i = 1; i <= maxTestsToShow; i++) {
        const completedResult = completedTestMap.get(i);
        const isCompleted = !!completedResult;

        // Get test progress for in_progress detection
        const testProgress = await testProgressService.getTestProgress(supabase, userId, batchId, i);
        const isInProgress = !isCompleted && testProgress && testProgress.status === 'in_progress';

        // Determine test status
        // For paid plans: unlock sequentially (test 1, then test 2, etc.)
        // For free plan: only test 1 is available
        let status: 'available' | 'in_progress' | 'completed' | 'locked';
        
        if (isCompleted) {
          status = 'completed';
        } else if (isInProgress) {
          status = 'in_progress';
        } else if (i <= availableTests) {
          // Test is within user's available limit
          status = 'available';
        } else {
          // Test is beyond user's limit
          status = 'locked';
        }

        tests.push({
          testNumber: i,
          name: `Test ${i}`,
          totalQuestions: questionsPerTest,
          status,
          hasAttempted: Boolean(isCompleted || isInProgress),
          completedAt: completedResult?.completed_at || undefined,
          score: completedResult?.score || undefined,
          percentage: completedResult?.percentage || undefined,
          attemptNumber: completedResult?.attempt_number || testProgress?.attemptNumber || 1,
        });
      }

      const remainingTests = Math.max(0, availableTests - completedTests);
      
      const stats: TestSetStats = {
        // Show questions based on user's plan limit, not total in database
        totalQuestions: availableTests * questionsPerTest,
        questionsPerTest: questionsPerTest,
        // Show user's plan limit, not total generated tests
        totalAvailableTests: availableTests,
        availableTests, // Add this so frontend knows how many tests to show
        completedTests,
        remainingTests,
        currentPlan,
      };

      console.log('Returning stats:', stats);
        console.log('Returning tests count:', tests.length);

      return {
        tests,
        stats,
        categoryCounts,
      };
    } catch (error) {
      console.error('Error getting available tests:', error);
      return {
        tests: [],
        stats: {
          totalQuestions: 0,
          questionsPerTest: 0,
          totalAvailableTests: 0,
          availableTests: 0,
          completedTests: 0,
          remainingTests: 0,
          currentPlan: 'free',
        },
        categoryCounts: [],
      };
    }
  },

  /**
   * Start a test (create test result with test_number)
   */
  async startTest(
    supabase: SupabaseClient,
    userId: string,
    batchId: number,
    testNumber: number
  ): Promise<{ success: boolean; testResultId?: number; error?: string }> {
    try {
      console.log('=== startTest ===');
      console.log('userId:', userId);
      console.log('batchId:', batchId);
      console.log('testNumber:', testNumber);

      // Create test result with test_number
      const { data: testResult, error: testResultError } = await supabase
        .from('test_results')
        .insert({
          user_id: userId,
          batch_id: batchId,
          test_number: testNumber,
          score: 0,
          total_questions: 0,
          correct_answers: 0,
          wrong_answers: 0,
          skipped_answers: 0,
          time_taken_seconds: 0,
          negative_marks: 0,
          percentage: 0,
        })
        .select('id')
        .single();

      if (testResultError) {
        console.error("Supabase Insert Error:", testResultError);
        return {
          success: false,
          error: testResultError.message,
        };
      }

      if (!testResult) {
        console.error("No test result returned from insert");
        return {
          success: false,
          error: "No test result returned",
        };
      }

      console.log('Test started successfully, testResultId:', testResult.id);
      return { success: true, testResultId: testResult.id };
    } catch (error) {
      console.error('Error starting test:', error);
      return { success: false, error: 'Failed to start test' };
    }
  },

  /**
   * Check if user can access a specific test
   * Uses database limits - NO hardcoded checks
   */
  async canAccessTest(
    supabase: SupabaseClient,
    userId: string,
    batchId: number,
    testNumber: number,
    allowRetest: boolean = false
  ): Promise<{ canAccess: boolean; reason?: string }> {
    try {
      console.log('=== canAccessTest ===');
      console.log('userId:', userId);
      console.log('batchId:', batchId);
      console.log('testNumber:', testNumber);
      console.log('allowRetest:', allowRetest);

      // Check if test set exists
      const { data: testSet, error: testSetError } = await supabase
        .from('test_sets')
        .select('id')
        .eq('batch_id', batchId)
        .eq('set_number', testNumber)
        .eq('is_active', true)
        .maybeSingle();

      if (testSetError || !testSet) {
        console.log('Test set does not exist');
        return {
          canAccess: false,
          reason: 'This test is not available yet.',
        };
      }

      console.log('Test set found:', testSet.id);

      // Get user's subscription info
      const subscriptionInfo = await subscriptionService.getUserSubscription(supabase, userId);
      const plan = subscriptionInfo.plan;
      const summary = subscriptionInfo.summary;

      // Get monthly limit from database
      const monthlyLimit = plan?.monthly_mock_test_limit;
      
      // Get total available tests
      const { count: totalAvailableTests } = await testSetsService.getTestSetCount(supabase, batchId);
      
      // Calculate available tests
      let availableTests = totalAvailableTests || 0;
      if (monthlyLimit !== null && monthlyLimit !== undefined && monthlyLimit > 0) {
        availableTests = Math.min(availableTests, monthlyLimit);
      } else {
        // Free plan: use lifetime limit
        const lifetimeLimit = plan?.lifetime_question_limit || summary?.lifetime_question_limit || 0;
        const questionsPerTest = TEST_CONFIG.TOTAL_QUESTIONS;
        const testsFromLifetimeLimit = lifetimeLimit > 0 ? Math.floor(lifetimeLimit / questionsPerTest) : 1;
        availableTests = Math.min(availableTests, testsFromLifetimeLimit);
      }

      console.log('Available tests:', availableTests);

      // Check if test is unlocked
      if (testNumber > availableTests) {
        console.log('Access denied: Test is locked');
        return {
          canAccess: false,
          reason: 'This test is not available for your plan.',
        };
      }

      // Check if user has remaining monthly quota
      const hasRemainingQuota = !monthlyLimit || (summary && summary.tests_this_month < monthlyLimit);
      if (!hasRemainingQuota) {
        console.log('Access denied: Monthly limit reached');
        return {
          canAccess: false,
          reason: 'Monthly mock test limit reached. Upgrade or wait for next month.',
        };
      }

      // Check if user has already completed this test (and not retesting)
      if (!allowRetest) {
        const { data: existingResult } = await supabase
          .from('test_results')
          .select('id')
          .eq('user_id', userId)
          .eq('batch_id', batchId)
          .eq('test_number', testNumber)
          .maybeSingle();

        if (existingResult) {
          console.log('Access denied: Test already completed');
          return {
            canAccess: false,
            reason: 'You have already completed this test.',
          };
        }
      }

      console.log('Access granted');
      return { canAccess: true };
    } catch (error) {
      console.error('Error checking test access:', error);
      return { canAccess: false, reason: 'Error checking access' };
    }
  },
};