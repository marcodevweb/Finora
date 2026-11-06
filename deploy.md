# Deploy do Finora na Vercel

O frontend e a API ficam no mesmo projeto e domínio. A API `/api/*` roda como uma função Express, e as telas do React são entregues como arquivos estáticos. O banco é PostgreSQL externo e persistente; o SQLite local não é usado no deploy.

## Preparar o banco e as variáveis

1. No projeto da Vercel, instale a integração PostgreSQL **Neon** pelo Marketplace e conecte o banco ao projeto.
2. A integração Neon adiciona `POSTGRES_PRISMA_URL` (conexão pooled para a API) e `POSTGRES_URL_NON_POOLING` (conexão direta para migrations). Confirme que ambas estão disponíveis em Production e Preview.
3. Em **Settings → Environment Variables**, adicione `JWT_SECRET` como segredo, com um valor aleatório exclusivo de pelo menos 32 caracteres, em Production e Preview.

Não use `backend/prisma/dev.db` em produção: arquivos locais não são armazenamento durável ou compartilhado entre instâncias serverless.

**Dados que já estão só no SQLite local não são copiados automaticamente para o PostgreSQL.** O banco hospedado começa vazio; a partir do deploy, cada cadastro e alteração ficará salvo nele. Se precisar levar dados locais existentes, faça uma migração separada antes de liberar o novo banco.

## Configuração do projeto Vercel

- **Root Directory:** diretório raiz `finora` (onde está este arquivo).
- **Framework Preset:** `Other` (a configuração define o build Vite e a função Express do monorepo).
- **Build and Development Settings:** deixe os comandos detectados substituídos pela configuração de `vercel.json`.
- O deploy executa `prisma migrate deploy`, gera o cliente Prisma, compila o frontend e publica `frontend/dist`.
- O cadastro cria uma conta principal zerada e as categorias iniciais; receitas, despesas, orçamentos, metas e cartões são persistidos no PostgreSQL associados ao usuário.

Se as variáveis do PostgreSQL ou `JWT_SECRET` estiverem ausentes, o build ou a inicialização falharão com erro explícito, em vez de publicar uma API que perde dados ou assina tokens com uma chave insegura.
