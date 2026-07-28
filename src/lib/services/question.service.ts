import { supabase } from '@/lib/supabase/client';
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
  async getQuestion(questionId: number) {
    const { data, error } = await supabase.from('questions').select(questionSelect).eq('id', questionId).single();
    return { question: data as Question | null, error: error?.message ?? null };
  },

  async getQuestionsByBatch(batchId: number) {
    const { data, error } = await supabase
      .from('questions')
      .select(questionSelect)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });
    return { questions: (data ?? []) as Question[], error: error?.message ?? null };
  },

  async createQuestion(values: QuestionCreateData) {
    const { data, error } = await supabase.from('questions').insert(values).select(questionSelect).single();
    return { question: data as Question | null, error: error?.message ?? null };
  },

  async updateQuestion(questionId: number, values: QuestionUpdateData) {
    const { data, error } = await supabase
      .from('questions')
      .update(values)
      .eq('id', questionId)
      .select(questionSelect)
      .single();
    return { question: data as Question | null, error: error?.message ?? null };
  },

  async deleteQuestion(questionId: number) {
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    return { success: !error, error: error?.message ?? null };
  },
};
