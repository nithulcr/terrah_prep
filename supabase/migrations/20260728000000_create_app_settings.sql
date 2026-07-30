-- App Settings table for dynamic configuration
-- This allows admins to configure the app without code changes

begin;

CREATE TABLE IF NOT EXISTS public.app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS app_settings_key_idx ON public.app_settings(setting_key);

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
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
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
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
