-- ============================================
-- Terrah Qbank - DEVICE SESSIONS TABLE
-- ============================================

-- Create device_sessions table
CREATE TABLE IF NOT EXISTS device_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  browser TEXT NOT NULL,
  os TEXT NOT NULL,
  device_name TEXT NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one active session per device per user
  CONSTRAINT unique_active_device_per_user UNIQUE (user_id, device_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_is_active ON device_sessions(is_active);

-- Enable Row Level Security
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own device sessions
CREATE POLICY "Users can view their own device sessions"
  ON device_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own device sessions
CREATE POLICY "Users can insert their own device sessions"
  ON device_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own device sessions
CREATE POLICY "Users can update their own device sessions"
  ON device_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own device sessions
CREATE POLICY "Users can delete their own device sessions"
  ON device_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON device_sessions TO authenticated;
GRANT ALL ON device_sessions TO service_role;

-- Add comment
COMMENT ON TABLE device_sessions IS 'Tracks active device sessions for multi-device management';