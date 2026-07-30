-- Auto-generate test sets when questions are added
-- This trigger ensures test sets are automatically created when new questions are inserted

begin;

-- Function to generate test sets for a batch
CREATE OR REPLACE FUNCTION public.generate_test_sets_for_batch(batch_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
  questions_per_test INTEGER;
  unassigned_count INTEGER;
  test_sets_to_create INTEGER;
  next_set_number INTEGER;
  i INTEGER;
  test_set_id INTEGER;
  start_index INTEGER;
  end_index INTEGER;
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
    RAISE NOTICE 'Not enough questions to create a new test set';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Generating % test sets for batch %', test_sets_to_create, batch_id_param;
  
  -- Create test sets
  FOR i IN 0..(test_sets_to_create - 1) LOOP
    -- Insert test set
    INSERT INTO public.test_sets (batch_id, set_number, name, total_questions, is_active)
    VALUES (batch_id_param, next_set_number + i, 'Test ' || (next_set_number + i), questions_per_test, true)
    RETURNING id INTO test_set_id;
    
    -- Get question IDs for this test set
    start_index := i * questions_per_test + 1;
    end_index := (i + 1) * questions_per_test;
    
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

-- Trigger function to call after question insert
CREATE OR REPLACE FUNCTION public.trigger_generate_test_sets()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new questions (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Generate test sets for the batch
    PERFORM public.generate_test_sets_for_batch(NEW.batch_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on questions table
DROP TRIGGER IF EXISTS on_question_insert ON public.questions;

CREATE TRIGGER on_question_insert
  AFTER INSERT ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_test_sets();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_test_sets_for_batch(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_generate_test_sets() TO service_role;

commit;
