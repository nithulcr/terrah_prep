-- User Test Questions table
-- Tracks which questions have been assigned to which users
-- Ensures no duplicate questions per user

begin;

-- Create user_test_questions table
CREATE TABLE IF NOT EXISTS public.user_test_questions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id INTEGER NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  test_number INTEGER NOT NULL,
  question_id INTEGER NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure a question is only assigned once per user per batch
  UNIQUE(user_id, batch_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_test_questions_user_id_idx ON public.user_test_questions(user_id);
CREATE INDEX IF NOT EXISTS user_test_questions_batch_id_idx ON public.user_test_questions(batch_id);
CREATE INDEX IF NOT EXISTS user_test_questions_user_batch_idx ON public.user_test_questions(user_id, batch_id);
CREATE INDEX IF NOT EXISTS user_test_questions_question_id_idx ON public.user_test_questions(question_id);

-- Enable RLS
ALTER TABLE public.user_test_questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY user_test_questions_read_own ON public.user_test_questions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY user_test_questions_insert_own ON public.user_test_questions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_test_questions_admin_manage ON public.user_test_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Grant permissions
GRANT SELECT, INSERT ON public.user_test_questions TO authenticated;
GRANT ALL ON public.user_test_questions TO service_role;

commit;