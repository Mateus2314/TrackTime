-- ========================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- ========================================

-- ============================================================
-- 1. FIX PUBLIC.USERS TABLE
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_for_authenticated" ON public.users;
DROP POLICY IF EXISTS "allow_select_own_user" ON public.users;
DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;

-- Allow INSERT when auth_id matches
CREATE POLICY "allow_insert_for_authenticated"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Allow SELECT of own record
CREATE POLICY "allow_select_own_user"
ON public.users FOR SELECT
USING (auth.uid() = auth_id);

-- Allow UPDATE of own record
CREATE POLICY "allow_update_own_user"
ON public.users FOR UPDATE
USING (auth.uid() = auth_id);

-- ============================================================
-- 2. FIX PUBLIC.COMPANIES TABLE
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_service_insert_companies" ON public.companies;
DROP POLICY IF EXISTS "allow_view_companies" ON public.companies;

-- Allow INSERT (for triggers and service role)
CREATE POLICY "allow_service_insert_companies"
ON public.companies FOR INSERT
WITH CHECK (true);

-- Allow SELECT if user is an employee
CREATE POLICY "allow_view_companies"
ON public.companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- 3. FIX PUBLIC.EMPLOYEES TABLE
-- ============================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_service_insert_employees" ON public.employees;
DROP POLICY IF EXISTS "allow_view_own_employee" ON public.employees;
DROP POLICY IF EXISTS "allow_update_own_employee" ON public.employees;

-- Allow INSERT (for triggers and service role)
CREATE POLICY "allow_service_insert_employees"
ON public.employees FOR INSERT
WITH CHECK (true);

-- Allow SELECT own employee record
CREATE POLICY "allow_view_own_employee"
ON public.employees FOR SELECT
USING (user_id = auth.uid());

-- Allow UPDATE own employee record
CREATE POLICY "allow_update_own_employee"
ON public.employees FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================
-- 4. VERIFY ALL POLICIES
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('users', 'companies', 'employees')
ORDER BY tablename, policyname;
