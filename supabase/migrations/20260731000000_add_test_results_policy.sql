-- Add INSERT policy for test_results table
-- This allows users to create their own test results

begin;

-- Test Results policies
CREATE POLICY test_results_insert_own ON public.test_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY test_results_update_own ON public.test_results
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY test_results_read_own ON public.test_results
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Grant permissions
GRANT INSERT, UPDATE, SELECT ON public.test_results TO authenticated;
GRANT ALL ON public.test_results TO service_role;

commit;