# Research: Sistema de Competências, Avaliações e PDI (Fundações)

This document captures the Phase 0 research decisions used by the implementation plan.

## Decisions

### 1) Job Titles (Cargos) are global
- Decision: Maintain a single global catalog of job titles managed by a global admin (super admin). Workspaces reference `job_title_id`.
- Rationale: Avoids per-workspace drift, simplifies cross-workspace standardization, and matches the product’s concept of super admin (`users.is_super_admin`).
- Alternatives considered:
  - Per-workspace job titles (current DB): simpler for initial implementation but causes duplication and inconsistent hierarchy semantics.
  - Hybrid (global templates + workspace overrides): more flexible but adds complexity that is not required for the foundations scope.

### 2) Hierarchical visibility is workspace-wide (not squad-scoped)
- Decision: Access rules apply at workspace scope regardless of squad membership.
- Rationale: Matches the clarified rule and avoids partial visibility edge cases.
- Alternatives considered: restricting by squad (safer by default but conflicts with the chosen product behavior).

### 3) Competency Frameworks are global templates
- Decision: Competency frameworks are global templates per job title, managed by super admin.
- Rationale: Ensures comparability of seniority assessments across workspaces and reduces administrative overhead.
- Alternatives considered: per-workspace frameworks (more flexible but harder to govern).

### 4) “Current seniority” comes only from v2 calibrated flow
- Decision: Legacy seniority assessments remain readable as history but do not define the “current” seniority shown in profile/dashboard.
- Rationale: Avoids ambiguous precedence rules and enforces the new governance model.
- Alternatives considered: “latest wins” across legacy and v2; or legacy remains authoritative until migration.

### 5) Global job titles migration strategy
- Decision: Migrate from workspace-scoped `job_titles` to global job titles without rewriting applied migrations.
- Proposed approach (additive migrations):
  1. Create new global table (temporary name) with enriched fields (hierarchy level and metadata).
  2. Backfill global job titles from distinct `job_titles.name`.
  3. Backfill `workspace_members.job_title_id` to point at global job titles.
  4. Rename tables to keep the canonical name `job_titles` for the global table (rename old table to `job_titles_workspace`).
  5. Remove old workspace seeding trigger (or leave inert if table renamed).
- Rationale: Keeps the migration history intact and provides a clear cutover.

### 6) RLS enforcement approach for hierarchy-based access
- Decision: Enforce hierarchy rules at the database layer via RLS using invoker-safe helpers.
- Rationale: “Correct-by-default” and aligns with the constitution’s RLS-first requirement.
- Notes from best-practice research:
  - Prefer readable policies using `EXISTS` checks and indexed join keys.
  - Avoid `SECURITY DEFINER` unless absolutely necessary; if used, harden search_path and grants.
  - Index columns referenced by policies (workspace/user ids, job_title_id).

### 7) Versioning strategy for frameworks
- Decision: Use an immutable version model: create a new version for every published change; assessments reference the exact version used.
- Rationale: Reproducibility and auditability.
- Alternatives considered: in-place edits to a single record (breaks historical meaning).

## Known Constraints / Existing Tech Debt
- The repo currently uses `createAdminClient()` in several server actions and in `lib/auth-utils.ts`.
- This plan avoids introducing new service-role usage for user flows. If role-check refactors are required, they will be scoped to this feature’s touched paths.
