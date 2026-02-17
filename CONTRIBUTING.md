# Contributing to TrackTime

Obrigado por considerar contribuir com o TrackTime! 🎉

## Como Contribuir

### Reportar Bugs

Se você encontrou um bug, por favor abra uma issue com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Ambiente (SO, versão do Node, etc)

### Sugerir Features

Sugestões são bem-vindas! Abra uma issue com:
- Descrição clara da feature
- Justificativa (por que seria útil?)
- Exemplos de uso

### Pull Requests

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Faça suas alterações
4. Rode os testes: `npm test`
5. Commit: `git commit -m 'feat: adiciona minha feature'`
6. Push: `git push origin feature/minha-feature`
7. Abra um Pull Request

### Convenções de Código

#### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Apenas documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Adiciona testes
- `chore`: Tarefas de manutenção

Exemplos:
```
feat: adiciona reconhecimento facial
fix: corrige sync offline
docs: atualiza README com instruções Docker
```

#### Code Style

- Use Prettier (já configurado)
- Use ESLint (já configurado)
- TypeScript strict mode
- Nomes descritivos para variáveis/funções
- Comentários apenas quando necessário

#### TypeScript

```typescript
// ✅ Bom
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Evite
function getData(x: any): any {
  // ...
}
```

### Testes

- Escreva testes para novas features
- Mantenha coverage acima de 80%
- Testes unitários para lógica de negócio
- Testes E2E para fluxos críticos

### Documentação

- Atualize o README se necessário
- Adicione JSDoc para funções públicas
- Documente breaking changes no CHANGELOG

## Processo de Review

1. Automated checks devem passar (lint, tests, build)
2. Code review por pelo menos 1 maintainer
3. Aprovação necessária antes do merge

## Código de Conduta

- Seja respeitoso e profissional
- Críticas construtivas são bem-vindas
- Foque no código, não na pessoa
- Ajude outros desenvolvedores

## Dúvidas?

Abra uma issue ou entre em contato!

Obrigado por contribuir! 🚀
