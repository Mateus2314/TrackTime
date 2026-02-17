# TrackTime API

Backend REST API para o sistema TrackTime.

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Rodar build de produção
npm start
```

## Estrutura

```
src/
├── index.ts              # Entry point
├── config/               # Configurações
├── routes/               # Definição de rotas
│   ├── auth.ts
│   ├── time-entries.ts
│   ├── employees.ts
│   └── ...
├── controllers/          # Lógica dos endpoints
├── services/             # Lógica de negócio
├── middleware/           # Middleware do Express
├── models/               # Types e validações
└── utils/                # Utilitários
```

## Endpoints Principais

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Time Entries
- `POST /api/time-entries/check-in` - Check-in
- `POST /api/time-entries/check-out` - Check-out
- `GET /api/time-entries` - Listar registros
- `PUT /api/time-entries/:id` - Atualizar registro

### Employees
- `GET /api/employees` - Listar funcionários
- `POST /api/employees` - Criar funcionário
- `GET /api/employees/:id` - Detalhes do funcionário
- `PUT /api/employees/:id` - Atualizar funcionário

### Sync
- `POST /api/sync` - Sincronização offline

### Facial Recognition
- `POST /api/face-recognition/enroll` - Cadastrar face
- `POST /api/face-recognition/verify` - Verificar face

### Reports
- `POST /api/reports/generate` - Gerar relatório
- `GET /api/reports/:id` - Baixar relatório

## Variáveis de Ambiente

Ver `.env.example` na raiz do projeto.
