-- ============================================
-- Terrah Qbank - UPDATE PLAN FEATURES
-- ============================================

-- Update plans with new feature structure
-- Remove allow_analytics and add allow_previous_year_questions

-- First, let's update existing plans with new feature flags

-- FREE Plan
UPDATE plans 
SET 
  price = 0,
  duration_days = NULL, -- Lifetime
  daily_question_limit = 0, -- No daily limit (only lifetime)
  monthly_mock_test_limit = 0, -- No monthly tests
  lifetime_question_limit = 100,
  allow_bookmarks = false,
  allow_review_answers = false,
  allow_performance_dashboard = false,
  allow_pdf_download = false,
  allow_previous_year_questions = false,
  priority_support = false,
  max_device_sessions = 1
WHERE slug = 'free';

-- STARTER Plan
UPDATE plans 
SET 
  price = 99,
  duration_days = 30,
  daily_question_limit = 100,
  monthly_mock_test_limit = 15,
  lifetime_question_limit = NULL, -- Unlimited
  allow_bookmarks = false,
  allow_review_answers = false,
  allow_performance_dashboard = false,
  allow_pdf_download = false,
  allow_previous_year_questions = false,
  priority_support = false,
  max_device_sessions = 2
WHERE slug = 'starter';

-- PRO Plan
UPDATE plans 
SET 
  price = 199,
  duration_days = 30,
  daily_question_limit = 100,
  monthly_mock_test_limit = 30,
  lifetime_question_limit = NULL, -- Unlimited
  allow_bookmarks = true,
  allow_review_answers = true,
  allow_performance_dashboard = false,
  allow_pdf_download = false,
  allow_previous_year_questions = false,
  priority_support = false,
  max_device_sessions = 3
WHERE slug = 'pro';

-- ELITE Plan (Most Popular)
UPDATE plans 
SET 
  price = 299,
  duration_days = 30,
  daily_question_limit = 100,
  monthly_mock_test_limit = 30,
  lifetime_question_limit = NULL, -- Unlimited
  allow_bookmarks = true,
  allow_review_answers = true,
  allow_performance_dashboard = true,
  allow_pdf_download = true,
  allow_previous_year_questions = false,
  priority_support = false,
  max_device_sessions = 5
WHERE slug = 'elite';

-- PREMIUM Plan
UPDATE plans 
SET 
  price = 399,
  duration_days = 30,
  daily_question_limit = 100,
  monthly_mock_test_limit = 30,
  lifetime_question_limit = NULL, -- Unlimited
  allow_bookmarks = true,
  allow_review_answers = true,
  allow_performance_dashboard = true,
  allow_pdf_download = true,
  allow_previous_year_questions = true,
  priority_support = true,
  max_device_sessions = 10
WHERE slug = 'premium';

-- Add comment
COMMENT ON TABLE plans IS 'Subscription plans with feature flags for Terrah Qbank';