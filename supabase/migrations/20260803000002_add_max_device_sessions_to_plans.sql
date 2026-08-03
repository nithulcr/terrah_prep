-- ============================================
-- TERRAH PREP - ADD MAX DEVICE SESSIONS TO PLANS
-- ============================================

-- Add max_device_sessions column to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS max_device_sessions INTEGER NOT NULL DEFAULT 1;

-- Add comment
COMMENT ON COLUMN plans.max_device_sessions IS 'Maximum number of concurrent device sessions allowed for this plan';

-- Update existing plans with default values
-- FREE plan: 1 device
UPDATE plans 
SET max_device_sessions = 1 
WHERE slug = 'free' AND max_device_sessions IS NULL;

-- STARTER plan: 2 devices
UPDATE plans 
SET max_device_sessions = 2 
WHERE slug = 'starter' AND max_device_sessions IS NULL;

-- PRO plan: 3 devices
UPDATE plans 
SET max_device_sessions = 3 
WHERE slug = 'pro' AND max_device_sessions IS NULL;

-- ELITE plan: 5 devices
UPDATE plans 
SET max_device_sessions = 5 
WHERE slug = 'elite' AND max_device_sessions IS NULL;

-- PREMIUM plan: 10 devices
UPDATE plans 
SET max_device_sessions = 10 
WHERE slug = 'premium' AND max_device_sessions IS NULL;