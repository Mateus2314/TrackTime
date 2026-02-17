# 🧪 TrackTime - Guia de Testes (Fase 1: Autenticação)

## 📋 Sumário

- [Setup Inicial](#setup-inicial)
- [Testes Manuais (Insomnia)](#testes-manuais-insomnia)
- [Testes Automatizados](#testes-automatizados)
- [Estrutura de Testes](#estrutura-de-testes)
- [Troubleshooting](#troubleshooting)

---

## Setup Inicial

### 1. Verificar se a API está rodando

```powershell
# Terminal 1: Inicie a API
cd C:\TrackTime
npm run -w @tracktime/api dev

# Verificação: Deve retornar status 200
curl http://localhost:3001/health
```

### 2. Preparar dados de teste

O projeto já vem com um usuário de teste criado no seed:

```
Email: test@example.com
Senha: TestPass123
```

Se precisar criar um novo usuário, pode usar o Insomnia com a requisicao "OK - Valid Registration".

---

## Testes Manuais (Insomnia)

### Importar Coleção

1. Abra **Insomnia REST Client**
2. Va em `File > Import` (ou `Ctrl+Shift+I`)
3. Selecione `insomnia/TrackTime_Insomnia.json`
4. A coleção **TrackTime API** será importada com dois ambientes

### Estrutura da Coleção

```
TrackTime API
├── Health Checks
│   ├── API Health Check
│   └── API Root Info
├── Authentication - Fase 1
│   ├── Register Endpoint
│   │   ├── OK - Valid Registration
│   │   ├── ERR - Invalid Email Format
│   │   ├── ERR - Weak Password (No Uppercase)
│   │   ├── ERR - Weak Password (No Number)
│   │   ├── ERR - Weak Password (Too Short)
│   │   ├── ERR - Missing Required Field (fullName)
│   │   └── ERR - Missing Required Field (password)
│   ├── Login Endpoint
│   │   ├── OK - Valid Login
│   │   ├── ERR - Invalid Password
│   │   ├── ERR - Non-existent User
│   │   ├── ERR - Invalid Email Format
│   │   └── ERR - Missing Password Field
│   ├── Refresh Token Endpoint
│   │   ├── OK - Valid Refresh Token
│   │   └── ERR - Invalid/Expired Token
│   ├── Get Current User (Me) Endpoint
│   │   ├── OK - Get Current User (Valid Token)
│   │   ├── ERR - No Authorization Header
│   │   └── ERR - Invalid Token
│   └── Logout Endpoint
│       ├── OK - Logout (Valid Token)
│       └── ERR - Logout (No Token)
```

### Workflow de Testes Manual

#### 1. Health Checks (Verificacao Basica)

```
GET /health
GET /
```

**Resultado esperado:** Status 200 com dados de health check

#### 2. Autenticacao Completa (Happy Path)

1. **POST /api/auth/register** (OK - Valid Registration)
   - Crie um novo usuário
   - Extraia `access_token` e `refresh_token` da resposta
   - Guarde para próximos testes

2. **POST /api/auth/login** (OK - Valid Login)
   - Use credenciais existentes: `test@example.com` / `TestPass123`
   - Extraia tokens novamente (Insomnia auto-salva em variáveis de ambiente)

3. **GET /api/auth/me** (OK - Get Current User)
   - Use o `access_token` do login anterior
   - Vê os dados do usuário logado

4. **POST /api/auth/refresh** (OK - Valid Refresh Token)
   - Use o `refresh_token` logado
   - Receba novo `access_token`

5. **POST /api/auth/logout** (OK - Logout)
   - Use último `access_token`
   - Confirma logout bem-sucedido

#### 3. Validacao de Erros (Error Scenarios)

Execute todas as requisicoes `ERR` (erro esperado) para validar:

- **Emails invalidos** -> Status 400 com erro VALIDATION_ERROR
- **Senhas fracas** -> Status 400 com detalhes especificos (tamanho, maiuscula, numero)
- **Campos obrigatórios faltando** → Status 400
- **Credenciais inválidas** → Status 401 Unauthorized
- **Token inválido/ausente** → Status 401

### Dicas do Insomnia

#### Extrair Valores de Resposta Automaticamente

1. Faça a requisição **Login**
2. Na response, clique em `access_token`, selecione o valor
3. Clique com botão direito > **Set as Variable** > `access_token`
4. Exatamente igual para `refresh_token`
5. Próximas requisições usarão `{{ access_token }}` automaticamente

#### Variáveis de Ambiente

Acesse `Manage Environments` para editar:

```json
{
  "api_base_url": "http://localhost:3001",
  "access_token": "",
  "refresh_token": "",
  "test_email": "test@example.com",
  "test_password": "TestPass123",
  "new_user_email": "newuser@tracktime.com",
  "new_user_password": "SecurePass123"
}
```

---

## Testes Automatizados

### Executar Suite de Testes

```powershell
# Todos os testes de auth (32 testes)
cd C:\TrackTime
npm run -w @tracktime/api test:auth

# Todos os testes (smoke + schema + auth)
npm run -w @tracktime/api test:all

# Testes específicos
npm run -w @tracktime/api test:smoke      # Health checks
npm run -w @tracktime/api test:schema     # Schema validation
```

### Resultado Esperado

```
✓ Health Checks - API Health Endpoint (15.32ms)
✓ Health Checks - API Root Endpoint (4.21ms)
✓ Register - Valid Registration (234.12ms)
✓ Register - Invalid Email Format (23.11ms)
... (total 32 testes)

tests 32
pass  32
fail  0
ok    true
─────────────────────────────────────────
OK - All tests passed!
```

### Cobertura de Testes

| Categoria | Testes | Descrição |
|-----------|--------|-----------|
| **Health Checks** | 2 | API health + root endpoints |
| **Register** | 7 | Valid + 6 cenários de erro |
| **Login** | 6 | Valid + 5 cenários de erro |
| **Get Me** | 5 | Valid + 4 cenários de error |
| **Refresh** | 4 | Valid + 3 cenários de erro |
| **Logout** | 3 | Valid + 2 cenários de erro |
| **Error Structure** | 3 | Validação de formato de erro |
| **Portuguese Messages** | 2 | Mensagens em português |
| **TOTAL** | **32** | Cobertura completa da Fase 1 |

---

## Estrutura de Testes

### Arquivo de Testes

**Localização:** `apps/api/tests/auth.integration.test.mjs`

### Padrão de Teste Utilizado

```javascript
import { test } from 'node:test';
import assert from 'node:assert';

test('Descrição do teste', async (t) => {
  const res = await request('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'TestPass123'
  });
  
  assert.strictEqual(res.status, 200, 'Should return 200 OK');
  assert(res.data.accessToken, 'Should have accessToken');
});
```

### Estrutura de Resposta Padrão (Success)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "fullName": "User Name",
      "authId": "supabase-uuid"
    },
    "companies": [
      {
        "id": "uuid",
        "slug": "company-slug",
        "name": "Company Name",
        "role": "owner"
      }
    ],
    "accessToken": "jwt.token.here",
    "refreshToken": "jwt.refresh.token"
  }
}
```

### Estrutura de Resposta Padrão (Error)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR|UNAUTHORIZED|FORBIDDEN",
    "message": "Erro de validação em português",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      }
    ]
  }
}
```

---

## Checklist de Validação

### Fase 1 (Autenticacao) - Pronta para Producao?

- [ ] **Health Checks**
  - [ ] GET /health retorna 200 e `status: "ok"`
  - [ ] GET / retorna 200 com versão

- [ ] **Register Endpoint**
  - [ ] OK - Registra usuario valido (201)
  - [ ] OK - Retorna access + refresh tokens
  - [ ] ERR - Rejeita emails invalidos (400)
  - [ ] ERR - Rejeita senhas fracas (400)
  - [ ] ERR - Rejeita campos obrigatorios faltando (400)

- [ ] **Login Endpoint**
  - [ ] OK - Autentica usuario valido (200)
  - [ ] OK - Retorna tokens + lista de companies
  - [ ] ERR - Rejeita email invalido (400)
  - [ ] ERR - Rejeita credenciais erradas (401)
  - [ ] ERR - Rejeita usuario inexistente (401)

- [ ] **Get Current User (Me)**
  - [ ] OK - Retorna usuario com token valido (200)
  - [ ] ERR - Bloqueia sem token (401)
  - [ ] ERR - Bloqueia com token invalido (401)

- [ ] **Refresh Token**
  - [ ] OK - Retorna novo token com refresh valido (200)
  - [ ] ERR - Bloqueia com token invalido (401)

- [ ] **Logout**
  - [ ] OK - Logout bem-sucedido com token valido (200)
  - [ ] ERR - Bloqueia sem token (401)

- [ ] **Mensagens de Erro**
  - [ ] Mensagens em português
  - [ ] Estrutura consistente
  - [ ] Status codes corretos

---

## Troubleshooting

### Problema: "Connection refused on port 3001"

**Solução:**
```powershell
# Verifique se a API está rodando
Get-Process node

# Se não estiver, inicie:
cd C:\TrackTime
npm run -w @tracktime/api dev
```

### Problema: "VALIDATION_ERROR - Email inválido" mesmo com email correto

**Solução:**
- Zod é muito rigoroso com padrão de email
- Use um email real no formato: `user@domain.com`
- Evite caracteres especiais

### Problema: Testes passam no Insomnia mas falham via CLI

**Solução:**
```powershell
# Limpe cache de node_modules
npm run clean
npm install

# Rebuild dos packages
npm run build

# Tente novamente
npm run -w @tracktime/api test:auth
```

### Problema: "Access token expirado"

**Solução:**
- Tokens JWT expiram em ~1 hora
- Use a requisição "Refresh Token" para obter novo
- Ou faça login novamente com "Valid Login"

### Problema: Insomnia não salva tokens automaticamente

**Solução:**
1. Faça a requisição POST /api/auth/login
2. Na aba **Response**, ache `accessToken`
3. Clique no valor → Preview → **Set as Variable**
4. Escolha nome: `access_token` ou `refresh_token`
5. Próximas requisições usarão `{{ variavel }}`

---

## Próximos Passos (Fase 2)

Após validar completamente a Fase 1 com ambos os testes:

1. OK - Testes manuais no Insomnia (todos os cenarios passando)
2. OK - Testes automatizados CLI (32 testes passando)
3. TODO - **Fase 2 - Time Entry Endpoints** (check-in/check-out)
   - POST /api/time-entries/check-in
   - POST /api/time-entries/check-out
   - GET /api/time-entries/list
   - Testes de geolocalização
   - Testes de offline sync

---

## Documentação de Referência

### Endpoints Implementados (Fase 1)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar novo usuario | No |
| POST | `/api/auth/login` | Autenticar usuario | No |
| POST | `/api/auth/refresh` | Renovar access token | No |
| GET | `/api/auth/me` | Dados do usuario autenticado | Yes |
| POST | `/api/auth/logout` | Logout do usuario | Yes |

### Variáveis de Ambiente (API)

```env
# .env
SUPABASE_URL=https://kgqrdwbdtfztyfxpmkyn.supabase.co
SUPABASE_SERVICE_KEY=seu-service-key-aqui
JWT_SECRET=sua-secret-aqui
NODE_ENV=development
PORT=3001
```

### Erros Esperados

| Código | Status HTTP | Causa |
|--------|------------|-------|
| `VALIDATION_ERROR` | 400 | Validação de input falhou |
| `UNAUTHORIZED` | 401 | Token inválido/ausente |
| `FORBIDDEN` | 403 | Acesso negado (role/company) |
| `SERVER_ERROR` | 500 | Erro interno da API |

---

**Atualizado em:** 14 de fevereiro de 2026  
**Versão:** 0.1.0  
**Status:** OK - Fase 1 Completa - Pronta para Testes

