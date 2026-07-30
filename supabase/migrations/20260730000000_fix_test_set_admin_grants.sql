-- Allow verified admin users to generate test sets without requiring a service-role key.
-- RLS still restricts writes to public.is_admin(); these grants only give authenticated
-- users the table privileges needed for the admin policy to take effect.

begin;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_set_questions TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.test_sets_id_seq') IS NOT NULL THEN
    GRANT USAGE, SELECT ON SEQUENCE public.test_sets_id_seq TO authenticated;
  END IF;

  IF to_regclass('public.test_set_questions_id_seq') IS NOT NULL THEN
    GRANT USAGE, SELECT ON SEQUENCE public.test_set_questions_id_seq TO authenticated;
  END IF;
END $$;

DROP POLICY IF EXISTS test_sets_admin_manage ON public.test_sets;
CREATE POLICY test_sets_admin_manage ON public.test_sets
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS test_set_questions_admin_manage ON public.test_set_questions;
CREATE POLICY test_set_questions_admin_manage ON public.test_set_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

commit;
