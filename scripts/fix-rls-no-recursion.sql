-- ========================================
-- COMPREHENSIVE RLS FIX - SEM RECURSÃO
-- ========================================

-- ============================================================
-- 1. SIMPLIFICAR PUBLIC.USERS TABLE
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_for_authenticated" ON public.users;
DROP POLICY IF EXISTS "allow_select_own_user" ON public.users;
DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;

-- Permitir tudo durante INSERT (trigger)
CREATE POLICY "users_insert_policy"
ON public.users FOR INSERT
WITH CHECK (true);

-- Permitir SELECT próprio
CREATE POLICY "users_select_policy"
ON public.users FOR SELECT
USING (auth.uid() = auth_id);

-- Permitir UPDATE próprio
CREATE POLICY "users_update_policy"
ON public.users FOR UPDATE
USING (auth.uid() = auth_id);

-- ============================================================
-- 2. SIMPLIFICAR PUBLIC.COMPANIES TABLE
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_service_insert_companies" ON public.companies;
DROP POLICY IF EXISTS "allow_view_companies" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;

-- Permitir INSERT
CREATE POLICY "companies_insert_policy"
ON public.companies FOR INSERT
WITH CHECK (true);

-- Permitir SELECT de todas (temporário para testing)
CREATE POLICY "companies_select_policy"
ON public.companies FOR SELECT
USING (true);

-- ============================================================
-- 3. SIMPLIFICAR PUBLIC.EMPLOYEES TABLE
-- ============================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_service_insert_employees" ON public.employees;
DROP POLICY IF EXISTS "allow_view_own_employee" ON public.employees;
DROP POLICY IF EXISTS "allow_update_own_employee" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;

-- Permitir INSERT
CREATE POLICY "employees_insert_policy"
ON public.employees FOR INSERT
WITH CHECK (true);

-- Permitir SELECT
CREATE POLICY "employees_select_policy"
ON public.employees FOR SELECT
USING (true);

-- Permitir UPDATE
CREATE POLICY "employees_update_policy"
ON public.employees FOR UPDATE
USING (true);

-- ============================================================
-- VERIFY ALL POLICIES
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('users', 'companies', 'employees')
ORDER BY tablename, policyname;
