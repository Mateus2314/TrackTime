# Database Migrations

Migrations SQL para o TrackTime.

## Como executar

### Opção 1: Manual via Supabase Dashboard (Recomendado)

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Crie uma **New Query**
4. Copie todo o conteúdo de `001_initial_schema.sql`
5. Cole no editor
6. Clique em **RUN**
7. Aguarde a confirmação (deve levar alguns segundos)

### Opção 2: Via CLI (Supabase local)

```bash
cd packages/database
supabase db push
```

## Como validar a criação do schema

Após executar a migration inicial, você deve validar se todas as tabelas e políticas foram criadas corretamente.

### Validação rápida (via Supabase Dashboard)

1. Vá em **SQL Editor**
2. Crie uma **New Query**
3. Copie o conteúdo de `validate_schema.sql`
4. Execute e verifique se todas as 8 tabelas foram criadas ✅

### Validação automática (via nodejs)

```bash
# No diretório raiz do projeto
npm run -w @tracktime/api test:schema
```

Isso executará uma bateria de 8 testes que verificam:
- ✅ Existência das 8 tabelas
- ✅ Seed data foi inserido
- ✅ RLS policies estão ativas
- ✅ Indexes foram criados
- ✅ Constraints estão enforçados
- ✅ Foreign key relationships existem
- ✅ Colunas críticas em time_entries
- ✅ Validações de constraints

### Checklist Visual (Supabase Dashboard)

Acesse **Database** → **Tables** e confirme:

- [ ] 8 tabelas criadas: `companies`, `users`, `employees`, `work_schedules`, `geofences`, `time_entries`, `approvals`, `audit_logs`
- [ ] Table `companies` tem 1 linha (seed: "TrackTime Dev")
- [ ] RLS está **On** para todas as tabelas (ícone 🔒 ao lado do nome da tabela)
- [ ] Colunas em `time_entries` incluem: `check_in_time`, `check_out_time`, `sync_status`, `facial_verification_check_in`, `is_late`, `is_overtime`
- [ ] Indexes criados: Vá em cada tabela → **Indexes** tab

## Migrações

- **001_initial_schema.sql** - Schema inicial multi-tenant com RLS (406 linhas)
  - 8 tabelas core
  - Row Level Security (RLS) em todas as tabelas
  - 36+ indexes para performance
  - 25+ constraints para data integrity
  - Helper functions para JWT-based multi-tenancy
  - Seed data (company padrão)

- **validate_schema.sql** - Script de validação rápida
  - Verifica existência de tabelas
  - Conta policies RLS
  - Valida seed data
  - Confirma indexes e constraints

## Output esperado de validate_schema.sql

```
TABLES | 8 | companies, employees, ...
SEED_DATA | 1 | TrackTime Dev company exists
RLS_POLICIES | public.time_entries | 3
RLS_POLICIES | public.employees | 2
...
FINAL VALIDATION REPORT | ✅ SCHEMA CREATION SUCCESSFUL
```
