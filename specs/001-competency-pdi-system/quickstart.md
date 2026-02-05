# Quickstart: Sistema de Competências, Avaliações e PDI (Fundações)

## Prerequisites
- Node.js (>= 20 recommended)
- npm
- Supabase project (cloud) or local Supabase (Supabase CLI)

## Run the app
- Install deps: `npm install`
- Start dev: `npm run dev`
- Open: http://localhost:3000

## Database / Supabase
- Apply migrations in `supabase/migrations/` to your Supabase project.
- Ensure env vars are set for Supabase SSR (project URL + anon key) and any server-only keys.

## Smoke test checklist (feature-level)
1) **Global admin job titles**
- As a super admin, create/update a job title with `hierarchy_level` 0–3.

2) **Global competency frameworks**
- As a super admin, publish a framework for a job title.
- Validate weight sums are enforced.

3) **Seniority v2**
- As a regular user, start self-assessment for your job title.
- As a leader, submit leader assessment.
- Calibrate and verify “current seniority” becomes defined.

4) **Hierarchy access**
- Verify a user cannot read sensitive data for peers/seniors (same or lower level).
