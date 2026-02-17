-- ==============================================
-- validate_schema.sql
-- Quick validation script to verify all tables and RLS
-- Run this in Supabase SQL Editor to confirm schema creation
-- ==============================================

-- Helper: Count tables
SELECT 
  'TABLES' as metric,
  COUNT(*)::text as count,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as names
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'companies', 'users', 'employees', 'work_schedules', 
    'geofences', 'time_entries', 'approvals', 'audit_logs'
  );

-- Helper: Seed data check
SELECT 
  'SEED_DATA' as check_type,
  COUNT(*)::text as count,
  'TrackTime Dev company exists' as details
FROM companies 
WHERE slug = 'tracktime-dev';

-- Helper: Count RLS policies by table
SELECT 
  'RLS_POLICIES' as metric,
  schemaname || '.' || tablename as table_name,
  COUNT(*)::text as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'companies', 'users', 'employees', 'work_schedules', 
    'geofences', 'time_entries', 'approvals', 'audit_logs'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Helper: Count indexes for performance optimization
SELECT 
  'INDEXES' as metric,
  tablename,
  COUNT(*)::text as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'companies', 'users', 'employees', 'work_schedules', 
    'geofences', 'time_entries', 'approvals', 'audit_logs'
  )
GROUP BY tablename
ORDER BY tablename;

-- Helper: Verify critical columns in time_entries
SELECT 
  'TIME_ENTRIES_COLUMNS' as check_type,
  CASE 
    WHEN COUNT(*) >= 20 THEN 'OK - ' || COUNT(*) || ' columns found'
    ELSE 'ERROR - Only ' || COUNT(*) || ' columns found'
  END as status
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
  AND table_schema = 'public';

-- Helper: Check RLS is enabled on all tables
SELECT 
  'RLS_ENABLED' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ Enabled'
    ELSE '✗ Disabled'
  END as status
FROM pg_class 
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
WHERE pg_namespace.nspname = 'public' 
  AND pg_class.relname IN (
    'companies', 'users', 'employees', 'work_schedules', 
    'geofences', 'time_entries', 'approvals', 'audit_logs'
  )
ORDER BY relname;

-- Helper: Sample of functions created
SELECT 
  'FUNCTIONS' as metric,
  COUNT(*)::text as count,
  STRING_AGG(proname, ', ' ORDER BY proname) as names
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND proname LIKE 'get_%';

-- Helper: Verify constraints on time_entries
SELECT 
  'CONSTRAINTS' as metric,
  'time_entries' as table_name,
  COUNT(*)::text as count
FROM information_schema.constraint_column_usage 
WHERE table_name = 'time_entries' 
  AND table_schema = 'public';

-- Summary report
WITH table_counts AS (
  SELECT 
    COUNT(*) as total_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN (
      'companies', 'users', 'employees', 'work_schedules', 
      'geofences', 'time_entries', 'approvals', 'audit_logs'
    )
),
rls_counts AS (
  SELECT 
    COUNT(DISTINCT tablename) as tables_with_rls
  FROM pg_policies 
  WHERE schemaname = 'public'
),
index_counts AS (
  SELECT 
    COUNT(*) as total_indexes
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND tablename IN (
      'companies', 'users', 'employees', 'work_schedules', 
      'geofences', 'time_entries', 'approvals', 'audit_logs'
    )
)
SELECT 
  'FINAL VALIDATION REPORT' as report_name,
  (SELECT total_tables FROM table_counts)::text || ' / 8 tables' as tables_status,
  (SELECT tables_with_rls FROM rls_counts)::text || ' / 8 RLS enabled' as rls_status,
  (SELECT total_indexes FROM index_counts)::text || ' indexes created' as index_status,
  CASE 
    WHEN (SELECT total_tables FROM table_counts) = 8 
      AND (SELECT tables_with_rls FROM rls_counts) >= 6
      AND (SELECT total_indexes FROM index_counts) >= 30
    THEN '✅ SCHEMA CREATION SUCCESSFUL'
    ELSE '⚠️ SCHEMA CREATION INCOMPLETE'
  END as final_status;
