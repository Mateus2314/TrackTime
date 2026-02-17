-- ========================================
-- FIX RLS POLICY FOR PUBLIC.USERS TABLE
-- ========================================
-- This script enables authenticated users to register by allowing INSERT into public.users

-- First, let's see existing policies on users table
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists (optional, for cleanup)
DROP POLICY IF EXISTS "allow_insert_for_authenticated" ON public.users;
DROP POLICY IF EXISTS "allow_register" ON public.users;

-- Create new policy: Allow authenticated users to INSERT (register)
CREATE POLICY "allow_insert_for_authenticated"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Create read policy: Allow users to read their own record
DROP POLICY IF EXISTS "allow_select_own_user" ON public.users;
CREATE POLICY "allow_select_own_user"
ON public.users
FOR SELECT
USING (auth.uid() = auth_id);

-- Create update policy: Allow users to update their own record
DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;
CREATE POLICY "allow_update_own_user"
ON public.users
FOR UPDATE
USING (auth.uid() = auth_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, QUAL, WITH_CHECK
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
