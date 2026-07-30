-- Update app_settings with additional configuration values
-- This migration adds missing settings that were added to the AppSettings interface

begin;

-- Insert or update additional settings
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
  ('questions_per_category', '0', 'Questions to select per category (0 = no limit)'),
  ('daily_question_limit', '10', 'Daily question limit for premium users'),
  ('monthly_mock_test_limit', '30', 'Monthly mock test limit for premium users'),
  ('marks_per_question', '1', 'Marks awarded per correct answer'),
  ('allow_bookmarks', 'true', 'Allow users to bookmark questions'),
  ('allow_review', 'true', 'Allow users to review answers after test'),
  ('allow_pdf_download', 'false', 'Allow PDF download of test results'),
  ('show_explanation_after_test', 'true', 'Show explanations after test submission')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

commit;
