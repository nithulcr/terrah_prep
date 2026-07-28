-- Add test_number to test_results for dynamic test generation
-- This replaces the need for test_sets and user_test_attempts tables

begin;

-- Add test_number column to test_results
ALTER TABLE public.test_results 
  ADD COLUMN IF NOT EXISTS test_number INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_test_number 
  ON public.test_results(test_number);

-- Add comment
COMMENT ON COLUMN public.test_results.test_number IS 
  'The test number (1, 2, 3, etc.) for dynamic test generation';

commit;