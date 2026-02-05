export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          supabase_user_id: string
          email: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          supabase_user_id: string
          email: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          supabase_user_id?: string
          email?: string
          full_name?: string | null
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          clerk_org_id: string | null
          plan: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          clerk_org_id?: string | null
          plan?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          clerk_org_id?: string | null
          plan?: string
          created_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'leader' | 'closer' | 'sdr'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'leader' | 'closer' | 'sdr'
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'leader' | 'closer' | 'sdr'
          created_at?: string
        }
      }
      test_structures: {
        Row: {
          id: string
          test_type: string
          structure: Json
          version: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_type: string
          structure: Json
          version?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_type?: string
          structure?: Json
          version?: string
          updated_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          workspace_id: string
          test_type: string
          evaluated_user_id: string | null
          evaluator_user_id: string | null
          assessment_mode: 'self' | 'manager'
          status: 'draft' | 'completed'
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          test_type: string
          evaluated_user_id?: string | null
          evaluator_user_id?: string | null
          assessment_mode: 'self' | 'manager'
          status?: 'draft' | 'completed'
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          test_type?: string
          evaluated_user_id?: string | null
          evaluator_user_id?: string | null
          assessment_mode?: 'self' | 'manager'
          status?: 'draft' | 'completed'
          started_at?: string
          completed_at?: string | null
        }
      }
      pdi_plans: {
        Row: {
          id: string
          workspace_id: string
          user_id: string | null
          source_assessment_id: string | null
          status: 'active' | 'completed' | 'archived'
          created_at: string
          target_completion_date: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id?: string | null
          source_assessment_id?: string | null
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          target_completion_date?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string | null
          source_assessment_id?: string | null
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          target_completion_date?: string | null
        }
      }
    }
  }
}
