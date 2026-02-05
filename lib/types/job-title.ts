// Enhanced Job Title Types
// Based on migration: 20250101000100_enrich_job_titles.sql

export type JobTitleFixedCompensation =
  | number
  | {
      type: 'value';
      value: number | null;
    }
  | {
      type: 'range';
      min: number | null;
      max: number | null;
    }

export interface JobTitleRemuneration {
  junior: {
    fixed: JobTitleFixedCompensation;
    variable_description: string;
  };
  pleno: {
    fixed: JobTitleFixedCompensation;
    variable_description: string;
  };
  senior: {
    fixed: JobTitleFixedCompensation;
    variable_description: string;
  };
}

export interface JobTitleRequirements {
  education: string;
  mandatory_courses: string[];
  key_competencies: string[];
}

export type HierarchyLevel = 0 | 1 | 2 | 3; // 0=Strategic, 1=Tactical, 2=Operational, 3=Execution

export interface JobTitle {
  id: string;
  name: string;

  // New enriched fields
  slug: string | null;
  hierarchy_level: HierarchyLevel;
  subordination?: string; // Who they report to
  allows_seniority: boolean;
  mission?: string;
  sector: string;
  is_global: boolean;

  // Structured data
  remuneration: JobTitleRemuneration;
  requirements: JobTitleRequirements;
  kpis: string[];
  main_activities: string[];
  common_challenges: string[];

  // Metadata
  last_reviewed_at?: string;
  created_at: string;
  updated_at?: string;
}

// Helper type for creating job titles (admin/global)
export type CreateJobTitleInput = Partial<Omit<JobTitle, 'id' | 'created_at' | 'updated_at' | 'name'>> & {
  name: string;
};

// Helper type for updating job titles
export type UpdateJobTitleInput = Partial<Omit<JobTitle, 'id' | 'created_at'>>;
