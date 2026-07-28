-- ============================================
-- USER USAGE TABLE SETUP
-- Execute this in Supabase SQL Editor if the table doesn't exist
-- ============================================

-- Create user_usage table
CREATE TABLE IF NOT EXISTS public.user_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES public.subscriptions(id) ON DELETE CASCADE,
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

-- Create index
CREATE INDEX IF NOT EXISTS user_usage_subscription_id_idx ON public.user_usage (subscription_id);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS usage_read_own_or_admin ON public.user_usage;
DROP POLICY IF EXISTS usage_admin_manage ON public.user_usage;

-- Create RLS policies
CREATE POLICY usage_read_own_or_admin ON public.user_usage 
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY usage_admin_manage ON public.user_usage 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS user_usage_set_updated_at ON public.user_usage;
CREATE TRIGGER user_usage_set_updated_at 
  BEFORE UPDATE ON public.user_usage 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- SEED DATA FOR EXISTING USERS
-- ============================================

-- Insert usage records for users who don't have one
INSERT INTO public.user_usage (user_id, subscription_id, subscription_started_at, subscription_expires_at)
SELECT 
  pr.id,
  s.id,
  s.starts_at,
  s.expires_at
FROM public.profiles pr
JOIN public.subscriptions s ON s.user_id = pr.id AND s.status = 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_usage u WHERE u.user_id = pr.id
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_usage'
ORDER BY ordinal_position;

-- Verify data was seeded
SELECT 
  u.user_id,
  p.email,
  u.questions_today,
  u.tests_this_month,
  u.free_questions_used
FROM public.user_usage u
JOIN public.profiles p ON p.id = u.user_id
LIMIT 10;