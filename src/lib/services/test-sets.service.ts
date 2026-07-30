// ============================================
// TERRAH PREP - TEST SETS SERVICE (SINGLE SOURCE OF TRUTH)
// ============================================
// This is the ONLY service that should handle question assignment
// All question generation happens ONCE during admin "Generate Test Sets"
// No runtime question generation

import { SupabaseClient } from '@supabase/supabase-js';
import { settingsService } from '@/lib/services/settings.service';
import { Batch, Question } from '@/types';

export interface TestSet {
  id: number;
  batch_id: number;
  set_number: number;
  name: string;
  total_questions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestSetQuestion {
  id: number;
  test_set_id: number;
  question_id: number;
  question_order: number;
  created_at: string;
}

export interface TestSetGenerationResult {
  success: boolean;
  testSetsCreated: number;
  questionsAssigned: number;
  error?: string;
}

export interface TestSetWithQuestions {
  testSet: TestSet;
  questions: Question[];
}

export const testSetsService = {
  /**
   * Generate test sets for a batch
   * ADMIN ONLY - Called when admin clicks "Generate Test Sets"
   * 
   * Process:
   * 1. Load all active questions for batch
   * 2. Shuffle ONCE
   * 3. Assign sequentially to test sets
   * 4. Store in test_sets and test_set_questions
   * 5. Verify NO duplicates
   * 
   * Example:
   * 40 questions, 10 per test
   * Shuffle once → [5, 23, 1, 40, 15, ...]
   * Test 1: indices 0-9 (questions [5, 23, 1, 40, 15, ...])
   * Test 2: indices 10-19
   * Test 3: indices 20-29
   * Test 4: indices 30-39
   */
  async generateTestSetsForBatch(
    supabase: SupabaseClient,
    batchId: number
  ): Promise<TestSetGenerationResult> {
    try {
      
      console.log('========================================');
      console.log('GENERATE TEST SETS');
      console.log('========================================');
      console.log('batchId:', batchId);

      // Get settings
      await settingsService.refreshSettings(supabase);

      const settings = await settingsService.getAllSettings(supabase);

      const questionsPerTest = Number(settings.total_questions);

      console.log({
        totalQuestionsSetting: settings.total_questions,
        questionsPerTest
      });

      if (!questionsPerTest || questionsPerTest <= 0) {
        throw new Error("Invalid total_questions setting");
      }

      console.log('SETTINGS:');
      console.log('  questionsPerTest:', questionsPerTest);

      if (questionsPerTest <= 0) {
        return {
          success: false,
          testSetsCreated: 0,
          questionsAssigned: 0,
          error: 'Invalid questions per test setting',
        };
      }

      // Get all active questions for this batch.
      console.log('TEST SET GENERATION QUERY: questions select active ids - BEFORE', {
        batchId,
      });
      const { data: allQuestions, error: questionsError } = await supabase
        .from("questions")
        .select("id")
        .eq("batch_id", batchId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      console.log('TEST SET GENERATION QUERY: questions select active ids - AFTER', {
        rowCount: allQuestions?.length ?? 0,
        error: questionsError,
      });

      if (questionsError) {
        throw questionsError;
      }

      console.log("Questions Found:", allQuestions?.length);
      const unassignedQuestions = allQuestions ?? [];

      console.log("Deleting old test sets...");

      // Delete old question mappings
      console.log('TEST SET GENERATION QUERY: existing test_sets select ids - BEFORE', {
        batchId,
      });
      const { data: oldSets, error: oldSetsError } = await supabase
        .from("test_sets")
        .select("id")
        .eq("batch_id", batchId);

      console.log('TEST SET GENERATION QUERY: existing test_sets select ids - AFTER', {
        rowCount: oldSets?.length ?? 0,
        error: oldSetsError,
      });

      if (oldSetsError) {
        throw oldSetsError;
      }

      if (oldSets?.length) {
        const ids = oldSets.map(s => s.id);

        console.log('TEST SET GENERATION QUERY: old test_set_questions delete - BEFORE', {
          batchId,
          testSetIds: ids,
        });
        const { error: deleteQuestionsError } = await supabase
          .from("test_set_questions")
          .delete()
          .in("test_set_id", ids);

        console.log('TEST SET GENERATION QUERY: old test_set_questions delete - AFTER', {
          error: deleteQuestionsError,
        });

        if (deleteQuestionsError) {
          throw deleteQuestionsError;
        }

        console.log('TEST SET GENERATION QUERY: old test_sets delete - BEFORE', {
          batchId,
        });
        const { error: deleteTestSetsError } = await supabase
          .from("test_sets")
          .delete()
          .eq("batch_id", batchId);

        console.log('TEST SET GENERATION QUERY: old test_sets delete - AFTER', {
          error: deleteTestSetsError,
        });

        if (deleteTestSetsError) {
          throw deleteTestSetsError;
        }
      }



      if (!unassignedQuestions || unassignedQuestions.length === 0) {
        console.log('No unassigned questions found');
        return {
          success: true,
          testSetsCreated: 0,
          questionsAssigned: 0,
        };
      }

      // Get the next set number
      console.log('TEST SET GENERATION QUERY: next set number select - BEFORE', {
        batchId,
      });
      const { data: existingSets, error: existingSetsError } = await supabase
        .from('test_sets')
        .select('set_number')
        .eq('batch_id', batchId)
        .order('set_number', { ascending: false })
        .limit(1);

      console.log('TEST SET GENERATION QUERY: next set number select - AFTER', {
        rowCount: existingSets?.length ?? 0,
        error: existingSetsError,
      });

      if (existingSetsError) {
        throw existingSetsError;
      }

      const nextSetNumber = existingSets && existingSets.length > 0
        ? existingSets[0].set_number + 1
        : 1;

      console.log('Next set number:', nextSetNumber);

      // SHUFFLE ONCE - This prevents duplicates
      const shuffledIds = this.shuffleArray(
        unassignedQuestions.map(q => q.id)
      );

      console.log('========================================');
      console.log('QUESTION DISTRIBUTION');
      console.log('========================================');
      console.log('Total questions:', shuffledIds.length);
      console.log('Questions per test:', questionsPerTest);
      console.log('Test sets to create:', Math.floor(shuffledIds.length / questionsPerTest));
      console.log('');
      console.log('SHUFFLED QUESTION IDs:');
      console.log('All IDs:', shuffledIds);
      console.log('');
      console.log('DISTRIBUTION:');
      for (let i = 0; i < Math.floor(shuffledIds.length / questionsPerTest); i++) {
        const start = i * questionsPerTest;
        const end = start + questionsPerTest;
        const testQuestions = shuffledIds.slice(start, end);
        console.log(`Test ${i + 1}: [${testQuestions.join(', ')}]`);
      }
      console.log('========================================');

      // Calculate how many test sets we can create
      const testSetsToCreate = Math.floor(
        shuffledIds.length / questionsPerTest
      );

      if (testSetsToCreate === 0) {
        return {
          success: true,
          testSetsCreated: 0,
          questionsAssigned: 0,
        };
      }

      // Create test sets and assign questions sequentially
      let totalQuestionsAssigned = 0;
      const allAssignedIds: number[] = [];
      const createdTestSetIds: number[] = [];

      for (let i = 0; i < testSetsToCreate; i++) {
        const setNumber = nextSetNumber + i;

        // Create test set
        console.log('TEST SET GENERATION QUERY: test_sets insert - BEFORE', {
          batchId,
          setNumber,
          questionsPerTest,
        });
        const { data: testSet, error: testSetError } = await supabase
          .from('test_sets')
          .insert({
            batch_id: batchId,
            set_number: setNumber,
            name: `Test ${setNumber}`,
            total_questions: questionsPerTest,
            is_active: true,
          })
          .select('id')
          .single();

        console.log('TEST SET GENERATION QUERY: test_sets insert - AFTER', {
          testSetId: testSet?.id,
          error: testSetError,
        });

        if (testSetError || !testSet) {
          console.error(`Error creating test set ${setNumber}:`, testSetError);
          throw testSetError || new Error(`No test_set row returned for Test ${setNumber}`);
        }

        console.log(`Created Test ${setNumber} (ID: ${testSet.id})`);
        createdTestSetIds.push(testSet.id);

        // Get questions for this test set - SEQUENTIAL assignment
        const startIndex = i * questionsPerTest;
        const endIndex = startIndex + questionsPerTest;
        const testQuestionIds = shuffledIds.slice(startIndex, endIndex);
        if (testQuestionIds.length === 0) continue;

        allAssignedIds.push(...testQuestionIds);

        // Create test_set_questions entries
        const testSetQuestions = testQuestionIds.map((questionId, index) => ({
          test_set_id: testSet.id,
          question_id: questionId,
          question_order: index + 1,
        }));

        console.log('TEST SET GENERATION QUERY: test_set_questions insert - BEFORE', {
          testSetId: testSet.id,
          rowCount: testSetQuestions.length,
          questionIds: testQuestionIds,
        });
        const { error: tsqError } = await supabase
          .from('test_set_questions')
          .insert(testSetQuestions);

        console.log('TEST SET GENERATION QUERY: test_set_questions insert - AFTER', {
          testSetId: testSet.id,
          error: tsqError,
        });

        if (tsqError) {
          console.error(`Error creating test set questions for Test ${setNumber}:`, tsqError);
          // Rollback: delete the test set
          console.log('TEST SET GENERATION QUERY: rollback test_sets delete - BEFORE', {
            testSetId: testSet.id,
          });
          const { error: rollbackError } = await supabase
            .from('test_sets')
            .delete()
            .eq('id', testSet.id);
          console.log('TEST SET GENERATION QUERY: rollback test_sets delete - AFTER', {
            testSetId: testSet.id,
            error: rollbackError,
          });
          throw tsqError;
        }

        console.log(`Assigned ${testQuestionIds.length} questions to Test ${setNumber}`);
        console.log(`  Question IDs: [${testQuestionIds.slice(0, 5).join(', ')}${testQuestionIds.length > 5 ? '...' : ''}]`);
        totalQuestionsAssigned += testQuestionIds.length;
      }

      // Verify NO duplicates
      const uniqueIds = new Set(allAssignedIds);
      if (uniqueIds.size !== allAssignedIds.length) {
        console.error('========================================');
        console.error('ERROR: DUPLICATE QUESTION IDs DETECTED!');
        console.error('========================================');
        console.error('Total assigned:', allAssignedIds.length);
        console.error('Unique IDs:', uniqueIds.size);
        const duplicates = allAssignedIds.filter((id, index) => allAssignedIds.indexOf(id) !== index);
        console.error('Duplicate IDs:', duplicates);
        console.log({
          questionsPerTest,
          totalQuestions: shuffledIds.length,
          testSetsToCreate
        });
        // Rollback - delete all created test sets
        for (let i = 0; i < testSetsToCreate; i++) {
          const setNumber = nextSetNumber + i;
          console.log('TEST SET GENERATION QUERY: duplicate rollback test_sets delete - BEFORE', {
            batchId,
            setNumber,
          });
          const { error: duplicateRollbackError } = await supabase
            .from('test_sets')
            .delete()
            .eq('batch_id', batchId)
            .eq('set_number', setNumber);
          console.log('TEST SET GENERATION QUERY: duplicate rollback test_sets delete - AFTER', {
            batchId,
            setNumber,
            error: duplicateRollbackError,
          });
        }

        throw new Error(`Duplicate question IDs detected during test set generation: ${duplicates.join(', ')}`);
      } else {
        console.log('✓ VALIDATION PASSED: All', allAssignedIds.length, 'question IDs are unique');
      }

      console.log('========================================');
      console.log('GENERATION COMPLETE');
      console.log('TEST SET GENERATION QUERY: final test_sets count - BEFORE', {
        batchId,
      });
      const { count: testSetCount, error: testSetCountError } = await supabase
        .from("test_sets")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq('batch_id', batchId)
        .eq('is_active', true);

      console.log('TEST SET GENERATION QUERY: final test_sets count - AFTER', {
        count: testSetCount,
        error: testSetCountError,
      });

      if (testSetCountError) {
        throw testSetCountError;
      }

      console.log('TEST SET GENERATION QUERY: final test_set_questions count - BEFORE', {
        batchId,
      });
      const { count: questionCount, error: questionCountError } = await supabase
        .from("test_set_questions")
        .select("*", {
          count: "exact",
          head: true
        })
        .in('test_set_id', createdTestSetIds);

      const expectedQuestionCount = totalQuestionsAssigned;

      console.log('TEST SET GENERATION QUERY: final test_set_questions count - AFTER', {
        count: questionCount,
        expectedQuestionCount,
        error: questionCountError,
      });

      if (questionCountError) {
        throw questionCountError;
      }

      console.log({
        generatedTestSets: testSetCount,
        generatedQuestionMappings: questionCount
      });
      console.log(`Total test sets created: ${testSetsToCreate}`);
      console.log(`Total questions assigned: ${totalQuestionsAssigned}`);
      console.log('========================================');

      return {
        success: true,
        testSetsCreated: testSetsToCreate,
        questionsAssigned: totalQuestionsAssigned,
      };
    } catch (error) {
      console.error('Error generating test sets:', error);
      return {
        success: false,
        testSetsCreated: 0,
        questionsAssigned: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async getTestSetById(
    supabase: SupabaseClient,
    testSetId: number
  ): Promise<(TestSet & { batch?: Batch; questions?: Array<TestSetQuestion & { question: Question }> }) | null> {
    try {
      console.log('TEST SET QUERY: test_sets select by id with batch/questions - BEFORE', {
        testSetId,
      });
      const { data, error } = await supabase
        .from('test_sets')
        .select('*, batch:batches(*), questions:test_set_questions(*, question:questions(*, category:categories(*)))')
        .eq('id', testSetId)
        .eq('is_active', true)
        .single();

      console.log('TEST SET QUERY: test_sets select by id with batch/questions - AFTER', {
        found: !!data,
        error,
      });

      if (error || !data) {
        return null;
      }

      return data as TestSet & {
        batch?: Batch;
        questions?: Array<TestSetQuestion & { question: Question }>;
      };
    } catch (error) {
      console.error('Error fetching test set by id:', error);
      return null;
    }
  },

  /**
   * Get test set for a specific test number
   * Reads from test_sets table
   */
  async getTestSet(
    supabase: SupabaseClient,
    batchId: number,
    testNumber: number
  ): Promise<{ testSet: TestSet | null; error: string | null }> {
    try {
      const { data: testSet, error } = await supabase
        .from('test_sets')
        .select('*')
        .eq('batch_id', batchId)
        .eq('set_number', testNumber)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        return { testSet: null, error: error.message };
      }

      return { testSet: testSet as TestSet, error: null };
    } catch (error) {
      console.error('Error fetching test set:', error);
      return {
        testSet: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get questions for a specific test set
   * ONLY reads from test_set_questions - NEVER generates
   * This is the ONLY way to get questions for a test
   */
  async getTestSetQuestions(
    supabase: SupabaseClient,
    testSetId: number
  ): Promise<TestSetWithQuestions | null> {
    try {
      console.log('=== getTestSetQuestions ===');
      console.log('testSetId:', testSetId);

      // Get test set
      console.log('TEST SET QUERY: test_sets select by id - BEFORE', {
        testSetId,
      });
      const { data: testSet, error: testSetError } = await supabase
        .from('test_sets')
        .select('*')
        .eq('id', testSetId)
        .single();

      console.log('TEST SET QUERY: test_sets select by id - AFTER', {
        found: !!testSet,
        error: testSetError,
      });

      if (testSetError || !testSet) {
        console.error('Test set not found:', testSetError);
        return null;
      }

      // Get questions from test_set_questions
      console.log('TEST SET QUERY: test_set_questions select questions - BEFORE', {
        testSetId,
      });
      const { data: testSetQuestions, error: tsqError } = await supabase
        .from('test_set_questions')
        .select('*, question:questions(*, category:categories(*))')
        .eq('test_set_id', testSetId)
        .order('question_order', { ascending: true });

      console.log('TEST SET QUERY: test_set_questions select questions - AFTER', {
        rowCount: testSetQuestions?.length ?? 0,
        error: tsqError,
      });

      if (tsqError) {
        console.error('Error fetching test set questions:', tsqError);
        return null;
      }

      const questions = (testSetQuestions || [])
        .filter(tsq => tsq.question)
        .map(tsq => tsq.question);

      console.log('Loaded questions from test_set_questions:', questions.length);
      console.log('Question IDs:', questions.map(q => q.id));

      // Verify no duplicates
      const questionIds = questions.map(q => q.id);
      const uniqueIds = new Set(questionIds);
      if (uniqueIds.size !== questionIds.length) {
        console.error('ERROR: Duplicate question IDs in test_set_questions!');
        const duplicates = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
        console.error('Duplicate IDs:', duplicates);
        throw new Error(`Duplicate question IDs found in test_set_questions: ${duplicates.join(', ')}`);
      }

      console.log('✓ No duplicates found');

      return {
        testSet: testSet as TestSet,
        questions,
      };
    } catch (error) {
      console.error('Error fetching test set questions:', error);
      return null;
    }
  },

  /**
   * Get all test sets for a batch
   * Reads from test_sets table
   */
  async getTestSetsForBatch(
    supabase: SupabaseClient,
    batchId: number
  ): Promise<{ testSets: TestSet[]; error: string | null }> {
    try {
      const { data: testSets, error } = await supabase
        .from('test_sets')
        .select('*')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .order('set_number', { ascending: true });

      if (error) {
        return { testSets: [], error: error.message };
      }

      return { testSets: testSets as TestSet[], error: null };
    } catch (error) {
      console.error('Error fetching test sets:', error);
      return {
        testSets: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async getTestSetsByBatch(
    supabase: SupabaseClient,
    batchId: number
  ): Promise<TestSet[]> {
    const { testSets, error } = await this.getTestSetsForBatch(supabase, batchId);
    if (error) {
      console.error('Error fetching test sets by batch:', error);
    }
    return testSets;
  },

  async getTestSetStats(
    supabase: SupabaseClient,
    batchId: number,
    userId: string
  ) {
    try {
      const settings = await settingsService.getAllSettings(supabase);
      const questionsPerTest = Number(settings.total_questions);

      console.log('TEST SET QUERY: questions count active - BEFORE', { batchId });
      const { count: totalQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId)
        .eq('is_active', true);
      console.log('TEST SET QUERY: questions count active - AFTER', {
        batchId,
        count: totalQuestions,
        error: questionsError,
      });

      if (questionsError) {
        throw questionsError;
      }

      const { count: totalAvailableTests, error: testSetCountError } = await this.getTestSetCount(supabase, batchId);
      if (testSetCountError) {
        throw new Error(testSetCountError);
      }

      console.log('TEST SET QUERY: user_test_attempts completed count - BEFORE', {
        batchId,
        userId,
      });
      const { count: completedTests, error: completedError } = await supabase
        .from('user_test_attempts')
        .select('*, test_set:test_sets!inner(batch_id)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('test_set.batch_id', batchId)
        .not('completed_at', 'is', null);
      console.log('TEST SET QUERY: user_test_attempts completed count - AFTER', {
        batchId,
        userId,
        count: completedTests,
        error: completedError,
      });

      if (completedError) {
        throw completedError;
      }

      return {
        totalQuestions: totalQuestions || 0,
        questionsPerTest,
        totalAvailableTests,
        completedTests: completedTests || 0,
        remainingTests: Math.max(0, totalAvailableTests - (completedTests || 0)),
        currentPlan: 'free',
      };
    } catch (error) {
      console.error('Error fetching test set stats:', error);
      return {
        totalQuestions: 0,
        questionsPerTest: 0,
        totalAvailableTests: 0,
        completedTests: 0,
        remainingTests: 0,
        currentPlan: 'free',
      };
    }
  },

  async canAccessTestSet(
    supabase: SupabaseClient,
    userId: string,
    testSetId: number,
    userPlan: string
  ): Promise<{ canAccess: boolean; reason?: string }> {
    try {
      const testSet = await this.getTestSetById(supabase, testSetId);
      if (!testSet) {
        return { canAccess: false, reason: 'This test is not available yet.' };
      }

      if (userPlan === 'free' && testSet.set_number > 1) {
        return { canAccess: false, reason: 'Upgrade to unlock this test.' };
      }

      console.log('TEST SET QUERY: user_test_attempts existing attempt - BEFORE', {
        userId,
        testSetId,
      });
      const { data: existingAttempt, error } = await supabase
        .from('user_test_attempts')
        .select('id, completed_at')
        .eq('user_id', userId)
        .eq('test_set_id', testSetId)
        .maybeSingle();
      console.log('TEST SET QUERY: user_test_attempts existing attempt - AFTER', {
        found: !!existingAttempt,
        error,
      });

      if (error) {
        throw error;
      }

      if (existingAttempt?.completed_at) {
        return { canAccess: false, reason: 'You have already completed this test.' };
      }

      return { canAccess: true };
    } catch (error) {
      console.error('Error checking test set access:', error);
      return { canAccess: false, reason: 'Error checking access' };
    }
  },

  async startTestSet(
    supabase: SupabaseClient,
    userId: string,
    testSetId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('TEST SET QUERY: user_test_attempts upsert start - BEFORE', {
        userId,
        testSetId,
      });
      const { error } = await supabase
        .from('user_test_attempts')
        .upsert({
          user_id: userId,
          test_set_id: testSetId,
        }, {
          onConflict: 'user_id,test_set_id',
        });
      console.log('TEST SET QUERY: user_test_attempts upsert start - AFTER', {
        error,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error starting test set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start test set',
      };
    }
  },

  /**
   * Get total count of test sets for a batch
   * This is the SOURCE OF TRUTH for available tests
   */
  async getTestSetCount(
    supabase: SupabaseClient,
    batchId: number
  ): Promise<{ count: number; error: string | null }> {
    try {
      console.log('TEST SET QUERY: test_sets count active - BEFORE', {
        batchId,
      });
      const { count, error } = await supabase
        .from('test_sets')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId)
        .eq('is_active', true);

      console.log('TEST SET QUERY: test_sets count active - AFTER', {
        batchId,
        count,
        error,
      });

      if (error) {
        return { count: 0, error: error.message };
      }

      return { count: count || 0, error: null };
    } catch (error) {
      console.error('Error counting test sets:', error);
      return {
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Shuffle array (Fisher-Yates algorithm) - returns new array
   * Used ONLY during test set generation (admin operation)
   */
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
};
