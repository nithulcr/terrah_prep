-- Generate test sets for all existing batches
-- Run this migration to populate test_sets and test_set_questions for existing data

begin;

-- Function to generate test sets for a batch (same as in migration 3)
CREATE OR REPLACE FUNCTION public.generate_test_sets_for_batch(batch_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
  questions_per_test INTEGER;
  unassigned_count INTEGER;
  test_sets_to_create INTEGER;
  next_set_number INTEGER;
  i INTEGER;
  test_set_id INTEGER;
BEGIN
  -- Get questions per test from settings
  SELECT setting_value::INTEGER INTO questions_per_test
  FROM public.app_settings
  WHERE setting_key = 'total_questions'
  LIMIT 1;
  
  IF questions_per_test IS NULL OR questions_per_test <= 0 THEN
    RAISE NOTICE 'Invalid questions per test setting';
    RETURN;
  END IF;
  
  -- Count unassigned questions (not in any test set for this batch)
  SELECT COUNT(*) INTO unassigned_count
  FROM public.questions q
  WHERE q.batch_id = batch_id_param
    AND q.is_active = true
    AND NOT EXISTS (
      SELECT 1 
      FROM public.test_set_questions tsq
      WHERE tsq.question_id = q.id
        AND tsq.test_set_id IN (
          SELECT id FROM public.test_sets WHERE batch_id = batch_id_param
        )
    );
  
  IF unassigned_count = 0 THEN
    RAISE NOTICE 'No unassigned questions found for batch %', batch_id_param;
    RETURN;
  END IF;
  
  -- Get next set number
  SELECT COALESCE(MAX(set_number), 0) + 1 INTO next_set_number
  FROM public.test_sets
  WHERE batch_id = batch_id_param;
  
  -- Calculate how many test sets we can create
  test_sets_to_create := FLOOR(unassigned_count / questions_per_test);
  
  IF test_sets_to_create = 0 THEN
    RAISE NOTICE 'Not enough questions to create a new test set for batch %', batch_id_param;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Generating % test sets for batch %', test_sets_to_create, batch_id_param;
  
  -- Create test sets
  FOR i IN 0..(test_sets_to_create - 1) LOOP
    -- Insert test set
    INSERT INTO public.test_sets (batch_id, set_number, name, total_questions, is_active)
    VALUES (batch_id_param, next_set_number + i, 'Test ' || (next_set_number + i), questions_per_test, true)
    RETURNING id INTO test_set_id;
    
    -- Insert test_set_questions
    INSERT INTO public.test_set_questions (test_set_id, question_id, question_order)
    SELECT 
      test_set_id,
      q.id,
      ROW_NUMBER() OVER (ORDER BY q.created_at ASC)
    FROM (
      SELECT q.id
      FROM public.questions q
      WHERE q.batch_id = batch_id_param
        AND q.is_active = true
        AND NOT EXISTS (
          SELECT 1 
          FROM public.test_set_questions tsq
          WHERE tsq.question_id = q.id
            AND tsq.test_set_id IN (
              SELECT id FROM public.test_sets WHERE batch_id = batch_id_param
            )
        )
      ORDER BY q.created_at ASC
      LIMIT questions_per_test
      OFFSET (i * questions_per_test)
    ) q;
    
    RAISE NOTICE 'Created test set % with ID %', next_set_number + i, test_set_id;
  END LOOP;
  
  RAISE NOTICE 'Successfully generated % test sets for batch %', test_sets_to_create, batch_id_param;
END;
$$ LANGUAGE plpgsql;

-- Generate test sets for all existing batches
DO $$
DECLARE
  batch_record RECORD;
  settings_record RECORD;
BEGIN
  -- Get settings
  SELECT * INTO settings_record
  FROM public.app_settings
  WHERE setting_key = 'total_questions'
  LIMIT 1;
  
  IF settings_record IS NULL THEN
    RAISE NOTICE 'No app settings found, skipping test set generation';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Questions per test: %', settings_record.setting_value;
  
  -- Loop through all batches
  FOR batch_record IN 
    SELECT DISTINCT batch_id 
    FROM public.questions 
    WHERE is_active = true
    ORDER BY batch_id
  LOOP
    RAISE NOTICE 'Processing batch %', batch_record.batch_id;
    PERFORM public.generate_test_sets_for_batch(batch_record.batch_id);
  END LOOP;
  
  RAISE NOTICE 'Test set generation complete';
END $$;

-- Drop the function after use (optional, can keep for future use)
-- DROP FUNCTION IF EXISTS public.generate_test_sets_for_batch(INTEGER);

commit;
