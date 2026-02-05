# PRD: Sistema de Competências, PDI e Avaliações

**Branch:** `feat/competency-and-pdi-system`
**Data:** 2025-01-01
**Status:** Em Desenvolvimento

---

## 1. Visão Geral e Objetivos

Reestruturar o sistema de gestão de talentos do Cockpit Comercial, evoluindo de um modelo simples para um framework robusto baseado em:

1. **Descrições de Cargo Detalhadas** (Missão, KPIs, Atividades, Hierarquia)
2. **Matriz de Competências Dimensional** (Comportamental 50%, Técnica DEF 30%, Processos 20%)
3. **Avaliações de Senioridade 360º** (Auto + Líder + Calibração)
4. **Método DEF Multicanal** (Platform Test + Sparring + Real Calls com IA)
5. **PDI Trimestral Holístico** (JSONB flexível, contexto integrado)
6. **Dashboards Hierárquicos** com filtros de Squad

---

## 2. Decisões de Arquitetura e Regras de Negócio

### 2.1. Hierarquia e Visibilidade (CRÍTICO)

A visibilidade de dados sensíveis (avaliações, salários, PDIs) será regida pela **Hierarquia de Cargos**:

- **Nível 0 - Estratégico:** Gerente Comercial (vê todos abaixo)
- **Nível 1 - Tático:** Coordenador, Sales Ops, Enablement (vê Nível 2 e 3)
- **Nível 2 - Operacional:** Supervisor (vê Nível 3)
- **Nível 3 - Execução:** SDR, Closer, etc. (vê apenas seus próprios dados)

**Regra:** `Usuario(N)` vê dados de `Usuario(>N)`

**Papel dos Squads:**
- Dimensão organizacional para agrupar processos e pessoas
- Dashboards (Níveis 0-2) têm **Filtro de Squad** obrigatório
- Squads NÃO controlam visibilidade de dados sensíveis

### 2.2. Regra de Senioridade Inicial

> **Regra de Ouro:** Todo usuário é criado com **Senioridade Indefinida** (null).
>
> - O campo `seniority_level` permanece vazio até conclusão da primeira **Avaliação de Senioridade**.
> - Após calibração, o nível é atualizado no perfil.
> - Dashboard trata `seniority_level = null` como "Aguardando Avaliação".

### 2.3. Sistema DEF Dual (Platform Test + Evaluations)

#### Sistema Atual (Manter)
**Tabela:** `assessments` com `test_type='def_method'`
- **Uso:** Platform Test (questionário de 41 questões)
- **Estrutura:** 5 categorias (Whatsapp, Descoberta, Encantamento, Fechamento, Objeções)
- **Granularidade:** Respostas individuais por questão (1-3) em `assessment_responses`
- **Propósito:** Diagnóstico de conhecimento teórico/treinamento

#### Sistema Novo (Implementar)
**Tabela:** `def_call_evaluations`
- **Uso:** Sparrings e Real Calls (avaliações práticas)
- **Estrutura:** 5 scores consolidados (0-3.0) por categoria
- **Granularidade:** Scores diretos + feedback estruturado (JSONB)
- **Propósito:** Avaliação de performance em situações reais

**3 Fontes de Dados DEF:**

1. **Platform Test** (Atual) → `assessments` com `test_type='def_method'`
   - Questionário de 41 questões
   - Avaliação de conhecimento teórico

2. **Sparrings** (Novo) → `def_call_evaluations` com `source_type='sparring'`
   - Simulações com tutor/líder
   - Nota manual + feedback estruturado

3. **Real Calls** (Novo) → `def_call_evaluations` com `source_type='real_call'`
   - Transcrição de reunião anexada pelo usuário
   - Vincula Produto e ICP
   - **Agente IA** analisa e gera nota + feedback automáticos

### 2.4. Mapeamento de Avaliações de Senioridade Existentes (CRÍTICO)

**Decisão:** As avaliações de senioridade existentes devem ser **mantidas e mapeadas** para os cargos apropriados, não eliminadas.

#### Avaliações Existentes no Sistema

| Test Type | Tabela Atual | Cargos Aplicáveis | Status |
|-----------|--------------|-------------------|---------|
| `seniority_seller` | `assessments` | Inside Sales, Closer | ✅ Manter e mapear |
| `seniority_leader` | `assessments` | Gerente Comercial, Coordenador Comercial, Supervisor Comercial | ✅ Manter e mapear |

#### Cargos Sem Avaliação de Senioridade

Os seguintes cargos **não possuem** avaliação de senioridade definida ainda:
- SDR
- BDR
- Social Seller
- Sales Operations
- Sales Enablement
- Customer Success

**Estratégia:**
1. **Fase 1-3:** Criar competency frameworks e seniority_assessments para **todos os 10 cargos**
2. **Fase 3:** Criar assessments específicos para os 6 cargos sem avaliação
3. **Compatibilidade:** Manter `test_type='seniority_seller'` e `'seniority_leader'` funcionando
4. **Migração gradual:** Novos assessments usam `seniority_assessments`, antigos continuam em `assessments`

#### Tabela de Mapeamento Job Title → Assessment Type

| Job Title | Hierarchy Level | Assessment Type (Atual) | Competency Framework (Novo) |
|-----------|----------------|------------------------|----------------------------|
| Gerente Comercial | 0 - Estratégico | `seniority_leader` | ✅ Sim (gestão) |
| Coordenador Comercial | 1 - Tático | `seniority_leader` | ✅ Sim (gestão) |
| Sales Operations | 1 - Tático | ❌ Não tem | ✅ Criar (gestão/ops) |
| Sales Enablement | 1 - Tático | ❌ Não tem | ✅ Criar (gestão/treinamento) |
| Supervisor Comercial | 2 - Operacional | `seniority_leader` | ✅ Sim (gestão) |
| Inside Sales | 3 - Execução | `seniority_seller` | ✅ Sim (vendas) |
| Closer | 3 - Execução | `seniority_seller` | ✅ Sim (vendas) |
| SDR | 3 - Execução | ❌ Não tem | ✅ Criar (vendas/prospecção) |
| BDR | 3 - Execução | ❌ Não tem | ✅ Criar (vendas/prospecção) |
| Social Seller | 3 - Execução | ❌ Não tem | ✅ Criar (vendas/social) |
| Customer Success | 3 - Execução | ❌ Não tem | ✅ Criar (retenção/suporte) |

#### Regras de Validação

```typescript
// Ao criar assessment de senioridade, validar cargo do usuário
const ASSESSMENT_JOB_TITLE_MAP = {
  'seniority_seller': ['Inside Sales', 'Closer'],
  'seniority_leader': ['Gerente Comercial', 'Coordenador Comercial', 'Supervisor Comercial']
};

function canCreateAssessment(userId: string, testType: string): boolean {
  const userJobTitle = getUserJobTitle(userId);
  const allowedJobTitles = ASSESSMENT_JOB_TITLE_MAP[testType];

  return allowedJobTitles?.includes(userJobTitle.name) ?? false;
}
```

### 2.5. Mapeamento de Avaliações de Estilo de Liderança

**Decisão:** A avaliação de estilo de liderança é exclusiva para cargos de liderança.

#### Tabela de Mapeamento Leadership Style

| Test Type | Cargos Aplicáveis | Hierarchy Level | Status |
|-----------|-------------------|-----------------|---------|
| `leadership_style` | Gerente Comercial, Coordenador Comercial, Supervisor Comercial | 0, 1, 2 | ✅ Manter |

**Cargos SEM acesso a Leadership Style:**
- Inside Sales, Closer, SDR, BDR, Social Seller (Nível 3 - Execução)
- Sales Operations, Sales Enablement (Nível 1 - Tático, mas não lideram pessoas)
- Customer Success (Nível 3 - Execução)

**Validação:**
```typescript
const LEADERSHIP_ASSESSMENT_MAP = {
  'leadership_style': [
    'Gerente Comercial',      // Nível 0
    'Coordenador Comercial',  // Nível 1
    'Supervisor Comercial'    // Nível 2
  ]
};

// Validação por hierarchy_level (mais flexível)
function canAccessLeadershipAssessment(user: User): boolean {
  const jobTitle = user.job_title;

  // Cargos de liderança: níveis 0, 1, 2 que lideram pessoas
  const isLeadershipRole = [
    'Gerente Comercial',
    'Coordenador Comercial',
    'Supervisor Comercial'
  ].includes(jobTitle.name);

  return isLeadershipRole;
}
```

### 2.6. Avaliações Opcionais e Contextuais

#### 8 Dimensões de Valores (Opcional)

**Decisão:** Este teste é **opcional** e não impacta PDI, senioridade ou matriz de competências.

- **Propósito:** Autoconhecimento e desenvolvimento pessoal
- **Uso:** Insights sobre valores pessoais do colaborador
- **Integração:** Pode ser usado em contextos de coaching ou onboarding
- **Não afeta:** Cálculo de senioridade, PDI obrigatório, dashboards de performance

**Status:** Mantém implementação atual, sem integração com novo sistema.

#### DISC (Contexto de PDI)

**Decisão:** DISC pode ser integrado ao PDI para ações de desenvolvimento.

**Uso no PDI:**
- Identificar pontos fortes (ex: "Alto D" → Ações para canalizar assertividade)
- Trabalhar pontos fracos (ex: "Baixo S" → Ações para melhorar estabilidade)
- Sugerir ações baseadas no perfil (ex: "Alto I" → Treinamento em foco e organização)

**Integração:**
```typescript
// Ao criar PDI, opcionalmente incluir contexto DISC
interface PDIContext {
  seniority_gap?: string;
  def_weakness?: string;
  kpi_performance?: string;
  disc_profile?: {
    type: 'D' | 'I' | 'S' | 'C' | 'Misto';
    strengths: string[];
    development_areas: string[];
    suggested_actions: string[];
  };
}
```

**Exemplo de Ação PDI baseada em DISC:**
```json
{
  "objective": "Melhorar organização e follow-up (perfil Alto I)",
  "actions": [
    {
      "description": "Usar checklist diário de follow-ups",
      "deadline": "2025-02-15",
      "disc_related": true
    }
  ]
}
```

**Status:** Não obrigatório, mas pode enriquecer o PDI quando disponível.

### 2.7. Storage de Avatares e Assets do Usuário

**PROBLEMA ATUAL:** Avatares estão salvos em `workspace-assets/avatars`, mas usuários podem estar em múltiplos workspaces.

**Decisão:** Migrar para estrutura global por usuário.

#### Estrutura Atual (Incorreta)
```
workspace-assets/
└── {workspace_id}/
    └── avatars/
        └── {user_id}.jpg
```

**Problema:**
- Mesmo avatar duplicado em cada workspace
- Desperdício de storage
- Inconsistência ao atualizar

#### Estrutura Nova (Correta)
```
user-assets/
└── avatars/
    └── {user_id}.jpg
```

**Vantagens:**
- Avatar único e global
- Usuário mantém mesma foto em todos workspaces
- Atualização reflete em todos os lugares

**Migração:**
```sql
-- Script para mover avatares existentes
-- supabase/migrations/20250101000104_migrate_user_avatars.sql

-- 1. Criar novo bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true);

-- 2. Copiar avatares (via script Node.js ou Bash)
-- 3. Atualizar referências em users table
UPDATE users
SET avatar_url = REPLACE(avatar_url, 'workspace-assets', 'user-avatars');

-- 4. Limpar avatares antigos após validação
```

**RLS Policies:**
```sql
-- Leitura pública (avatares são públicos)
CREATE POLICY "Public avatar read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Escrita apenas pelo próprio usuário
CREATE POLICY "User can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Atualização apenas pelo próprio usuário
CREATE POLICY "User can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Entregas Fase 1:**
- [ ] Criar bucket `user-avatars`
- [ ] Migração de avatares existentes
- [ ] Atualizar componentes de upload
- [ ] Configurar RLS policies

### 2.8. Portabilidade de Histórico entre Workspaces

**CONTEXTO:** Um workspace equivale a uma empresa. Usuários podem:
1. Criar workspace próprio (sem empresa)
2. Ser contratados e migrar para workspace da empresa
3. Mudar de empresa e querer levar histórico

**Decisão:** Implementar sistema de "Transferência de Histórico" entre workspaces.

#### Cenários de Uso

**Cenário 1: Usuário Individual → Empresa**
```
João cria "João Vendas" (workspace pessoal)
→ Faz avaliações, PDIs, tasks
→ É contratado pela "Empresa XYZ"
→ Quer levar histórico para workspace da empresa
```

**Cenário 2: Mudança de Empresa**
```
Maria trabalha na "Empresa A"
→ Histórico de 2 anos (avaliações, PDIs, DEF)
→ Muda para "Empresa B"
→ Quer levar histórico relevante
```

#### Dados Transferíveis

| Entidade | Transferível? | Observações |
|----------|---------------|-------------|
| **Assessments** | ✅ Sim | Avaliações de senioridade, DISC, Leadership |
| **Seniority Assessments** | ✅ Sim | Histórico de níveis e calibrações |
| **DEF Evaluations** | ⚠️ Parcial | Platform tests sim, sparrings/calls com transcrição: decisão do usuário |
| **PDI Plans** | ⚠️ Parcial | Estrutura sim, evidências da empresa anterior: não |
| **Tasks** | ❌ Não | Tasks são contexto da empresa |
| **Products/ICPs** | ❌ Não | Propriedade intelectual da empresa |

#### Implementação

**Tabela de Histórico Portátil:**
```sql
CREATE TABLE user_portable_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  source_workspace_id UUID REFERENCES workspaces(id),
  data_type TEXT NOT NULL, -- 'assessment', 'seniority', 'def', 'pdi'
  original_record_id UUID NOT NULL,
  snapshot JSONB NOT NULL, -- Cópia imutável dos dados
  is_transferred BOOLEAN DEFAULT FALSE,
  transferred_to_workspace_id UUID REFERENCES workspaces(id),
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_portable_history_user ON user_portable_history(user_id);
CREATE INDEX idx_portable_history_workspace ON user_portable_history(source_workspace_id);
```

**Fluxo de Transferência:**

1. **Exportar Histórico (Origem):**
```typescript
async function exportUserHistory(userId: string, workspaceId: string) {
  // 1. Buscar todos os dados transferíveis
  const assessments = await getAssessments(userId, workspaceId);
  const seniorityAssessments = await getSeniorityAssessments(userId, workspaceId);
  const defEvaluations = await getDEFEvaluations(userId, workspaceId, 'platform_test');
  const pdis = await getPDIs(userId, workspaceId);

  // 2. Criar snapshots imutáveis
  const snapshots = [
    ...assessments.map(a => createSnapshot('assessment', a)),
    ...seniorityAssessments.map(s => createSnapshot('seniority', s)),
    ...defEvaluations.map(d => createSnapshot('def', d)),
    ...pdis.map(p => createSnapshot('pdi', p))
  ];

  // 3. Salvar em user_portable_history
  await savePortableHistory(userId, workspaceId, snapshots);

  return { exported: snapshots.length };
}
```

2. **Importar Histórico (Destino):**
```typescript
async function importUserHistory(
  userId: string,
  targetWorkspaceId: string,
  selections: string[] // IDs dos snapshots a importar
) {
  // 1. Buscar snapshots selecionados
  const snapshots = await getPortableHistory(userId, selections);

  // 2. Recriar records no novo workspace
  for (const snapshot of snapshots) {
    switch (snapshot.data_type) {
      case 'assessment':
        await recreateAssessment(snapshot.snapshot, targetWorkspaceId);
        break;
      case 'seniority':
        await recreateSeniorityAssessment(snapshot.snapshot, targetWorkspaceId);
        break;
      // ... outros tipos
    }

    // 3. Marcar como transferido
    await markAsTransferred(snapshot.id, targetWorkspaceId);
  }
}
```

**UI de Transferência:**
```tsx
// Rota: /[workspaceId]/settings/history-transfer

<HistoryTransferWizard>
  <Step1>
    {/* Listar workspaces anteriores do usuário */}
    {/* Permitir selecionar origem */}
  </Step1>

  <Step2>
    {/* Mostrar dados disponíveis para transferir */}
    {/* Checkboxes por tipo (Assessments, PDI, DEF) */}
    {/* Preview dos dados */}
  </Step2>

  <Step3>
    {/* Confirmação e disclaimer */}
    {/* "Dados serão copiados, não movidos" */}
  </Step3>

  <Step4>
    {/* Progresso da transferência */}
    {/* Resumo do que foi importado */}
  </Step4>
</HistoryTransferWizard>
```

**Regras de Negócio:**

1. **Transferência é cópia, não movimentação:** Dados originais permanecem no workspace de origem
2. **Imutabilidade:** Snapshots são imutáveis (não podem ser editados após transferência)
3. **Auditoria:** Todas transferências são logadas
4. **Permissão:** Apenas o próprio usuário pode transferir seu histórico
5. **Workspace pessoal:** Usuário sempre mantém acesso ao workspace pessoal

**Entregas Fase 8 (ou Onda 2):**
- [ ] Tabela `user_portable_history`
- [ ] Actions de export/import
- [ ] UI de transferência (wizard)
- [ ] Auditoria e logs
- [ ] Documentação para usuários

### 2.9. PDI Holístico (Migração para Novo Sistema)

**Decisão:** Migrar de sistema relacional (`pdi_plans` + `pdi_items` + `pdi_actions`) para sistema JSONB (`pdis`)

**Novo Sistema:**
- **Tabela única:** `pdis` com estrutura JSONB flexível
- **Contexto integrado:** Snapshot de gaps (senioridade, DEF, KPIs)
- **Action Plan:** Array JSONB de objetivos e ações
- **Checkpoints:** Array JSONB de revisões mensais
- **Ciclo:** Trimestral (90 dias) com datas flexíveis

**Vantagens:**
- Mais flexível para contextos variados
- Fácil adicionar campos sem migrations
- Alinhado com visão holística do PRD

---

## 3. Schema de Banco de Dados

### 3.1. Job Titles (Migração 20250101000100)

**Status:** ✅ Migração criada, aguardando execução

```sql
ALTER TABLE job_titles
  ADD COLUMN slug TEXT,
  ADD COLUMN hierarchy_level INTEGER DEFAULT 3, -- 0=Estratégico, 1=Tático, 2=Operacional, 3=Execução
  ADD COLUMN subordination TEXT,
  ADD COLUMN allows_seniority BOOLEAN DEFAULT TRUE,
  ADD COLUMN mission TEXT,
  ADD COLUMN sector TEXT DEFAULT 'Comercial',
  ADD COLUMN remuneration JSONB, -- {junior, pleno, senior}
  ADD COLUMN requirements JSONB, -- {education, courses, competencies}
  ADD COLUMN kpis JSONB,
  ADD COLUMN main_activities JSONB,
  ADD COLUMN common_challenges JSONB,
  ADD COLUMN last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ;
```

**Seed:** `seed_job_titles.sql` - 10 cargos completos

### 3.2. Competency System (Migração 20250101000101)

**Status:** ✅ Migração criada, aguardando execução

```sql
-- Frameworks de competência por cargo
CREATE TABLE competency_frameworks (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  job_title_id UUID,
  name TEXT, -- "SDR Competency Matrix"

  -- Pesos (total = 1.00)
  weights JSONB, -- {behavioral: 0.50, technical_def: 0.30, process: 0.20}

  -- Competências (arrays JSONB)
  behavioral_competencies JSONB, -- 16 competências
  technical_def_competencies JSONB, -- 5 competências DEF
  process_competencies JSONB, -- 7 (vendedor) ou 10 (gestor)

  -- Ranges para classificação
  scoring_ranges JSONB -- {behavioral, technical_def, process, global} x {junior, pleno, senior}
);

-- Avaliações de senioridade
CREATE TABLE seniority_assessments (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  evaluated_user_id UUID,
  evaluator_user_id UUID,
  job_title_id UUID,
  competency_framework_id UUID,

  assessment_type TEXT, -- 'self' | 'leader'
  status TEXT, -- 'draft' | 'submitted' | 'calibrated'

  -- Scores por dimensão
  behavioral_scores JSONB,
  technical_def_scores JSONB,
  process_scores JSONB,

  -- Totais calculados
  behavioral_total DECIMAL(5,2),
  technical_def_total DECIMAL(5,2),
  process_total DECIMAL(5,2),
  global_score DECIMAL(5,2),

  -- Níveis resultantes
  behavioral_level TEXT, -- 'junior' | 'pleno' | 'senior'
  technical_def_level TEXT,
  process_level TEXT,
  global_level TEXT,

  -- Comentários
  behavioral_comments TEXT,
  technical_def_comments TEXT,
  process_comments TEXT,
  general_observations TEXT,
  calibration_notes TEXT,

  assessment_period TEXT, -- "Q1 2025"
  completed_at TIMESTAMPTZ,
  calibrated_at TIMESTAMPTZ
);
```

**Seed:** `seed_competency_frameworks.sql` - Frameworks para SDR, Closer, Supervisor

### 3.3. DEF Evaluations (Migração 20250101000102)

**Status:** ✅ Migração criada, aguardando execução

```sql
CREATE TABLE def_call_evaluations (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  evaluated_user_id UUID,

  -- Fonte da avaliação
  source_type TEXT, -- 'platform_test' | 'sparring' | 'real_call'

  -- Metadata (Real Calls e Sparrings)
  product_id UUID,
  icp_id UUID,
  lead_name TEXT,
  recording_url TEXT,
  transcription_text TEXT,
  call_date TIMESTAMPTZ,

  -- Avaliador
  evaluator_user_id UUID, -- NULL se IA
  is_ai_evaluation BOOLEAN DEFAULT FALSE,

  -- Scores por categoria (0-3)
  whatsapp_score DECIMAL(3,1),
  discovery_score DECIMAL(3,1),
  enchantment_score DECIMAL(3,1),
  closing_score DECIMAL(3,1),
  objection_score DECIMAL(3,1),
  average_score DECIMAL(3,1) GENERATED ALWAYS AS (...) STORED,

  -- Feedback estruturado
  feedback_data JSONB, -- Checklists, comentários por seção
  general_feedback TEXT
);
```

### 3.4. PDI Holístico (Migração 20250101000102)

**Status:** ✅ Migração criada, aguardando execução

```sql
CREATE TABLE pdis (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  user_id UUID,
  leader_id UUID,

  -- Ciclo
  start_date DATE,
  end_date DATE,
  status TEXT, -- 'draft' | 'active' | 'completed' | 'cancelled' | 'archived'

  -- Snapshot de contexto
  context_snapshot JSONB,
  /* {
    seniority_gap: "Junior -> Pleno",
    def_weakness: "Fechamento (Avg 1.2)",
    kpi_performance: "Conversion 5% (Target 10%)"
  } */

  -- Plano de ação
  action_plan JSONB,
  /* [{
    id: "uuid",
    objective: "Melhorar Fechamento",
    actions: [{description, deadline, status}],
    status: "pending" | "in_progress" | "done"
  }] */

  -- Checkpoints mensais
  checkpoints JSONB,
  /* [{
    date: "2025-02-01",
    notes: "...",
    progress_percentage: 30
  }] */

  -- Notas
  leader_notes TEXT,
  collaborator_notes TEXT,

  completed_at TIMESTAMPTZ
);
```

---

## 4. Estado Atual do Sistema

### ✅ O Que Já Existe e Funciona

1. **Sistema DEF Platform Test** (`assessments` + `test_type='def_method'`)
   - 41 questões em 5 categorias
   - Fluxo completo: criar → responder → visualizar resultados
   - Vinculação com produtos
   - Filtros por status e PDI

2. **Sistema PDI Legacy** (`pdi_plans` + `pdi_items` + `pdi_actions`)
   - CRUD completo
   - Aprovação de líder
   - Upload de evidências
   - Integração com tasks

3. **Job Titles Base** (`job_titles`)
   - Criação automática por workspace
   - 5 títulos padrão (Closer, Líder, BDR, SDR, Social Seller)

4. **AI RAG Backend** (Vercel AI SDK)
   - `generateWithRAG()` - Text generation com contexto
   - `generateObjectWithRAG()` - Structured output
   - API endpoints: `/api/ai/rag/search`, `/api/ai/rag/index-document`
   - ❌ Sem frontend/chat UI

### ⚠️ O Que Está Criado Mas Não Implementado

1. **Migrações 100-102:** Criadas mas não executadas
2. **Seeds:** `seed_job_titles.sql`, `seed_competency_frameworks.sql`
3. **Novo sistema DEF:** Tabela `def_call_evaluations` criada mas sem código
4. **Novo sistema PDI:** Tabela `pdis` criada mas sem código
5. **Competency System:** Tabelas criadas mas sem UI/Actions

---

## 5. Plano de Execução

### ✅ Fase 0: Preparação (CONCLUÍDA)

- ✅ Criar branch `feat/competency-and-pdi-system`
- ✅ Auditar código existente
- ✅ Definir decisões arquiteturais

### 🚀 Fase 1: Foundation & Types (3 dias)

#### 1.1. Executar Migrações e Seeds
```bash
# Aplicar migrações
supabase db push

# Executar seeds
psql -f supabase/seed_job_titles.sql
psql -f supabase/seed_competency_frameworks.sql

# Verificar
supabase db diff
```

#### 1.2. Criar TypeScript Types
- `lib/types/job-title.ts` - JobTitle enriquecido
- `lib/types/competency.ts` - CompetencyFramework, SeniorityAssessment
- `lib/types/def-evaluation.ts` - DEFCallEvaluation
- `lib/types/pdi-holistic.ts` - PDI novo sistema

#### 1.3. Configurar RLS Policies
- Policies baseadas em `hierarchy_level`
- Policies para `competency_frameworks`
- Policies para `seniority_assessments`
- Policies para `def_call_evaluations`
- Policies para `pdis`

**Entregas:**
- [x] Migrações aplicadas
- [ ] Seeds executados
- [ ] Types TypeScript criados
- [ ] RLS configurado

---

### 🚀 Fase 2: Admin & Job Titles (7 dias)

#### 2.1. Admin - Gestão de Cargos
**Rota:** `/admin/job-titles`

**Componentes:**
- `components/admin/job-titles-table.tsx` - Lista com hierarquia
- `components/admin/job-title-form.tsx` - CRUD completo
- `components/admin/job-title-hierarchy-view.tsx` - Árvore visual

**Actions:**
- `app/actions/admin/job-titles.ts`
  - `listJobTitles()` - Com filtros
  - `getJobTitle(id)` - Detalhes completos
  - `createJobTitle(data)` - Validação
  - `updateJobTitle(id, data)` - Atualização
  - `deleteJobTitle(id)` - Soft delete

**Features:**
- Editor de Missão (Textarea)
- Editor de KPIs (Array JSONB - dynamic form)
- Editor de Remuneração (3 níveis: Jr/Pl/Sr)
- Editor de Atividades (Array JSONB)
- Seletor de Hierarquia (0-3)
- Campo subordination (Textarea)

#### 2.2. Admin - Matriz de Competências
**Rota:** `/admin/competency-frameworks`

**Componentes:**
- `components/admin/competency-frameworks-table.tsx`
- `components/admin/competency-matrix-editor.tsx` - Editor visual
- `components/admin/scoring-ranges-editor.tsx` - Configurar ranges

**Actions:**
- `app/actions/admin/competencies.ts`
  - `listFrameworks()`
  - `getFramework(id)`
  - `createFramework(data)`
  - `updateFramework(id, data)`
  - `cloneFramework(id)` - Duplicar para novo cargo

**Features:**
- Ajuste de pesos (Comportamental, Técnica DEF, Processos) → Total = 100%
- Editor de competências (Nome, Níveis 1-3 com descrições)
- Configuração de ranges por senioridade
- Visualização de cargo vinculado

#### 2.3. Admin - Editor de Testes (Test Structures)
**Rota:** `/admin/assessments/editor`

**PROBLEMA ATUAL:** A UX/UI e funcionalidades do editor de testes não estão boas e funcionais. Precisa ser reformulado.

**Componentes:**
- `components/admin/test-structure-list.tsx` - Lista de todos test_types
  - Filtros: test_type, status (ativo/inativo), versão
  - Indicador visual de qual versão está ativa
  - Ações: Editar, Clonar, Criar nova versão, Ativar/Desativar

- `components/admin/test-structure-editor.tsx` - **Editor Visual Intuitivo**
  - **Modo de visualização:**
    - Overview: metadados do teste (nome, descrição, cargos aplicáveis)
    - Estrutura: visualização hierárquica (categorias → questões)
    - Scoring: regras de pontuação e ranges de senioridade
    - Preview: visualização de como o usuário final verá o teste

  - **Features de edição:**
    - Drag & drop para reordenar questões e categorias
    - Editor WYSIWYG para texto das questões
    - Adicionar/remover questões com validação
    - Configurar pesos por categoria (visual com slider + percentuais)
    - Editar ranges de pontuação (junior/pleno/senior) com validação
    - Opções de resposta (escala 1-3, múltipla escolha, etc.)
    - Preview em tempo real das mudanças

- `components/admin/test-structure-version-manager.tsx` - **Versionamento**
  - Histórico de versões (v1, v2, v3...)
  - Comparação side-by-side entre versões
  - Rollback para versões anteriores
  - Changelog/notas de versão

**Actions:**
- `app/actions/admin/test-structures.ts`
  - `listTestStructures(filters)` - Lista com paginação e filtros
  - `getTestStructure(testType, version?)` - Busca específica ou versão ativa
  - `createTestStructure(data)` - Criar novo test_type
  - `updateTestStructure(testType, data)` - Atualizar (cria nova versão)
  - `cloneTestStructure(testType)` - Duplicar para novo test_type
  - `activateVersion(testType, version)` - Ativar versão específica
  - `getVersionHistory(testType)` - Histórico completo
  - `compareVersions(testType, v1, v2)` - Diff entre versões

**Validações:**
- Pesos das categorias devem somar 100%
- Ranges de senioridade não podem sobrepor
- Mínimo de 1 questão por categoria
- IDs de questões únicos dentro do teste
- JSON válido antes de salvar

**Versionamento:**
```typescript
interface TestStructureVersion {
  test_type: string;
  version: number;
  is_active: boolean;
  structure: TestStructureJSON;
  created_by: string;
  created_at: Date;
  changelog?: string;
}

// Ao atualizar, sempre criar nova versão
function updateTestStructure(testType, newStructure, changelog) {
  const currentActive = getCurrentVersion(testType);
  const newVersion = {
    ...newStructure,
    version: currentActive.version + 1,
    is_active: false, // Admin decide quando ativar
    changelog
  };

  return saveNewVersion(newVersion);
}
```

**UX Melhorias:**
1. **Validação em tempo real:** Feedback visual imediato de erros
2. **Auto-save:** Salvar rascunho automaticamente a cada 30s
3. **Undo/Redo:** Histórico de ações dentro da sessão de edição
4. **Templates:** Templates pré-configurados para novos testes
5. **Import/Export:** JSON para backup/restauração
6. **Preview responsivo:** Ver como fica em desktop/mobile
7. **Ajuda contextual:** Tooltips e documentação inline

**Entregas:**
- [ ] Admin Job Titles (lista + CRUD)
- [ ] Admin Competency Frameworks (lista + editor)
- [ ] **Admin Test Structure Editor (NEW)**
  - [ ] Lista de test_structures com filtros
  - [ ] Editor visual intuitivo
  - [ ] Sistema de versionamento
  - [ ] Validações e preview
- [ ] Visualização de hierarquia
- [ ] Actions implementadas
- [ ] RLS testado

---

### 🚀 Fase 3: Avaliações de Senioridade (7 dias)

#### 3.1. Compatibilidade com Avaliações Existentes

**IMPORTANTE:** Manter sistema atual funcionando para Inside Sales, Closer e cargos de liderança.

**Validação por Cargo:**
- `lib/constants/assessment-job-mapping.ts` - Mapeamento test_type → job_titles

```typescript
export const ASSESSMENT_JOB_TITLE_MAP = {
  'seniority_seller': ['Inside Sales', 'Closer'],
  'seniority_leader': ['Gerente Comercial', 'Coordenador Comercial', 'Supervisor Comercial']
} as const;

export const JOB_TITLES_WITHOUT_ASSESSMENT = [
  'SDR', 'BDR', 'Social Seller',
  'Sales Operations', 'Sales Enablement', 'Customer Success'
] as const;
```

**Actions atualizados:**
- `app/actions/assessments.ts`
  - `canCreateAssessment(userId, testType)` - Validar se cargo permite
  - `getAvailableAssessmentTypes(userId)` - Retornar test_types disponíveis para o cargo

#### 3.2. Criar Test Structures para Novos Cargos

**Novos test_types a criar:**
1. `seniority_sdr` - SDR, BDR (prospecção)
2. `seniority_social_seller` - Social Seller (vendas sociais)
3. `seniority_ops` - Sales Operations (operações)
4. `seniority_enablement` - Sales Enablement (treinamento)
5. `seniority_cs` - Customer Success (retenção)

**Script de migração:**
`supabase/migrations/20250101000103_new_seniority_assessments.sql`

```sql
-- Inserir novos test_structures
INSERT INTO test_structures (test_type, structure, version)
VALUES
  ('seniority_sdr', '<structure_json>', 1),
  ('seniority_social_seller', '<structure_json>', 1),
  ('seniority_ops', '<structure_json>', 1),
  ('seniority_enablement', '<structure_json>', 1),
  ('seniority_cs', '<structure_json>', 1);

-- Atualizar mapeamento em tabela auxiliar
CREATE TABLE IF NOT EXISTS job_title_assessment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  job_title_id UUID REFERENCES job_titles(id),
  test_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, job_title_id, test_type)
);

-- Popular mapeamento
INSERT INTO job_title_assessment_types (workspace_id, job_title_id, test_type)
SELECT
  jt.workspace_id,
  jt.id,
  CASE jt.name
    WHEN 'Inside Sales' THEN 'seniority_seller'
    WHEN 'Closer' THEN 'seniority_seller'
    WHEN 'Gerente Comercial' THEN 'seniority_leader'
    WHEN 'Coordenador Comercial' THEN 'seniority_leader'
    WHEN 'Supervisor Comercial' THEN 'seniority_leader'
    WHEN 'SDR' THEN 'seniority_sdr'
    WHEN 'BDR' THEN 'seniority_sdr'
    WHEN 'Social Seller' THEN 'seniority_social_seller'
    WHEN 'Sales Operations' THEN 'seniority_ops'
    WHEN 'Sales Enablement' THEN 'seniority_enablement'
    WHEN 'Customer Success' THEN 'seniority_cs'
  END as test_type
FROM job_titles jt;
```

**Estruturas JSON:**
- Baseadas em `competency_frameworks` de cada cargo
- Conversão de competências → questões de avaliação
- Mantém compatibilidade com sistema atual (assessment_responses)

#### 3.3. Fluxo de Avaliação (Novo Sistema)
**Rota:** `/[workspaceId]/assessments/seniority-v2`

**Componentes:**
- `components/assessments/seniority/create-assessment-dialog.tsx`
  - Validação automática: mostra apenas test_types válidos para o cargo do usuário
- `components/assessments/seniority/assessment-form.tsx` - 3 tabs (Comportamental, Técnica, Processos)
- `components/assessments/seniority/results-view.tsx` - Radar chart + níveis
- `components/assessments/seniority/calibration-panel.tsx` - Comparar auto vs líder

**Actions:**
- `app/actions/seniority-assessments.ts`
  - `createSeniorityAssessment(userId, jobTitleId)` - Usa competency_framework
  - `saveSeniorityScores(assessmentId, scores)`
  - `submitSeniorityAssessment(id)` - Status: submitted
  - `calibrateSeniorityAssessment(id, notes)` - Calcula níveis finais
  - `getSeniorityHistory(userId)` - Timeline de avaliações

**Lógica de Negócio:**
1. Validar cargo do usuário
2. Buscar competency_framework do cargo
3. Usuário faz **auto-avaliação** (status: draft → submitted)
4. Líder faz **avaliação do colaborador** (status: draft → submitted)
5. Líder faz **calibração** comparando as duas (status: calibrated)
6. Após calibração:
   - Calcula níveis por dimensão usando scoring_ranges
   - Calcula nível global
   - Atualiza campo `seniority_level` em `users`

#### 3.4. Atualizar Sistema Atual (Compatibilidade)

**Adicionar validação ao fluxo existente:**
- `/[workspaceId]/assessments/seniority-seller` - Só permite Inside Sales, Closer
- `/[workspaceId]/assessments/seniority-leader` - Só permite Gerente, Coordenador, Supervisor

**Componente de redirecionamento:**
```typescript
// Se usuário tem cargo sem avaliação, mostrar mensagem
if (JOB_TITLES_WITHOUT_ASSESSMENT.includes(userJobTitle.name)) {
  return (
    <Alert>
      <AlertTitle>Avaliação em Desenvolvimento</AlertTitle>
      <AlertDescription>
        A avaliação de senioridade para o cargo {userJobTitle.name}
        está sendo desenvolvida. Disponível em breve.
      </AlertDescription>
    </Alert>
  );
}
```

#### 3.5. Dashboard de Senioridade
**Rota:** `/[workspaceId]/assessments/seniority/dashboard`

**Componentes:**
- `components/assessments/seniority/seniority-dashboard.tsx`
- Distribuição por nível (Jr/Pl/Sr)
- Gaps por dimensão (Comportamental, Técnica, Processos)
- **Filtros:** Squad, Job Title, Período
- **Indicador:** Quantos usuários ainda sem avaliação por cargo

**Entregas:**
- [ ] Criar test_structures para 6 novos cargos
- [ ] Migração com job_title_assessment_types
- [ ] Validação de cargo no fluxo existente
- [ ] Fluxo novo sistema (seniority_assessments)
- [ ] Calibração e cálculo de níveis
- [ ] Atualização de seniority_level em users
- [ ] Dashboard consolidado (ambos sistemas)
- [ ] Histórico de avaliações

---

### 🚀 Fase 4: DEF Multicanal (7 dias)

#### 4.1. Manter Platform Test Atual
- ✅ Já funciona em `/[workspaceId]/assessments/def`
- Nenhuma alteração necessária

#### 4.2. Implementar Sparrings
**Rota:** `/[workspaceId]/def/sparrings`

**Componentes:**
- `components/def/sparring-form.tsx` - Formulário de avaliação de sparring
- `components/def/sparring-list.tsx` - Lista de sparrings realizados

**Actions:**
- `app/actions/def-evaluations.ts`
  - `createSparringEvaluation(data)` - source_type='sparring'
  - `listSparrings(userId, filters)`

**Features:**
- Seleção de avaliado
- Seleção de produto e ICP
- Scores por categoria (0-3, decimal)
- Feedback estruturado por seção
- Comentário geral

#### 4.3. Implementar Real Calls com IA
**Rota:** `/[workspaceId]/def/real-calls`

**Componentes:**
- `components/def/real-call-upload.tsx` - Upload de transcrição
- `components/def/real-call-analysis.tsx` - Resultados da IA

**Actions:**
- `app/actions/def-evaluations.ts`
  - `createRealCallEvaluation(data)` - source_type='real_call'
  - `analyzeTranscription(callId)` - Chama IA

**API Routes:**
- `app/api/ai/analyze-call/route.ts` - Endpoint para análise de IA

**Integração com IA:**
```typescript
import { generateObjectWithRAG } from '@/lib/ai/rag/vercel-integration';

const analysis = await generateObjectWithRAG({
  userMessage: `Analise esta transcrição de call: ${transcription}`,
  workspaceId,
  systemPrompt: `Você é um especialista em vendas...`,
  schema: z.object({
    whatsapp_score: z.number().min(0).max(3),
    discovery_score: z.number().min(0).max(3),
    enchantment_score: z.number().min(0).max(3),
    closing_score: z.number().min(0).max(3),
    objection_score: z.number().min(0).max(3),
    feedback_data: z.object({...}),
  }),
  ragOptions: {
    documentType: 'transcript',
  }
});
```

**Entregas:**
- [ ] Sparring evaluation form
- [ ] Real call upload + análise IA
- [ ] Dashboard consolidado DEF (platform + sparring + real)
- [ ] API de análise de IA implementada

---

### 🚀 Fase 5: PDI Holístico (7 dias)

#### 5.1. Migração de Dados
**Script:** `supabase/migrations/20250101000110_migrate_pdi_to_holistic.sql`

```sql
-- Migrar PDIs existentes para novo formato
INSERT INTO pdis (
  workspace_id, user_id, leader_id,
  start_date, end_date, status,
  context_snapshot, action_plan, checkpoints,
  created_at
)
SELECT
  pp.workspace_id,
  pp.user_id,
  pp.approved_by as leader_id,
  pp.start_date,
  pp.target_completion_date as end_date,
  CASE pp.status
    WHEN 'active' THEN 'active'
    WHEN 'completed' THEN 'completed'
    ELSE 'draft'
  END,

  -- Snapshot (construir a partir de dados existentes)
  jsonb_build_object(
    'source', 'migrated_from_legacy',
    'original_pdi_plan_id', pp.id
  ),

  -- Action plan (converter pdi_items + pdi_actions)
  (SELECT jsonb_agg(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'objective', pi.criterion,
      'actions', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'description', pa.action_description,
            'deadline', pa.due_date,
            'status', pa.status
          )
        )
        FROM pdi_actions pa
        WHERE pa.pdi_item_id = pi.id
      ),
      'status', pi.status
    )
  )
  FROM pdi_items pi
  WHERE pi.pdi_plan_id = pp.id),

  -- Checkpoints (vazio por enquanto)
  '[]'::jsonb,

  pp.created_at
FROM pdi_plans pp
WHERE pp.status != 'archived';
```

#### 5.2. Nova Interface PDI
**Rota:** `/[workspaceId]/pdi`

**Componentes:**
- `components/pdi/pdi-wizard.tsx` - Wizard de criação
  - Step 1: Contexto (gaps detectados)
  - Step 2: Objetivos
  - Step 3: Ações por objetivo
  - Step 4: Revisão

- `components/pdi/pdi-dashboard.tsx` - Dashboard holístico
- `components/pdi/checkpoint-form.tsx` - Registrar checkpoints mensais
- `components/pdi/pdi-timeline.tsx` - Timeline visual

**Actions:**
- `app/actions/pdis.ts` (novo)
  - `createPDI(userId, data)`
  - `updatePDI(id, data)`
  - `addCheckpoint(pdiId, checkpoint)`
  - `updateActionStatus(pdiId, actionId, status)`
  - `completePDI(pdiId)`
  - `getUserActivePDI(userId)`
  - `getPDIHistory(userId)`

**Features:**
- Wizard inteligente que sugere objetivos baseado em:
  - Gap de senioridade (seniority_assessments)
  - Scores DEF baixos (def_call_evaluations)
  - KPIs abaixo da meta
- Checkpoints mensais com percentual de progresso
- Timeline visual de evolução

#### 5.3. Deprecar Sistema Legacy
- Manter tabelas legacy em read-only
- Redirecionar rotas antigas para novas
- Exibir banner de migração

**Entregas:**
- [ ] Script de migração de dados
- [ ] Nova interface PDI (wizard + dashboard)
- [ ] Checkpoints mensais
- [ ] Integração com seniority_assessments e DEF
- [ ] Timeline de evolução
- [ ] Deprecação do sistema legacy

---

### 🚀 Fase 6: AI Vercel SDK - Conclusão (5 dias)

#### 6.1. Chat Interface
**Rota:** `/[workspaceId]/ai/chat`

**Componentes:**
- `components/ai/chat-interface.tsx` - Interface de chat
- `components/ai/message-list.tsx` - Lista de mensagens
- `components/ai/rag-context-display.tsx` - Mostrar documentos usados

**Hooks:**
- `lib/hooks/use-chat-with-rag.ts` - Wrapper do useChat com RAG

```typescript
import { useChat } from '@ai-sdk/react';

export function useChatWithRAG(workspaceId: string) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/ai/chat',
    body: { workspaceId },
  });

  return { messages, input, handleInputChange, handleSubmit };
}
```

**API Routes:**
- `app/api/ai/chat/route.ts` - Streaming chat com RAG

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createSupabaseRAG } from '@/lib/ai/rag/supabase-rag';

export async function POST(req: Request) {
  const { messages, workspaceId } = await req.json();

  // Get RAG context
  const rag = createSupabaseRAG();
  const lastMessage = messages[messages.length - 1].content;
  const ragResults = await rag.search({
    query: lastMessage,
    workspaceId,
    limit: 3,
  });

  // Stream response
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    system: `...contexto RAG...`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

#### 6.2. Agentes Especializados
- **Agente de Análise de DEF:** Analisa transcrições de calls
- **Agente de PDI:** Sugere objetivos e ações
- **Agente de Coaching:** Responde dúvidas sobre vendas

**Entregas:**
- [ ] Chat interface com streaming
- [ ] RAG context display
- [ ] API de chat com streaming
- [ ] Agentes especializados
- [ ] Análise de transcrições DEF

---

### 🚀 Fase 7: Dashboards Hierárquicos (5 dias)

#### 7.1. Dashboard Principal
**Rota:** `/[workspaceId]/dashboard`

**Features:**
- Filtro de Squad (obrigatório para Níveis 0-2)
- Visibilidade baseada em hierarchy_level
- Métricas consolidadas:
  - Distribuição de senioridade
  - Média DEF por categoria
  - PDIs ativos/concluídos
  - Gaps prioritários

#### 7.2. Dashboard do Líder
**Rota:** `/[workspaceId]/team/dashboard`

**Features:**
- Visão do time (respeitando hierarquia)
- Comparação de performance
- Alertas de gaps críticos
- Sugestões de ações (IA)

**Entregas:**
- [ ] Dashboard principal com filtros
- [ ] Dashboard do líder
- [ ] Visibilidade hierárquica implementada
- [ ] RLS testado em produção

---

### 🚀 Fase 8: UX e Polimento (3 dias)

#### 8.1. Ajustes de UX Pendentes
- Revisar navegação
- Melhorar feedback de ações
- Otimizar loading states
- Adicionar empty states
- Melhorar mobile responsiveness

#### 8.2. Testes e Validação
- Testar todos os fluxos end-to-end
- Validar RLS policies
- Testar com múltiplos usuários e hierarquias
- Performance testing

**Entregas:**
- [ ] UX ajustada
- [ ] Testes completos
- [ ] Documentação atualizada

---

## 6. Cronograma Estimado

| Fase | Duração | Entregas Principais |
|------|---------|---------------------|
| 0. Preparação | ✅ 1 dia | Branch, auditoria, decisões |
| 1. Foundation | 3 dias | Migrações, types, RLS |
| 2. Admin & Job Titles | **7 dias** | Admin completo, matriz competências, **editor de testes** |
| 3. Avaliações Senioridade | 7 dias | **Mapeamento cargos, novos test_types**, fluxo 360º |
| 4. DEF Multicanal | 7 dias | Sparrings, real calls, IA |
| 5. PDI Holístico | 7 dias | Migração, wizard, checkpoints |
| 6. AI SDK | 5 dias | Chat, streaming, agentes |
| 7. Dashboards | 5 dias | Hierárquicos, filtros squad |
| 8. UX & Polimento | 3 dias | Ajustes, testes |
| **TOTAL** | **45 dias** | **~9 semanas** |

**Notas:**
- **Fase 2** expandida para incluir Editor de Test Structures com versionamento
- **Fase 3** expandida para incluir criação de avaliações para 6 cargos novos (SDR, BDR, Social Seller, Sales Ops, Enablement, CS)
- **Módulo de Tarefas** será tratado em onda separada (ver seção 11)

---

## 7. Decisões Técnicas Importantes

### 7.1. Por Que Manter Dual DEF?
- Platform Test: Diagnóstico teórico detalhado (41 questões)
- Evaluations: Performance prática (scores consolidados)
- Propósitos complementares

### 7.2. Por Que Migrar PDI para JSONB?
- Flexibilidade para contextos variados
- Sem necessidade de migrations para novos campos
- Alinhado com visão holística

### 7.3. Por Que Não Usar Assessments Genérica para Tudo?
- Seniority precisa de estrutura dedicada (competency_frameworks)
- DEF Calls precisam de metadata específica (recording, transcription, IA)
- Separação de concerns

---

## 8. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Migração de dados PDI | Alto | Script testado em staging, backup antes |
| Performance com JSONB | Médio | Índices GIN, queries otimizadas |
| Custo de IA | Médio | Rate limiting, cache de análises |
| Complexidade RLS | Alto | Testes extensivos, função helper |

---

## 9. Métricas de Sucesso

- [ ] 100% dos usuários com senioridade definida (ou "Aguardando")
- [ ] PDIs ativos para 80%+ dos usuários
- [ ] 3+ avaliações DEF (mix platform/sparring/real) por usuário/mês
- [ ] Dashboards respondem <2s com filtros
- [ ] 90%+ de satisfação em pesquisa UX

---

## 10. Módulo de Gestão de Tarefas - Decisão de Escopo

### Estado Atual

Existe um módulo de gestão de tarefas integrado ao PDI e outras features que:
- Permite criar tarefas standalone ou vinculadas a PDI actions
- Possui visualizações: Lista, Kanban, Calendário
- Integra com sistema de notificações
- Rastreia prioridades (P1, P2, P3) e status

**Localização:**
- `components/tasks/` - Componentes de UI
- `app/actions/tasks.ts` - Actions de CRUD
- `lib/types/task.ts` - Tipos UnifiedTask

### Impacto das Mudanças

Com a migração do PDI para sistema holístico (`pdis`), o módulo de tarefas precisa ser ajustado:

1. **PDI Actions (Legacy):** Atualmente integra com `pdi_actions` table
2. **PDI Actions (Novo):** Precisará integrar com `action_plan` JSONB em `pdis`
3. **Task Sync:** Tarefas criadas no PDI devem sincronizar com módulo de tasks
4. **Visualizações:** Kanban/Calendário precisarão refletir novo modelo

### Decisão de Onda

**❓ DECISÃO NECESSÁRIA:** Fazer agora ou em onda separada?

#### Opção A: Incluir nesta Onda (Fase 5)
**Pros:**
- Refatoração completa e consistente
- PDI holístico já funcionaria com tasks integradas
- Evita retrabalho futuro

**Cons:**
- Aumenta escopo e cronograma (+3-5 dias)
- Complexidade adicional na Fase 5
- Risco de atrasar entregas críticas

**Estimativa:** +5 dias (Fase 5: 7 → 12 dias) | Total: 45 → 50 dias

#### Opção B: Onda Separada (Recomendado)
**Pros:**
- Foco nas fundações do sistema (Job Titles, Competências, PDI)
- Menor risco de atrasos
- Permite validar novo PDI antes de integrar com tasks
- Módulo de tasks pode ser melhorado de forma isolada

**Cons:**
- PDI novo inicialmente sem integração com visualizações de tasks
- Duas ondas de desenvolvimento ao invés de uma

**Estimativa:** Onda 2: ~1-2 semanas | Total: Onda 1 (45 dias) + Onda 2 (10 dias)

### Proposta de Onda 2 (Se Decisão = Separada)

**Nome:** Refatoração do Módulo de Tarefas e Integrações

**Escopo:**
1. **Migração de Dados:**
   - Migrar tasks vinculadas a `pdi_actions` para novo modelo
   - Criar tabela bridge se necessário

2. **Integração com PDI Holístico:**
   - Tasks criadas a partir de `action_plan` JSONB
   - Sincronização bidirecional (task → PDI e PDI → task)
   - Atualização de status propagada

3. **Melhorias no Módulo:**
   - UX aprimorada em visualizações Kanban e Calendário
   - Filtros avançados (por PDI, por squad, por líder)
   - Bulk actions (mover múltiplas tasks)
   - Integração com notificações melhorada

4. **Novas Features:**
   - Subtasks (tarefas dentro de tarefas)
   - Dependências entre tasks
   - Time tracking (opcional)
   - Templates de tasks recorrentes

**Entregas:**
- [ ] Migração de tasks legacy → novo modelo
- [ ] Integração completa com PDI holístico
- [ ] UX melhorada em todas as views
- [ ] Filtros e bulk actions
- [ ] Documentação de uso

### Recomendação

**Onda Separada** é a abordagem recomendada porque:
1. Permite focar nas fundações críticas primeiro
2. Reduz risco de atrasos
3. Possibilita melhorias mais profundas no módulo de tasks
4. Não bloqueia uso do PDI holístico (ações podem ser gerenciadas dentro do próprio PDI)

**Durante Onda 1:** PDI holístico funciona standalone com `action_plan` JSONB
**Durante Onda 2:** Adiciona-se integração com módulo de tasks melhorado

---

## 11. Próximos Passos Imediatos

1. **Executar Fase 1:**
   ```bash
   supabase db push
   psql -f supabase/seed_job_titles.sql
   psql -f supabase/seed_competency_frameworks.sql
   ```

2. **Criar types TypeScript:**
   - job-title.ts
   - competency.ts
   - def-evaluation.ts
   - pdi-holistic.ts

3. **Configurar RLS:**
   - Policies baseadas em hierarchy_level
   - Testar com múltiplos usuários

**Branch:** `feat/competency-and-pdi-system`
**Status:** 🚀 Pronto para execução
