# 🏗️ Arquitetura TrackTime

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                │
├──────────────────────┬──────────────────────┬───────────────────┤
│   📱 Mobile App      │   🌐 Web App         │   🖥️ Desktop      │
│   (React Native)     │   (Next.js)          │   (Futuro)        │
│   iOS / Android      │   React              │                   │
└──────────────────────┴──────────────────────┴───────────────────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │    (Express/NestJS)       │
                    │    Port: 3001             │
                    └─────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐ ┌──────▼──────┐  ┌────────▼────────┐
    │   Supabase        │ │    Redis    │  │  External APIs  │
    │   - PostgreSQL    │ │   - Cache   │  │  - AWS Rekogn.  │
    │   - Auth          │ │   - Queues  │  │  - Azure Face   │
    │   - Storage       │ │   - Session │  │  - Push (FCM)   │
    │   - RLS           │ │             │  │                 │
    └───────────────────┘ └─────────────┘  └─────────────────┘
```

## Camadas da Aplicação

### 1. Frontend Layer

#### Mobile (React Native)
```
apps/mobile/
├── src/
│   ├── screens/          # Telas do app
│   │   ├── Auth/
│   │   ├── Home/
│   │   ├── TimeEntry/
│   │   ├── History/
│   │   └── Profile/
│   ├── components/       # Componentes reutilizáveis
│   ├── navigation/       # React Navigation setup
│   ├── services/         # API calls, sync logic
│   ├── store/            # Zustand stores
│   ├── database/         # WatermelonDB models
│   ├── hooks/            # Custom hooks
│   └── utils/            # Helpers
```

**Características:**
- Offline-first com WatermelonDB
- Sincronização em background
- Biometria local (Face ID/Touch ID)
- Geolocalização GPS
- Push notifications (FCM)
- Camera para facial recognition

#### Web (Next.js)
```
apps/web/
├── app/                  # App Router (Next.js 14+)
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── employees/
│   ├── reports/
│   └── settings/
├── components/           # React components
├── lib/                  # Utilities
└── public/               # Static assets
```

**Características:**
- Server-side rendering
- Dashboards avançados
- Relatórios complexos
- Gestão administrativa

### 2. Backend Layer

#### API (Node.js + Express)
```
apps/api/
├── src/
│   ├── routes/           # Definição de rotas
│   │   ├── auth.ts
│   │   ├── employees.ts
│   │   ├── time-entries.ts
│   │   ├── approvals.ts
│   │   ├── reports.ts
│   │   └── sync.ts
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── time-entry.service.ts
│   │   ├── sync.service.ts
│   │   ├── facial.service.ts
│   │   └── report.service.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── config/           # Configuration
│   └── utils/            # Helpers
```

**Endpoints Principais:**
- `POST /api/auth/login` - Autenticação
- `POST /api/time-entries/check-in` - Registrar entrada
- `POST /api/time-entries/check-out` - Registrar saída
- `POST /api/sync` - Sincronização offline
- `POST /api/face-recognition/verify` - Verificar face
- `POST /api/reports/generate` - Gerar relatórios

### 3. Data Layer

#### Database Schema (PostgreSQL)

```sql
-- Multi-tenancy: todas tabelas têm company_id

companies
├── id (uuid, PK)
├── name
├── slug (unique)
├── settings (jsonb)
└── created_at

users
├── id (uuid, PK)
├── email (unique)
├── full_name
└── created_at

employees (junction: user ↔ company)
├── id (uuid, PK)
├── user_id (FK → users)
├── company_id (FK → companies)
├── role (enum)
├── work_schedule (jsonb)
└── facial_recognition_id

time_entries
├── id (uuid, PK)
├── company_id (FK → companies)
├── employee_id (FK → employees)
├── check_in_time
├── check_out_time
├── check_in_location (point)
├── status (enum)
└── sync_status (enum)

geofences
├── id (uuid, PK)
├── company_id (FK → companies)
├── name
├── location (point)
└── radius_meters

approvals
├── id (uuid, PK)
├── company_id (FK → companies)
├── employee_id (FK → employees)
├── manager_id (FK → employees)
├── time_entry_ids (uuid[])
└── status (enum)
```

**Row Level Security (RLS):**
```sql
-- Exemplo de policy
CREATE POLICY "Users can only see their company data"
ON time_entries
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM employees 
    WHERE user_id = auth.uid()
  )
);
```

### 4. Shared Packages

```
packages/
├── types/                # TypeScript types
│   ├── entities.ts       # Database entities
│   └── api.ts            # API request/response types
│
├── ui/                   # Shared UI components
│   ├── Button/
│   ├── Card/
│   └── Input/
│
├── database/             # Database utilities
│   ├── client.ts         # Supabase client
│   ├── queries.ts        # Typed queries
│   └── migrations/       # SQL migrations
│
└── utils/                # Shared utilities
    ├── date.ts
    ├── validation.ts
    └── calculations.ts
```

## Fluxo de Dados

### Check-in Flow (Offline-first)

```
1. Usuário toca em "Check In" no mobile
   ↓
2. Captura localização GPS
   ↓
3. (Opcional) Captura foto para facial recognition
   ↓
4. Salva localmente no WatermelonDB
   status: PENDING_SYNC
   ↓
5. UI atualiza instantaneamente (Optimistic Update)
   ↓
6. Background sync detecta conectividade
   ↓
7. Envia para API: POST /api/time-entries/check-in
   ↓
8. API valida:
   - Autenticação JWT
   - Multi-tenancy (company_id)
   - Geofence (se requerido)
   - Facial recognition (se requerido)
   ↓
9. Salva no PostgreSQL via Supabase
   ↓
10. Retorna ID do servidor
   ↓
11. Mobile atualiza registro local:
    sync_status: SYNCED
    server_id: <uuid>
```

### Multi-tenancy Flow

```
1. Usuário faz login
   ↓
2. JWT contém: user_id, companies[]
   ↓
3. Usuário seleciona empresa ativa
   ↓
4. Todos requests incluem: company_id no context
   ↓
5. RLS no PostgreSQL filtra automaticamente:
   WHERE company_id = current_company_id()
   ↓
6. Dados isolados por empresa ✅
```

## Performance & Escalabilidade

### Caching Strategy (Redis)

- **Session Storage**: JWT sessions, refresh tokens
- **Rate Limiting**: Limitar requests por usuário/IP
- **Query Cache**: Cache de queries frequentes (dashboards)
- **Job Queues**: Background jobs (relatórios, sync)

### Optimizations

**Mobile:**
- WatermelonDB lazy loading
- Image compression antes upload
- Batch sync (múltiplos registros de uma vez)
- Background fetch iOS/Android

**Backend:**
- Database indexes em company_id, employee_id, date
- Materialized views para relatórios
- Pagination em todas listagens
- CDN para assets estáticos

**Database:**
- Connection pooling
- Read replicas (futuro)
- Partitioning por company_id (se necessário)

## Segurança

### Camadas de Segurança

```
┌─────────────────────────────────────┐
│  1. Client-side Validation          │
│     - Zod schemas                   │
│     - Input sanitization            │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  2. API Authentication              │
│     - JWT verification              │
│     - Rate limiting                 │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  3. Authorization                   │
│     - Role-based access control     │
│     - Permission checks             │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  4. Database Level (RLS)            │
│     - Row Level Security            │
│     - Multi-tenant isolation        │
└─────────────────────────────────────┘
```

### Dados Sensíveis

- **Senhas**: Hashed (bcrypt via Supabase)
- **JWT Secrets**: Environment variables
- **Imagens Faciais**: Encrypted storage (Supabase)
- **GPS Coordinates**: Validadas server-side
- **Audit Logs**: Todas operações críticas

## Deployment Architecture (Futuro)

```
┌─────────────────────────────────────────────────┐
│              Load Balancer                      │
└────────────┬────────────────────────┬───────────┘
             │                        │
   ┌─────────▼─────────┐   ┌─────────▼─────────┐
   │   API Server 1    │   │   API Server 2    │
   │   (Docker)        │   │   (Docker)        │
   └─────────┬─────────┘   └─────────┬─────────┘
             │                        │
             └────────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │  Supabase (Managed)   │
              │  - PostgreSQL HA      │
              │  - Backups            │
              └───────────────────────┘
```

**Hosting Options:**
- API: AWS ECS, Google Cloud Run, Railway, Render
- Web: Vercel, Netlify
- Mobile: App Store, Google Play
- Database: Supabase Cloud (managed)

## Monitoring & Observability

- **Error Tracking**: Sentry
- **Logs**: Winston → CloudWatch/DataDog
- **Metrics**: Prometheus + Grafana
- **Uptime**: StatusPage.io
- **Analytics**: PostHog, Mixpanel

---

Para mais detalhes, consulte o [README.md](README.md) principal.
