-- Add negative_marks column to questions table
-- This allows setting negative marks per question for wrong answers

begin;

-- Add negative_marks column if it doesn't exist
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS negative_marks NUMERIC(5,2) DEFAULT 0;

-- Set default value for existing NULL values
UPDATE public.questions
SET negative_marks = 0
WHERE negative_marks IS NULL;

-- Set NOT NULL constraint
ALTER TABLE public.questions
  ALTER COLUMN negative_marks SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.questions.negative_marks IS
  'Negative marks to deduct for wrong answer (e.g., 0.33 for 1/3 mark deduction)';

-- Backfill with standard negative marking (1/3 of question marks) for existing questions
-- This is the standard practice in competitive exams like PSC, SSC, UPSC
UPDATE public.questions
SET negative_marks = CASE 
  WHEN marks IS NOT NULL AND marks > 0 THEN ROUND(marks / 3, 2)
  ELSE 0.33
END
WHERE negative_marks = 0 AND marks IS NOT NULL AND marks > 0;

commit;