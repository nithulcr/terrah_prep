-- ============================================
-- QUESTION REPORTS & REWARDS SYSTEM
-- ============================================

-- Question Reports Table
CREATE TABLE IF NOT EXISTS question_reports (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reward_points INTEGER DEFAULT 0,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point Transactions Table
CREATE TABLE IF NOT EXISTS point_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  reference_id INTEGER,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lucky Spin History Table
CREATE TABLE IF NOT EXISTS lucky_spin_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  points_deducted INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_spin_history_user_id ON lucky_spin_history(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_question_reports_updated_at BEFORE UPDATE ON question_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_spin_history ENABLE ROW LEVEL SECURITY;

-- Question Reports Policies
-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON question_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create reports
CREATE POLICY "Users can create reports" ON question_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update reports (approve/reject)
CREATE POLICY "Admins can update reports" ON question_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can view all reports
CREATE POLICY "Admins can view all reports" ON question_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User Points Policies
-- Users can view their own points
CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

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

-- Point Transactions Policies
-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can insert transactions
CREATE POLICY "Admins can create transactions" ON point_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Lucky Spin History Policies
-- Users can view their own spin history
CREATE POLICY "Users can view their own spin history" ON lucky_spin_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own spin records
CREATE POLICY "Users can create spin records" ON lucky_spin_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create user points record if not exists
CREATE OR REPLACE FUNCTION create_user_points_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_points (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user points on first report
CREATE TRIGGER create_user_points_on_report
  AFTER INSERT ON question_reports
  FOR EACH ROW EXECUTE FUNCTION create_user_points_if_not_exists();

-- Function to add points to user
CREATE OR REPLACE FUNCTION add_points_to_user(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_reference_id INTEGER DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Create or update user points
  INSERT INTO user_points (user_id, total_points, available_points)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = user_points.total_points + p_points,
      available_points = user_points.available_points + p_points;

  -- Record transaction
  INSERT INTO point_transactions (user_id, transaction_type, points, description, reference_id, reference_type)
  VALUES (p_user_id, p_transaction_type, p_points, p_description, p_reference_id, p_reference_type);
END;
$$ LANGUAGE plpgsql;

-- Function to deduct points from user
CREATE OR REPLACE FUNCTION deduct_points_from_user(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_available INTEGER;
BEGIN
  -- Check if user has enough points
  SELECT available_points INTO current_available
  FROM user_points
  WHERE user_id = p_user_id;

  IF current_available IS NULL OR current_available < p_points THEN
    RETURN FALSE;
  END IF;

  -- Deduct points
  UPDATE user_points
  SET available_points = available_points - p_points
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO point_transactions (user_id, transaction_type, points, description)
  VALUES (p_user_id, p_transaction_type, -p_points, p_description);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;