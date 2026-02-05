export const SYSTEM_PERMISSIONS = {
  dashboard: {
    label: "Dashboard",
    permissions: [
      { key: "view_dashboard", label: "Visualizar Dashboard", description: "Permite acesso à visão geral e indicadores principais." },
      { key: "view_financials", label: "Visualizar Dados Financeiros", description: "Permite visualizar métricas financeiras sensíveis como receita e MRR." },
    ]
  },
  teams: {
    label: "Times",
    permissions: [
      { key: "view_team", label: "Visualizar Time", description: "Permite ver a lista de membros e estrutura do time." },
      { key: "manage_members", label: "Gerenciar Membros", description: "Permite editar perfis de membros e alterar suas informações." },
      { key: "invite_members", label: "Convidar Membros", description: "Permite enviar convites para novos usuários entrarem no workspace." },
      { key: "manage_roles", label: "Gerenciar Cargos", description: "Permite criar, editar e excluir cargos e suas permissões." },
    ]
  },
  pdi: {
    label: "PDI",
    permissions: [
      { key: "view_pdi", label: "Visualizar PDIs", description: "Permite visualizar os Planos de Desenvolvimento Individual." },
      { key: "create_pdi", label: "Criar PDI", description: "Permite criar novos PDIs para si mesmo ou liderados." },
      { key: "approve_pdi", label: "Aprovar PDI", description: "Permite aprovar PDIs criados por liderados." },
      { key: "manage_pdi_templates", label: "Gerenciar Modelos de PDI", description: "Permite configurar templates e sugestões de PDI." },
    ]
  },
  assessments: {
    label: "Avaliações",
    permissions: [
      { key: "view_assessments", label: "Visualizar Avaliações", description: "Permite ver resultados de avaliações." },
      { key: "create_assessment", label: "Criar Avaliação", description: "Permite iniciar novos ciclos de avaliação." },
      { key: "manage_assessment_templates", label: "Gerenciar Modelos de Avaliação", description: "Permite criar e editar modelos de avaliação." },
    ]
  },
  settings: {
    label: "Configurações",
    permissions: [
      { key: "manage_workspace", label: "Gerenciar Workspace", description: "Acesso às configurações gerais do workspace (nome, logo, etc)." },
      { key: "manage_billing", label: "Gerenciar Faturamento", description: "Acesso à gestão de planos, faturas e pagamentos." },
    ]
  }
} as const

export type PermissionKey = 
  | typeof SYSTEM_PERMISSIONS.dashboard.permissions[number]["key"]
  | typeof SYSTEM_PERMISSIONS.teams.permissions[number]["key"]
  | typeof SYSTEM_PERMISSIONS.pdi.permissions[number]["key"]
  | typeof SYSTEM_PERMISSIONS.assessments.permissions[number]["key"]
  | typeof SYSTEM_PERMISSIONS.settings.permissions[number]["key"]
