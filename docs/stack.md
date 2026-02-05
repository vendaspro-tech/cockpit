# Stack do Projeto

Resumo da stack atual baseada em `package.json`, `next.config.ts` e configuracoes em `lib/`.

## Core
- Next.js 16 (App Router)
- React 19
- TypeScript 5

## UI e estilos
- Tailwind CSS v4 + PostCSS
- shadcn/ui (Radix UI + class-variance-authority)
- Lucide Icons
- Utilitarios: clsx, tailwind-merge

## Dados, backend e auth
- Supabase Postgres (RLS + migrations em `supabase/migrations/`)
- Supabase SSR + supabase-js (`lib/supabase/*`)
- Supabase Storage (imagens remotas em `next.config.ts`)
- Auth atual: Supabase Auth (via `lib/auth-server.ts`)

## Estado, formularios e validacao
- React Hook Form + @hookform/resolvers
- Zod
- @tanstack/react-query

## Visualizacao e UX
- React Flow + dagre (layouts de grafos)
- Recharts (graficos)
- react-big-calendar, react-day-picker
- @dnd-kit (drag and drop)

## Editor e conteudo
- TipTap + Novel

## AI e integracoes
- Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
- OpenAI SDK (`openai`)

## Exportacao e documentos
- @react-pdf/renderer

## Qualidade e tooling
- ESLint 9 + eslint-config-next
- Scripts npm (dev/build/lint/test)

## Notas
- Documentacao menciona Clerk, mas o codigo atual usa Supabase Auth e nao ha dependencia `@clerk/nextjs` no `package.json`.
