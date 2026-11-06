# Finora — Finanças pessoais

O **Finora** é uma aplicação web para organizar receitas, despesas, orçamentos e metas financeiras em um só lugar. A proposta é tornar o acompanhamento do dinheiro simples de entender, com um painel visual e relatórios objetivos.

## Telas do sistema

<div align="center">
  <img src="docs/dashboard.png" alt="Painel inicial do Finora com saldo, receitas, despesas e gráfico de evolução" width="49%" />
  <img src="docs/reports.png" alt="Relatório financeiro do Finora com resumo mensal e comparativo histórico" width="49%" />
</div>

*As informações de perfil foram anonimizadas nas imagens. Os valores exibidos são demonstrativos.*

## Funcionalidades

- Cadastro com e-mail e senha e entrada automática na primeira sessão.
- Login para voltar à conta e consultar os dados já salvos.
- Registro e organização de receitas e despesas por categoria e conta.
- Painel com saldo, resumo mensal e evolução financeira.
- Orçamentos mensais por categoria.
- Metas de economia com acompanhamento de aportes.
- Relatórios e comparativo histórico, com exportação de dados em CSV.
- Tema claro e escuro.
- Persistência por usuário em PostgreSQL.

## Tecnologias

<p>
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="Recharts" src="https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=react&logoColor=white" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" />
</p>

| Área | Tecnologias e ferramentas |
| --- | --- |
| Interface | React, TypeScript, Vite, Tailwind CSS, React Router, Axios e Lucide |
| Gráficos | Recharts |
| API | Node.js, Express e TypeScript |
| Banco de dados | PostgreSQL no deploy, SQLite no desenvolvimento local e Prisma ORM |
| Autenticação | JWT em cookie HttpOnly e senhas protegidas com bcryptjs |

## Executar localmente

Você precisa ter **Node.js** e **npm**. O desenvolvimento local usa SQLite; no deploy, a Vercel usa PostgreSQL persistente.

### 1. Configurar o backend

Abra um terminal na pasta do projeto e rode:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Para desenvolvimento local, deixe `DATABASE_URL="file:./dev.db"` e configure `JWT_SECRET` com um segredo aleatório de pelo menos 32 caracteres. Depois rode:

```powershell
npm run prisma:generate
npm run prisma:dev
npm run dev
```

Deixe esse terminal aberto enquanto usa o Finora.

### 2. Iniciar a interface

Abra um segundo terminal na pasta do projeto:

```powershell
cd frontend
npm ci
npm run dev
```

Abra no navegador o endereço mostrado pelo Vite, normalmente `http://localhost:3000`, e crie sua conta.

## Publicar na Vercel

O projeto inclui configuração de build, API e migrations. Para conectar o banco e publicar, siga o [guia de deploy na Vercel](DEPLOY-VERCEL.md).

## Imagens

- Painel: [`docs/dashboard.png`](docs/dashboard.png)
- Relatórios: [`docs/reports.png`](docs/reports.png)
