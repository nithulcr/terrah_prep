-- Fix RLS policy to allow users to create their own points record

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage points" ON user_points;

-- Create separate policies for different operations
-- Users can create their own points record
CREATE POLICY "Users can create their own points" ON user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update points
CREATE POLICY "Admins can update points" ON user_points
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete points
CREATE POLICY "Admins can delete points" ON user_points
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );