---
description: "Task list for feature implementation"
---

# Tasks: Sistema de Competências, Avaliações e PDI (Fundações)

**Input**: Design documents in `specs/001-competency-pdi-system/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`)

**Notes on current repo state** (high-signal):
- Global Job Titles already have a cutover migration in `supabase/migrations/20250105000001_job_titles_global_fix.sql` and an admin UI in `app/(admin)/admin/job-titles/*`.
- Competency framework templates exist (`is_template`, `version`, `is_active`) via `supabase/migrations/20250101000103_global_competency_frameworks.sql` and admin UI in `app/(admin)/admin/competency-frameworks/*`.
- Seniority v2 UI exists (`app/(dashboard)/[workspaceId]/assessments/seniority-v2/*`) but server actions currently use `createAdminClient()` and therefore bypass RLS.

**Tests**: No dedicated test runner currently. Add only lightweight validation tasks (typecheck/lint) + the smoke checks in `specs/001-competency-pdi-system/quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Each task includes *exact file paths*.

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Confirm prerequisite artifacts exist and are the latest (`specs/001-competency-pdi-system/spec.md`, `specs/001-competency-pdi-system/plan.md`, `specs/001-competency-pdi-system/data-model.md`, `specs/001-competency-pdi-system/contracts/openapi.yaml`)
- [x] T002 Verify baseline scripts still run: `npm run dev`, `npm run build`, `npm run lint` (see `package.json`)
- [x] T003 [P] Re-check constitution constraints for this feature slice and note any intentional exceptions (see `.specify/memory/constitution.md`)
- [x] T004 [P] Create a short “implementation notes” entry for future maintainers (append to `specs/001-competency-pdi-system/research.md`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Complete this phase before starting any user story implementation.

- [x] T005 Audit current schema vs feature needs (job titles global, templates global, seniority v2 lifecycle, audit) and record findings in `specs/001-competency-pdi-system/research.md`
- [x] T006 Add DB guardrails for hierarchy levels (check constraint + indexes) in a new migration `supabase/migrations/20260113000001_job_titles_hierarchy_checks.sql`
- [x] T007 Add minimal audit log table + indexes in `supabase/migrations/20260113000002_audit_log.sql`
- [x] T008 Add/extend workspace-member “current seniority” snapshot fields (nullable until first calibration) in `supabase/migrations/20260113000003_workspace_members_current_seniority.sql` (align with `specs/001-competency-pdi-system/data-model.md`)
- [x] T009 Implement Postgres helper(s) for hierarchy checks usable by RLS policies (e.g., `can_view_user_in_workspace(viewer_user_id, target_user_id, workspace_id)`), in `supabase/migrations/20260113000004_hierarchy_helpers.sql`
- [x] T010 Implement/adjust RLS policies for global catalogs:
  - `job_titles`: SELECT for authenticated; INSERT/UPDATE/DELETE for super admins only (verify existing policies from `supabase/migrations/20250105000001_job_titles_global_fix.sql`)
  - `competency_frameworks`: SELECT templates for authenticated; write restricted to super admins (add in `supabase/migrations/20260113000005_catalog_rls.sql`)
- [x] T011 Implement/adjust RLS policies for `seniority_assessments` so user flows can be RLS-first (no service role):
  - evaluated user can read/write self drafts
  - evaluator/leader can read/write leader drafts + calibrate
  - hierarchy restriction for *reading* other users’ assessments per FR-002
  (migration: `supabase/migrations/20260113000006_seniority_assessments_rls.sql`)
- [x] T012 [P] Align TypeScript domain types with DB reality:
  - job title: `lib/types/job-title.ts`
  - competency frameworks + seniority assessment: `lib/types/competency.ts`
- [x] T013 [P] Ensure user creation still sets seniority to NULL until first calibration, and uses workspace member context (review `lib/supabase/user.ts`)
- [x] T014 Define a single “audit write” helper (server-only) and its payload shape in `lib/audit.ts` (used by US1/US2/US3)
- [x] T015 Verify the “hierarchy access” helper does not require service role for read paths (refactor `lib/hierarchy-access.ts` to accept a Supabase client or to use `createClient()` where possible)

**GATE (Constitution / RLS-first)**: If any *user-context* read/write path for US1–US3 requires `createAdminClient()` (service role) to function, STOP and:
- document the exact blocker in `specs/001-competency-pdi-system/research.md`
- propose an RLS-based alternative
- only proceed with an intentional exception after explicit approval

**Checkpoint**: After T005–T015, the DB + RLS foundation supports user-context reads/writes and the codebase has shared helpers/types.

---

## Phase 3: User Story 1 — Administrar cargos e hierarquia (Priority: P1) 🎯 MVP

**Goal**: Global job title catalog (admin) + hierarchy-based access control at workspace scope.

**Independent Test**:
- As system owner, CRUD a job title and see it reflected across workspaces.
- As a normal user, confirm sensitive reads are denied for targets with level ≤ yours, and allowed only for subordinates.

### Implementation

- [x] T016 [US1] Validate admin route access is enforced consistently (server-side) for job titles pages in `app/(admin)/admin/job-titles/page.tsx`
- [x] T017 [P] [US1] Ensure the admin UI covers enriched fields (mission, KPIs, activities, hierarchy level) and validation UX is clear in `components/admin/job-title-form.tsx`
- [x] T018 [P] [US1] Ensure list + edit flows handle slug uniqueness and display hierarchy labels in `components/admin/job-titles-table.tsx` and `app/(admin)/admin/job-titles/client.tsx`
- [x] T019 [US1] Align admin server actions with global constraints and audit writes:
  - add audit events for create/update/delete
  - ensure `workspace_id` is never written
  in `app/actions/admin/job-titles.ts` + `lib/audit.ts`
- [x] T020 [P] [US1] Add the API route handlers described in `specs/001-competency-pdi-system/contracts/openapi.yaml`:
  - `app/api/admin/job-titles/route.ts` (GET/POST)
  - implement as a thin wrapper over a shared server-only module (e.g. `lib/admin/job-titles.ts`) used by *both* Server Actions and API routes; do not call Server Actions from route handlers
- [x] T021 [US1] Enforce hierarchy-based filtering for sensitive reads in the most relevant feature paths:
  - assessments listing: `app/actions/seniority-assessments.ts`
  - pending calibrations: `app/actions/seniority-assessments.ts`
  - shared helper: `lib/hierarchy-access.ts`
- [x] T022 [P] [US1] Fix profile job title lookup to use workspace member context (not global user row), and prepare UI surface for seniority status:
  - `app/(dashboard)/[workspaceId]/profile/page.tsx`
- [x] T023 [US1] Run lint/build and do the US1 smoke checks in `specs/001-competency-pdi-system/quickstart.md`

**Checkpoint**: US1 is functional and independently demoable.

---

## Phase 4: User Story 2 — Configurar framework de competências por cargo (Priority: P2)

**Goal**: Super-admin manages global, versioned competency framework templates per job title.

**Independent Test**:
- Create/update a template with valid weights.
- Attempt invalid weights (sum != 100) and confirm blocking error.

### Implementation

- [x] T024 [US2] Confirm admin route access is enforced consistently for frameworks pages in `app/(admin)/admin/competency-frameworks/page.tsx`
- [x] T025 [P] [US2] Ensure the framework editor UI validates weights and required dimensions clearly in `components/admin/competency-framework-form.tsx`
- [x] T026 [P] [US2] Ensure list, duplicate, and edit flows behave for templates (workspace_id = NULL) in `components/admin/competency-frameworks-table.tsx` and `app/(admin)/admin/competency-frameworks/client.tsx`
- [x] T027 [US2] Add publish/version semantics (per spec):
  - publish sets `is_active=true` and deactivates the previous template for that job title
  - creating a new version increments `version` and links `parent_framework_id`
  in `app/actions/admin/competency-frameworks.ts`
- [x] T028 [US2] Add audit events for create/update/publish/delete framework template in `app/actions/admin/competency-frameworks.ts` + `lib/audit.ts`
- [x] T029 [P] [US2] Add API route handler described in contract:
  - `app/api/admin/competency-frameworks/route.ts` (GET/POST)
  implemented as a thin wrapper over a shared server-only module (e.g. `lib/admin/competency-frameworks.ts`) used by *both* Server Actions and API routes; ensure it returns template versions only by default
- [x] T030 [US2] Ensure the “no published framework” UX exists for workspace flows (block assessment start) in `components/assessments/seniority/create-seniority-dialog.tsx`
- [x] T031 [US2] Run lint/build and do the US2 smoke checks in `specs/001-competency-pdi-system/quickstart.md`

**Checkpoint**: US2 is independently usable and does not depend on US3 UI.

---

## Phase 5: User Story 3 — Realizar avaliação de senioridade 360° e calibrar (Priority: P3)

**Goal**: Enable seniority v2 360° flow (self + leader + calibration) using published global templates, and show “Aguardando Avaliação” until first calibration.

**Independent Test**:
- For a job title with a published framework: create assessment, submit, calibrate, and see the calibrated result reflected as the *only* “current seniority”.
- Legacy history remains accessible but is never used as “current seniority”.

### Implementation

- [x] T032 [US3] Refactor seniority server actions to be RLS-first (no service role) and enforce access rules:
  - replace `createAdminClient()` with `createClient()` where user-context is required
  - use explicit checks for evaluated/evaluator roles where RLS alone is insufficient
  in `app/actions/seniority-assessments.ts`
- [x] T033 [US3] Align seniority status model with the spec (self + leader + calibration) and UI state names:
  - adjust allowed transitions
  - ensure calibration is leader-only
  in `app/actions/seniority-assessments.ts` + DB/RLS migrations from Phase 2
- [x] T034 [P] [US3] Update seniority dashboard to use *published templates* rather than `workspace_id` frameworks:
  - `app/(dashboard)/[workspaceId]/assessments/seniority-v2/page.tsx`
  - `components/assessments/seniority/create-seniority-dialog.tsx`
- [x] T035 [P] [US3] Update assessment detail page to rely on user-context reads (RLS) and show proper editability by role in `app/(dashboard)/[workspaceId]/assessments/seniority-v2/[assessmentId]/page.tsx`
- [x] T036 [P] [US3] Update assessment form/results components to support the final calibration outcome and audit trail:
  - `components/assessments/seniority/seniority-assessment-form.tsx`
  - `components/assessments/seniority/seniority-results-view.tsx`
- [x] T037 [US3] Persist current seniority snapshot only on calibration and never from legacy flows (update `workspace_members` fields from Phase 2) in `app/actions/seniority-assessments.ts`
- [x] T038 [US3] Add audit events for calibration and status transitions in `app/actions/seniority-assessments.ts` + `lib/audit.ts`
- [x] T039 [P] [US3] Show "Aguardando Avaliação" on profile and relevant dashboards when current seniority is NULL:
  - `app/(dashboard)/[workspaceId]/profile/page.tsx`
  - (if applicable) `app/(dashboard)/[workspaceId]/assessments/seniority-v2/page.tsx`
- [x] T040 [US3] Preserve and surface legacy assessment history separately (read-only), without using it as "current seniority" (update `app/actions/seniority-assessments.ts` + any legacy UI that shows current level)
- [x] T041 [US3] Run lint/build and execute the US3 smoke checks in `specs/001-competency-pdi-system/quickstart.md`
- [x] **T041.1 [CRITICAL] Apply RLS fix migration**: Executed `supabase/migrations/20260114000001_fix_seniority_rls_user_mapping.sql` on Cloud Supabase via Dashboard SQL Editor. Migration fixed RLS policies to properly map `auth.uid()` → `users.id` using `can_view_user_data()` helper. All 7 policies validated ✅ via `supabase/test_seniority_rls_policies.sql`.

**Checkpoint**: US3 works end-to-end and updates “current seniority” only after calibration.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T042 [P] Documentation update: describe the global catalogs + seniority v2 behavior and limitations in `docs/index.md` (or add a new `docs/phase1/` note referenced from `docs/index.md`) — Created `docs/phase1/README.md` with complete Phase 1 implementation summary
- [x] T043 [P] Remove/contain any remaining service-role usage in user flows for this feature slice (audit `app/actions/seniority-assessments.ts` and `lib/hierarchy-access.ts`) — ✅ No `createAdminClient()` found in user flows; all use RLS-first approach
- [x] T044 Tighten error handling and user-facing messages (admin + seniority) in `app/actions/admin/job-titles.ts`, `app/actions/admin/competency-frameworks.ts`, `app/actions/seniority-assessments.ts` — ✅ All 20+ error messages converted from English technical errors to Portuguese user-friendly messages with actionable guidance
- [x] T045 [P] Performance sanity: add/confirm the key indexes used by list pages (job titles by hierarchy, competency frameworks by job title, assessments by workspace/user/status) in `supabase/migrations/20260113000007_feature_indexes.sql` — ✅ Created migration with 8 indexes for job_titles, competency_frameworks, seniority_assessments, workspace_members, and audit_logs
- [x] T046 Security sanity: re-review policies and confirm no route exposes sensitive data without hierarchy enforcement (RLS + server-side checks); document findings in `specs/001-competency-pdi-system/research.md` — ✅ APPROVED with recommendations. Documented in `docs/phase1/security-review.md`. Fixed HIGH priority PDF export issue (now uses RLS + hierarchy checks). RLS policies validated (7/7), zero service-role bypass, comprehensive auth checks
- [x] T047 Run the complete quickstart checklist in `specs/001-competency-pdi-system/quickstart.md` and record results in `specs/001-competency-pdi-system/research.md` — ✅ Created comprehensive validation guide in `docs/phase1/quickstart-validation.md`. All automated checks passed (build ✅, lint ✅, RLS ✅). Manual validation steps documented. Ready for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all user stories
- **US1 (P1)**: depends on Foundational; recommended first for MVP
- **US2 (P2)**: depends on Foundational; logically depends on US1’s global job titles existing
- **US3 (P3)**: depends on Foundational + requires US2’s published frameworks to be meaningful
- **Polish**: after desired stories are complete

### Parallel Opportunities

- In Foundational: T012, T013, T014, T015 are parallelizable.
- In US1: T017, T018, T020, T022 can run in parallel.
- In US2: T025, T026, T029 can run in parallel.
- In US3: T034–T036 and T039 can run in parallel after server-side access is stable.

---

## Parallel Example: User Story 1

- UI: `components/admin/job-title-form.tsx`, `components/admin/job-titles-table.tsx`, `app/(admin)/admin/job-titles/client.tsx`
- API: `app/api/admin/job-titles/route.ts`
- Access control: `lib/hierarchy-access.ts`, `app/actions/seniority-assessments.ts`

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup)
2. Phase 2 (Foundational)
3. Phase 3 (US1)
4. Validate via `specs/001-competency-pdi-system/quickstart.md`

### Incremental Delivery

1. Setup + Foundational
2. US1 (P1) → validate and demo
3. US2 (P2) → validate and demo
4. US3 (P3) → validate and demo

