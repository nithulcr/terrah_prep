-- Fix test_results table schema
-- Ensure all required columns exist for test submission

begin;

-- Add missing columns if they don't exist
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wrong_answers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skipped_answers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS negative_marks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS test_number INTEGER,
  ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES public.batches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add constraints
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_batch_id ON public.test_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_number ON public.test_results(test_number);
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at ON public.test_results(completed_at);

-- Create unique constraint to prevent duplicate test attempts
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_results_unique_attempt 
  ON public.test_results(user_id, batch_id, test_number) 
  WHERE completed_at IS NULL;

-- Enable RLS
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS test_results_insert_own ON public.test_results;
DROP POLICY IF EXISTS test_results_update_own ON public.test_results;
DROP POLICY IF EXISTS test_results_read_own ON public.test_results;

-- Create policies
CREATE POLICY test_results_insert_own ON public.test_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY test_results_update_own ON public.test_results
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY test_results_read_own ON public.test_results
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Grant permissions
GRANT INSERT, UPDATE, SELECT ON public.test_results TO authenticated;
GRANT ALL ON public.test_results TO service_role;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS test_results_set_updated_at ON public.test_results;
CREATE TRIGGER test_results_set_updated_at 
  BEFORE UPDATE ON public.test_results 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

commit;