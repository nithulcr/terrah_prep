-- Test Sets system for structured mock tests
-- This allows creating fixed test sets with no duplicate questions

begin;

-- Test Sets table
CREATE TABLE IF NOT EXISTS public.test_sets (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(batch_id, set_number)
);

-- Test Set Questions junction table
CREATE TABLE IF NOT EXISTS public.test_set_questions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_set_id INTEGER NOT NULL REFERENCES public.test_sets(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(test_set_id, question_id),
  UNIQUE(test_set_id, question_order)
);

-- User Test Attempts table to track which tests users have taken
CREATE TABLE IF NOT EXISTS public.user_test_attempts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_set_id INTEGER NOT NULL REFERENCES public.test_sets(id) ON DELETE CASCADE,
  test_result_id INTEGER REFERENCES public.test_results(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, test_set_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS test_sets_batch_id_idx ON public.test_sets(batch_id);
CREATE INDEX IF NOT EXISTS test_set_questions_test_set_id_idx ON public.test_set_questions(test_set_id);
CREATE INDEX IF NOT EXISTS test_set_questions_question_id_idx ON public.test_set_questions(question_id);
CREATE INDEX IF NOT EXISTS user_test_attempts_user_id_idx ON public.user_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS user_test_attempts_test_set_id_idx ON public.user_test_attempts(test_set_id);

-- Enable RLS
ALTER TABLE public.test_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_attempts ENABLE ROW LEVEL SECURITY;

-- Test Sets policies
CREATE POLICY test_sets_read_all ON public.test_sets
  FOR SELECT USING (is_active OR public.is_admin());

CREATE POLICY test_sets_admin_manage ON public.test_sets
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Test Set Questions policies
CREATE POLICY test_set_questions_read_all ON public.test_set_questions
  FOR SELECT USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.test_sets ts 
    WHERE ts.id = test_set_questions.test_set_id 
    AND ts.is_active = true
  ));

CREATE POLICY test_set_questions_admin_manage ON public.test_set_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User Test Attempts policies
CREATE POLICY user_test_attempts_read_own ON public.user_test_attempts
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY user_test_attempts_insert_own ON public.user_test_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_test_attempts_update_own ON public.user_test_attempts
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_sets TO authenticated;
GRANT ALL ON public.test_sets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_set_questions TO authenticated;
GRANT ALL ON public.test_set_questions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.user_test_attempts TO authenticated;
GRANT ALL ON public.user_test_attempts TO service_role;

commit;
