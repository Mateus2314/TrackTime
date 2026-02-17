-- ========================================
-- FIX RLS POLICY FOR PUBLIC.USERS TABLE
-- This script must be run in Supabase SQL Editor with service role
-- ========================================

-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_insert_for_authenticated" ON public.users;
DROP POLICY IF EXISTS "allow_register" ON public.users;
DROP POLICY IF EXISTS "allow_select_own_user" ON public.users;
DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;

-- Policy 1: Allow INSERT only when auth_id matches the authenticated user
CREATE POLICY "allow_insert_for_authenticated"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Policy 2: Allow SELECT only their own record
CREATE POLICY "allow_select_own_user"
ON public.users FOR SELECT
USING (auth.uid() = auth_id);

-- Policy 3: Allow UPDATE only their own record
CREATE POLICY "allow_update_own_user"
ON public.users FOR UPDATE
USING (auth.uid() = auth_id);

-- Verify policies were created (this will show in Results)
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
