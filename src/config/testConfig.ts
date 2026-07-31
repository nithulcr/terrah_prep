// ============================================
// TERRAH PREP - CENTRALIZED TEST CONFIGURATION
// ============================================
// All fixed test configuration values live here.
// Only maintenance_mode remains in the app_settings table.
// allow_bookmarks and allow_review come from the plans table.

export const TEST_CONFIG = {
  TOTAL_QUESTIONS: 10,
  MARKS_PER_QUESTION: 1,
  NEGATIVE_MARK: 0.33,
  TEST_DURATION_MINUTES: 90,
  SHUFFLE_QUESTIONS: true,
  SHUFFLE_OPTIONS: true,
} as const;

export type TestConfig = typeof TEST_CONFIG;