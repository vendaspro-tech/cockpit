# Arquitetura de Assessments - Análise do Sistema Atual

**Data:** 2025-01-08
**Status:** ✅ Mapeamento Completo

---

## 📊 Visão Geral

O sistema atual de assessments é **genérico e extensível**, funcionando com qualquer tipo de avaliação através de estruturas JSON armazenadas em `test_structures`.

---

## 🗂️ Estrutura de Rotas

### Rotas Principais

```
/[workspaceId]/assessments
├── / (page.tsx)                           # Dashboard principal
├── /dashboard (page.tsx)                  # Dashboard alternativo
├── /[testType]                            # Rotas dinâmicas por tipo
│   ├── /new (page.tsx)                    # Criar nova avaliação
│   ├── /history (page.tsx)                # Histórico
│   └── /[assessmentId] (page.tsx)         # Formulário de avaliação
├── /def (page.tsx)                        # DEF específico
└── /disc/[assessmentId] (page.tsx)        # DISC específico
```

### Tipos de Avaliação Suportados

| Test Type | Nome | Status | Sistema |
|-----------|------|--------|---------|
| `seniority_seller` | Senioridade Vendedor | ✅ Ativo | Legacy (assessments) |
| `seniority_leader` | Senioridade Líder | ✅ Ativo | Legacy (assessments) |
| `def_method` | Matriz DEF | ✅ Ativo | Legacy (assessments) |
| `leadership_style` | Estilo de Liderança | ✅ Ativo | Legacy (assessments) |
| `values_8d` | Mapa de Valores | ✅ Ativo | Legacy (assessments) |
| `disc` | Perfil DISC | ✅ Ativo | Legacy (assessments) |

---

## 🧩 Componentes Principais

### 1. **AssessmentsTable** (`components/assessments/assessments-table.tsx`)

**Funcionalidades:**
- ✅ Tabela com sorting (data, tipo, status, usuário)
- ✅ Filtro por texto
- ✅ Badges de status (draft, completed, reviewed)
- ✅ Actions: Visualizar, Continuar, Deletar
- ✅ Comentário do gestor
- ✅ Geração de PDI a partir de avaliação
- ✅ Avatar do usuário
- ✅ Empty state

**Props:**
```typescript
interface AssessmentsTableProps {
  data: Assessment[]
  workspaceId: string
  onDelete: (id: string) => void
  onView?: (assessment: Assessment) => void
  showProductColumn?: boolean // Para DEF
}
```

**Test Type Labels:**
```typescript
const TEST_TYPE_LABELS: Record<string, string> = {
  'seniority_seller': 'Senioridade Vendedor',
  'seniority_leader': 'Senioridade Líder',
  'def_method': 'Matriz DEF',
  'leadership_style': 'Estilo de Liderança',
  'values_8d': 'Mapa de Valores',
  'disc': 'Perfil DISC'
}
```

---

### 2. **AssessmentForm** (`[testType]/[assessmentId]/assessment-form.tsx`)

**Funcionalidades:**
- ✅ Navegação por questões (anterior/próximo)
- ✅ Auto-save (rascunho)
- ✅ Progress bar
- ✅ Radio buttons para respostas
- ✅ Comentários por questão
- ✅ Seleção de produto (DEF)
- ✅ Auto-advance (opcional)
- ✅ Dialog de confirmação ao sair
- ✅ Suporte a matrix rating
- ✅ Resumo de progresso

**Estrutura de Dados:**
```typescript
interface TestStructure {
  title: string
  description: string
  categories: Category[]
  scoring_system?: Record<string, string>
}

interface Category {
  id: string
  name: string
  description?: string
  questions: Question[]
  justification_options?: string[] // DEF
}

interface Question {
  id: string
  text: string
  weight?: number
  options?: { label: string; value: number }[]
  matrix_config?: MatrixRatingConfig
}
```

**Props:**
```typescript
interface AssessmentFormProps {
  structure: TestStructure
  assessmentId: string
  testType: string
  initialData?: any
  products?: Array<{ id: string; name: string }>
  onSave: (data: any, status: 'draft' | 'completed', forceComplete?: boolean) => Promise<void>
  isOwner?: boolean
  workspaceId: string
}
```

**Estados:**
- `answers`: Record<string, number> - Respostas por questão
- `comments`: Record<string, string> - Comentários por questão
- `justifications`: Record<string, string> - Justificativas (DEF)
- `selectedProduct`: string - Produto selecionado (DEF)
- `currentCategoryIndex`: number - Categoria atual
- `currentQuestionIndex`: number - Questão atual
- `autoAdvance`: boolean - Avançar automaticamente

**Features Especiais:**
1. **Resume Position:** Retoma da última questão respondida
2. **Auto-save:** Salva a cada resposta
3. **Validação:** Verifica se todas as questões foram respondidas antes de submeter
4. **Exit Dialog:** Confirma saída se houver mudanças não salvas

---

### 3. **AssessmentConfigForm** (`[testType]/new/assessment-config-form.tsx`)

**Funcionalidades:**
- ✅ Selecionar quem será avaliado
- ✅ Escolher modo (auto-avaliação ou avaliação de gestor)
- ✅ Validação de campos

**Fluxo de Criação:**
```
1. Usuário acessa /[testType]/new
2. Seleciona evaluated_user
3. Seleciona mode ('self' ou 'manager')
4. Submit cria assessment em 'draft'
5. Redireciona para /[testType]/[assessmentId]
```

---

### 4. **AssessmentRadarChart** (`components/charts/assessment-radar-chart.tsx`)

**Funcionalidades:**
- ✅ Radar chart com Recharts
- ✅ Suporta comparação (2 datasets)
- ✅ Responsivo
- ✅ Tooltips
- ✅ Legend
- ✅ Customizável (title, description, footer)

**Data Format:**
```typescript
interface ChartData {
  subject: string    // Nome da dimensão
  A: number         // Score atual (0-100)
  B?: number        // Score de comparação (opcional)
  fullMark: number  // Valor máximo (100)
}[]
```

**Uso Típico:**
```typescript
const data = [
  { subject: 'Comportamental', A: 75, B: 68, fullMark: 100 },
  { subject: 'Técnica DEF', A: 82, B: 79, fullMark: 100 },
  { subject: 'Processos', A: 65, B: 70, fullMark: 100 },
]

<AssessmentRadarChart
  title="Comparação: Auto x Gestor"
  description="Avaliação Q1 2025"
  data={data}
/>
```

---

### 5. **Componentes Auxiliares**

#### AssessmentHero
- Header visual no topo do formulário
- Exibe título e descrição

#### AssessmentDrawer
- Drawer lateral para visualização rápida

#### AssessmentOverviewTable
- Tabela de overview (não muito usado)

#### MatrixRatingQuestion
- Questões do tipo matriz (múltiplas linhas x colunas)

---

## 🗄️ Estrutura de Dados

### Tabela: `assessments`

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  test_type TEXT, -- 'seniority_seller', 'def_method', etc
  evaluated_user_id UUID,
  evaluator_user_id UUID,
  assessment_mode TEXT, -- 'self' | 'manager'
  status TEXT, -- 'draft' | 'completed' | 'reviewed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  product_id UUID, -- Para DEF
  manager_comments TEXT,
  pdi_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Tabela: `assessment_responses`

```sql
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY,
  assessment_id UUID,
  question_id TEXT, -- String ID da questão
  score INTEGER, -- 1, 2, 3, etc
  comment TEXT,
  created_at TIMESTAMPTZ
)
```

### Tabela: `test_structures`

```sql
CREATE TABLE test_structures (
  id UUID PRIMARY KEY,
  test_type TEXT UNIQUE,
  structure JSONB, -- JSON com categories, questions, etc
  version INTEGER,
  created_at TIMESTAMPTZ
)
```

---

## 🎨 Padrões de UI/UX

### 1. Status Badges

```typescript
const ASSESSMENT_STATUS_CONFIG = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  completed: { label: 'Completo', variant: 'default' },
  reviewed: { label: 'Revisado', variant: 'success' },
}
```

### 2. Cores e Estilo

- **Primary Color:** `var(--primary)` - Usado para gráficos, botões principais
- **Chart 2:** `var(--chart-2)` - Segunda linha em gráficos de comparação
- **Muted:** `var(--muted-foreground)` - Textos secundários, bordas

### 3. Navegação

- **Breadcrumbs:** Sempre presentes
- **Back buttons:** Voltar para dashboard
- **Progress indicators:** Barra de progresso, "Questão X de Y"

### 4. Formulários

- **Radio Groups:** Para questões de múltipla escolha
- **Textareas:** Para comentários (opcional)
- **Buttons:** Salvar Rascunho, Finalizar, Anterior, Próximo

---

## 🔄 Fluxo de Dados

### Criar Avaliação

```
User → /assessments/[testType]/new
  ↓
Select User + Mode
  ↓
Server Action: createAssessment()
  ↓
INSERT into assessments (status='draft')
  ↓
Redirect → /assessments/[testType]/[assessmentId]
```

### Responder Questões

```
User seleciona resposta
  ↓
onChange event
  ↓
Auto-save (debounced)
  ↓
Server Action: createAssessmentResponse()
  ↓
UPSERT into assessment_responses
  ↓
Update local state
```

### Submeter Avaliação

```
User clica "Finalizar"
  ↓
Validação: todas respondidas?
  ↓
onSave(data, 'completed')
  ↓
Server Action: submitAssessment()
  ↓
UPDATE assessments SET status='completed', completed_at=NOW()
  ↓
Redirect → /assessments (dashboard)
```

---

## 🆚 Sistema Atual vs Novo Sistema de Seniority

### Sistema Atual (Legacy)

**Tabelas:**
- `assessments` + `assessment_responses`

**Características:**
- ✅ Genérico, funciona com JSON structures
- ✅ Navegação questão-por-questão
- ✅ Scores individuais por questão
- ⚠️ Cálculo de níveis manual/externo
- ⚠️ Sem matriz de competências formal
- ⚠️ Sem calibração 360º

**Usado por:**
- seniority_seller (Inside Sales, Closer)
- seniority_leader (Gerente, Coordenador, Supervisor)

### Novo Sistema (Seniority Assessments)

**Tabelas:**
- `seniority_assessments` + `competency_frameworks`

**Características:**
- ✅ Baseado em matriz de competências
- ✅ Avaliação 360º (auto + líder + calibração)
- ✅ Cálculo automático de níveis
- ✅ Pesos por dimensão (50% + 30% + 20%)
- ✅ Atualização de seniority_level em workspace_members
- ✅ Estrutura mais robusta

**Usado por:**
- Todos os 10 cargos (eventualmente)

---

## 🎯 Estratégia de Integração

### Opção 1: Rotas Separadas (RECOMENDADO)

```
/[workspaceId]/assessments/seniority-v2
├── /new
├── /[assessmentId]
├── /calibration
└── /dashboard
```

**Vantagens:**
- ✅ Não quebra sistema existente
- ✅ Coexistência pacífica
- ✅ Migração gradual
- ✅ Fácil de testar

**Desvantagens:**
- ⚠️ Duplicação de rotas
- ⚠️ Usuários podem se confundir

### Opção 2: Adaptador Híbrido

Criar um adaptador que:
1. Detecta se test_type é "seniority_*"
2. Verifica se usuário deve usar novo sistema
3. Redireciona ou renderiza componente apropriado

**Vantagens:**
- ✅ URLs consistentes
- ✅ Transição transparente

**Desvantagens:**
- ⚠️ Complexidade adicional
- ⚠️ Risco de bugs

---

## 📝 Recomendações para Implementação

### 1. **Reutilizar Componentes Existentes**

✅ **Reutilizar:**
- `AssessmentRadarChart` - Perfeito para nosso caso
- `AssessmentsTable` - Adicionar filtro por sistema (legacy/novo)
- Status badges, avatares, shared components

❌ **Não reutilizar (criar específico):**
- `AssessmentForm` - Muito acoplado ao fluxo questão-por-questão
- `AssessmentConfigForm` - Novo sistema tem lógica diferente

### 2. **Criar Componentes Novos**

**Prioridade:**
1. `SeniorityAssessmentForm` - Form com 3 tabs
2. `SeniorityCalibrationPanel` - Comparação side-by-side
3. `SeniorityResultsView` - Resultados com radar chart
4. `SeniorityCreateDialog` - Dialog de criação

### 3. **Integração com Sistema Existente**

**Dashboard Principal:**
```typescript
// /[workspaceId]/assessments/page.tsx
// Buscar de ambas as tabelas
const legacyAssessments = await supabase.from('assessments')...
const seniorityAssessments = await supabase.from('seniority_assessments')...

// Merge e exibir em tabs ou filtros
```

---

## 🚀 Próximos Passos

1. ✅ **Análise Completa** (HOJE)
2. **Dia 2:** Criar componentes específicos de Seniority
   - SeniorityAssessmentForm (3 tabs)
   - SeniorityCreateDialog
3. **Dia 3:** Rotas e integração
4. **Dia 4-5:** Test structures + Dashboard
5. **Dia 6-7:** Calibration + Polimento

---

**Status:** ✅ Arquitetura mapeada e estratégia definida!
