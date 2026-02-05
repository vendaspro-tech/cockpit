# Seniority Assessments v2 - Componentes Implementados

**Data:** 2025-01-08
**Status:** ✅ Componentes e Rotas Completos

---

## 📦 O que foi Construído

### 1. Componentes React

#### ✅ CreateSeniorityDialog
**Arquivo:** `components/assessments/seniority/create-seniority-dialog.tsx`

**Funcionalidades:**
- Dialog modal para criar nova avaliação
- Seleção de tipo: Auto-avaliação vs Avaliação de Líder
- Filtro hierárquico de usuários (líder só vê subordinados)
- Seleção de framework baseado no cargo do avaliado
- Seleção de período (Q1-Q4)
- Validação completa de campos
- Integração com `createSeniorityAssessment` action
- Loading states e error handling
- Toast notifications

**Props:**
```typescript
interface CreateSeniorityDialogProps {
  workspaceId: string
  currentUser: User
  workspaceUsers: User[]
  competencyFrameworks: CompetencyFramework[]
  trigger?: React.ReactNode // Opcional, usa botão padrão se não fornecido
}
```

**Uso:**
```tsx
<CreateSeniorityDialog
  workspaceId={workspaceId}
  currentUser={currentUser}
  workspaceUsers={workspaceUsers}
  competencyFrameworks={frameworks}
/>
```

---

#### ✅ SeniorityAssessmentForm
**Arquivo:** `components/assessments/seniority/seniority-assessment-form.tsx`

**Funcionalidades:**
- Form com 3 tabs (Comportamental, Técnica DEF, Processos)
- Radio buttons para scoring (escala 1-3)
- Exibição de descrições de níveis para cada competência
- Auto-save com debounce (1 segundo)
- Progress tracking por dimensão e global
- Check marks visuais nas tabs completas
- Textarea para comentários por dimensão
- Validação: só permite submeter quando 100% completo
- Save manual + Submit
- Loading states
- Indicador de último salvamento

**Props:**
```typescript
interface SeniorityAssessmentFormProps {
  assessment: SeniorityAssessment
  framework: CompetencyFramework
  workspaceId: string
}
```

**Features Especiais:**
- ✅ Auto-save silencioso em background
- ✅ Progress bar com porcentagem
- ✅ Visual feedback (checkmarks) quando dimensão completa
- ✅ Desabilita submit se incompleto
- ✅ Calls `submitSeniorityAssessment` que calcula níveis automaticamente

---

#### ✅ SeniorityResultsView
**Arquivo:** `components/assessments/seniority/seniority-results-view.tsx`

**Funcionalidades:**
- Exibição de nível global de senioridade (Júnior/Pleno/Sênior)
- Radar chart com 3 dimensões (reutiliza `AssessmentRadarChart`)
- Cards individuais por dimensão mostrando nível e score
- Seção de comentários (se existirem)
- Notas de calibração (se assessment foi calibrado)
- Metadata da avaliação (tipo, status, data)
- Suporte a comparação (auto-avaliação vs líder)

**Props:**
```typescript
interface SeniorityResultsViewProps {
  assessment: SeniorityAssessment
  framework: CompetencyFramework
  workspaceId: string
  comparisonAssessment?: SeniorityAssessment // Opcional para comparação
}
```

**Visual Hierarchy:**
1. Global Level Badge (destaque principal)
2. Radar Chart (visão comparativa)
3. Dimension Breakdown (3 cards)
4. Comments Section
5. Calibration Notes (se calibrado)
6. Metadata

---

### 2. Rotas Next.js

#### ✅ Dashboard Principal
**Rota:** `/[workspaceId]/assessments/seniority-v2`
**Arquivo:** `app/(dashboard)/[workspaceId]/assessments/seniority-v2/page.tsx`

**Funcionalidades:**
- Header com botão "Nova Avaliação"
- Cards de estatísticas:
  - Minhas Avaliações
  - Pendentes de Calibração
  - Calibradas
- Lista de todas as avaliações do workspace
- Filtro hierárquico automático (via RLS)
- Badges de status (draft, submitted, calibrated)
- Links para cada avaliação
- Empty state com CTA

**Dados Carregados:**
- Current user + job title
- Workspace users (para dialog)
- Competency frameworks
- Assessments list via `listSeniorityAssessments()`

---

#### ✅ Página de Avaliação (Form ou Results)
**Rota:** `/[workspaceId]/assessments/seniority-v2/[assessmentId]`
**Arquivo:** `app/(dashboard)/[workspaceId]/assessments/seniority-v2/[assessmentId]/page.tsx`

**Lógica Condicional:**
```typescript
// Se status='draft' E user é avaliado/avaliador → SeniorityAssessmentForm
// Caso contrário → SeniorityResultsView
```

**Funcionalidades:**
- Busca assessment via `getSeniorityAssessment()`
- Valida permissões (RLS + lógica de edição)
- Renderiza componente apropriado
- Error handling se assessment não existe

---

## 🔄 Fluxo Completo de Uso

### Cenário 1: Auto-avaliação

```
1. User acessa /seniority-v2
2. Clica "Nova Avaliação"
3. Seleciona "Auto-avaliação"
4. Sistema automaticamente seleciona o próprio usuário
5. Seleciona framework baseado no seu cargo
6. Escolhe período (ex: Q1 2025)
7. Clica "Criar Avaliação" → cria assessment com status='draft'
8. Redireciona para /seniority-v2/[id]
9. Renderiza SeniorityAssessmentForm
10. User preenche as 3 tabs, auto-save acontece
11. Clica "Finalizar Avaliação" → submitSeniorityAssessment()
12. Sistema calcula níveis automaticamente
13. Status muda para 'submitted'
14. Redireciona para dashboard
```

### Cenário 2: Líder Avalia Subordinado

```
1. Líder acessa /seniority-v2
2. Clica "Nova Avaliação"
3. Seleciona "Avaliação de Subordinado"
4. Sistema filtra apenas subordinados (hierarchy_level > líder)
5. Seleciona subordinado
6. Seleciona framework do cargo do subordinado
7. Escolhe período
8. Cria avaliação → evaluator_user_id = líder
9. Preenche form igual cenário 1
10. Submete → status='submitted'
11. Aguarda calibração
```

### Cenário 3: Calibração (Futuro)

```
1. Líder vê "Pendentes de Calibração" > 0
2. Clica para ver lista
3. Seleciona assessment submetida
4. Vê comparação lado a lado: auto-avaliação vs avaliação líder
5. Usa calibrateSeniorityAssessment() para:
   - Adicionar notas
   - Ajustar nível final se necessário
6. Status muda para 'calibrated'
7. workspace_members.seniority_level é atualizado
```

---

## 📊 Integração com Sistema Existente

### Reutilização de Componentes

✅ **Reutilizados:**
- `AssessmentRadarChart` - Radar chart da biblioteca Recharts
- `Card`, `Button`, `Badge`, `Alert` - UI components
- `Tabs`, `RadioGroup`, `Textarea` - Form components
- Layout do dashboard

❌ **Não reutilizados (novos criados):**
- `AssessmentForm` - Legacy usa navegação questão-por-questão, novo usa tabs
- `AssessmentConfigForm` - Lógica diferente de criação

### Coexistência com Sistema Legacy

**Sistema Legacy:**
- Rota: `/[workspaceId]/assessments/[testType]`
- Tabela: `assessments` + `assessment_responses`
- Test types: `seniority_seller`, `seniority_leader`, `def_method`, etc

**Novo Sistema:**
- Rota: `/[workspaceId]/assessments/seniority-v2`
- Tabela: `seniority_assessments` + `competency_frameworks`
- Baseado em matriz de competências

**Dashboard Principal (`/assessments`):**
- Pode mostrar ambos os sistemas
- Filtro por tipo
- Tabs separadas?

---

## 🎨 Padrões de UI/UX Seguidos

### Cores e Badges

```typescript
// Níveis de Senioridade
const LEVEL_CONFIG = {
  junior: { label: 'Júnior', variant: 'secondary', color: '#94a3b8' },
  pleno: { label: 'Pleno', variant: 'default', color: '#3b82f6' },
  senior: { label: 'Sênior', variant: 'default', color: '#10b981' },
}

// Status de Assessment
draft: 'Rascunho' (secondary)
submitted: 'Submetida' (default)
calibrated: 'Calibrada' (default/success)
```

### Ícones

- `Award` - Senioridade, avaliações
- `TrendingUp` - Calibração, progresso
- `Users` - Equipe, workspace
- `CheckCircle2` - Completado
- `AlertCircle` - Avisos
- `Loader2` - Loading

### Responsividade

- Cards em grid: `md:grid-cols-3`
- Mobile-first
- Tabs se adaptam ao tamanho da tela

---

## 🚀 Próximos Passos

### 1. **Testes** (Prioridade Alta)
- [ ] Testar criação de assessment (self e leader)
- [ ] Testar form com auto-save
- [ ] Testar submissão e cálculo de níveis
- [ ] Testar visualização de resultados
- [ ] Testar RLS permissions

### 2. **Componente de Calibração** (Fase 2)
- [ ] `SeniorityCalibrationPanel` - Side-by-side comparison
- [ ] Rota: `/seniority-v2/calibration`
- [ ] UI para ajustar nível final

### 3. **Test Structures** (Fase 2)
Criar 6 frameworks via seed ou interface:
- [ ] `seniority_sdr` (SDR + BDR)
- [ ] `seniority_social_seller`
- [ ] `seniority_ops`
- [ ] `seniority_enablement`
- [ ] `seniority_cs`
- [ ] Closer e Inside Sales (já existem no legacy, migrar?)

### 4. **Dashboard Consolidado** (Fase 3)
- [ ] Merge legacy assessments + seniority assessments
- [ ] Filtros por sistema
- [ ] Tabs ou toggle
- [ ] Estatísticas globais

### 5. **Melhorias de UX**
- [ ] Animações de transição entre tabs
- [ ] Skeleton loaders
- [ ] Confirmação antes de sair do form com mudanças não salvas
- [ ] Export para PDF dos resultados
- [ ] Timeline de evolução (histórico)

---

## 🔧 Dependências

### Actions (já implementadas)
```typescript
import {
  createSeniorityAssessment,
  saveSeniorityScores,
  submitSeniorityAssessment,
  getSeniorityAssessment,
  listSeniorityAssessments,
  calibrateSeniorityAssessment, // Ainda não usado
  getSeniorityHistory, // Ainda não usado
  getPendingCalibrationsForLeader, // Ainda não usado
} from '@/app/actions/seniority-assessments'
```

### Types
```typescript
import type {
  SeniorityAssessment,
  CompetencyFramework,
  SeniorityLevel,
  CreateSeniorityAssessmentInput,
  UpdateSeniorityScoresInput,
} from '@/lib/types/competency'
```

### UI Components (shadcn/ui)
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Button, Badge, Alert, AlertDescription
- Dialog, DialogContent, DialogHeader, etc
- Tabs, TabsList, TabsTrigger, TabsContent
- RadioGroup, RadioGroupItem
- Textarea, Label, Select
- Progress, Separator

---

## ✅ Checklist de Conclusão

**Componentes:**
- [x] CreateSeniorityDialog
- [x] SeniorityAssessmentForm
- [x] SeniorityResultsView
- [ ] SeniorityCalibrationPanel (Fase 2)

**Rotas:**
- [x] `/seniority-v2` - Dashboard
- [x] `/seniority-v2/[assessmentId]` - Form/Results
- [ ] `/seniority-v2/calibration` - Calibration (Fase 2)

**Integrações:**
- [x] Server actions implementadas
- [x] RLS policies aplicadas
- [x] Types definidos
- [ ] Test structures criadas (Fase 2)

**Documentação:**
- [x] Arquitetura existente analisada
- [x] Actions documentadas
- [x] Componentes documentados
- [ ] User guide (Fase 3)

---

## 📝 Notas de Implementação

### Design Decisions

1. **3 Tabs vs Navegação por Questão:**
   - Escolhido tabs para melhor visão do progresso global
   - User consegue voltar facilmente entre dimensões
   - Mais alinhado com matriz de competências

2. **Auto-save com Debounce:**
   - Debounce de 1 segundo para evitar requests excessivos
   - Silencioso (não mostra toast)
   - Indicador visual de "Salvando..." e "Último salvamento"

3. **Validação de Completude:**
   - Submit só habilitado quando 100% respondido
   - Feedback visual claro (progress bar + checkmarks)
   - Mensagem explicativa

4. **Reutilização do Radar Chart:**
   - `AssessmentRadarChart` existente funciona perfeitamente
   - Mantém consistência visual com sistema legacy
   - Suporta comparação (2 datasets)

5. **RLS + Lógica de Edição:**
   - RLS controla visibilidade (quem pode ver)
   - Lógica de negócio controla edição (quem pode editar)
   - Apenas drafts são editáveis
   - Apenas avaliador/avaliado pode editar

---

**Status:** ✅ Componentes principais implementados e prontos para testes!

**Próximo:** Testar fluxo completo e criar test structures para os 6 cargos restantes.
