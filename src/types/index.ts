export type UserRole = 'user' | 'admin';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'premium' | 'elite';
export type SubscriptionStatus = 'inactive' | 'active' | 'cancelled' | 'expired';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  plan_slug?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  description?: string | null;
  /** NULL means the plan does not expire. */
  duration_days: number | null;
  /** NULL means unlimited; zero means no allowance. */
  daily_question_limit: number | null;
  /** NULL means unlimited; zero means no allowance. */
  monthly_mock_test_limit: number | null;
  /** NULL means unlimited; zero means no allowance. */
  lifetime_question_limit: number | null;
  allow_result_history: boolean;
  allow_pdf_download: boolean;
  allow_analytics: boolean;
  allow_bookmarks: boolean;
  allow_review_answers: boolean;
  allow_performance_dashboard: boolean;
  allow_previous_year_questions: boolean;
  priority_support: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user_id: string;
  plan_id: number;
  plan?: Plan;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUsage {
  id: number;
  user_id: string;
  subscription_id: number;
  questions_today: number;
  tests_this_month: number;
  free_questions_used: number;
  last_daily_reset: string;
  subscription_started_at: string;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: number;
  batch_name: string;
  batch_number: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  icon?: string | null;
  sort_order: number;
  created_at: string;
  parent?: Category | null;
}

export interface Question {
  id: number;
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

export interface TestResult {
  id: number;
  user_id: string;
  batch_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  skipped_answers: number;
  time_taken_seconds: number;
  negative_marks: number;
  earned_marks: number;
  final_marks: number;
  percentage: number;
  created_at: string;
  updated_at: string;
  batch?: {
    batch_name: string;
  };
  questions?: Array<UserAnswer & { question: Question }>;
}

export interface UserAnswer {
  id: number;
  test_result_id: number;
  question_id: number;
  selected_option: CorrectOption | null;
  is_correct: boolean;
  time_taken_seconds: number;
  created_at: string;
}

export interface Bookmark {
  id: number;
  user_id: string;
  question_id: number;
  created_at: string;
}

export interface PlanFeatureFlags {
  allow_result_history: boolean;
  allow_pdf_download: boolean;
  allow_analytics: boolean;
  allow_bookmarks: boolean;
  allow_review_answers: boolean;
  allow_performance_dashboard: boolean;
  priority_support: boolean;
}

export interface UsageSummary {
  plan_slug: string;
  daily_question_limit: number | null;
  monthly_mock_test_limit: number | null;
  lifetime_question_limit: number | null;
  questions_today: number;
  tests_this_month: number;
  free_questions_used: number;
  subscription_expires_at: string | null;
}

export interface TestSet {
  id: number;
  batch_id: number;
  set_number: number;
  name: string;
  total_questions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  batch?: {
    batch_name: string;
  };
  questions?: Array<TestSetQuestion & { question: Question }>;
  status?: 'available' | 'started' | 'completed' | 'locked';
  hasAttempted?: boolean;
}

export interface TestSetQuestion {
  id: number;
  test_set_id: number;
  question_id: number;
  question_order: number;
  created_at: string;
}

export interface UserTestAttempt {
  id: number;
  user_id: string;
  test_set_id: number;
  test_result_id: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface TestSetStats {
  totalQuestions: number;
  questionsPerTest: number;
  totalAvailableTests: number;
  availableTests: number;
  completedTests: number;
  remainingTests: number;
  currentPlan: string;
}

export interface DynamicTest {
  testNumber: number;
  name: string;
  totalQuestions: number;
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  hasAttempted: boolean;
  completedAt?: string;
  score?: number;
  percentage?: number;
  attemptNumber?: number;
}

export interface CategoryQuestionCount {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  count: number;
}

export interface QuestionReport {
  id: number;
  question_id: number;
  user_id: string;
  reason: string;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reward_points: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  question?: {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'A' | 'B' | 'C' | 'D';
    explanation?: string | null;
    category: {
      name: string;
    };
  };
  user?: {
    email: string;
    full_name: string;
  };
}

export interface UserPoints {
  id: number;
  user_id: string;
  total_points: number;
  available_points: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: number;
  user_id: string;
  transaction_type: string;
  points: number;
  description: string;
  reference_id: number | null;
  reference_type: string | null;
  created_at: string;
}

export interface LuckySpinHistory {
  id: number;
  user_id: string;
  reward_type: string;
  reward_value: string;
  points_deducted: number;
  created_at: string;
}
