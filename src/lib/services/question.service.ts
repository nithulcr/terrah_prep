import { SupabaseClient } from '@supabase/supabase-js';
import { CorrectOption, DifficultyLevel, Question } from '@/types';

export interface QuestionCreateData {
  batch_id: number;
  category_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: CorrectOption;
  explanation?: string | null;
  difficulty: DifficultyLevel;
  language: string;
  marks: number;
  negative_marks: number;
  question_image?: string | null;
  options_image?: string | null;
  is_active: boolean;
}

export type QuestionUpdateData = Partial<QuestionCreateData>;

const questionSelect = '*, category:categories(*), batch:batches(*)';

export const questionService = {
  async getQuestion(supabase: SupabaseClient, questionId: number) {
    try {
      console.log('=== getQuestion ===');
      console.log('questionId:', questionId);
      
      const { data, error } = await supabase.from('questions').select(questionSelect).eq('id', questionId).single();
      
      console.log('Query Result - Question:', data ? 'FOUND' : 'NOT FOUND');
      console.log('Query Error - Question:', error);
      
      return { question: data as Question | null, error: error?.message ?? null };
    } catch (error) {
      console.error('Error fetching question:', error);
      return { question: null, error: 'Failed to fetch question' };
    }
  },

  async getQuestionsByBatch(supabase: SupabaseClient, batchId: number) {
    try {
      console.log('=== getQuestionsByBatch ===');
      console.log('batchId:', batchId);
      
      const { data, error } = await supabase
        .from('questions')
        .select(questionSelect)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });
      
      console.log('Query Result - Questions:', data?.length);
      console.log('Query Error - Questions:', error);
      
      return { questions: (data ?? []) as Question[], error: error?.message ?? null };
    } catch (error) {
      console.error('Error fetching questions:', error);
      return { questions: [], error: 'Failed to fetch questions' };
    }
  },

  async createQuestion(supabase: SupabaseClient, values: QuestionCreateData) {
    try {
      console.log('=== createQuestion ===');
      console.log('values:', values);
      
      const { data, error } = await supabase.from('questions').insert(values).select(questionSelect).single();
      
      console.log('Query Result - Question:', data ? 'CREATED' : 'FAILED');
      console.log('Query Error - Question:', error);
      
      return { question: data as Question | null, error: error?.message ?? null };
    } catch (error) {
      console.error('Error creating question:', error);
      return { question: null, error: 'Failed to create question' };
    }
  },

  async updateQuestion(supabase: SupabaseClient, questionId: number, values: QuestionUpdateData) {
    try {
      console.log('=== updateQuestion ===');
      console.log('questionId:', questionId);
      console.log('values:', values);
      
      const { data, error } = await supabase
        .from('questions')
        .update(values)
        .eq('id', questionId)
        .select(questionSelect)
        .single();
      
      console.log('Query Result - Question:', data ? 'UPDATED' : 'FAILED');
      console.log('Query Error - Question:', error);
      
      return { question: data as Question | null, error: error?.message ?? null };
    } catch (error) {
      console.error('Error updating question:', error);
      return { question: null, error: 'Failed to update question' };
    }
  },

  async deleteQuestion(supabase: SupabaseClient, questionId: number) {
    try {
      console.log('=== deleteQuestion ===');
      console.log('questionId:', questionId);
      
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      
      console.log('Query Error - Delete Question:', error);
      
      return { success: !error, error: error?.message ?? null };
    } catch (error) {
      console.error('Error deleting question:', error);
      return { success: false, error: 'Failed to delete question' };
    }
  },
};