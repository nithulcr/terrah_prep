export type UserRole = 'user' | 'admin';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'elite';
export type SubscriptionStatus = 'inactive' | 'active' | 'cancelled' | 'expired';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan?: Plan;
  status: SubscriptionStatus;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  batch_name: string;
  batch_number: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  icon?: string | null;
  created_at: string;
  parent?: Category | null;
}

export interface Question {
  id: string;
  batch_id: string;
  category_id: string;
  question_text: string;
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  batch?: Batch;
}

export const questionOptions = (question: Pick<Question, 'option_a' | 'option_b' | 'option_c' | 'option_d'>) => [
  { key: 'A' as const, text: question.option_a },
  { key: 'B' as const, text: question.option_b },
  { key: 'C' as const, text: question.option_c },
  { key: 'D' as const, text: question.option_d },
];
