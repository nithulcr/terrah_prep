-- ============================================
-- FRESH DATABASE SCHEMA FOR TERRAH PREP
-- This is a COMPLETE RESET and fresh start
-- Execute this in Supabase SQL Editor on an empty database
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES (in dependency order)
-- ============================================

DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.user_answers CASCADE;
DROP TABLE IF EXISTS public.test_results CASCADE;
DROP TABLE IF EXISTS public.user_usage CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- ============================================
-- STEP 2: CREATE ALL TABLES WITH INTEGER IDs
-- ============================================

-- Profiles table (extends auth.users - uses UUID from Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans table (INTEGER ID)
CREATE TABLE public.plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  daily_question_limit INTEGER CHECK (daily_question_limit IS NULL OR daily_question_limit >= 0),
  monthly_mock_test_limit INTEGER CHECK (monthly_mock_test_limit IS NULL OR monthly_mock_test_limit >= 0),
  lifetime_question_limit INTEGER CHECK (lifetime_question_limit IS NULL OR lifetime_question_limit >= 0),
  allow_result_history BOOLEAN NOT NULL DEFAULT false,
  allow_pdf_download BOOLEAN NOT NULL DEFAULT false,
  allow_analytics BOOLEAN NOT NULL DEFAULT false,
  allow_bookmarks BOOLEAN NOT NULL DEFAULT false,
  allow_review_answers BOOLEAN NOT NULL DEFAULT false,
  allow_performance_dashboard BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Batches table (INTEGER ID)
CREATE TABLE public.batches (
  id SERIAL PRIMARY KEY,
  batch_name TEXT NOT NULL,
  batch_number INTEGER NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories table (INTEGER ID)
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions table (INTEGER ID)
CREATE TABLE public.questions (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  language TEXT NOT NULL,
  marks NUMERIC NOT NULL DEFAULT 1,
  negative_marks NUMERIC NOT NULL DEFAULT 0,
  question_image TEXT,
  options_image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions table (INTEGER ID)
CREATE TABLE public.subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('inactive', 'active', 'cancelled', 'expired')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User usage table (INTEGER ID)
CREATE TABLE public.user_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id INTEGER NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  questions_today INTEGER NOT NULL DEFAULT 0 CHECK (questions_today >= 0),
  tests_this_month INTEGER NOT NULL DEFAULT 0 CHECK (tests_this_month >= 0),
  free_questions_used INTEGER NOT NULL DEFAULT 0 CHECK (free_questions_used >= 0),
  last_daily_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  subscription_started_at TIMESTAMPTZ NOT NULL,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Test results table (INTEGER ID)
CREATE TABLE public.test_results (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id INTEGER NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  skipped_answers INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  negative_marks NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User answers table (INTEGER ID)
CREATE TABLE public.user_answers (
  id SERIAL PRIMARY KEY,
  test_result_id INTEGER NOT NULL REFERENCES public.test_results(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookmarks table (INTEGER ID)
CREATE TABLE public.bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Plans indexes
CREATE INDEX idx_plans_slug ON public.plans(slug);
CREATE INDEX idx_plans_active ON public.plans(is_active);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE UNIQUE INDEX idx_subscriptions_one_active_per_user ON public.subscriptions(user_id) WHERE status = 'active';

-- User usage indexes
CREATE INDEX idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX idx_user_usage_subscription_id ON public.user_usage(subscription_id);

-- Batches indexes
CREATE INDEX idx_batches_active ON public.batches(is_active);

-- Categories indexes
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- Questions indexes
CREATE INDEX idx_questions_batch_id ON public.questions(batch_id);
CREATE INDEX idx_questions_category_id ON public.questions(category_id);
CREATE INDEX idx_questions_is_active ON public.questions(is_active);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);

-- Test results indexes
CREATE INDEX idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX idx_test_results_batch_id ON public.test_results(batch_id);
CREATE INDEX idx_test_results_created_at ON public.test_results(created_at);

-- User answers indexes
CREATE INDEX idx_user_answers_test_result_id ON public.user_answers(test_result_id);
CREATE INDEX idx_user_answers_question_id ON public.user_answers(question_id);

-- Bookmarks indexes
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_question_id ON public.bookmarks(question_id);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$;

-- ============================================
-- STEP 6: CREATE TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER profiles_set_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER plans_set_updated_at 
  BEFORE UPDATE ON public.plans 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER batches_set_updated_at 
  BEFORE UPDATE ON public.batches 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER categories_set_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER questions_set_updated_at 
  BEFORE UPDATE ON public.questions 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER subscriptions_set_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_usage_set_updated_at 
  BEFORE UPDATE ON public.user_usage 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER test_results_set_updated_at 
  BEFORE UPDATE ON public.test_results 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================

-- Profiles: Users can read/update their own profile, admins can do everything
CREATE POLICY profiles_read_own ON public.profiles 
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_update_own ON public.profiles 
  FOR UPDATE USING (id = auth.uid() OR public.is_admin()) 
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_admin_manage ON public.profiles 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Plans: Everyone can read active plans, admins can manage
CREATE POLICY plans_read_active ON public.plans 
  FOR SELECT USING (is_active OR public.is_admin());

CREATE POLICY plans_admin_manage ON public.plans 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Batches: Everyone can read active batches, admins can manage
CREATE POLICY batches_read_active ON public.batches 
  FOR SELECT USING (is_active OR public.is_admin());

CREATE POLICY batches_admin_manage ON public.batches 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Categories: Everyone can read, admins can manage
CREATE POLICY categories_read ON public.categories 
  FOR SELECT USING (true);

CREATE POLICY categories_admin_manage ON public.categories 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Questions: Everyone can read active questions, admins can manage
CREATE POLICY questions_read_active ON public.questions 
  FOR SELECT USING (is_active OR public.is_admin());

CREATE POLICY questions_admin_manage ON public.questions 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Subscriptions: Users can read their own, admins can do everything
CREATE POLICY subscriptions_read_own ON public.subscriptions 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY subscriptions_admin_manage ON public.subscriptions 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User usage: Users can read their own, admins can do everything
CREATE POLICY usage_read_own ON public.user_usage 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY usage_admin_manage ON public.user_usage 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Test results: Users can read/insert/delete their own, admins can do everything
CREATE POLICY test_results_read_own ON public.test_results 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY test_results_insert_own ON public.test_results 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY test_results_delete_own ON public.test_results 
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- User answers: Users can read/insert answers for their own test results
CREATE POLICY user_answers_read_own ON public.user_answers 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.test_results 
      WHERE test_results.id = user_answers.test_result_id 
      AND test_results.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY user_answers_insert_own ON public.user_answers 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.test_results 
      WHERE test_results.id = user_answers.test_result_id 
      AND test_results.user_id = auth.uid()
    )
  );

-- Bookmarks: Users can manage their own bookmarks, admins can do everything
CREATE POLICY bookmarks_read_own ON public.bookmarks 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY bookmarks_insert_own ON public.bookmarks 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY bookmarks_delete_own ON public.bookmarks 
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- ============================================
-- STEP 8: SEED DATA
-- ============================================

-- Seed subscription plans
INSERT INTO public.plans (
  name, slug, description, price, duration_days, daily_question_limit,
  monthly_mock_test_limit, lifetime_question_limit, allow_result_history,
  allow_pdf_download, allow_analytics, allow_bookmarks, allow_review_answers,
  allow_performance_dashboard, priority_support, is_active
) VALUES
  ('FREE', 'free', 'Free practice access', 0, null, 0, 0, 20, false, false, false, false, true, false, false, true),
  ('STARTER', 'starter', 'Starter monthly preparation plan', 99, 30, 50, 15, null, true, false, true, true, true, false, false, true),
  ('PRO', 'pro', 'Pro monthly preparation plan', 299, 30, 100, 30, null, true, true, true, true, true, true, false, true),
  ('PREMIUM', 'premium', 'Premium quarterly preparation plan', 599, 90, 250, 100, null, true, true, true, true, true, true, true, true),
  ('ELITE', 'elite', 'Elite annual unlimited preparation plan', 1499, 365, null, null, null, true, true, true, true, true, true, true, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================

-- Verify all tables exist with correct column counts
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM (
  SELECT 'profiles' as table_name UNION ALL
  SELECT 'plans' UNION ALL
  SELECT 'subscriptions' UNION ALL
  SELECT 'user_usage' UNION ALL
  SELECT 'batches' UNION ALL
  SELECT 'categories' UNION ALL
  SELECT 'questions' UNION ALL
  SELECT 'test_results' UNION ALL
  SELECT 'user_answers' UNION ALL
  SELECT 'bookmarks'
) t
ORDER BY table_name;

-- Verify foreign keys
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  a.attname as column_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = ANY(conkey)
WHERE contype = 'f'
  AND conrelid::regclass::text LIKE 'public.%'
ORDER BY conrelid::regclass::text, a.attnum;

-- Verify RLS is enabled on all tables
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'plans', 'subscriptions', 'user_usage', 'batches',
    'categories', 'questions', 'test_results', 'user_answers', 'bookmarks'
  )
ORDER BY tablename;

-- Verify policies exist
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Verify indexes exist
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'plans', 'subscriptions', 'user_usage', 'batches',
    'categories', 'questions', 'test_results', 'user_answers', 'bookmarks'
  )
ORDER BY tablename, indexname;

-- Verify seed data
SELECT * FROM public.plans ORDER BY price;

-- Verify triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'profiles', 'plans', 'batches', 'categories', 'questions',
    'subscriptions', 'user_usage', 'test_results'
  )
ORDER BY event_object_table, trigger_name;