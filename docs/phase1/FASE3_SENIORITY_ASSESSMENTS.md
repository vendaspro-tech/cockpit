# Fase 3: Avaliações de Senioridade

## 🎯 Objetivo

Implementar sistema completo de avaliação de senioridade com autoavaliação, avaliação do líder e cálculo automático de níveis.

---

## 📋 Entregas

### 3.1. Dashboard de Avaliações
**Rota:** `/performance/assessments`

**Features:**
- Lista de avaliações com filtros (usuário, cargo, período, tipo, status)
- Indicadores visuais de status (draft, submitted, calibrated)
- Ações: criar nova, ver detalhes, calibrar
- Cards com resumo: nível calculado, pontuação global

### 3.2. Formulário de Avaliação
**Rota:** `/performance/assessments/new`

**Features:**
- Selecionar usuário e cargo
- Selecionar tipo (auto/leader)
- Escolher período (Q1 2025, Q2 2025, etc.)
- 3 abas: Comportamental, Técnica DEF, Processos
- Para cada competência: slider 1-3 com descrição
- Comentários por dimensão
- Cálculo em tempo real dos totais
- Submit (salva como submitted)

### 3.3. Detalhes da Avaliação
**Rota:** `/performance/assessments/[id]`

**Features:**
- Visualização completa da avaliação
- Comparação auto vs leader (se ambas existirem)
- Nível calculado (Junior/Pleno/Sênior)
- Pontuação por dimensão
- Histórico de evolução
- Action: calibrar (ajustar nível final)

### 3.4. Cálculo Automático de Níveis
**Lógica:**

```typescript
// 1. Calcular média ponderada por dimensão
behavioral_total = sum(behavioral_scores) / count(behavioral_competencies)
technical_total = sum(technical_scores) / count(technical_competencies)
process_total = sum(process_scores) / count(process_competencies)

// 2. Aplicar pesos do framework
global_score = (behavioral_total * 0.50) + (technical_total * 0.30) + (process_total * 0.20)

// 3. Determinar nível baseado nos ranges do framework
if (global_score >= junior.min && global_score <= junior.max) level = 'junior'
else if (global_score >= pleno.min && global_score <= pleno.max) level = 'pleno'
else if (global_score >= senior.min && global_score <= senior.max) level = 'senior'

// 4. Calcular nível por dimensão (mesma lógica)
behavioral_level = calcula_nivel(behavioral_total)
technical_level = calcula_nivel(technical_total)
process_level = calcula_nivel(process_total)
```

### 3.5. Fluxo de Calibração

**Cenário:** Líder revisa autoavaliação do colaborador

1. Líder abre avaliação "submitted"
2. Vê comparação lado a lado
3. Pode ajustar:
   - Pontuações das competências
   - Nível final sugerido
   - Adicionar notas de calibração
4. Salva como "calibrated"
5. Sistema notifica usuário

---

## 🔧 Implementação

### Passo 1: Types TypeScript
**Arquivo:** `lib/types/competency.ts` (já existe)

Verificar se tem:
- ✅ `SeniorityAssessment` (já existe)
- ✅ `SeniorityAssessmentInput` (já existe)
- ✅ `AssessmentType` ('self' | 'leader')
- ✅ `AssessmentStatus` ('draft' | 'submitted' | 'calibrated')

### Passo 2: Server Actions
**Arquivo:** `app/actions/performance.ts` (novo)

Actions:
- `listSeniorityAssessments(filters)`
- `getSeniorityAssessment(id)`
- `createSeniorityAssessment(input)`
- `updateSeniorityAssessment(id, input)`
- `submitAssessment(id)` - muda status para 'submitted'
- `calibrateAssessment(id, input)` - líder calibra
- `calculateScores(assessment)` - cálculo automático

### Passo 3: Pages
- `/performance/assessments/page.tsx`
- `/performance/assessments/new/page.tsx`
- `/performance/assessments/[id]/page.tsx`

### Passo 4: Components
- `assessments-table.tsx` - Lista com filtros
- `assessment-form.tsx` - Formulário 3 abas
- `assessment-calibration-dialog.tsx` - Calibração
- `assessment-comparison-view.tsx` - Auto vs Leader
- `score-badge.tsx` - Badge de nível

---

## ✅ Critérios de Sucesso

- [ ] Criar avaliação (self ou leader)
- [ ] Cálculo automático funciona
- [ ] Níveis baseados nos ranges do framework
- [ ] Draft → Submitted → Calibrated workflow
- [ ] Calibração por líder funcional
- [ ] Histórico de evolução visível
- [ ] RLS policies aplicadas

---

## 📅 Estimativa

- **Setup:** 1 dia (types, actions base)
- **Dashboard:** 2 dias (lista, filtros, cards)
- **Formulário:** 2 dias (3 abas, cálculo em tempo real)
- **Calibração:** 1 dia (workflow, notificações)
- **Testes:** 1 dia

**Total:** 7 dias

---

**Status:** 🚀 Iniciando implementação
