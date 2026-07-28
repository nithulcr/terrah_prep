-- ============================================
-- COMPLETE DATABASE SCHEMA FOR TERRAH PREP
-- Execute this in Supabase SQL Editor
-- This creates ALL tables, relationships, RLS policies, and seed data
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
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

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

-- User usage table
CREATE TABLE IF NOT EXISTS public.user_usage (
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

-- Batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id SERIAL PRIMARY KEY,
  batch_name TEXT NOT NULL,
  batch_number INTEGER NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
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

-- Test results table
CREATE TABLE IF NOT EXISTS public.test_results (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
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

-- User answers table
CREATE TABLE IF NOT EXISTS public.user_answers (
  id SERIAL PRIMARY KEY,
  test_result_id INTEGER NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user ON public.subscriptions(user_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_subscription_id ON public.user_usage(subscription_id);

CREATE INDEX IF NOT EXISTS idx_questions_batch_id ON public.questions(batch_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON public.questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);

CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_batch_id ON public.test_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON public.test_results(created_at);

CREATE INDEX IF NOT EXISTS idx_user_answers_test_result_id ON public.user_answers(test_result_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question_id ON public.bookmarks(question_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. HELPER FUNCTIONS
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
-- 5. CREATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS plans_set_updated_at ON public.plans;
CREATE TRIGGER plans_set_updated_at 
  BEFORE UPDATE ON public.plans 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_set_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_usage_set_updated_at ON public.user_usage;
CREATE TRIGGER user_usage_set_updated_at 
  BEFORE UPDATE ON public.user_usage 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS batches_set_updated_at ON public.batches;
CREATE TRIGGER batches_set_updated_at 
  BEFORE UPDATE ON public.batches 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS questions_set_updated_at ON public.questions;
CREATE TRIGGER questions_set_updated_at 
  BEFORE UPDATE ON public.questions 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS test_results_set_updated_at ON public.test_results;
CREATE TRIGGER test_results_set_updated_at 
  BEFORE UPDATE ON public.test_results 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS profiles_read_own ON public.profiles;
CREATE POLICY profiles_read_own ON public.profiles 
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles 
  FOR UPDATE USING (id = auth.uid() OR public.is_admin()) 
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_admin_manage ON public.profiles;
CREATE POLICY profiles_admin_manage ON public.profiles 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Plans policies (everyone can read active plans, admins can manage)
DROP POLICY IF EXISTS plans_read_active ON public.plans;
CREATE POLICY plans_read_active ON public.plans 
  FOR SELECT USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS plans_admin_manage ON public.plans;
CREATE POLICY plans_admin_manage ON public.plans 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Subscriptions policies
DROP POLICY IF EXISTS subscriptions_read_own ON public.subscriptions;
CREATE POLICY subscriptions_read_own ON public.subscriptions 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS subscriptions_admin_manage ON public.subscriptions;
CREATE POLICY subscriptions_admin_manage ON public.subscriptions 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User usage policies
DROP POLICY IF EXISTS usage_read_own ON public.user_usage;
CREATE POLICY usage_read_own ON public.user_usage 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS usage_admin_manage ON public.user_usage;
CREATE POLICY usage_admin_manage ON public.user_usage 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Batches policies (everyone can read active batches)
DROP POLICY IF EXISTS batches_read_active ON public.batches;
CREATE POLICY batches_read_active ON public.batches 
  FOR SELECT USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS batches_admin_manage ON public.batches;
CREATE POLICY batches_admin_manage ON public.batches 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Categories policies (everyone can read)
DROP POLICY IF EXISTS categories_read ON public.categories;
CREATE POLICY categories_read ON public.categories 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS categories_admin_manage ON public.categories;
CREATE POLICY categories_admin_manage ON public.categories 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Questions policies (everyone can read active questions)
DROP POLICY IF EXISTS questions_read_active ON public.questions;
CREATE POLICY questions_read_active ON public.questions 
  FOR SELECT USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS questions_admin_manage ON public.questions;
CREATE POLICY questions_admin_manage ON public.questions 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Test results policies
DROP POLICY IF EXISTS test_results_read_own ON public.test_results;
CREATE POLICY test_results_read_own ON public.test_results 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS test_results_insert_own ON public.test_results;
CREATE POLICY test_results_insert_own ON public.test_results 
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS test_results_delete_own ON public.test_results;
CREATE POLICY test_results_delete_own ON public.test_results 
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- User answers policies
DROP POLICY IF EXISTS user_answers_read_own ON public.user_answers;
CREATE POLICY user_answers_read_own ON public.user_answers 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.test_results 
      WHERE test_results.id = user_answers.test_result_id 
      AND test_results.user_id = auth.uid()
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS user_answers_insert_own ON public.user_answers;
CREATE POLICY user_answers_insert_own ON public.user_answers 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.test_results 
      WHERE test_results.id = user_answers.test_result_id 
      AND test_results.user_id = auth.uid()
    )
  );

-- Bookmarks policies
DROP POLICY IF EXISTS bookmarks_read_own ON public.bookmarks;
CREATE POLICY bookmarks_read_own ON public.bookmarks 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS bookmarks_insert_own ON public.bookmarks;
CREATE POLICY bookmarks_insert_own ON public.bookmarks 
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bookmarks_delete_own ON public.bookmarks;
CREATE POLICY bookmarks_delete_own ON public.bookmarks 
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- ============================================
-- 7. SEED DATA
-- ============================================

-- Seed plans
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
ON CONFLICT (slug) DO UPDATE SET
  name = excluded.name, description = excluded.description, price = excluded.price,
  duration_days = excluded.duration_days, daily_question_limit = excluded.daily_question_limit,
  monthly_mock_test_limit = excluded.monthly_mock_test_limit,
  lifetime_question_limit = excluded.lifetime_question_limit,
  allow_result_history = excluded.allow_result_history,
  allow_pdf_download = excluded.allow_pdf_download, allow_analytics = excluded.allow_analytics,
  allow_bookmarks = excluded.allow_bookmarks, allow_review_answers = excluded.allow_review_answers,
  allow_performance_dashboard = excluded.allow_performance_dashboard,
  priority_support = excluded.priority_support, is_active = excluded.is_active;

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Verify all tables exist
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

-- Verify RLS is enabled
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

-- Verify policies
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;