-- Add earned_marks and final_marks columns to test_results table
-- These columns store the calculated marks for display in results

begin;

-- Add earned_marks column if it doesn't exist
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS earned_marks NUMERIC(10,2) DEFAULT 0;

-- Add final_marks column if it doesn't exist
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS final_marks NUMERIC(10,2) DEFAULT 0;

-- Set default value for existing NULL values
UPDATE public.test_results
SET 
  earned_marks = COALESCE(earned_marks, 0),
  final_marks = COALESCE(final_marks, 0)
WHERE earned_marks IS NULL OR final_marks IS NULL;

-- Set NOT NULL constraint
ALTER TABLE public.test_results
  ALTER COLUMN earned_marks SET NOT NULL,
  ALTER COLUMN final_marks SET NOT NULL;

-- Add comments
COMMENT ON COLUMN public.test_results.earned_marks IS
  'Total marks earned from correct answers (correct_answers × marks_per_question)';

COMMENT ON COLUMN public.test_results.final_marks IS
  'Final marks after deducting negative marks (earned_marks - negative_marks)';

commit;