# Implementation Plan: Sistema de Competências, Avaliações e PDI (Fundações)

**Branch**: `001-competency-pdi-system` | **Date**: 2026-01-12 | **Spec**: [specs/001-competency-pdi-system/spec.md](spec.md)
**Input**: Feature specification from [specs/001-competency-pdi-system/spec.md](spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.github/prompts/speckit.plan.prompt.md` (and the corresponding agent file in `.github/agents/`) for the execution workflow.

## Summary

Deliver the “foundations” slice: (1) global Job Titles catalog with hierarchy level (0–3), (2) global, versioned competency framework templates per job title, (3) a seniority v2 360° flow (self + leader + calibration) whose calibrated result becomes the only “current seniority”, and (4) enforce hierarchy-based sensitive-data access at workspace scope.

Research/design artifacts:
- [specs/001-competency-pdi-system/research.md](research.md)
- [specs/001-competency-pdi-system/data-model.md](data-model.md)
- [specs/001-competency-pdi-system/contracts/openapi.yaml](contracts/openapi.yaml)
- [specs/001-competency-pdi-system/quickstart.md](quickstart.md)

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x, Node.js (>= 20 recommended)  
**Primary Dependencies**: Next.js 16, React 19, Supabase JS 2.x + Supabase SSR, Zod 4, Tailwind v4, shadcn/ui (Radix)  
**Storage**: PostgreSQL (Supabase) + Supabase Storage (already used for PDI evidence)  
**Testing**: No dedicated test runner currently (lint-only in `package.json`); rely on typecheck, lint, and feature-level smoke tests  
**Target Platform**: Web (Next.js App Router)  
**Project Type**: Web application (single Next.js repo)  
**Performance Goals**: RLS policies must remain queryable with pagination (avoid per-row expensive policies where possible)  
**Constraints**: Secrets server-only; least-privilege; migrations must be additive and reproducible  
**Scale/Scope**: Multi-workspace SaaS; moderate data volumes per workspace

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Validate against `.specify/memory/constitution.md`.
- Confirm server/client boundary and secrets never shipped to browser.
- Confirm Supabase access is RLS-first; avoid service-role admin client for user flows.
- Confirm auth/role logic stays centralized.
- Confirm UI changes follow tokens + `components/ui` / `components/shared` patterns.
- Confirm migrations/seeds are additive and correctly located.

Status for this plan:
- Pass (plan intent): All new feature access uses RLS-first `createClient()` patterns; global admin writes rely on RLS policies gated by `users.is_super_admin`.
- Existing debt: the repo uses `createAdminClient()` in several server actions and role helpers; this plan avoids introducing new service-role usage for these feature paths unless strictly required.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── (admin)/
├── (dashboard)/
├── actions/
└── api/

components/
├── ui/
├── shared/
└── admin/

lib/
├── auth-*.ts
└── supabase/

supabase/
└── migrations/
```

**Structure Decision**: Next.js App Router + Server Actions. DB changes via Supabase migrations. UI primitives in `components/ui`, compositions in `components/shared`.

## Phase 0: Research (complete)

Output: [specs/001-competency-pdi-system/research.md](research.md)

Key resolved clarifications captured in the spec:
- Global job titles
- Workspace-wide hierarchy (no squad restriction)
- Global competency framework templates
- “Current seniority” comes only from v2 calibration

## Phase 1: Design (complete)

Outputs:
- Data model: [specs/001-competency-pdi-system/data-model.md](data-model.md)
- API contracts: [specs/001-competency-pdi-system/contracts/openapi.yaml](contracts/openapi.yaml)
- Quickstart: [specs/001-competency-pdi-system/quickstart.md](quickstart.md)

Design notes:
- Global catalogs (`job_titles`, `competency_frameworks`) are super-admin-managed and readable by authenticated users.
- Seniority v2 is workspace-scoped; calibrated outcome becomes the only “current seniority”.
- Hierarchy enforcement should be backed by DB-level RLS where data is sensitive.

## Phase 2: Implementation Planning (next)

Milestones (ordered to reduce risk):

1) **Schema + RLS foundations**
- New additive migrations to implement: global job titles (cutover from current workspace-scoped table), hierarchy fields, framework tables, seniority v2 tables, and audit log.
- Add/adjust RLS policies to match:
  - super admin can write global catalogs
  - authenticated can read catalogs
  - hierarchy-based restrictions for sensitive reads

2) **Server actions + validation**
- Implement server actions for:
  - global job titles CRUD (super admin only)
  - framework CRUD + publish/version flows
  - seniority v2 lifecycle (create → submit self → submit leader → calibrate)
- Validate framework weights and enforce seniority “current = v2 only”.

3) **UI flows**
- Super admin admin pages for job titles + frameworks (reuse existing patterns from other admin catalogs like KPIs).
- Workspace dashboard flow for seniority v2 with clear status (“Aguardando Avaliação”).

4) **Audit + smoke tests**
- Emit minimal audit entries for global/admin changes and calibration events.
- Run smoke checks from [specs/001-competency-pdi-system/quickstart.md](quickstart.md).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
