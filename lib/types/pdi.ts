// PDI Types
export type PDIPlanStatus = 'draft' | 'active' | 'completed' | 'archived'
export type PDIItemStatus = 'not_started' | 'in_progress' | 'completed'
export type PDIActionStatus = 'pending' | 'in_progress' | 'done'
export type PDIPriority = 'critical' | 'high' | 'medium' | 'low'

export interface PDIPlan {
  id: string
  workspace_id: string
  user_id: string
  source_assessment_id: string | null
  status: PDIPlanStatus
  created_at: string
  target_completion_date: string | null
  approved_by: string | null
  approved_at: string | null
  start_date: string | null
  completion_date: string | null
}

export interface PDIItem {
  id: string
  pdi_plan_id: string
  category_id: string
  category_name: string
  criterion: string
  current_score_self: number | null
  current_score_manager: number | null
  target_score: number | null
  priority: PDIPriority | null
  status: PDIItemStatus
  created_at: string
}

export interface PDIAction {
  id: string
  pdi_item_id: string
  action_description: string
  deadline_days: number | null
  start_date: string | null
  due_date: string | null
  status: PDIActionStatus
  priority: 'P1' | 'P2' | 'P3' | null
  created_at: string
  completed_at: string | null
}

export interface PDIEvidence {
  id: string
  pdi_item_id: string
  file_url: string
  description: string | null
  uploaded_by: string
  uploaded_at: string
}

// Extended types with relations
export interface PDIItemWithActions extends PDIItem {
  actions: PDIAction[]
  evidences: PDIEvidence[]
}

export interface PDIPlanWithItems extends PDIPlan {
  items: PDIItemWithActions[]
  user: {
    id: string
    full_name: string | null
    email: string
  }
}

// Template for suggested actions by category
export interface SuggestedAction {
  description: string
  deadline_days: number
}

export const SUGGESTED_ACTIONS_BY_CATEGORY: Record<string, Record<string, SuggestedAction[]>> = {
  // Vendedor
  comportamental: {
    default: [
      { description: 'Realizar atividade de autoconhecimento com coach', deadline_days: 30 },
      { description: 'Solicitar feedback de 3 colegas e líder', deadline_days: 15 },
      { description: 'Participar de workshop sobre comunicação não violenta', deadline_days: 45 }
    ]
  },
  tecnica: {
    default: [
      { description: 'Assistir role-play gravado e identificar pontos de melhoria', deadline_days: 7 },
      { description: 'Fazer shadowing com vendedor sênior', deadline_days: 14 },
      { description: 'Praticar técnica específica em 5 reuniões consecutivas', deadline_days: 30 }
    ]
  },
  processo: {
    default: [
      { description: 'Revisar playbook comercial com líder', deadline_days: 7 },
      { description: 'Criar checklist pessoal de processos', deadline_days: 14 },
      { description: 'Atingir 90% de adesão ao processo por 2 semanas seguidas', deadline_days: 30 }
    ]
  },
  // Líder Comercial
  gestao: {
    default: [
      { description: 'Estudar framework de gestão de pessoas (ex: One-on-Ones)', deadline_days: 21 },
      { description: 'Implementar ritos semanais com o time', deadline_days: 7 },
      { description: 'Buscar mentoria com líder sênior', deadline_days: 30 }
    ]
  }
}
