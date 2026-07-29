// ============================================
// TERRAH PREP - TEST SETS SERVICE
// ============================================

import { SupabaseClient } from '@supabase/supabase-js';
import { settingsService } from '@/lib/services/settings.service';

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

export const testSetsService = {
  /**
   * Generate test sets for a batch
   * Divides questions into fixed sets with no duplicates
   */
  async generateTestSetsForBatch(
    supabase: SupabaseClient,
    batchId: number
  ): Promise<TestSetGenerationResult> {
    try {
      console.log('=== generateTestSetsForBatch ===');
      console.log('batchId:', batchId);

      // Get settings
      const settings = await settingsService.getAllSettings(supabase);
      const questionsPerTest = settings.total_questions;

      if (questionsPerTest <= 0) {
        return {
          success: false,
          testSetsCreated: 0,
          questionsAssigned: 0,
          error: 'Invalid questions per test setting',
        };
      }

      // Get all active questions for this batch that haven't been assigned to any test set
      const { data: unassignedQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .not('id', 'in', `(
          SELECT DISTINCT question_id 
          FROM public.test_set_questions 
          WHERE test_set_id IN (
            SELECT id FROM public.test_sets WHERE batch_id = ${batchId}
          )
        )`)
        .order('created_at', { ascending: true });

      console.log('Unassigned questions count:', unassignedQuestions?.length);

      if (questionsError) {
        console.error('Error fetching unassigned questions:', questionsError);
        return {
          success: false,
          testSetsCreated: 0,
          questionsAssigned: 0,
          error: questionsError.message,
        };
      }

      if (!unassignedQuestions || unassignedQuestions.length === 0) {
        console.log('No unassigned questions found');
        return {
          success: true,
          testSetsCreated: 0,
          questionsAssigned: 0,
        };
      }

      // Get the next set number for this batch
      const { data: existingSets, error: setsError } = await supabase
        .from('test_sets')
        .select('set_number')
        .eq('batch_id', batchId)
        .order('set_number', { ascending: false })
        .limit(1);

      const nextSetNumber = existingSets && existingSets.length > 0 
        ? existingSets[0].set_number + 1 
        : 1;

      console.log('Next set number:', nextSetNumber);

      // Calculate how many test sets we can create
      const questionsToAssign = unassignedQuestions.map(q => q.id);
      const testSetsToCreate = Math.floor(questionsToAssign.length / questionsPerTest);

      console.log('Test sets to create:', testSetsToCreate);

      if (testSetsToCreate === 0) {
        return {
          success: true,
          testSetsCreated: 0,
          questionsAssigned: 0,
        };
      }

      // Create test sets and assign questions
      let totalQuestionsAssigned = 0;

      for (let i = 0; i < testSetsToCreate; i++) {
        const setNumber = nextSetNumber + i;
        
        // Create test set
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

        if (testSetError || !testSet) {
          console.error('Error creating test set:', testSetError);
          continue;
        }

        console.log(`Created test set ${setNumber} with id ${testSet.id}`);

        // Get questions for this test set
        const startIndex = i * questionsPerTest;
        const endIndex = startIndex + questionsPerTest;
        const questionIds = questionsToAssign.slice(startIndex, endIndex);

        // Create test_set_questions entries
        const testSetQuestions = questionIds.map((questionId, index) => ({
          test_set_id: testSet.id,
          question_id: questionId,
          question_order: index + 1,
        }));

        const { error: tsqError } = await supabase
          .from('test_set_questions')
          .insert(testSetQuestions);

        if (tsqError) {
          console.error('Error creating test set questions:', tsqError);
          // Rollback: delete the test set
          await supabase
            .from('test_sets')
            .delete()
            .eq('id', testSet.id);
          continue;
        }

        console.log(`Assigned ${questionIds.length} questions to test set ${setNumber}`);
        totalQuestionsAssigned += questionIds.length;
      }

      console.log(`Total test sets created: ${testSetsToCreate}`);
      console.log(`Total questions assigned: ${totalQuestionsAssigned}`);

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

  /**
   * Get test set for a specific test number in a batch
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
        .single();

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
   */
  async getTestSetQuestions(
    supabase: SupabaseClient,
    testSetId: number
  ): Promise<{ questions: any[]; error: string | null }> {
    try {
      const { data: testSetQuestions, error: tsqError } = await supabase
        .from('test_set_questions')
        .select('*, question:questions(*, category:categories(*))')
        .eq('test_set_id', testSetId)
        .order('question_order', { ascending: true });

      if (tsqError) {
        return { questions: [], error: tsqError.message };
      }

      const questions = (testSetQuestions || [])
        .filter(tsq => tsq.question)
        .map(tsq => tsq.question);

      return { questions, error: null };
    } catch (error) {
      console.error('Error fetching test set questions:', error);
      return { 
        questions: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Get all test sets for a batch
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

  /**
   * Get total count of test sets for a batch
   */
  async getTestSetCount(
    supabase: SupabaseClient,
    batchId: number
  ): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('test_sets')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId)
        .eq('is_active', true);

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
};