# 🕐 TrackTime

Sistema multi-tenant de controle de ponto mobile-first com suporte offline, geolocalização, reconhecimento facial e aprovação de horas.

## 📋 Visão Geral

TrackTime é uma plataforma completa para gestão de jornada de trabalho que inclui:

- ✅ **Check-in/Check-out** com timer em tempo real
- 📍 **Geolocalização GPS** para validação de presença
- 👤 **Reconhecimento Facial** para verificação de identidade
- 📱 **Mobile-first** com React Native (iOS e Android)
- 🌐 **Web App** para gestores e administradores
- 🔄 **Offline-first** com sincronização automática
- 🏢 **Multi-tenant** com isolamento completo de dados
- 📊 **Relatórios e Dashboards** executivos
- ✅ **Aprovação de horas** com workflow
- 🔒 **Segurança e compliance** (LGPD/GDPR)

## 🏗️ Arquitetura

### Monorepo Structure

```
tracktime/
├── apps/
│   ├── mobile/          # React Native app (iOS & Android)
│   ├── web/             # Next.js web application
│   └── api/             # Node.js backend API
├── packages/
│   ├── types/           # TypeScript types compartilhados
│   ├── ui/              # Componentes UI reutilizáveis
│   ├── database/        # Supabase client e queries
│   └── utils/           # Utilitários compartilhados
├── docker/              # Docker configuration
└── docs/                # Documentação adicional
```

### Tech Stack

**Frontend Mobile:**
- React Native
- React Navigation
- WatermelonDB (offline storage)
- Zustand (state management)
- React Query (server state)

**Frontend Web:**
- Next.js 14+ (App Router)
- React
- Tailwind CSS
- Recharts (visualizações)

**Backend:**
- Node.js 20+
- Express / NestJS
- Supabase (PostgreSQL + Auth + Storage)
- Redis (cache & queues)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Turborepo (monorepo management)

## 🚀 Getting Started

### Pré-requisitos

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** e **Docker Compose**
- Para mobile:
  - React Native CLI
  - Android Studio (Android)
  - Xcode (iOS - apenas macOS)

### 1. Instalação

Clone o repositório e instale as dependências:

```bash
# Clone o projeto
git clone https://github.com/your-org/tracktime.git
cd tracktime

# Instale as dependências do monorepo
npm install
```

### 2. Configuração do Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

1. **Supabase** (crie um projeto em https://supabase.com):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

2. **JWT Secret** (gere uma chave segura):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Outras variáveis conforme necessário

### 3. Iniciar os Serviços com Docker

O Docker Compose gerencia o banco de dados PostgreSQL, Redis e a API:

```bash
# Iniciar todos os serviços
npm run docker:up

# Verificar logs
npm run docker:logs

# Parar os serviços
npm run docker:down

# Limpar volumes (⚠️ apaga dados)
npm run docker:clean
```

#### Serviços Disponíveis

| Serviço | URL | Descrição |
|---------|-----|-----------|
| PostgreSQL | `localhost:5432` | Banco de dados principal |
| Redis | `localhost:6379` | Cache e filas |
| API | `http://localhost:3001` | Backend REST API |
| Supabase Studio | `http://localhost:54323` | UI do Supabase |

### 4. Desenvolvimento

#### Backend API

```bash
# Desenvolvimento (já roda no Docker)
npm run docker:up

# Ou rodar localmente (sem Docker)
cd apps/api
npm install
npm run dev
```

#### Mobile App

```bash
cd apps/mobile
npm install

# iOS
npm run ios

# Android
npm run android

# Expo (se usar Expo)
npm start
```

#### Web App

```bash
cd apps/web
npm install
npm run dev
```

Acesse: http://localhost:3000

### 5. Build dos Packages

```bash
# Build de todos os packages
npm run build

# Build de um package específico
cd packages/types
npm run build
```

## 📦 Packages

### @tracktime/types

Types TypeScript compartilhados entre todos os projetos:
- Entidades (User, Company, TimeEntry, etc)
- API types (requests/responses)
- Enums e constantes

```typescript
import { TimeEntry, Employee, CheckInRequest } from '@tracktime/types';
```

### @tracktime/ui

Componentes UI reutilizáveis para mobile e web:
- Button, Card, Input, DatePicker
- Design tokens e temas
- Conditional exports para React/React Native

```typescript
import { Button, Card } from '@tracktime/ui';
```

### @tracktime/database

Cliente Supabase e queries tipadas:
- Configuração do Supabase client
- Queries reutilizáveis
- Migrations
- RLS policies

```typescript
import { supabase, getTimeEntries } from '@tracktime/database';
```

### @tracktime/utils

Utilitários compartilhados:
- Formatação de datas/horas
- Validações
- Helpers diversos

```typescript
import { formatDuration, calculateOvertime } from '@tracktime/utils';
```

## 🗄️ Banco de Dados

### Migrations

As migrations estão em `packages/database/migrations/`:

```bash
# Criar uma nova migration
cd packages/database
npm run migration:create nome-da-migration

# Executar migrations
npm run migration:up

# Reverter última migration
npm run migration:down
```

### Schema Principal

- `companies` - Organizações (multi-tenant)
- `users` - Contas de usuários
- `employees` - Vínculo user-company + role
- `time_entries` - Registros de ponto
- `work_schedules` - Horários de trabalho
- `geofences` - Locais permitidos
- `approvals` - Aprovações de timesheet
- `audit_logs` - Logs de auditoria

### Row Level Security (RLS)

Todas as tabelas usam RLS para isolamento multi-tenant automático. Usuários só acessam dados da sua empresa.

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes com coverage
npm run test:coverage

# Testes E2E mobile (Detox)
cd apps/mobile
npm run test:e2e

# Testes E2E web (Playwright)
cd apps/web
npm run test:e2e
```

## 📱 Features Principais

### 1. Check-in/Check-out

- Botão central para registrar entrada/saída
- Timer em tempo real mostrando duração da jornada
- Funciona offline com sincronização posterior
- Suporta múltiplos métodos: manual, GPS, facial, biometria

### 2. Geolocalização

- Captura de coordenadas GPS em cada registro
- Validação de geofence (funcionário dentro do perímetro)
- Configuração de múltiplos locais de trabalho
- Tratamento de permissões iOS/Android

### 3. Reconhecimento Facial

- Cadastro facial com múltiplas fotos
- Verificação no check-in/check-out
- Integração com AWS Rekognition ou Azure Face API
- Fallback para senha se facial falhar
- Compliance com LGPD (consentimento + direito de exclusão)

### 4. Offline-First

- Dados armazenados localmente com WatermelonDB
- Queue de operações pendentes
- Sincronização automática ao voltar online
- Resolução de conflitos
- Indicadores visuais de status de sync

### 5. Multi-tenant

- Isolamento completo de dados via RLS
- Um usuário pode pertencer a múltiplas empresas
- Configurações específicas por empresa
- Billing e assinaturas por empresa

### 6. Relatórios

- Horas trabalhadas por período
- Horas extras calculadas automaticamente
- Ausências e faltas
- Exportação em PDF, Excel, CSV
- Dashboards com gráficos interativos

### 7. Aprovação de Horas

- Criação de timesheets por período
- Workflow de aprovação (pending → approved/rejected)
- Comentários e solicitação de mudanças
- Notificações push para funcionários e gestores

## 🔒 Segurança

- ✅ Autenticação JWT via Supabase Auth
- ✅ Row Level Security (RLS) no PostgreSQL
- ✅ Imagens faciais criptografadas no storage
- ✅ Validação server-side de geolocalização (anti-spoofing)
- ✅ Audit logs de todas operações sensíveis
- ✅ Compliance LGPD/GDPR
- ✅ Permissões baseadas em roles

## 🎯 Roadmap

### MVP (Sprint 1-12) - 3 meses
- [x] Setup do monorepo e Docker
- [ ] Backend API + Database schema
- [ ] Auth e multi-tenancy
- [ ] Mobile: check-in/out básico
- [ ] GPS tracking
- [ ] Biometria local
- [ ] Histórico de registros
- [ ] Gestão de funcionários

### v1.0 (Sprint 13-18) - 2 meses
- [ ] Reconhecimento facial
- [ ] Aprovação de horas
- [ ] Relatórios básicos
- [ ] Notificações push
- [ ] Admin da empresa

### v2.0 (Sprint 19-27) - 4 meses
- [ ] Web app completo
- [ ] Relatórios avançados
- [ ] Testes E2E
- [ ] CI/CD completo
- [ ] Produção

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Convenções

- **Commits**: seguir [Conventional Commits](https://www.conventionalcommits.org/)
- **Branches**: `feature/`, `fix/`, `refactor/`, `docs/`
- **Code style**: Prettier e ESLint configurados
- **TypeScript**: strict mode habilitado

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 Email: support@tracktime.app
- 📖 Documentação: https://docs.tracktime.app
- 🐛 Issues: https://github.com/your-org/tracktime/issues

---

Desenvolvido com ❤️ pela equipe TrackTime
