-- ========================================
-- CLEAN START: Remove todas as policies e recria do zero
-- ========================================

-- ============================================================
-- PASSO 1: REMOVER TODAS AS POLICIES EXISTENTES
-- ============================================================

-- Remove todas as policies da tabela users
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END $$;

-- Remove todas as policies da tabela companies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'companies' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', pol.policyname);
    END LOOP;
END $$;

-- Remove todas as policies da tabela employees
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'employees' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.employees', pol.policyname);
    END LOOP;
END $$;

-- ============================================================
-- PASSO 2: CRIAR NOVAS POLICIES (SEM RECURSÃO)
-- ============================================================

-- ============================================================
-- 1. PUBLIC.USERS TABLE
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT durante registro (sem validação de auth ainda)
CREATE POLICY "users_insert_policy"
ON public.users FOR INSERT
WITH CHECK (true);

-- Permitir SELECT do próprio registro
CREATE POLICY "users_select_policy"
ON public.users FOR SELECT
USING (auth.uid() = auth_id);

-- Permitir UPDATE do próprio registro
CREATE POLICY "users_update_policy"
ON public.users FOR UPDATE
USING (auth.uid() = auth_id);

-- ============================================================
-- 2. PUBLIC.COMPANIES TABLE
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT (para novos registros via trigger)
CREATE POLICY "companies_insert_policy"
ON public.companies FOR INSERT
WITH CHECK (true);

-- Permitir SELECT de todas as empresas (temporário para testes)
CREATE POLICY "companies_select_policy"
ON public.companies FOR SELECT
USING (true);

-- Permitir UPDATE
CREATE POLICY "companies_update_policy"
ON public.companies FOR UPDATE
USING (true);

-- ============================================================
-- 3. PUBLIC.EMPLOYEES TABLE
-- ============================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT (para novos funcionários via trigger)
CREATE POLICY "employees_insert_policy"
ON public.employees FOR INSERT
WITH CHECK (true);

-- Permitir SELECT de todos os funcionários (sem recursão!)
CREATE POLICY "employees_select_policy"
ON public.employees FOR SELECT
USING (true);

-- Permitir UPDATE
CREATE POLICY "employees_update_policy"
ON public.employees FOR UPDATE
USING (true);

-- ============================================================
-- VERIFICAR RESULTADO
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as "using_clause",
  with_check as "with_check_clause"
FROM pg_policies
WHERE tablename IN ('users', 'companies', 'employees')
  AND schemaname = 'public'
ORDER BY tablename, policyname;
