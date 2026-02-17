# 🚀 Próximos Passos - TrackTime

## ✅ Concluído (Fase 0)

- [x] Estrutura do monorepo criada
- [x] Turborepo configurado
- [x] Docker Compose setup (PostgreSQL, Redis, API)
- [x] TypeScript configurado com paths aliases
- [x] ESLint e Prettier configurados
- [x] Package @tracktime/types com tipos compartilhados
- [x] Backend API básico (Express)
- [x] Documentação inicial (README, CONTRIBUTING)

## 📋 Sprint 1-2: Backend e Database (2-3 semanas)

### Tarefas Prioritárias

1. **Database Schema** (5 dias)
   - [ ] Criar migrations para schema inicial
   - [ ] Implementar tabelas: companies, users, employees
   - [ ] Implementar tabelas: time_entries, work_schedules
   - [ ] Implementar tabelas: geofences, approvals, audit_logs
   - [ ] Configurar RLS policies para multi-tenancy
   - [ ] Seed de dados para desenvolvimento

2. **Supabase Setup** (2 dias)
   - [ ] Criar projeto no Supabase (ou configurar local)
   - [ ] Configurar autenticação (email/password, OAuth)
   - [ ] Setup Storage para imagens faciais
   - [ ] Configurar variáveis de ambiente

3. **Backend API - Auth** (3 dias)
   - [ ] Endpoint POST /api/auth/register
   - [ ] Endpoint POST /api/auth/login
   - [ ] Endpoint POST /api/auth/refresh
   - [ ] Endpoint POST /api/auth/logout
   - [ ] Middleware de autenticação JWT
   - [ ] Validação com Zod

4. **Backend API - Employees** (2 dias)
   - [ ] Endpoint GET /api/employees (listar)
   - [ ] Endpoint POST /api/employees (criar)
   - [ ] Endpoint GET /api/employees/:id (detalhes)
   - [ ] Endpoint PUT /api/employees/:id (atualizar)
   - [ ] Middleware de permissões (role-based)

5. **Backend API - Time Entries** (3 dias)
   - [ ] Endpoint POST /api/time-entries/check-in
   - [ ] Endpoint POST /api/time-entries/check-out
   - [ ] Endpoint GET /api/time-entries (listar com filtros)
   - [ ] Endpoint PUT /api/time-entries/:id (editar)
   - [ ] Lógica de cálculo de late, overtime

6. **Package @tracktime/database** (2 dias)
   - [ ] Supabase client configurado
   - [ ] Queries tipadas para entidades principais
   - [ ] Helpers para multi-tenancy
   - [ ] Testes unitários

## 📋 Sprint 3-4: Mobile App Core (3-4 semanas)

1. **Setup React Native** (2 dias)
   - [ ] Inicializar projeto React Native
   - [ ] Configurar React Navigation
   - [ ] Setup de temas e design system
   - [ ] Configurar ambiente Android/iOS

2. **Autenticação Mobile** (3 dias)
   - [ ] Tela de Login
   - [ ] Tela de Registro
   - [ ] Seleção/criação de empresa
   - [ ] Integração com Supabase Auth
   - [ ] Persistência de sessão

3. **WatermelonDB** (3 dias)
   - [ ] Setup WatermelonDB
   - [ ] Schema local mirror do backend
   - [ ] Models para entities principais
   - [ ] Observers para UI reativa

4. **Check-in/Check-out** (4 dias)
   - [ ] Tela principal com botão de check-in/out
   - [ ] Timer em tempo real
   - [ ] Armazenamento local first
   - [ ] Status visual (trabalhando/parado)

5. **Sincronização Offline** (4 dias)
   - [ ] Queue de operações pendentes
   - [ ] Sync automático em background
   - [ ] Retry logic com exponential backoff
   - [ ] Indicadores de status (synced/pending/failed)
   - [ ] Resolver conflitos

6. **Navegação e Estrutura** (2 dias)
   - [ ] Bottom tabs (Home, Histórico, Perfil)
   - [ ] Stack navigation
   - [ ] Tela de Histórico
   - [ ] Tela de Perfil

## 🔧 Comandos Úteis

### Começar a Trabalhar

```bash
# 1. Instalar dependências (se ainda não fez)
npm install

# 2. Copiar .env.example para .env e configurar
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 3. Subir Docker (PostgreSQL, Redis, API)
npm run docker:up

# 4. Verificar se está rodando
npm run docker:logs

# 5. Acessar Supabase Studio (se configurado)
# http://localhost:54323

# 6. Criar migrations
cd packages/database
# Adicionar arquivo SQL em migrations/

# 7. Desenvolver a API
cd apps/api
npm run dev

# 8. Testar a API
curl http://localhost:3001/health
```

### Durante Desenvolvimento

```bash
# Rodar todos os projetos em dev mode
npm run dev

# Fazer build de todos os packages
npm run build

# Rodar testes
npm test

# Lint e format
npm run lint
npm run format

# Verificar tipos
npm run type-check
```

### Git Workflow

```bash
# Criar branch para feature
git checkout -b feature/database-schema

# Commit seguindo conventional commits
git add .
git commit -m "feat: adiciona schema inicial do banco"

# Push
git push origin feature/database-schema

# Criar PR no GitHub/GitLab
```

## 📚 Recursos

### Documentação Oficial
- [React Native](https://reactnative.dev/)
- [Supabase](https://supabase.com/docs)
- [WatermelonDB](https://watermelondb.dev/)
- [Turborepo](https://turbo.build/repo/docs)
- [Docker](https://docs.docker.com/)

### Tutoriais Específicos
- Multi-tenancy com RLS: https://supabase.com/docs/guides/auth/row-level-security
- Offline-first React Native: https://watermelondb.dev/docs/Sync/Intro
- React Navigation: https://reactnavigation.org/docs/getting-started

## 🎯 Objetivos da Sprint 1-2

**Meta:** Backend funcional com autenticação e CRUD básico

**Deliverables:**
- [ ] API rodando em Docker
- [ ] Database schema completo
- [ ] Auth endpoints funcionando
- [ ] Employee management endpoints
- [ ] Time entry endpoints básicos
- [ ] Documentação de API atualizada
- [ ] Testes unitários de rotas críticas

**Definition of Done:**
- Todos endpoints testados com Postman/Insomnia
- Multi-tenancy validado (dados isolados por empresa)
- Documentação atualizada
- Code reviewed
- CI passando (lint, type-check, tests)

## 💡 Dicas

1. **Comece pelo Database Schema**
   - É a base de tudo
   - Modele bem o multi-tenancy
   - RLS policies desde o início

2. **Teste Multi-tenancy Cedo**
   - Crie 2 empresas de teste
   - Valide isolamento de dados
   - Garanta que RLS está funcionando

3. **Use o Supabase Studio**
   - Facilita muito o desenvolvimento
   - Veja dados em tempo real
   - Teste queries diretamente

4. **Documente conforme desenvolve**
   - Atualize README da API
   - Documente endpoints novos
   - Exemplos de requests/responses

5. **Small Commits**
   - Commits pequenos e frequentes
   - Mais fácil de revisar
   - Mais fácil de reverter se necessário

## 🤝 Precisa de Ajuda?

- Abra uma issue no GitHub
- Consulte a documentação oficial
- Revise o plano completo no README principal

---

**Pronto para começar! 🚀**

Próximo passo: Criar o schema do banco de dados em `packages/database/migrations/`
