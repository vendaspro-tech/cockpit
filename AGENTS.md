# AGENTS.md

Guia curto para contribuir no Cockpit Comercial. Mantenha este arquivo atualizado quando alterar convencoes do projeto.

## Visao geral
- Stack: Next.js (app router), TypeScript, Supabase (SSR), Tailwind v4, shadcn/ui.
- Pastas principais: `app/`, `components/`, `lib/`, `hooks/`, `supabase/`, `docs/`, `scripts/`.
- Roteamento: `app/(dashboard)/[workspaceId]/...` e `app/(admin)/admin/...` sao grupos de rotas.
- Regras nao-negociaveis: `.specify/memory/constitution.md`.

## Padroes de codigo
- Server actions ficam em `app/actions/` e devem declarar `use server`.
- Evite usar `createAdminClient` para operacoes do usuario; prefira `lib/supabase/server.ts` e RLS.
- Centralize autenticacao e roles em `lib/auth-utils.ts` e `lib/supabase/user.ts`.
- Use `cn()` de `lib/utils.ts` para classes condicionais.
- Componentes reutilizaveis vao para `components/ui/` (primitives) e `components/shared/` (composicoes).

## Design system
- Tokens visuais devem viver em `app/globals.css` (ou `styles/tokens.css` se criado).
- Evite cores hardcoded; use variaveis CSS (ex.: `--primary`, `--accent`).
- Tipografia e espacamento devem usar tokens padronizados.
- Novos componentes de interface devem usar `components/ui/` e seguir `class-variance-authority`.
- Referencia de uso e exemplos: `docs/design/design-system.md`.

## Dados e migrations
- Migrations em `supabase/migrations/` devem ter IDs unicos e sequenciais.
- Evite editar migrations ja aplicadas; crie uma nova migration.
- Dados seed ficam em `supabase/seed.sql` ou `supabase/data/`.

## Seguranca e ambientes
- Nunca commitar `.env.local`; use `.env.example` como referencia.
- Chaves `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` devem ser usadas apenas no server.
- Valide inputs e autenticacao em rotas `app/api/`.

## Documentacao
- Documentos novos devem ir para `docs/` com nomes em ASCII.
- Se atualizar documentos na raiz, avalie mover para `docs/`.
- Atualize `README.md` quando mudar setup, scripts ou stack.
- Atualize `docs/index.md` quando mover ou criar docs.

## Checklist rapido (PR)
- [ ] Nao ha segredos no repo
- [ ] Migrations com ID unico
- [ ] Server/client boundary respeitado
- [ ] UI segue tokens e componentes existentes
