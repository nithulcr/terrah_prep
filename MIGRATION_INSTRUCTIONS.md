# App Settings Migration - Required Setup

## Issue
The application is throwing a 400 error when trying to fetch settings because the `app_settings` table doesn't exist in your Supabase database yet.

## Solution
You need to run the migration SQL in your Supabase SQL Editor to create the table and populate it with default settings.

## Steps to Fix

### 1. Open Supabase SQL Editor
Go to: https://ciubgyqzmruaoeilgubq.supabase.co/project/ciubgyqzmruaoeilgubq/editor

### 2. Copy and Paste the Following SQL

```sql
-- App Settings table for dynamic configuration
-- This allows admins to configure the app without code changes

begin;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS app_settings_key_idx ON public.app_settings(key);

-- Insert default settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('total_questions', '100', 'Total number of questions in a mock test'),
  ('english_questions', '20', 'Number of English questions per test'),
  ('science_questions', '20', 'Number of Science questions per test'),
  ('general_knowledge_questions', '20', 'Number of General Knowledge questions per test'),
  ('mathematics_questions', '20', 'Number of Mathematics questions per test'),
  ('malayalam_questions', '20', 'Number of Malayalam questions per test'),
  ('free_question_limit', '100', 'Total questions free users can answer'),
  ('negative_mark', '0.33', 'Negative marking per wrong answer'),
  ('test_duration_minutes', '90', 'Duration of mock test in minutes'),
  ('shuffle_questions', 'true', 'Shuffle questions randomly'),
  ('shuffle_options', 'true', 'Shuffle answer options randomly')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY app_settings_read_all ON public.app_settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY app_settings_admin_update ON public.app_settings
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY app_settings_admin_insert ON public.app_settings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY app_settings_admin_delete ON public.app_settings
  FOR DELETE USING (public.is_admin());

-- Grant permissions
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

commit;
```

### 3. Execute the SQL
Click the "Run" button (or press Ctrl+Enter) to execute the migration.

### 4. Verify the Migration
After running the SQL, you should see a success message. The `app_settings` table will be created with default values.

### 5. Refresh Your Application
Once the migration is complete, refresh your browser. The error should be gone and the app will use the settings from the database.

## What This Does

1. **Creates the `app_settings` table** with columns for key, value, and description
2. **Inserts default settings** for all configurable values (questions per test, time limits, etc.)
3. **Enables Row Level Security (RLS)** to protect the table
4. **Creates policies** that allow:
   - Everyone to read settings (SELECT)
   - Only admins to modify settings (UPDATE, INSERT, DELETE)
5. **Grants appropriate permissions** to authenticated users and service role

## After Migration

The app will now:
- Fetch settings from the database instead of using hardcoded values
- Allow admins to update settings dynamically
- Cache settings for 5 minutes for better performance
- Fall back to default values if the database is unavailable

## Step 5 (Required): Add Additional Settings

**You must run this migration to enable free question limits and other features:**

```sql
begin;

INSERT INTO public.app_settings (key, value, description) VALUES
  ('questions_per_category', '0', 'Questions to select per category (0 = no limit)'),
  ('daily_question_limit', '10', 'Daily question limit for premium users'),
  ('monthly_mock_test_limit', '30', 'Monthly mock test limit for premium users'),
  ('marks_per_question', '1', 'Marks awarded per correct answer'),
  ('allow_bookmarks', 'true', 'Allow users to bookmark questions'),
  ('allow_review', 'true', 'Allow users to review answers after test'),
  ('allow_pdf_download', 'false', 'Allow PDF download of test results'),
  ('show_explanation_after_test', 'true', 'Show explanations after test submission')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

commit;
```

This migration adds the `free_question_limit` setting that controls how many questions free users can access. Without this, free users will see all questions.

## Troubleshooting

If you still see errors after running the migration:
1. Make sure you clicked "Run" to execute the SQL
2. Check for any error messages in the SQL Editor
3. Verify the table was created by running: `SELECT * FROM app_settings;`
4. Clear your browser cache and refresh the page
