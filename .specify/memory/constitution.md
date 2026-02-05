<!--
Sync Impact Report

- Version change: N/A (template) -> 1.0.0
- Modified principles: N/A (placeholders) -> filled with 5 project principles
- Added sections: Engineering Constraints, Workflow & Quality Gates, Governance rules
- Removed sections: none
- Templates requiring updates:
	- ✅ Updated: .specify/templates/plan-template.md
	- ✅ Updated: .specify/templates/tasks-template.md
	- ✅ Updated: .specify/templates/checklist-template.md
	- ✅ Updated: .specify/templates/spec-template.md
- Follow-up TODOs: none
-->

# Cockpit Comercial Constitution

## Core Principles

### 1) Server/Client Boundary & Secret Safety
- Secrets MUST never be shipped to the browser (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`).
- Any privileged operation MUST run on the server (route handlers, server actions, or server-only libs).
- API endpoints and server actions MUST validate input and enforce authentication/authorization.

Rationale: This project handles sensitive customer/workspace data; the safest default is server-only privilege.

### 2) RLS-First Supabase Access (Avoid Admin Client for User Ops)
- User-facing data access MUST go through Supabase with Row Level Security (RLS).
- Prefer the standard server client in `lib/supabase/server.ts` for authenticated user operations.
- `createAdminClient` (service role) MUST be avoided for user flows; use it only for controlled back-office
	or infrastructure tasks where RLS is not applicable.

Rationale: RLS keeps authorization correct-by-default and reduces privilege escalation risk.

### 3) Centralized Auth & Roles
- Authentication and role decisions MUST be centralized in `lib/auth-utils.ts` and `lib/supabase/user.ts`.
- Business logic MUST NOT re-implement role checks ad-hoc inside random components.

Rationale: Centralizing auth makes security review and auditing realistic as the codebase grows.

### 4) UI Consistency via Tokens + shadcn/ui
- Visual tokens MUST live in `app/globals.css` (or `styles/tokens.css` if created).
- Hardcoded colors SHOULD be avoided; use CSS variables (e.g., `--primary`, `--accent`).
- Reusable primitives belong in `components/ui/`; compositions belong in `components/shared/`.
- Conditional classes MUST use `cn()` from `lib/utils.ts`.

Rationale: Consistent UI reduces regressions and improves product cohesion.

### 5) Migrations & Data Discipline
- Migrations in `supabase/migrations/` MUST have unique, sequential IDs.
- Applied migrations MUST NOT be edited; create a new migration instead.
- Seed data MUST live in `supabase/seed.sql` or `supabase/data/`.

Rationale: Database history must remain reproducible across environments.

## Engineering Constraints

- Stack baseline: Next.js (app router), TypeScript, Supabase (SSR), Tailwind v4, shadcn/ui.
- Server actions MUST declare `use server` and remain server-only.
- API routes under `app/api/` MUST validate inputs and enforce auth.
- Documentation lives in `docs/`; new documents MUST use ASCII filenames.

## Workflow & Quality Gates

- Before opening a PR, run `npm run lint`.
- When changing database schema or access patterns, re-check RLS policies and role logic.
- When touching migrations/seeds, ensure changes are additive and environment-safe.
- Update `README.md` and `docs/index.md` when setup/docs structure changes.

## Governance

- This constitution supersedes local conventions and ad-hoc team practices.
- Amendments MUST be done via PR and include:
	- A short rationale (why the change is necessary)
	- A version bump following SemVer:
		- MAJOR: backward-incompatible governance/principle removals or redefinitions
		- MINOR: new principle/section added or materially expanded guidance
		- PATCH: clarifications/wording/typos (no semantic change)
	- Updates to any dependent Spec Kit templates under `.specify/templates/`.
- PR reviewers MUST explicitly check constitution compliance for relevant changes (security, RLS, UI tokens,
	migrations, docs hygiene).

**Version**: 1.0.0 | **Ratified**: 2026-01-12 | **Last Amended**: 2026-01-12
