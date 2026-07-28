// ============================================
// TERRAH PREP - DYNAMIC MOCK TESTS SERVICE
// ============================================

import { settingsService } from '@/lib/services/settings.service';
import { TestSetStats, Question, Category } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface DynamicTest {
  testNumber: number;
  name: string;
  totalQuestions: number;
  status: 'available' | 'started' | 'completed' | 'locked';
  hasAttempted: boolean;
}

export interface CategoryQuestionCount {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  count: number;
}

// ============================================
// MOCK TESTS SERVICE
// ============================================

export const mockTestsService = {
  /**
   * Get available tests for a batch (dynamically calculated)
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

      // Get settings
      const settings = await settingsService.getAllSettings(supabase);
      console.log('Settings loaded:', settings);

      // Get all active questions for this batch grouped by category
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('category_id, category:categories(*)')
        .eq('batch_id', batchId)
        .eq('is_active', true);

      console.log('Query Result - Questions:', questions);
      console.log('Query Error - Questions:', questionsError);

      if (questionsError || !questions || questions.length === 0) {
        console.log('No questions found for batch');
        return {
          tests: [],
          stats: {
            totalQuestions: 0,
            questionsPerTest: settings.total_questions,
            totalAvailableTests: 0,
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
      console.log('Category Counts:', categoryCounts);

      // Get question counts per category from settings
      const categoryQuestionSettings: Record<string, number> = {
        english: settings.english_questions,
        science: settings.science_questions,
        'general-knowledge': settings.general_knowledge_questions,
        mathematics: settings.mathematics_questions,
        malayalam: settings.malayalam_questions,
      };

      console.log('Category Question Settings:', categoryQuestionSettings);

      // Calculate available tests based on each category
      const testCountsPerCategory: number[] = [];

      categoryCounts.forEach((catCount) => {
        const questionsNeeded = categoryQuestionSettings[catCount.categorySlug] || 0;
        console.log(`Category ${catCount.categorySlug}: count=${catCount.count}, needed=${questionsNeeded}`);
        
        if (questionsNeeded > 0) {
          const testsFromCategory = Math.floor(catCount.count / questionsNeeded);
          testCountsPerCategory.push(testsFromCategory);
          console.log(`  Tests from this category: ${testsFromCategory}`);
        }
      });

      // The minimum across all categories determines total available tests
      const totalAvailableTests = testCountsPerCategory.length > 0
        ? Math.min(...testCountsPerCategory)
        : 0;

      console.log('Total Available Tests:', totalAvailableTests);

      // Get user's completed tests for this batch
      const { data: completedResults, error: completedError } = await supabase
        .from('test_results')
        .select('test_number')
        .eq('user_id', userId)
        .eq('batch_id', batchId)
        .not('test_number', 'is', null);

      console.log('Query Result - Completed Results:', completedResults);
      console.log('Query Error - Completed Results:', completedError);

      const completedTestNumbers = new Set(
        (completedResults || []).map((r: any) => r.test_number)
      );

      const completedTests = completedTestNumbers.size;
      console.log('Completed Tests:', completedTests);

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
      console.log('Current Plan:', currentPlan);

      // Calculate accessible tests based on plan
      let maxAccessibleTests = totalAvailableTests;
      if (currentPlan === 'free') {
        maxAccessibleTests = Math.min(totalAvailableTests, 1);
      }

      console.log('Max Accessible Tests:', maxAccessibleTests);

      // Generate test list
      const tests: DynamicTest[] = [];
      for (let i = 1; i <= totalAvailableTests; i++) {
        const isCompleted = completedTestNumbers.has(i);
        const isLocked = i > maxAccessibleTests;

        let status: 'available' | 'started' | 'completed' | 'locked' = 'available';
        if (isLocked) {
          status = 'locked';
        } else if (isCompleted) {
          status = 'completed';
        }

        tests.push({
          testNumber: i,
          name: `Test ${i}`,
          totalQuestions: settings.total_questions,
          status,
          hasAttempted: isCompleted,
        });
      }

      const stats: TestSetStats = {
        totalQuestions: questions.length,
        questionsPerTest: settings.total_questions,
        totalAvailableTests,
        completedTests,
        remainingTests: totalAvailableTests - completedTests,
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
          questionsPerTest: 100,
          totalAvailableTests: 0,
          completedTests: 0,
          remainingTests: 0,
          currentPlan: 'free',
        },
        categoryCounts: [],
      };
    }
  },

  /**
   * Get questions for a specific test number using LIMIT/OFFSET per category
   */
  async getTestQuestions(
    supabase: SupabaseClient,
    batchId: number,
    testNumber: number,
    shuffleQuestions: boolean = true
  ): Promise<Question[]> {
    try {
      console.log('=== getTestQuestions ===');
      console.log('batchId:', batchId);
      console.log('testNumber:', testNumber);
      console.log('shuffleQuestions:', shuffleQuestions);

      const settings = await settingsService.getAllSettings(supabase);
      console.log('Settings loaded:', settings);

      // Get all active questions for this batch with categories
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*, category:categories(*)')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      console.log('Query Result - Questions count:', questions?.length);
      console.log('Query Error - Questions:', questionsError);

      if (questionsError || !questions || questions.length === 0) {
        console.log('No questions found for batch');
        return [];
      }

      // Group questions by category
      const questionsByCategory = new Map<number, any[]>();
      questions.forEach((q: any) => {
        const categoryId = q.category_id;
        if (!questionsByCategory.has(categoryId)) {
          questionsByCategory.set(categoryId, []);
        }
        questionsByCategory.get(categoryId)!.push(q);
      });

      console.log('Questions by category:', Array.from(questionsByCategory.entries()).map(([catId, qs]) => ({
        categoryId: catId,
        count: qs.length,
        categoryName: qs[0]?.category?.name
      })));

      // Get question counts per category from settings
      const categoryQuestionSettings: Record<string, number> = {
        english: settings.english_questions,
        science: settings.science_questions,
        'general-knowledge': settings.general_knowledge_questions,
        mathematics: settings.mathematics_questions,
        malayalam: settings.malayalam_questions,
      };

      console.log('Category Question Settings:', categoryQuestionSettings);

      // Calculate offset for this test number
      const offset = (testNumber - 1) * settings.total_questions;
      console.log('Global offset for test:', offset);

      // Select questions from each category using LIMIT/OFFSET
      const selectedQuestions: any[] = [];

      questionsByCategory.forEach((categoryQuestions, categoryId) => {
        const category = categoryQuestions[0]?.category;
        const categorySlug = category?.slug || 'unknown';
        const questionsPerCategory = categoryQuestionSettings[categorySlug] || 0;

        console.log(`Processing category ${categorySlug} (ID: ${categoryId}):`);
        console.log(`  Available questions: ${categoryQuestions.length}`);
        console.log(`  Questions per category: ${questionsPerCategory}`);

        if (questionsPerCategory > 0) {
          // Calculate offset within this category
          const categoryOffset = (testNumber - 1) * questionsPerCategory;
          const categoryLimit = questionsPerCategory;

          console.log(`  Category offset: ${categoryOffset}`);
          console.log(`  Category limit: ${categoryLimit}`);

          // Get questions for this test (no overlap between tests)
          const startIndex = categoryOffset;
          const endIndex = startIndex + categoryLimit;
          const categoryTestQuestions = categoryQuestions.slice(startIndex, endIndex);

          console.log(`  Selected questions: ${categoryTestQuestions.length}`);
          console.log(`  Start index: ${startIndex}, End index: ${endIndex}`);

          if (categoryTestQuestions.length === 0) {
            console.warn(`  WARNING: No questions selected for category ${categorySlug}!`);
            console.warn(`  This may cause the test to have fewer questions than expected.`);
            console.warn(`  Reason: Not enough questions in this category for test number ${testNumber}`);
          }

          selectedQuestions.push(...categoryTestQuestions);
        } else {
          console.log(`  Skipping category ${categorySlug} - questionsPerCategory is 0`);
        }
      });

      console.log(`Total selected questions: ${selectedQuestions.length}`);
      console.log(`Expected questions: ${settings.total_questions}`);

      if (selectedQuestions.length !== settings.total_questions) {
        console.warn(`WARNING: Selected ${selectedQuestions.length} questions but expected ${settings.total_questions}`);
      }

      // Shuffle questions if enabled
      if (shuffleQuestions) {
        console.log('Shuffling questions...');
        this.shuffleArray(selectedQuestions);
      }

      return selectedQuestions as Question[];
    } catch (error) {
      console.error('Error getting test questions:', error);
      return [];
    }
  },

  /**
   * Check if user can access a specific test
   */
  async canAccessTest(
    supabase: SupabaseClient,
    userId: string,
    batchId: number,
    testNumber: number
  ): Promise<{ canAccess: boolean; reason?: string }> {
    try {
      console.log('=== canAccessTest ===');
      console.log('userId:', userId);
      console.log('batchId:', batchId);
      console.log('testNumber:', testNumber);

      // Get user's plan
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('subscription:subscriptions(plan:plans(*))')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Query Result - Usage Data:', usageData);

      const subscription = (usageData as any)?.subscription;
      const plan = subscription?.plan;
      const userPlan = plan?.slug || 'free';
      console.log('User Plan:', userPlan);

      // Free plan users can only access Test 1
      if (userPlan === 'free' && testNumber > 1) {
        console.log('Access denied: Free plan user trying to access test > 1');
        return {
          canAccess: false,
          reason: 'You have completed your free mock test. Upgrade your plan to unlock the remaining tests.',
        };
      }

      // Check if user has already completed this test
      const { data: existingResult } = await supabase
        .from('test_results')
        .select('id')
        .eq('user_id', userId)
        .eq('batch_id', batchId)
        .eq('test_number', testNumber)
        .maybeSingle();

      console.log('Query Result - Existing Test Result:', existingResult);

      if (existingResult) {
        console.log('Access denied: Test already completed');
        return {
          canAccess: false,
          reason: 'You have already completed this test.',
        };
      }

      console.log('Access granted');
      return { canAccess: true };
    } catch (error) {
      console.error('Error checking test access:', error);
      return { canAccess: false, reason: 'Error checking access' };
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

      console.log('Insert Data:', {
        user_id: userId,
        batch_id: batchId,
        test_number: testNumber,
      });

      console.log('Query Result - Test Result:', testResult);
      console.log('Query Error - Test Result:', testResultError);

      if (testResultError) {
        console.error("Supabase Insert Error:", testResultError);
        console.error("Error details:", {
          message: testResultError.message,
          details: testResultError.details,
          hint: testResultError.hint,
          code: testResultError.code,
        });

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
   * Shuffle array in place (Fisher-Yates algorithm)
   */
  shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },
};