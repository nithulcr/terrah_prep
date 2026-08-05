# How to Apply Database Migrations

The errors you're seeing (406 status codes) indicate that the database tables haven't been created yet. Follow these steps to apply the migrations:

## Step 1: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

## Step 2: Link Your Project

```bash
cd c:/Users/ASUS/Desktop/terrah-Qbank
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

## Step 3: Apply Migrations

```bash
supabase db push
```

This will apply all pending migrations including:
- `20260804000001_create_question_reports_and_points_tables.sql`
- `20260804000002_add_redeem_plan_function.sql`
- `20260804000003_fix_user_points_rls.sql`

## Alternative: Manual Migration (if CLI doesn't work)

If you prefer to apply migrations manually via the Supabase dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of each migration file in order:
   - First: `supabase/migrations/20260804000001_create_question_reports_and_points_tables.sql`
   - Second: `supabase/migrations/20260804000002_add_redeem_plan_function.sql`
   - Third: `supabase/migrations/20260804000003_fix_user_points_rls.sql`
6. Click **Run** for each migration

## Step 4: Verify Migration

After applying migrations, verify the tables were created:

```sql
-- Run this in SQL Editor to check
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('question_reports', 'user_points', 'point_transactions', 'lucky_spin_history');
```

You should see all 4 tables listed.

## Step 5: Restart Your App

```bash
# Stop the dev server (Ctrl+C) and restart
npm run dev
```

## Troubleshooting

### If you get "relation already exists" errors:
This means the table was partially created. Drop it and retry:

```sql
DROP TABLE IF EXISTS lucky_spin_history CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS question_reports CASCADE;
```

Then re-apply migration 1.

### If RLS policies still don't work:
Check the current policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('user_points', 'question_reports', 'point_transactions', 'lucky_spin_history');
```

### To verify RLS is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_points', 'question_reports', 'point_transactions', 'lucky_spin_history');
```

All should show `rowsecurity = true`.

## Quick Test

After applying migrations, test the system:

1. Log in to your app
2. Go to any mock test
3. Click "Report Question" on a question
4. Submit a report
5. Check if the error is gone

The points system should now work correctly!