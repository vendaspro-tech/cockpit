# Data Model: Sistema de Competências, Avaliações e PDI (Fundações)

This is the Phase 1 design output describing the data model and validation rules.

## Entity: Job Title (`job_titles`) (GLOBAL)
**Purpose:** canonical global catalog of roles/cargos.

**Fields (proposed):**
- `id` (uuid, PK)
- `name` (text, unique, required)
- `hierarchy_level` (int, required, check 0–3)
- `mission` (text, optional)
- `main_activities` (text, optional)
- `kpis` (jsonb, optional) — references KPIs catalog by id/name (implementation choice)
- `remuneration` (jsonb, optional)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Relationships:**
- `workspace_members.job_title_id -> job_titles.id`

**Validation:**
- `hierarchy_level in (0,1,2,3)`

## Entity: Competency Framework (`competency_frameworks`) (GLOBAL TEMPLATE)
**Purpose:** define competency expectations by job title, versioned and publishable.

**Fields (proposed):**
- `id` (uuid, PK)
- `job_title_id` (uuid, FK -> job_titles.id)
- `version` (int, required)
- `is_published` (boolean, default false)
- `published_at` (timestamptz, nullable)
- `structure` (jsonb, required) — dimensions/competencies/weights
- `created_at` (timestamptz)
- `created_by` (uuid -> users.id)

**Constraints:**
- Unique `(job_title_id, version)`
- Only one published framework per job title at a time (enforced via partial unique index or pointer table)

**Structure JSON (example):**
```json
{
  "dimensions": [
    {
      "id": "execution",
      "name": "Execução",
      "weight": 40,
      "competencies": [
        {"id": "pipeline", "name": "Gestão de Pipeline", "weight": 50},
        {"id": "closing", "name": "Fechamento", "weight": 50}
      ]
    }
  ]
}
```

**Validation rules:**
- Sum of dimension weights == 100
- For each dimension, sum of competency weights == 100

(Enforcement: application validation + optional database validation function used on `INSERT/UPDATE`.)

## Entity: Seniority Assessment (`seniority_assessments`) (WORKSPACE-SCOPED INSTANCE)
**Purpose:** 360° evaluation instance for a user.

**Fields (proposed):**
- `id` (uuid, PK)
- `workspace_id` (uuid, FK -> workspaces.id)
- `job_title_id` (uuid, FK -> job_titles.id)
- `framework_id` (uuid, FK -> competency_frameworks.id) — exact version used
- `evaluated_user_id` (uuid, FK -> users.id)
- `evaluator_user_id` (uuid, FK -> users.id) — leader
- `status` (text enum: `draft`, `self_submitted`, `leader_submitted`, `calibrated`, `cancelled`)
- `self_submitted_at` (timestamptz)
- `leader_submitted_at` (timestamptz)
- `calibrated_at` (timestamptz)
- `created_at` (timestamptz)

## Entity: Seniority Assessment Responses (`seniority_assessment_responses`)
**Purpose:** store responses per competency + rater.

**Fields (proposed):**
- `assessment_id` (uuid, FK -> seniority_assessments.id)
- `rater_type` (text enum: `self`, `leader`)
- `competency_id` (text)
- `score` (int)
- `notes` (text, optional)

**Constraints:**
- PK/unique `(assessment_id, rater_type, competency_id)`

## Entity: Seniority Calibration (`seniority_calibrations`)
**Purpose:** final decision; defines the “current seniority” outcome.

**Fields (proposed):**
- `assessment_id` (uuid, PK/FK -> seniority_assessments.id)
- `calibrated_by` (uuid, FK -> users.id)
- `final_level` (int, nullable? recommended required)
- `final_notes` (text)
- `created_at` (timestamptz)

## Entity: Current Seniority Snapshot (recommended)
**Option A:** store in `workspace_members`:
- `current_seniority_level` (int, nullable)
- `seniority_last_calibrated_at` (timestamptz, nullable)
- `seniority_last_assessment_id` (uuid, nullable)

**Rule:** starts NULL; becomes defined only after first calibration (spec clarification).

## Auditing (`audit_log`)
**Purpose:** minimal evidence trail required by FR-008.

**Fields (proposed):**
- `id` (uuid)
- `workspace_id` (uuid, nullable for global changes)
- `actor_user_id` (uuid)
- `action` (text)
- `entity_type` (text)
- `entity_id` (uuid/text)
- `before` (jsonb)
- `after` (jsonb)
- `created_at` (timestamptz)

## State Transitions
- `draft` → `self_submitted` → `leader_submitted` → `calibrated`
- Any non-calibrated state → `cancelled`

## RLS / Access Notes (high-level)
- Global tables (`job_titles`, `competency_frameworks`):
  - SELECT: authenticated users
  - ALL: super admin only
- Workspace tables (`seniority_assessments`, responses):
  - Evaluated user can access their own self responses.
  - Evaluator/leader can access leader responses + calibration.
  - Hierarchy-based read access for “sensitive outcomes” must follow FR-002.
