-- Seed data is also embedded in the subscription migration for fresh installs.
-- Run this file only to restore the canonical plan catalogue.
insert into public.plans (name, slug, description, price, duration_days, daily_question_limit, monthly_mock_test_limit, lifetime_question_limit, allow_result_history, allow_pdf_download, allow_analytics, allow_bookmarks, allow_review_answers, allow_performance_dashboard, priority_support, is_active)
values
  ('FREE', 'free', 'Free practice access', 0, null, 0, 0, 20, false, false, false, false, true, false, false, true),
  ('STARTER', 'starter', 'Starter monthly preparation plan', 99, 30, 50, 15, null, true, false, true, true, true, false, false, true),
  ('PRO', 'pro', 'Pro monthly preparation plan', 299, 30, 100, 30, null, true, true, true, true, true, true, false, true),
  ('PREMIUM', 'premium', 'Premium quarterly preparation plan', 599, 90, 250, 100, null, true, true, true, true, true, true, true, true),
  ('ELITE', 'elite', 'Elite annual unlimited preparation plan', 1499, 365, null, null, null, true, true, true, true, true, true, true, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, price = excluded.price,
  duration_days = excluded.duration_days, daily_question_limit = excluded.daily_question_limit,
  monthly_mock_test_limit = excluded.monthly_mock_test_limit, lifetime_question_limit = excluded.lifetime_question_limit,
  allow_result_history = excluded.allow_result_history, allow_pdf_download = excluded.allow_pdf_download,
  allow_analytics = excluded.allow_analytics, allow_bookmarks = excluded.allow_bookmarks,
  allow_review_answers = excluded.allow_review_answers,
  allow_performance_dashboard = excluded.allow_performance_dashboard,
  priority_support = excluded.priority_support, is_active = excluded.is_active;
