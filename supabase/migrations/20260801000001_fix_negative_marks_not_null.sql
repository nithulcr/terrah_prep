-- Fix negative_marks NOT NULL constraint issue
-- This migration ensures negative_marks has a DEFAULT value and updates existing NULL values

begin;

-- Set default value for negative_marks if not already set
ALTER TABLE public.test_results 
  ALTER COLUMN negative_marks SET DEFAULT 0;

-- Update any existing NULL values to 0
UPDATE public.test_results 
SET negative_marks = 0 
WHERE negative_marks IS NULL;

-- Ensure the column has NOT NULL constraint
ALTER TABLE public.test_results 
  ALTER COLUMN negative_marks SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.test_results.negative_marks IS 
  'Total negative marks deducted for wrong answers';

commit;