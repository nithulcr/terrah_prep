# Migration Guide: Dynamic Test Generation System

This guide explains how to migrate from the static test sets system to the new dynamic test generation system.

## Overview

The new system eliminates the need for manually generated test sets (`test_sets`, `test_set_questions`, `user_test_attempts` tables) and instead generates tests dynamically based on available questions and app settings.

## Step 1: Run Database Migration

Execute the following migration in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20260728000003_add_test_number_to_test_results.sql

-- Add test_number column to test_results
ALTER TABLE public.test_results 
  ADD COLUMN IF NOT EXISTS test_number INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_test_number 
  ON public.test_results(test_number);

-- Add comment
COMMENT ON COLUMN public.test_results.test_number IS 
  'The test number (1, 2, 3, etc.) for dynamic test generation';
```

## Step 2: Verify App Settings

Ensure your `app_settings` table has the following settings configured:

```sql
-- Required settings for dynamic test generation
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
  ('total_questions', '100', 'Total questions per test'),
  ('english_questions', '20', 'English questions per test'),
  ('science_questions', '20', 'Science questions per test'),
  ('general_knowledge_questions', '20', 'General Knowledge questions per test'),
  ('mathematics_questions', '20', 'Mathematics questions per test'),
  ('malayalam_questions', '20', 'Malayalam questions per test'),
  ('shuffle_questions', 'true', 'Shuffle questions within each test')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
```

**Important**: The category slugs in settings must match the slugs in your `categories` table:
- `english`
- `science`
- `general_knowledge`
- `mathematics`
- `malayalam`

## Step 3: Remove Old Test Sets Tables (Optional)

If you want to completely remove the old test sets system, run this migration:

```sql
-- WARNING: This will delete all test sets and user attempts
-- Only run this after verifying the new system works correctly

-- Drop user_test_attempts table
DROP TABLE IF EXISTS public.user_test_attempts CASCADE;

-- Drop test_set_questions table
DROP TABLE IF EXISTS public.test_set_questions CASCADE;

-- Drop test_sets table
DROP TABLE IF EXISTS public.test_sets CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS test_sets_batch_id_idx;
DROP INDEX IF EXISTS test_set_questions_test_set_id_idx;
DROP INDEX IF EXISTS test_set_questions_question_id_idx;
DROP INDEX IF EXISTS user_test_attempts_user_id_idx;
DROP INDEX IF EXISTS user_test_attempts_test_set_id_idx;
```

**Note**: Keep the old tables initially until you've verified the new system works correctly.

## Step 4: Update Category Slugs (If Needed)

Ensure your categories have the correct slugs. Run this query to check:

```sql
SELECT id, name, slug FROM categories ORDER BY sort_order;
```

The slugs should be:
- `english`
- `science`
- `general_knowledge`
- `mathematics`
- `malayalam`

If any slugs are different, update them:

```sql
UPDATE categories SET slug = 'english' WHERE slug = 'eng' OR slug = 'english-language';
UPDATE categories SET slug = 'science' WHERE slug = 'sci';
UPDATE categories SET slug = 'mathematics' WHERE slug = 'math' OR slug = 'maths';
-- etc.
```

## Step 5: Deploy Code Changes

The following files have been created/updated:

### New Files:
1. `src/lib/services/mock-tests.service.ts` - Dynamic test generation service
2. `src/app/api/mock-tests/route.ts` - API endpoint to get available tests
3. `src/app/api/mock-tests/[testNumber]/start/route.ts` - API endpoint to start a test
4. `supabase/migrations/20260728000003_add_test_number_to_test_results.sql` - Database migration

### Updated Files:
1. `src/types/index.ts` - Added `DynamicTest` and `CategoryQuestionCount` types
2. `src/app/mock-tests/page.tsx` - Updated to use dynamic tests
3. `src/app/mock-tests/[testNumber]/page.tsx` - New page for taking tests
4. `src/app/api/test/submit/route.ts` - Updated to use `testResultId` instead of `testSetId`

## Step 6: Test the Implementation

### Test Checklist:

1. **View Mock Tests Page**
   - Navigate to `/mock-tests`
   - Verify batches are displayed
   - Click "View Tests" on a batch
   - Verify tests are dynamically generated (Test 1, Test 2, Test 3, etc.)
   - Verify stats show correct numbers

2. **Start a Test**
   - Click "Start" on Test 1
   - Verify questions load correctly
   - Verify questions are from all required categories
   - Verify total questions matches `total_questions` setting

3. **Submit a Test**
   - Answer some questions
   - Submit the test
   - Verify results are saved
   - Verify test is marked as "Completed" on the mock tests page

4. **Test Free User Limits**
   - Create/use a free user account
   - Complete Test 1
   - Verify Test 2+ shows as "Locked"
   - Verify "Upgrade" button appears for locked tests

5. **Test Paid User Access**
   - Use a paid user account
   - Verify all available tests are accessible
   - Complete multiple tests
   - Verify each test shows correct status

6. **Verify No Duplicate Questions**
   - Start Test 1, note some question IDs
   - Start Test 2, verify different questions
   - Continue through all tests
   - Verify no question appears in multiple tests

## How It Works

### Test Calculation

The number of available tests is calculated as:

```
availableTests = minimum(
  english_count / english_questions,
  science_count / science_questions,
  general_knowledge_count / general_knowledge_questions,
  mathematics_count / mathematics_questions,
  malayalam_count / malayalam_questions
)
```

Uses integer division (floor).

### Question Selection

When a user starts Test N:
1. Calculate offset: `offset = (N - 1) * questionsPerCategory`
2. For each category, select `questionsPerCategory` questions starting from the offset
3. Combine all category questions into a single test
4. Shuffle if `shuffle_questions` is enabled

### Access Control

- **Free users**: Can only access Test 1
- **Paid users**: Can access all available tests
- **Completed tests**: Cannot be retaken (tracked via `test_results.test_number`)

## Rollback Plan

If issues occur, you can rollback:

1. Revert code changes to use old test-sets service
2. The old `test_sets`, `test_set_questions`, and `user_test_attempts` tables still exist (if not dropped)
3. Re-run the old test set generation endpoint

## Benefits of New System

1. **No manual test generation**: Tests are always up-to-date with current questions
2. **Automatic scaling**: Adding more questions automatically creates more tests
3. **No duplicate questions**: Each question appears in only one test
4. **Flexible configuration**: Change settings to adjust test composition
5. **Simplified database**: Fewer tables, less data to manage
6. **Better performance**: No complex joins with test_set_questions

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify app_settings are configured correctly
4. Verify category slugs match settings
5. Ensure questions have `is_active = true`