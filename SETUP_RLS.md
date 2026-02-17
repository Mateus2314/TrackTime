# 🔧 Como Executar a Correção RLS no Supabase

## Passo 1: Acesse seu projeto Supabase
1. Abra https://app.supabase.com
2. Selecione seu projeto **TrackTime**

## Passo 2: Vá para SQL Editor
- No menu esquerdo, clique em **"SQL Editor"**

## Passo 3: Crie uma nova query
- Clique no botão **"+ New query"**
- Ou clique em **"New"** → **"SQL query"**

## Passo 4: Cole o SQL abaixo
```sql
-- ========================================
-- FIX RLS POLICY FOR PUBLIC.USERS TABLE
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

-- Verify policies were created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

## Passo 5: Execute a query
- Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
- Você verá uma mensagem de sucesso ao final

## Passo 6: Confirme as policies foram criadas
- A última query SELECT deve retornar 3 linhas:
  - `allow_insert_for_authenticated`
  - `allow_select_own_user`  
  - `allow_update_own_user`

## ✅ Pronto!
Depois disso, volte e rode:
```bash
npm run -w @tracktime/api test:auth
```

Os testes devem passar agora! 🎉
