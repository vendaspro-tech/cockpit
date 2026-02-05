# Plano de Execução: Fase 3 - Avaliações de Senioridade

**Data:** 2025-01-08
**Estimativa:** 7 dias
**Prioridade:** 🔴 ALTA (Core feature)
**Status:** 📋 Planejado

---

## 🎯 Objetivo da Fase 3

Implementar sistema completo de **Avaliações de Senioridade 360º** usando o novo modelo de `seniority_assessments` + `competency_frameworks`, baseado na matriz de competências dimensional (Comportamental 50%, Técnica DEF 30%, Processos 20%).

---

## 📊 Contexto

### O Que Já Existe
- ✅ Tabela `seniority_assessments` criada (migração 101)
- ✅ Tabela `competency_frameworks` criada (migração 101)
- ✅ RLS policies aplicadas (migração 20250108000001)
- ✅ Types TypeScript completos (`lib/types/competency.ts`)
- ✅ Admin de competency frameworks funcionando

### O Que Está Pendente
- ❌ Actions de `seniority-assessments.ts`
- ❌ Componentes de avaliação (formulário, resultados, calibração)
- ❌ Rotas no dashboard para avaliações
- ❌ Novos test structures para 6 cargos sem avaliação (SDR, BDR, Social Seller, Sales Ops, Enablement, CS)
- ❌ Dashboard de senioridade consolidado

---

## 📝 Entregas da Fase 3

### 3.1. Actions de Seniority Assessments (2 horas)

**Arquivo:** `app/actions/seniority-assessments.ts`

**Funções a implementar:**

```typescript
// 1. Criar avaliação
export async function createSeniorityAssessment(data: CreateSeniorityAssessmentInput)

// 2. Salvar scores (draft)
export async function saveSeniorityScores(
  assessmentId: string,
  scores: UpdateSeniorityScoresInput
)

// 3. Submeter avaliação (auto ou líder)
export async function submitSeniorityAssessment(assessmentId: string)

// 4. Calibrar avaliação (líder compara auto vs líder)
export async function calibrateSeniorityAssessment(
  assessmentId: string,
  calibrationData: {
    calibration_notes: string;
    final_global_level: SeniorityLevel;
  }
)

// 5. Buscar histórico de avaliações
export async function getSeniorityHistory(userId: string, workspaceId: string)

// 6. Buscar avaliação por ID
export async function getSeniorityAssessment(assessmentId: string)

// 7. Listar avaliações pendentes de calibração (líder)
export async function getPendingCalibrationsForLeader(workspaceId: string)

// 8. Calcular níveis baseado em scores + scoring_ranges
export async function calculateSeniorityLevels(
  assessmentId: string,
  frameworkId: string
)
```

**Lógica de Cálculo de Níveis:**
```typescript
// Exemplo: Behavioral dimension
// Framework define: junior [0, 30], pleno [31, 60], senior [61, 100]
// User scored: 45 pontos
// Resultado: "pleno"

function classifyLevel(score: number, ranges: ScoringRange): SeniorityLevel {
  if (score >= ranges.senior[0] && score <= ranges.senior[1]) return 'senior';
  if (score >= ranges.pleno[0] && score <= ranges.pleno[1]) return 'pleno';
  return 'junior';
}
```

---

### 3.2. Componentes de Avaliação (1 dia)

#### 3.2.1. Create Assessment Dialog
**Arquivo:** `components/assessments/seniority/create-assessment-dialog.tsx`

**Features:**
- Validar se usuário tem job_title
- Validar se existe competency_framework para o cargo
- Selecionar período (Q1 2025, Q2 2025, etc)
- Escolher tipo: Auto-avaliação ou Avaliar subordinado (se líder)
- Botão "Iniciar Avaliação"

#### 3.2.2. Assessment Form
**Arquivo:** `components/assessments/seniority/assessment-form.tsx`

**Estrutura:**
```tsx
<Tabs>
  <Tab value="behavioral">
    {/* 16 competências comportamentais */}
    {/* Cada uma: escala 1-3 + comentário opcional */}
  </Tab>

  <Tab value="technical_def">
    {/* 5 competências técnicas DEF */}
  </Tab>

  <Tab value="process">
    {/* 7 ou 10 competências de processos */}
  </Tab>

  <Tab value="summary">
    {/* Resumo dos scores */}
    {/* Observações gerais */}
    {/* Botão "Salvar Rascunho" */}
    {/* Botão "Submeter Avaliação" */}
  </Tab>
</Tabs>
```

**UX:**
- Auto-save a cada 30s (draft)
- Progress bar (X de Y competências avaliadas)
- Validação: todas as competências devem ser avaliadas antes de submeter
- Tooltips explicando cada nível (1, 2, 3)

#### 3.2.3. Results View
**Arquivo:** `components/assessments/seniority/results-view.tsx`

**Features:**
- Radar chart com 3 dimensões (Comportamental, Técnica, Processos)
- Badges de nível por dimensão (Junior/Pleno/Senior)
- Nível global calculado
- Comentários por dimensão
- Observações gerais
- Botão "Baixar PDF" (futuro)

#### 3.2.4. Calibration Panel
**Arquivo:** `components/assessments/seniority/calibration-panel.tsx`

**Features:**
- Side-by-side: Auto-avaliação vs Avaliação do Líder
- Comparação de scores por competência (destacar discrepâncias)
- Radar chart comparativo
- Campo de "Notas de Calibração"
- Seletor de nível final (se diferente do calculado)
- Botão "Finalizar Calibração"

**Lógica:**
```typescript
// Ao finalizar calibração:
// 1. Status = 'calibrated'
// 2. Preencher calibration_notes
// 3. Atualizar seniority_level no users table
// 4. Notificar usuário
```

---

### 3.3. Rotas no Dashboard (30 min)

#### Criar rotas:

1. **`/[workspaceId]/assessments/seniority`** - Lista de avaliações
2. **`/[workspaceId]/assessments/seniority/new`** - Criar nova avaliação
3. **`/[workspaceId]/assessments/seniority/[assessmentId]`** - Formulário de avaliação
4. **`/[workspaceId]/assessments/seniority/[assessmentId]/results`** - Resultados
5. **`/[workspaceId]/assessments/seniority/calibration`** - Painel de calibração (líder)
6. **`/[workspaceId]/assessments/seniority/dashboard`** - Dashboard consolidado

---

### 3.4. Novos Test Structures para Cargos Sem Avaliação (2 dias)

**Problema:** 6 cargos não têm avaliação de senioridade definida:
- SDR, BDR, Social Seller, Sales Operations, Sales Enablement, Customer Success

**Solução:** Usar o editor de test structures já implementado para criar:

#### 3.4.1. `seniority_sdr` (SDR + BDR)
**Competências Comportamentais (16):**
- Resiliência, Proatividade, Organização, Comunicação, Trabalho em equipe...

**Competências Técnicas DEF (5):**
- Whatsapp, Descoberta, Encantamento, Fechamento, Objeções

**Competências de Processos (7 - Vendedor):**
- Qualificação de leads, Gestão de pipeline, Follow-up, Atualização de CRM...

#### 3.4.2. `seniority_social_seller` (Social Seller)
Similar a SDR, mas com competências específicas:
- Engajamento em redes sociais
- Criação de conteúdo
- Personal branding
- Networking digital

#### 3.4.3. `seniority_ops` (Sales Operations)
**Competências de Processos (10 - Gestão):**
- Análise de dados
- Otimização de processos
- Gestão de ferramentas
- Reporting e dashboards
- Automações

#### 3.4.4. `seniority_enablement` (Sales Enablement)
**Competências específicas:**
- Desenvolvimento de conteúdo de treinamento
- Facilitação de workshops
- Avaliação de competências
- Onboarding de novos vendedores

#### 3.4.5. `seniority_cs` (Customer Success)
**Competências específicas:**
- Relacionamento com cliente
- Gestão de churn
- Upsell/Cross-sell
- Resolução de problemas

**Ação:** Usar `/admin/test-structures` para criar esses 5 novos test_types.

---

### 3.5. Dashboard de Senioridade (1 dia)

**Arquivo:** `app/(dashboard)/[workspaceId]/assessments/seniority/dashboard/page.tsx`

**Features:**

#### Visão Geral
- Total de usuários por nível (Junior, Pleno, Senior, Indefinido)
- Gráfico de pizza: Distribuição de senioridade
- Filtros: Squad, Job Title, Período

#### Gaps por Dimensão
- Quantos usuários têm gap em Comportamental (ex: nível global Pleno, mas comportamental Junior)
- Quantos têm gap em Técnica DEF
- Quantos têm gap em Processos

#### Avaliações Pendentes (Líder)
- Quantas auto-avaliações aguardando avaliação do líder
- Quantas avaliações aguardando calibração
- Lista clicável para ir direto para o usuário

#### Histórico e Tendências
- Gráfico de linha: Evolução de senioridade ao longo do tempo
- Comparação período anterior vs atual

#### Indicadores por Cargo
- SDR: X% Junior, Y% Pleno, Z% Senior
- Closer: ...
- Etc.

**Visibilidade:**
- Respeita hierarquia (RLS já configurado)
- Gerente (Nível 0) vê todos
- Coordenador (Nível 1) vê apenas Níveis 2 e 3
- Etc.

---

## 🗓️ Cronograma Detalhado (7 dias)

### Dia 1: Actions + Types
- [ ] Criar `app/actions/seniority-assessments.ts`
- [ ] Implementar 8 funções principais
- [ ] Testar lógica de cálculo de níveis
- [ ] Testar RLS policies via actions

### Dia 2: Componente - Create Dialog + Form (Parte 1)
- [ ] `create-assessment-dialog.tsx`
- [ ] `assessment-form.tsx` (estrutura base + tab Behavioral)
- [ ] Integrar com actions

### Dia 3: Componente - Form (Parte 2) + Results
- [ ] Completar tabs Technical DEF e Process
- [ ] Implementar auto-save
- [ ] `results-view.tsx` com radar chart
- [ ] Badges de nível

### Dia 4: Componente - Calibration Panel
- [ ] `calibration-panel.tsx`
- [ ] Comparação side-by-side
- [ ] Lógica de finalização
- [ ] Atualização de `seniority_level` em users

### Dia 5: Rotas + Integração
- [ ] Criar 6 rotas no dashboard
- [ ] Integrar componentes com rotas
- [ ] Navegação entre telas
- [ ] Testar fluxo end-to-end

### Dia 6: Novos Test Structures
- [ ] Criar `seniority_sdr` via admin
- [ ] Criar `seniority_social_seller`
- [ ] Criar `seniority_ops`
- [ ] Criar `seniority_enablement`
- [ ] Criar `seniority_cs`
- [ ] Testar cada um

### Dia 7: Dashboard + Polimento
- [ ] Implementar dashboard de senioridade
- [ ] Testar filtros e visibilidade
- [ ] Ajustes de UX
- [ ] Documentação

---

## ✅ Critérios de Aceitação

### Funcionalidades Obrigatórias
- [x] RLS aplicado e funcionando
- [ ] Usuário pode criar auto-avaliação
- [ ] Líder pode criar avaliação para subordinado
- [ ] Líder pode calibrar (comparar auto vs líder)
- [ ] Cálculo automático de níveis (junior/pleno/senior)
- [ ] Atualização de `seniority_level` em users após calibração
- [ ] Dashboard mostra distribuição de senioridade
- [ ] Todos os 11 cargos têm test_structure (5 existentes + 6 novos)

### UX/UI
- [ ] Formulário intuitivo com tabs
- [ ] Auto-save funcionando
- [ ] Progress bar visual
- [ ] Radar chart para visualização
- [ ] Tooltips explicativos
- [ ] Responsivo (mobile)

### Performance
- [ ] Carregar avaliação <2s
- [ ] Salvar draft <1s
- [ ] Dashboard <3s

### Segurança
- [ ] RLS testado com múltiplos usuários
- [ ] SDR não consegue ver avaliação de Gerente
- [ ] Gerente consegue ver avaliação de todos
- [ ] Apenas líder pode calibrar

---

## 🚨 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Cálculo de níveis incorreto | Alto | Criar testes unitários para função de cálculo |
| UX confusa (muitas competências) | Médio | UI/UX bem desenhada com tabs e progress bar |
| Performance com muitas competências | Médio | Lazy loading, virtualized lists |
| Criar 6 novos test structures é trabalhoso | Baixo | Usar editor visual já implementado |

---

## 📚 Referências

- **PRD:** `docs/prd/2025-01-01-refatoracao-cargos-e-competencias.md` (Seção 2.4)
- **Types:** `lib/types/competency.ts`
- **Migrações:** `20250101000101_competency_system.sql`
- **RLS:** `20250108000001_rls_competency_and_pdi_system.sql`

---

## 🎯 Próximos Passos Após Fase 3

1. **Fase 4:** DEF Multicanal (Sparrings + Real Calls com IA)
2. **Fase 5:** PDI Holístico (migração + wizard + checkpoints)
3. **Fase 6:** AI Chat Interface
4. **Fase 7:** Dashboards Hierárquicos

---

**Status:** 📋 Pronto para iniciar
**Responsável:** Dev Team
**Aprovação:** Product Owner
