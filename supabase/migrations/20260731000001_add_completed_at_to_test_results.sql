-- Add completed_at column to test_results table
-- This tracks when a test was completed

begin;

ALTER TABLE public.test_results 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at 
  ON public.test_results(completed_at);

-- Add comment
COMMENT ON COLUMN public.test_results.completed_at IS 
  'Timestamp when the test was completed';

commit;