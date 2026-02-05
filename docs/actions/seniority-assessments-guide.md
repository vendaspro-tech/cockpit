# Seniority Assessments Actions - Guia de Uso

**Arquivo:** `app/actions/seniority-assessments.ts`
**Data:** 2025-01-08
**Status:** ✅ Implementado

---

## 📋 Visão Geral

Este arquivo contém **8 funções server actions** para gerenciar avaliações de senioridade usando o novo sistema (`seniority_assessments` + `competency_frameworks`).

### Funções Disponíveis

1. ✅ `createSeniorityAssessment` - Criar nova avaliação
2. ✅ `saveSeniorityScores` - Salvar scores (draft)
3. ✅ `calculateSeniorityLevels` - Calcular níveis (junior/pleno/senior)
4. ✅ `submitSeniorityAssessment` - Submeter avaliação
5. ✅ `calibrateSeniorityAssessment` - Calibrar (líder)
6. ✅ `getSeniorityAssessment` - Buscar por ID
7. ✅ `getSeniorityHistory` - Histórico do usuário
8. ✅ `getPendingCalibrationsForLeader` - Pendentes (líder)
9. ✅ `listSeniorityAssessments` - Listar com filtros

---

## 🔐 Segurança

Todas as funções:
- ✅ Usam `'use server'`
- ✅ Validam autenticação via `getAuthUser()`
- ✅ Respeitam RLS policies (hierarchy-based)
- ✅ Validam permissões antes de executar ações

---

## 📖 Guia de Uso

### 1. Criar Nova Avaliação

```typescript
import { createSeniorityAssessment } from '@/app/actions/seniority-assessments'

// Auto-avaliação
const result = await createSeniorityAssessment({
  workspace_id: 'workspace-uuid',
  evaluated_user_id: 'user-uuid', // Mesmo usuário logado
  job_title_id: 'job-title-uuid',
  competency_framework_id: 'framework-uuid',
  assessment_type: 'self',
  assessment_period: 'Q1 2025',
})

// Avaliação do líder
const result = await createSeniorityAssessment({
  workspace_id: 'workspace-uuid',
  evaluated_user_id: 'subordinate-uuid', // Subordinado
  job_title_id: 'job-title-uuid',
  competency_framework_id: 'framework-uuid',
  assessment_type: 'leader',
  assessment_period: 'Q1 2025',
})
```

**Validações:**
- ✅ User autenticado
- ✅ Competency framework existe
- ✅ Se `assessment_type='self'`, evaluated_user_id deve ser o próprio usuário
- ✅ Se `assessment_type='leader'`, RLS valida se pode avaliar o subordinado

---

### 2. Salvar Scores (Draft - Auto-save)

```typescript
import { saveSeniorityScores } from '@/app/actions/seniority-assessments'

const result = await saveSeniorityScores('assessment-uuid', {
  behavioral_scores: {
    '1': 2, // Competência 1: score 2
    '2': 3, // Competência 2: score 3
    // ... até 16 competências comportamentais
  },
  technical_def_scores: {
    '1': 2,
    '2': 3,
    // ... 5 competências DEF
  },
  process_scores: {
    '1': 3,
    '2': 2,
    // ... 7 ou 10 competências de processos
  },
  behavioral_comments: 'Comentário opcional sobre comportamental',
  technical_def_comments: 'Comentário opcional sobre técnica',
  process_comments: 'Comentário opcional sobre processos',
})
```

**Uso:**
- ✅ Chamar a cada alteração de score (debounced)
- ✅ Atualiza apenas os campos enviados
- ✅ Assessment deve estar em status `draft`

---

### 3. Calcular Níveis

```typescript
import { calculateSeniorityLevels } from '@/app/actions/seniority-assessments'

const result = await calculateSeniorityLevels(
  'assessment-uuid',
  'framework-uuid'
)

// Retorna assessment atualizado com:
// - behavioral_total, technical_def_total, process_total
// - global_score
// - behavioral_level, technical_def_level, process_level, global_level
```

**Lógica de Cálculo:**
1. Para cada dimensão:
   - Soma scores das competências
   - Calcula média
   - Normaliza para escala 0-100
   - Aplica peso (50%, 30%, 20%)
2. Global score = soma das 3 dimensões ponderadas
3. Classifica cada dimensão em junior/pleno/senior usando scoring_ranges

**Chamada Automática:**
- ✅ Automaticamente chamada ao `submitSeniorityAssessment`

---

### 4. Submeter Avaliação

```typescript
import { submitSeniorityAssessment } from '@/app/actions/seniority-assessments'

const result = await submitSeniorityAssessment('assessment-uuid')

// Ações executadas:
// 1. Calcula níveis automaticamente
// 2. Muda status para 'submitted'
// 3. Preenche completed_at
```

**Após submissão:**
- Auto-avaliação: aguarda avaliação do líder
- Avaliação do líder: aguarda calibração

---

### 5. Calibrar Avaliação (Líder)

```typescript
import { calibrateSeniorityAssessment } from '@/app/actions/seniority-assessments'

const result = await calibrateSeniorityAssessment('assessment-uuid', {
  calibration_notes: 'Notas de calibração. Comparei auto-avaliação com minha avaliação...',
  final_global_level: 'pleno', // júnior | pleno | senior
})

// Ações executadas:
// 1. Muda status para 'calibrated'
// 2. Preenche calibration_notes
// 3. Sobrescreve global_level se líder ajustou
// 4. Atualiza seniority_level em workspace_members
// 5. Preenche calibrated_at
```

**Importante:**
- ✅ Atualiza o nível de senioridade oficial do usuário
- ✅ Esse é o nível que aparecerá no perfil e dashboards

---

### 6. Buscar Avaliação por ID

```typescript
import { getSeniorityAssessment } from '@/app/actions/seniority-assessments'

const result = await getSeniorityAssessment('assessment-uuid')

// Retorna assessment com:
// - evaluated_user (nome, email)
// - evaluator_user (nome, email)
// - competency_framework (estrutura completa)
```

---

### 7. Histórico do Usuário

```typescript
import { getSeniorityHistory } from '@/app/actions/seniority-assessments'

const result = await getSeniorityHistory('user-uuid', 'workspace-uuid')

// Retorna array de assessments ordenados por data (mais recente primeiro)
// Útil para:
// - Timeline de evolução
// - Comparar avaliações anteriores
// - Gráficos de progresso
```

---

### 8. Calibrações Pendentes (Líder)

```typescript
import { getPendingCalibrationsForLeader } from '@/app/actions/seniority-assessments'

const result = await getPendingCalibrationsForLeader('workspace-uuid')

// Retorna assessments com status='submitted'
// RLS filtra automaticamente baseado em hierarquia
// Líder vê apenas subordinados
```

**UI Sugerida:**
- Badge com número de pendentes
- Lista com nome do avaliado + período
- Botão "Calibrar" → redireciona para painel de calibração

---

### 9. Listar Avaliações (com Filtros)

```typescript
import { listSeniorityAssessments } from '@/app/actions/seniority-assessments'

// Listar todas
const result = await listSeniorityAssessments('workspace-uuid')

// Com filtros
const result = await listSeniorityAssessments('workspace-uuid', {
  status: 'calibrated',
  userId: 'user-uuid',
  assessmentType: 'self',
})
```

**Filtros disponíveis:**
- `status`: 'draft' | 'submitted' | 'calibrated'
- `userId`: Filtrar por avaliado
- `assessmentType`: 'self' | 'leader'

---

## 🎯 Fluxo Completo de Avaliação

### Fluxo Típico: Avaliação 360º

```
1. [Colaborador] Cria auto-avaliação
   → createSeniorityAssessment({ assessment_type: 'self' })

2. [Colaborador] Preenche scores
   → saveSeniorityScores() (múltiplas chamadas - auto-save)

3. [Colaborador] Submete
   → submitSeniorityAssessment()
   → Status: draft → submitted
   → Níveis calculados automaticamente

4. [Líder] Cria avaliação do colaborador
   → createSeniorityAssessment({ assessment_type: 'leader', evaluated_user_id: subordinate })

5. [Líder] Preenche scores
   → saveSeniorityScores()

6. [Líder] Submete
   → submitSeniorityAssessment()

7. [Líder] Compara auto-avaliação vs avaliação líder
   → getSeniorityAssessment() para ambas

8. [Líder] Calibra nível final
   → calibrateSeniorityAssessment()
   → Status: submitted → calibrated
   → Atualiza seniority_level oficial do colaborador
```

---

## 🧮 Lógica de Cálculo de Níveis

### Fórmula

```typescript
// Para cada dimensão:
dimension_total = (
  average_score_of_competencies * weight
)

// Normalização:
// Scores são 1-3, normalizamos para 0-100
normalized = ((average - 1) / 2) * 100

// Exemplo Comportamental (peso 0.50):
// Usuário deu scores: [2, 3, 2, 3, 2, ...] (16 competências)
// Média: 2.5
// Normalizado: ((2.5 - 1) / 2) * 100 = 75
// Total: 75 * 0.50 = 37.5

// Global Score:
global_score = behavioral_total + technical_def_total + process_total
```

### Classificação

```typescript
// Baseado em scoring_ranges do framework
// Exemplo:
scoring_ranges.behavioral = {
  junior: [0, 30],
  pleno: [31, 60],
  senior: [61, 100]
}

// Se behavioral_total = 37.5 (normalizado):
// 37.5 está entre 31 e 60 → 'pleno'
```

---

## 🔄 Revalidação de Cache

Todas as funções que modificam dados chamam:
```typescript
revalidatePath(`/${workspaceId}/assessments/seniority`)
// ou
revalidatePath(`/*/assessments/seniority`) // Para todas as rotas
```

---

## 🚨 Tratamento de Erros

Todas as funções podem lançar:
- `'Unauthorized'` - Usuário não autenticado
- `'User not found'` - Usuário não existe no banco
- `'Assessment not found'` - ID inválido
- `'Competency framework not found'` - Framework não existe
- `'Failed to create assessment: {error}'` - Erro ao criar
- Etc.

**Capturar erros:**
```typescript
try {
  const result = await createSeniorityAssessment(data)
  // sucesso
} catch (error) {
  console.error(error)
  // Mostrar toast de erro
}
```

---

## 📊 Estrutura de Retorno

Todas as funções retornam:
```typescript
{
  success: true,
  data: <resultado>
}
```

Ou lançam erro (throw).

---

## 🔜 Próximos Passos

Agora que as actions estão prontas, implementar:

1. **Dia 2-3:** Componentes React
   - `create-assessment-dialog.tsx`
   - `assessment-form.tsx`
   - `results-view.tsx`
   - `calibration-panel.tsx`

2. **Dia 4-5:** Rotas no Dashboard
   - `/[workspaceId]/assessments/seniority`
   - `/[workspaceId]/assessments/seniority/new`
   - `/[workspaceId]/assessments/seniority/[id]`
   - `/[workspaceId]/assessments/seniority/calibration`

3. **Dia 6-7:** Dashboard + Novos Test Structures

---

**Status:** ✅ Actions completas e prontas para uso!
