================================================================================
PRD: MÓDULO DE FRAMEWORKS ESTRATÉGICOS
Cockpit Comercial - Strategic Planning Module
================================================================================

Versão: 1.0
Data: Dezembro 2024
Autor: Brenno

================================================================================
1. VISÃO GERAL
================================================================================

1.1 Objetivo
------------
Adicionar módulo de planejamento estratégico ao Cockpit Comercial, permitindo 
que usuários executem análises 3C, SWOT, Blue Ocean e Ansoff de forma integrada, 
com workflows guiados e outputs acionáveis.

1.2 Escopo
----------
- 4 frameworks integrados (3C → SWOT → Blue Ocean → Ansoff)
- Workflow trimestral completo
- Templates pré-configurados
- Dashboards de acompanhamento
- Exportação de relatórios

1.3 Usuários
------------
- Admin/Owner: Cria e gerencia ciclos estratégicos
- Team Member: Contribui com dados e participa de workshops
- Viewer: Visualiza estratégias e resultados

================================================================================
2. ARQUITETURA DE DADOS
================================================================================

2.1 Tabelas Principais
-----------------------

-- Ciclos Trimestrais
CREATE TABLE strategic_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  quarter TEXT NOT NULL, -- 'Q1-2024'
  year INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'planning', 'executing', 'reviewing', 'completed'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Framework 3C: Análise de Concorrentes
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  type TEXT NOT NULL, -- 'direct', 'indirect', 'substitute'
  
  -- Produto
  product_name TEXT,
  price DECIMAL,
  pricing_model TEXT, -- 'one-time', 'subscription', 'tiered'
  format TEXT, -- 'recorded', 'live', 'hybrid', 'mentorship'
  
  -- Dados estruturados
  strengths JSONB, -- [{text: '', evidence: ''}]
  weaknesses JSONB,
  differentials JSONB,
  proof_social JSONB, -- {cases: 0, testimonials: 0, nps: 0}
  
  -- Scoring
  authority_score INTEGER CHECK (authority_score BETWEEN 1 AND 10),
  product_quality_score INTEGER CHECK (product_quality_score BETWEEN 1 AND 10),
  proof_score INTEGER CHECK (proof_score BETWEEN 1 AND 10),
  price_value_score INTEGER CHECK (price_value_score BETWEEN 1 AND 10),
  support_score INTEGER CHECK (support_score BETWEEN 1 AND 10),
  marketing_score INTEGER CHECK (marketing_score BETWEEN 1 AND 10),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Framework 3C: Market Gaps
CREATE TABLE market_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  opportunity_size TEXT, -- 'high', 'medium', 'low'
  can_fill BOOLEAN DEFAULT false,
  how_to_fill TEXT,
  priority INTEGER, -- 1-5
  created_at TIMESTAMP DEFAULT NOW()
);

-- Framework 3C: Customer Insights
CREATE TABLE customer_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'pain_emotional', 'pain_practical', 'aspiration', 'objection', 'job_to_be_done'
  insight TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  verbatim TEXT[],
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Framework SWOT
CREATE TABLE swot_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  quadrant TEXT NOT NULL, -- 'strength', 'weakness', 'opportunity', 'threat'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  urgency_score INTEGER CHECK (urgency_score BETWEEN 1 AND 10),
  control_score INTEGER CHECK (control_score BETWEEN 1 AND 10),
  priority_rank INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SWOT: Cruzamentos Estratégicos
CREATE TABLE swot_crossings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'strength_opportunity', 'strength_threat', 'weakness_opportunity', 'weakness_threat'
  item_1_id UUID REFERENCES swot_items(id),
  item_2_id UUID REFERENCES swot_items(id),
  strategy TEXT NOT NULL,
  priority TEXT, -- 'critical', 'high', 'medium', 'low'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Framework Blue Ocean
CREATE TABLE blue_ocean_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'eliminate', 'reduce', 'raise', 'create'
  factor TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Para REDUCE
  current_level TEXT,
  target_level TEXT,
  
  -- Para RAISE
  current_state TEXT,
  target_state TEXT,
  
  -- Para CREATE
  why_not_exists TEXT,
  viability_score INTEGER CHECK (viability_score BETWEEN 1 AND 10),
  
  -- Impacto
  cost_savings DECIMAL,
  investment_needed DECIMAL,
  differentiation_level TEXT, -- 'high', 'medium', 'low'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blue Ocean: Value Proposition
CREATE TABLE value_propositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  validated BOOLEAN DEFAULT false,
  validation_data JSONB, -- {prospects_tested: 20, positive_response: 15, price_premium: 30}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Framework Ansoff
CREATE TABLE ansoff_quadrants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  quadrant TEXT NOT NULL, -- 'penetration', 'product_development', 'market_development', 'diversification'
  
  -- Análise
  viability_score INTEGER CHECK (viability_score BETWEEN 1 AND 10),
  potential_revenue DECIMAL,
  resources_needed JSONB, -- {time: '', budget: 0, team: 0}
  risk_level TEXT, -- 'low', 'medium', 'high', 'very_high'
  
  -- Alocação decidida
  budget_allocation INTEGER CHECK (budget_allocation BETWEEN 0 AND 100),
  time_allocation INTEGER CHECK (time_allocation BETWEEN 0 AND 100),
  
  -- Ações principais
  key_actions JSONB, -- [{action: '', owner: '', deadline: ''}]
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ações do Plano de Execução
CREATE TABLE execution_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  quadrant_id UUID REFERENCES ansoff_quadrants(id),
  
  title TEXT NOT NULL,
  description TEXT,
  pillar TEXT NOT NULL, -- 'penetration', 'product', 'market', 'diversification'
  
  owner_id UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  
  budget DECIMAL,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'blocked', 'completed', 'cancelled'
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  
  -- KPIs
  success_metric TEXT,
  target_value TEXT,
  current_value TEXT,
  
  dependencies TEXT[],
  blockers JSONB, -- [{description: '', severity: 'high'}]
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Métricas & KPIs
CREATE TABLE cycle_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  
  metric_name TEXT NOT NULL, -- 'revenue', 'leads', 'conversion', 'cac', 'ltv', 'nps', 'churn'
  
  baseline_value DECIMAL,
  target_value DECIMAL,
  current_value DECIMAL,
  
  measurement_frequency TEXT, -- 'weekly', 'monthly'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Histórico de métricas (time-series)
CREATE TABLE metric_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID REFERENCES cycle_metrics(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  recorded_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Relatórios Semanais/Mensais
CREATE TABLE cycle_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'weekly', 'monthly', 'mid_quarter', 'final'
  
  week_number INTEGER,
  month_number INTEGER,
  
  status TEXT NOT NULL, -- 'on_track', 'attention', 'critical'
  
  achievements JSONB, -- [{text: ''}]
  blockers JSONB, -- [{text: '', impact: 'high'}]
  learnings JSONB, -- [{worked: '', didnt_work: ''}]
  
  metrics_summary JSONB,
  
  next_steps JSONB, -- [{priority: 1, action: ''}]
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workshops & Colaboração
CREATE TABLE workshop_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  framework TEXT NOT NULL, -- '3c', 'swot', 'blue_ocean', 'ansoff'
  
  scheduled_date TIMESTAMP,
  duration_minutes INTEGER,
  
  participants JSONB, -- [{user_id: '', role: 'facilitator|contributor'}]
  
  agenda JSONB,
  notes TEXT,
  decisions JSONB,
  
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comentários & Discussões
CREATE TABLE framework_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  
  item_type TEXT NOT NULL, -- 'competitor', 'swot_item', 'blue_ocean_action', etc
  item_id UUID NOT NULL,
  
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

2.2 Relacionamentos Chave
--------------------------
strategic_cycles (1) → (N) competitors
strategic_cycles (1) → (N) market_gaps
strategic_cycles (1) → (N) customer_insights
strategic_cycles (1) → (N) swot_items
strategic_cycles (1) → (N) swot_crossings
strategic_cycles (1) → (N) blue_ocean_actions
strategic_cycles (1) → (1) value_propositions
strategic_cycles (1) → (N) ansoff_quadrants
strategic_cycles (1) → (N) execution_actions
strategic_cycles (1) → (N) cycle_metrics
strategic_cycles (1) → (N) cycle_reports

================================================================================
3. FLUXOS DE USUÁRIO
================================================================================

3.1 Fluxo Principal: Criar Novo Ciclo Estratégico
--------------------------------------------------
1. Dashboard Principal
   ↓
2. [Botão] "Novo Ciclo Estratégico"
   ↓
3. Modal: Configuração Inicial
   - Trimestre (Q1, Q2, Q3, Q4)
   - Ano
   - Data início/fim (auto-preenchida)
   ↓
4. Criar Ciclo → Status: "planning"
   ↓
5. Wizard de Setup (6 fases)

3.2 Wizard de Setup (6 Fases)
-----------------------------

FASE 1: Coleta de Dados (2 semanas)
├─ 1.1 Métricas Atuais
│   └─ Input: Baseline de todas métricas
├─ 1.2 Concorrentes
│   └─ CRUD de competitors
├─ 1.3 Customer Insights
│   └─ Adicionar insights por categoria
└─ 1.4 Consolidação
    └─ Review de todos dados coletados

FASE 2: Análise 3C (1 semana)
├─ 2.1 Análise de Concorrentes
│   ├─ Matriz Comparativa (tabela)
│   └─ Scoring de cada concorrente
├─ 2.2 Identificação de Gaps
│   └─ CRUD de market_gaps
└─ 2.3 Posicionamento
    └─ Frase de posicionamento vs cada concorrente

FASE 3: Diagnóstico SWOT (1 semana)
├─ 3.1 Brainstorming
│   ├─ Modo individual (cada membro adiciona)
│   └─ Modo colaborativo (workshop ao vivo)
├─ 3.2 Consolidação
│   ├─ Votação nos top 5 de cada quadrante
│   └─ Priorização por impacto
└─ 3.3 Cruzamentos
    └─ Criar swot_crossings automaticamente

FASE 4: Diferenciação Blue Ocean (1 semana)
├─ 4.1 Canvas 4 Ações
│   ├─ Eliminar (lista de fatores)
│   ├─ Reduzir (de X para Y)
│   ├─ Elevar (10x melhor)
│   └─ Criar (totalmente novo)
├─ 4.2 Proposta de Valor
│   └─ Escrever statement único
└─ 4.3 Validação
    └─ Registrar testes com prospects

FASE 5: Estratégia Ansoff (1 semana)
├─ 5.1 Avaliação Quadrantes
│   └─ Para cada: viability, potential, risk
├─ 5.2 Alocação de Recursos
│   └─ % budget e % tempo por quadrante
└─ 5.3 Roadmap
    └─ Ações principais por mês

FASE 6: Plano de Execução (1 semana)
├─ 6.1 Detalhamento de Ações
│   └─ CRUD execution_actions
├─ 6.2 Definir KPIs
│   └─ cycle_metrics + targets
├─ 6.3 Setup de Acompanhamento
│   └─ Agendar reuniões, dashboards
└─ 6.4 Kickoff
    └─ Mudar status para "executing"

3.3 Fluxo de Execução (Durante o Trimestre)
--------------------------------------------
EXECUTING Status
├─ Dashboard de Acompanhamento
│   ├─ Métricas (atual vs meta)
│   ├─ Ações (Kanban)
│   └─ Alertas
│
├─ Relatório Semanal
│   ├─ [Toda segunda] Criar novo
│   ├─ Achievements, Blockers, Learnings
│   └─ Update de métricas
│
├─ Review Mensal
│   ├─ [Primeira sexta] Análise profunda
│   ├─ Ajustes táticos
│   └─ Remanejamento de recursos
│
└─ Mid-Quarter Review (Semana 6)
    ├─ Avaliação estratégica
    ├─ Decisão: manter/ajustar/pivotar
    └─ Plano 2ª metade

3.4 Fluxo de Finalização
-------------------------
REVIEWING Status (Semana 12)
├─ Retrospectiva Trimestral
│   ├─ Análise de Resultados
│   ├─ Aprendizados Críticos
│   ├─ Atualização de Frameworks
│   └─ Recomendações Q+1
│
└─ Completar Ciclo
    ├─ Status → "completed"
    └─ Opção: Criar Q+1 baseado em Q atual

================================================================================
4. TELAS & INTERFACES
================================================================================

4.1 Dashboard Principal
-----------------------
┌─────────────────────────────────────────────────────────┐
│ Cockpit Comercial > Planejamento Estratégico           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [+ Novo Ciclo Estratégico]                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📊 Q4 2024                        [Em Execução] │  │
│  │                                                  │  │
│  │ Progresso: ████████░░ 75%                       │  │
│  │ Semana: 9/12                                    │  │
│  │                                                  │  │
│  │ Métricas:                                       │  │
│  │ • Faturamento: R$ 850k / R$ 1M (85%) 🟡        │  │
│  │ • Conversão: 4.2% / 5% (84%) 🟡               │  │
│  │ • CAC: R$ 320 / R$ 280 (114%) 🔴              │  │
│  │                                                  │  │
│  │ Ações:                                          │  │
│  │ • 12 concluídas ✅                              │  │
│  │ • 8 em progresso 🔄                             │  │
│  │ • 3 bloqueadas 🚫                               │  │
│  │                                                  │  │
│  │ [Ver Detalhes] [Relatório Semanal]             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📋 Q3 2024                         [Completo]   │  │
│  │ Finalizado em 30/09/2024                        │  │
│  │ Resultado: 92% das metas atingidas ✅           │  │
│  │ [Ver Retrospectiva] [Exportar PDF]              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘

4.2 Tela: Wizard - Fase 1.2 (Análise de Concorrentes)
-----------------------------------------------------
┌─────────────────────────────────────────────────────────┐
│ Fase 1: Coleta de Dados > Concorrentes                 │
│ Progresso: ██░░░░ (Fase 1.2 de 6)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Lista de Concorrentes (5)                             │
│  [+ Adicionar Concorrente]                             │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ Concorrente A                    [Direto]     │    │
│  │ www.concorrente-a.com                         │    │
│  │                                                │    │
│  │ Produto: Curso Avançado de Vendas            │    │
│  │ Preço: R$ 2.497 (12x)                        │    │
│  │                                                │    │
│  │ Scoring:                                      │    │
│  │ • Autoridade: ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10)             │    │
│  │ • Produto: ⭐⭐⭐⭐⭐⭐⭐ (7/10)                │    │
│  │ • Prova Social: ⭐⭐⭐⭐⭐⭐⭐⭐⭐ (9/10)        │    │
│  │                                                │    │
│  │ Forças:                                       │    │
│  │ • 200+ casos documentados                     │    │
│  │ • Comunidade de 15k membros                   │    │
│  │                                                │    │
│  │ Fraquezas:                                    │    │
│  │ • Conteúdo desatualizado (2021)              │    │
│  │ • Sem app mobile                              │    │
│  │                                                │    │
│  │ [Editar] [Deletar]                            │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  [← Voltar: Métricas] [Próximo: Customer Insights →]  │
│                                                         │
└─────────────────────────────────────────────────────────┘

4.3 Tela: Wizard - Fase 2.1 (Matriz Competitiva)
------------------------------------------------
┌─────────────────────────────────────────────────────────────────┐
│ Fase 2: Análise 3C > Matriz Competitiva                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Comparativo Direto                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Critério      │ Você │ Conc A │ Conc B │ Conc C │ Vence│  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ Autoridade    │  6   │   8    │   7    │   5    │  A   │  │
│  │ Produto       │  8   │   7    │   9    │   6    │  B   │  │
│  │ Prova Social  │  5   │   9    │   6    │   4    │  A   │  │
│  │ Preço/Valor   │  7   │   6    │   5    │   8    │  C   │  │
│  │ Suporte       │  9   │   5    │   7    │   6    │ VOCÊ │  │
│  │ Marketing     │  6   │   9    │   8    │   5    │  A   │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ TOTAL (pond.) │ 6.8  │  7.6   │  7.2   │  6.0   │  A   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Gaps Identificados (Auto-gerados do SWOT + 3C)               │
│                                                                 │
│  🔵 Nenhum oferece certificação reconhecida (Alta prioridade) │
│  🔵 Mentorias 1:1 são raras (Média prioridade)                │
│  🔵 App mobile é fraco em todos (Baixa prioridade)            │
│                                                                 │
│  [← Voltar] [Salvar & Próximo: Gaps →]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

4.4 Tela: Wizard - Fase 3 (SWOT Colaborativo)
---------------------------------------------
┌─────────────────────────────────────────────────────────┐
│ Fase 3: Diagnóstico SWOT                               │
│ Modo: Brainstorming Colaborativo                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┬──────────────────┐              │
│  │   FORÇAS (S)     │  FRAQUEZAS (W)   │              │
│  ├──────────────────┼──────────────────┤              │
│  │ [+ Adicionar]    │  [+ Adicionar]   │              │
│  │                  │                  │              │
│  │ 📌 Método DEF    │ 📌 Poucos cases  │              │
│  │    validado      │    documentados  │              │
│  │    ⭐⭐⭐ (3)     │    ⭐⭐⭐⭐ (4)   │              │
│  │    Impacto: 9/10 │    Impacto: 8/10 │              │
│  │    [Votar] 👤x3  │    [Votar] 👤x5  │              │
│  │                  │                  │              │
│  │ 📌 Comunidade    │ 📌 Sem app       │              │
│  │    engajada      │    mobile        │              │
│  │    ⭐⭐ (2)       │    ⭐ (1)         │              │
│  │    [Votar] 👤x2  │    [Votar] 👤x1  │              │
│  │                  │                  │              │
│  ├──────────────────┼──────────────────┤              │
│  │ OPORTUNIDADES(O) │   AMEAÇAS (T)    │              │
│  ├──────────────────┼──────────────────┤              │
│  │ [+ Adicionar]    │  [+ Adicionar]   │              │
│  │                  │                  │              │
│  │ 📌 Certificação  │ 📌 Guerra de     │              │
│  │    reconhecida   │    preços        │              │
│  │    ⭐⭐⭐⭐⭐ (5)  │    ⭐⭐⭐⭐ (4)   │              │
│  │    [Votar] 👤x7  │    [Votar] 👤x6  │              │
│  │                  │                  │              │
│  └──────────────────┴──────────────────┘              │
│                                                         │
│  Participantes Online (4): 👤 João, Maria, Pedro, Ana  │
│                                                         │
│  [Finalizar Votação] [Ver Cruzamentos →]               │
│                                                         │
└─────────────────────────────────────────────────────────┘

4.5 Tela: Wizard - Fase 3.3 (Cruzamentos SWOT)
----------------------------------------------
┌─────────────────────────────────────────────────────────┐
│ Fase 3: Diagnóstico SWOT > Cruzamentos Estratégicos    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🚀 OFENSIVAS (Forças + Oportunidades)                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Método DEF (F) + Certificação (O)               │  │
│  │                                                  │  │
│  │ Estratégia:                                     │  │
│  │ "Criar certificação profissional usando        │  │
│  │  Método DEF como base. Primeira certificação   │  │
│  │  técnica do mercado."                           │  │
│  │                                                  │  │
│  │ Prioridade: 🔴 CRÍTICA                          │  │
│  │ [Editar] [Adicionar ao Roadmap]                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  🛡️ DEFENSIVAS (Forças + Ameaças)                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Comunidade (F) + Guerra Preços (A)              │  │
│  │                                                  │  │
│  │ Estratégia:                                     │  │
│  │ "Comunidade forte cria switching cost.         │  │
│  │  Concorrente pode baixar preço mas não         │  │
│  │  consegue roubar clientes engajados."           │  │
│  │                                                  │  │
│  │ Prioridade: 🟡 ALTA                             │  │
│  │ [Editar]                                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ⚠️ ZONA DE PERIGO (Fraquezas + Ameaças)              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Poucos Cases (W) + Guerra Preços (A)            │  │
│  │                                                  │  │
│  │ RISCO CRÍTICO:                                  │  │
│  │ "Sem prova social forte, perderemos mercado    │  │
│  │  se concorrentes baixarem preço."               │  │
│  │                                                  │  │
│  │ Mitigação:                                      │  │
│  │ "Documentar 50 casos em vídeo nos próximos     │  │
│  │  60 dias. Prioridade MÁXIMA."                   │  │
│  │                                                  │  │
│  │ [Criar Ação Urgente]                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [← Voltar: SWOT] [Próximo: Blue Ocean →]             │
│                                                         │
└─────────────────────────────────────────────────────────┘

4.6 Tela: Wizard - Fase 4 (Canvas Blue Ocean)
---------------------------------------------
┌─────────────────────────────────────────────────────────┐
│ Fase 4: Blue Ocean Strategy > Canvas 4 Ações           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ❌ ELIMINAR                                      │ │
│  │ (O que todo mundo faz mas não agrega)           │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ [+ Adicionar Fator]                              │ │
│  │                                                   │ │
│  │ • Aulas teóricas de 2h+                          │ │
│  │   Razão: Ninguém assiste, conclusão de 22%      │ │
│  │   Economia: 60% tempo de produção               │ │
│  │   [Editar] [Remover]                             │ │
│  │                                                   │ │
│  │ • Acesso vitalício                               │ │
│  │   Razão: Gera procrastinação                     │ │
│  │   Economia: -R$ 0 mas urgência aumenta vendas   │ │
│  │   [Editar] [Remover]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📉 REDUZIR                                       │ │
│  │ (Fazer bem menos que a indústria)               │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ [+ Adicionar Fator]                              │ │
│  │                                                   │ │
│  │ • Conteúdo gravado                               │ │
│  │   De: 60h → Para: 15h (75% redução)             │ │
│  │   Foco: Só essencial (80/20)                     │ │
│  │   [Editar] [Remover]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📈 ELEVAR                                        │ │
│  │ (Fazer 10x melhor que qualquer concorrente)     │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ [+ Adicionar Fator]                              │ │
│  │                                                   │ │
│  │ • Role-play prático                              │ │
│  │   De: 0 → Para: 2x/semana ao vivo               │ │
│  │   Investimento: R$ 5k/mês (facilitador)         │ │
│  │   Diferenciação: 🟢 ALTA                         │ │
│  │   [Editar] [Remover]                             │ │
│  │                                                   │ │
│  │ • Certificação                                   │ │
│  │   De: PDF → Para: Prova técnica + LinkedIn badge│ │
│  │   Investimento: R$ 15k (setup)                   │ │
│  │   Diferenciação: 🟢 ALTA                         │ │
│  │   [Editar] [Remover]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ✨ CRIAR                                         │ │
│  │ (Nunca oferecido antes)                         │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ [+ Adicionar Fator]                              │ │
│  │                                                   │ │
│  │ • Garantia "Dobra ou Devolve"                    │ │
│  │   Ninguém faz porque: Alto risco                 │ │
│  │   Viabilidade: 8/10 (filtro de entrada)         │ │
│  │   Investimento: R$ 0 (contingência 5% fat.)     │ │
│  │   [Editar] [Remover]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  [Gerar Proposta de Valor →]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘

4.7 Tela: Wizard - Fase 4.2 (Proposta de Valor)
-----------------------------------------------
┌─────────────────────────────────────────────────────────┐
│ Fase 4: Blue Ocean > Proposta de Valor Única           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Baseado nas 4 Ações, sua proposta é:                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │  "Método DEF é o único programa de vendas      │  │
│  │   B2B com garantia de dobrar resultado +       │  │
│  │   prática ao vivo 2x/semana + certificação     │  │
│  │   técnica, sem aulas teóricas intermináveis"   │  │
│  │                                                  │  │
│  │  [Editar Manualmente]                           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Validação com Prospects                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Prospects testados: [20____]                    │  │
│  │                                                  │  │
│  │ Respostas positivas: [15____]                   │  │
│  │ (75% - Meta: 70%+) ✅                           │  │
│  │                                                  │  │
│  │ Disposição a pagar mais: [+35___]%              │  │
│  │ (Meta: 30%+) ✅                                 │  │
│  │                                                  │  │
│  │ Conseguem explicar diferença: [18/20]          │  │
│  │ (90% - Meta: 70%+) ✅                           │  │
│  │                                                  │  │
│  │ Status: ✅ VALIDADO                             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [← Voltar: Canvas] [Próximo: Ansoff →]               │
│                                                         │
└─────────────────────────────────────────────────────────┘

4.8 Tela: Wizard - Fase 5 (Ansoff)
----------------------------------
┌─────────────────────────────────────────────────────────┐
│ Fase 5: Estratégia de Crescimento (Ansoff)             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Avaliação dos 4 Quadrantes                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 1️⃣ PENETRAÇÃO DE MERCADO                        │  │
│  │ (Mais do produto atual pro mercado atual)       │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Viabilidade:  ⭐⭐⭐⭐⭐⭐⭐⭐⭐ 9/10             │  │
│  │ Potencial:    R$ 800k (em 12m)                  │  │
│  │ Risco:        🟢 BAIXO                          │  │
│  │                                                  │  │
│  │ Ações principais:                               │  │
│  │ • Otimizar conversão (2% → 5%)                  │  │
│  │ • Dobrar tráfego (ads + SEO)                    │  │
│  │ • Reduzir CAC (R$ 350 → R$ 280)                 │  │
│  │                                                  │  │
│  │ Alocação sugerida: 60% budget / 60% tempo      │  │
│  │ [Editar] [Ver Detalhes]                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 2️⃣ DESENVOLVIMENTO DE PRODUTO                   │  │
│  │ (Produto novo pro mercado atual)                │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Viabilidade:  ⭐⭐⭐⭐⭐⭐⭐ 7/10                 │  │
│  │ Potencial:    R$ 400k (em 12m)                  │  │
│  │ Risco:        🟡 MÉDIO                          │  │
│  │                                                  │  │
│  │ Produto proposto: Certificação Profissional    │  │
│  │ (vem do Blue Ocean "CRIAR")                     │  │
│  │                                                  │  │
│  │ Validação:                                      │  │
│  │ • 67% da base pediu "próximo passo"             │  │
│  │ • Pré-venda: 32 compraram = R$ 159k            │  │
│  │                                                  │  │
│  │ Alocação sugerida: 30% budget / 30% tempo      │  │
│  │ [Editar] [Ver Detalhes]                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 3️⃣ DESENVOLVIMENTO DE MERCADO                   │  │
│  │ (Produto atual pra mercado novo)                │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Viabilidade:  ⭐⭐⭐⭐⭐ 5/10                     │  │
│  │ Potencial:    R$ 600k (em 12m)                  │  │
│  │ Risco:        🟡 MÉDIO/ALTO                     │  │
│  │                                                  │  │
│  │ Mercado proposto: B2B Corporativo               │  │
│  │ (adaptação <30% do produto)                     │  │
│  │                                                  │  │
│  │ Alocação sugerida: 10% budget / 10% tempo      │  │
│  │ Decisão: ⚠️ Testar com MVP primeiro             │  │
│  │ [Editar] [Ver Detalhes]                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 4️⃣ DIVERSIFICAÇÃO                               │  │
│  │ (Produto novo pra mercado novo)                 │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Viabilidade:  ⭐⭐ 2/10                          │  │
│  │ Risco:        🔴 ALTÍSSIMO                      │  │
│  │                                                  │  │
│  │ Recomendação: ❌ NÃO FAZER neste momento       │  │
│  │                                                  │  │
│  │ Razão: Faturamento < R$ 5M/ano                  │  │
│  │ Core ainda não está no piloto automático        │  │
│  │                                                  │  │
│  │ Alocação: 0%                                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ALOCAÇÃO FINAL DE RECURSOS                      │  │
│  ├─────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │ Budget Total: R$ 150k                           │  │
│  │                                                  │  │
│  │ Penetração:       60% (R$ 90k)  ████████░░     │  │
│  │ Des. Produto:     30% (R$ 45k)  ████░░░░░░     │  │
│  │ Des. Mercado:     10% (R$ 15k)  ██░░░░░░░░     │  │
│  │ Diversificação:    0% (R$ 0)    ░░░░░░░░░░     │  │
│  │                                                  │  │
│  │ ⚠️ Total = 100% ✅                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [← Voltar] [Gerar Roadmap →]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘

4.9 Tela: Dashboard de Execução (Durante Trimestre)
---------------------------------------------------
┌─────────────────────────────────────────────────────────────────┐
│ Q4 2024 - Execução                    Semana 9/12  [Relatório]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Status Geral: 🟡 ATENÇÃO (3 bloqueios críticos)              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ MÉTRICAS vs METAS                                     │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │ Faturamento                                           │    │
│  │ R$ 850k ████████░░ R$ 1M (85%) 🟡                    │    │
│  │ Tendência: ↗️ +12% vs mês anterior                    │    │
│  │                                                        │    │
│  │ Leads                                                  │    │
│  │ 1.820 █████████░ 2.000 (91%) 🟢                      │    │
│  │ Tendência: ↗️ +8% vs mês anterior                     │    │
│  │                                                        │    │
│  │ Conversão                                             │    │
│  │ 4.2% ████████░░ 5.0% (84%) 🟡                        │    │
│  │ Tendência: → Estável                                  │    │
│  │                                                        │    │
│  │ CAC                                                    │    │
│  │ R$ 320 ████████████ R$ 280 (114%) 🔴                 │    │
│  │ Tendência: ↗️ Subindo (RUIM)                          │    │
│  │ ⚠️ ALERTA: CAC acima da meta há 3 semanas            │    │
│  │                                                        │    │
│  │ NPS                                                    │    │
│  │ 68 ██████████ 70 (97%) 🟢                            │    │
│  │ Tendência: ↗️ +4 pts vs trimestre anterior            │    │
│  │                                                        │    │
│  │ [Ver Todas Métricas] [Adicionar Snapshot]            │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ AÇÕES - VISÃO KANBAN                                  │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │ A Fazer (3) │ Em Progresso (8) │ Bloqueada (3) │ ✅ (12)│  │
│  │             │                   │                │      │  │
│  │ [Ação X]    │ [Otimizar VSL]   │ [Afiliados]   │ [...]│  │
│  │ [Ação Y]    │ 80% ████████░░   │ 🔴 CRÍTICO    │      │  │
│  │ [Ação Z]    │ @Maria           │ @Pedro        │      │  │
│  │             │                   │ Bloqueio:     │      │  │
│  │             │ [Ver Webinar]    │ "Plataforma   │      │  │
│  │             │ 40% ████░░░░░░   │  não contrat."│      │  │
│  │             │ @João            │               │      │  │
│  │             │ 🟡 Atrasado      │ [Resolver]    │      │  │
│  └─────────────┴──────────────────┴───────────────┴──────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ ALERTAS & DECISÕES NECESSÁRIAS                        │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │ 🔴 CRÍTICO                                            │    │
│  │ CAC subiu 14% acima da meta                           │    │
│  │ → Ação sugerida: Pausar canal X, duplicar canal Y    │    │
│  │ → Decisão necessária até: 15/12                       │    │
│  │ [Tomar Decisão] [Adiar]                               │    │
│  │                                                        │    │
│  │ 🟡 ATENÇÃO                                            │    │
│  │ 3 ações bloqueadas há 2+ semanas                      │    │
│  │ → Agendar reunião de desbloqueio                      │    │
│  │ [Agendar] [Ver Detalhes]                              │    │
│  │                                                        │    │
│  │ 🟢 POSITIVO                                           │    │
│  │ NPS subiu 4 pontos vs trimestre anterior              │    │
│  │ → Investigar o que melhorou                           │    │
│  │ [Documentar]                                          │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Criar Relatório Semanal] [Mid-Quarter Review] [Exportar]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

================================================================================
5. LÓGICA DE NEGÓCIO
================================================================================

5.1 Auto-Geração de Insights
-----------------------------

// Ao completar 3C, auto-popular SWOT
function autoGenerateSWOT(cycleId) {
  // FORÇAS: O que você faz melhor que concorrentes
  competitors = getCompetitors(cycleId)
  yourScores = getYourScores(cycleId)
  
  competitors.forEach(comp => {
    if (yourScores.authority > comp.authority_score) {
      createSWOTItem(cycleId, 'strength', 
        `Autoridade superior (${yourScores.authority} vs ${comp.authority_score})`,
        `Baseado em análise 3C vs ${comp.name}`
      )
    }
  })
  
  // OPORTUNIDADES: Gaps de mercado do 3C
  gaps = getMarketGaps(cycleId)
  gaps.forEach(gap => {
    if (gap.can_fill) {
      createSWOTItem(cycleId, 'opportunity',
        gap.title,
        `Gap identificado no 3C: ${gap.evidence}`
      )
    }
  })
}

// Ao completar SWOT, sugerir Blue Ocean
function suggestBlueOcean(cycleId) {
  swotItems = getSWOTItems(cycleId)
  
  // ELIMINAR: Fraquezas que são tradição da indústria
  weaknesses = swotItems.filter(i => i.quadrant === 'weakness')
  weaknesses.forEach(w => {
    if (isIndustryStandard(w)) {
      suggestBlueOceanAction(cycleId, 'eliminate', w.title)
    }
  })
  
  // CRIAR: Oportunidades + Gaps
  opportunities = swotItems.filter(i => i.quadrant === 'opportunity')
  opportunities.forEach(o => {
    suggestBlueOceanAction(cycleId, 'create', o.title)
  })
}

// Ao completar Blue Ocean, sugerir Ansoff
function suggestAnsoff(cycleId) {
  blueOceanActions = getBlueOceanActions(cycleId)
  
  // Se criou produto novo → Des. Produto
  newProducts = blueOceanActions.filter(a => 
    a.action_type === 'create' && 
    a.factor.includes('produto')
  )
  
  if (newProducts.length > 0) {
    updateAnsoffRecommendation(cycleId, 'product_development', {
      viability: 8,
      justification: `Blue Ocean sugeriu criar: ${newProducts[0].factor}`
    })
  }
}

5.2 Validação & Regras de Negócio
----------------------------------

// Validar alocação Ansoff = 100%
function validateAnsoffAllocation(cycleId) {
  quadrants = getAnsoffQuadrants(cycleId)
  
  totalBudget = quadrants.reduce((sum, q) => sum + q.budget_allocation, 0)
  totalTime = quadrants.reduce((sum, q) => sum + q.time_allocation, 0)
  
  if (totalBudget !== 100 || totalTime !== 100) {
    throw new Error('Alocação deve somar 100%')
  }
  
  // Regra: Se faturamento < R$ 1M, não permitir > 20% em Diversificação
  org = getOrganization(cycleId)
  diversification = quadrants.find(q => q.quadrant === 'diversification')
  
  if (org.annual_revenue < 1_000_000 && diversification.budget_allocation > 20) {
    showWarning('Diversificação arriscada para empresas < R$ 1M/ano')
  }
}

// Auto-detectar status de ação baseado em prazo
function autoUpdateActionStatus() {
  actions = getExecutionActions({ status: 'in_progress' })
  
  actions.forEach(action => {
    today = new Date()
    
    // Se passou do prazo e ainda não completa = atrasada
    if (action.end_date < today && action.progress < 100) {
      updateActionStatus(action.id, 'delayed')
      createAlert({
        type: 'critical',
        message: `Ação "${action.title}" atrasada`,
        owner: action.owner_id
      })
    }
    
    // Se bloqueada há 2+ semanas = escalate
    if (action.status === 'blocked') {
      blockedSince = getBlockedSince(action.id)
      daysSince = (today - blockedSince) / (1000 * 60 * 60 * 24)
      
      if (daysSince > 14) {
        createAlert({
          type: 'escalation',
          message: `Ação bloqueada há ${Math.floor(daysSince)} dias`,
          owner: action.owner_id,
          escalate_to: getCycleOwner(action.cycle_id)
        })
      }
    }
  })
}

// Calcular "health score" do ciclo
function calculateCycleHealth(cycleId) {
  metrics = getCycleMetrics(cycleId)
  
  metricsOnTrack = metrics.filter(m => 
    m.current_value >= (m.target_value * 0.85)
  ).length
  
  metricsScore = (metricsOnTrack / metrics.length) * 100
  
  actions = getExecutionActions(cycleId)
  actionsCompleted = actions.filter(a => a.status === 'completed').length
  actionsScore = (actionsCompleted / actions.length) * 100
  
  actionsBlocked = actions.filter(a => a.status === 'blocked').length
  blockersPenalty = actionsBlocked * 10 // -10% por ação bloqueada
  
  healthScore = ((metricsScore + actionsScore) / 2) - blockersPenalty
  
  if (healthScore >= 80) return 'on_track'
  if (healthScore >= 60) return 'attention'
  return 'critical'
}

5.3 Notificações & Automações
------------------------------

// Notificações automáticas
const notifications = {
  // Toda segunda às 9h: lembrete relatório semanal
  weeklyReport: {
    schedule: 'cron:0 9 * * 1',
    condition: (cycle) => cycle.status === 'executing',
    action: (cycle) => {
      notify(cycle.created_by, {
        type: 'reminder',
        title: 'Relatório Semanal',
        message: 'Hora de criar o relatório da semana',
        cta: `/cycles/${cycle.id}/reports/new`
      })
    }
  },
  
  // Quando métrica desvia 20%+ da meta
  metricAlert: {
    trigger: 'metric_snapshot_created',
    condition: (snapshot) => {
      metric = getMetric(snapshot.metric_id)
      deviation = Math.abs((snapshot.value - metric.target_value) / metric.target_value)
      return deviation > 0.20
    },
    action: (snapshot) => {
      metric = getMetric(snapshot.metric_id)
      cycle = getCycle(metric.cycle_id)
      
      notify(cycle.created_by, {
        type: 'alert',
        priority: 'high',
        title: `Métrica fora da meta: ${metric.metric_name}`,
        message: `Desvio de ${Math.round(deviation * 100)}%`,
        cta: `/cycles/${cycle.id}/metrics`
      })
    }
  },
  
  // Semana 6: Mid-Quarter Review
  midQuarter: {
    schedule: 'calculated', // 42 dias após start_date
    action: (cycle) => {
      notify(cycle.created_by, {
        type: 'milestone',
        title: 'Mid-Quarter Review',
        message: 'Hora de avaliar se a estratégia está funcionando',
        cta: `/cycles/${cycle.id}/mid-quarter-review`
      })
    }
  },
  
  // Semana 12: Retrospectiva
  quarterEnd: {
    schedule: 'calculated', // end_date - 3 dias
    action: (cycle) => {
      notify(cycle.created_by, {
        type: 'milestone',
        title: 'Retrospectiva Trimestral',
        message: 'Ciclo acabando - prepare a retrospectiva',
        cta: `/cycles/${cycle.id}/retrospective`
      })
    }
  }
}

================================================================================
6. INTEGRAÇÕES
================================================================================

6.1 Com Módulo de Assessments
------------------------------

-- Usar dados de assessments para alimentar 3C (Company)
SELECT 
  a.name as assessment_type,
  AVG(r.score) as avg_score,
  COUNT(r.id) as respondents
FROM assessments a
JOIN assessment_results r ON a.id = r.assessment_id
WHERE a.organization_id = :org_id
  AND r.completed_at > NOW() - INTERVAL '3 months'
GROUP BY a.name;

-- Popular SWOT automaticamente com gaps de competências
INSERT INTO swot_items (cycle_id, quadrant, title, description, evidence)
SELECT 
  :cycle_id,
  'weakness',
  CONCAT('Gap de competência: ', c.name),
  CONCAT('Score médio: ', AVG(cr.score), '/10'),
  CONCAT(COUNT(cr.id), ' vendedores avaliados')
FROM competencies c
JOIN competency_results cr ON c.id = cr.competency_id
WHERE AVG(cr.score) < 6
GROUP BY c.id;

6.2 Com Módulo de PDIs
-----------------------

-- Criar ações de PDI baseadas em fraquezas do SWOT
INSERT INTO pdi_actions (user_id, competency_id, action, deadline)
SELECT 
  u.id,
  comp.id,
  CONCAT('Desenvolver: ', sw.title),
  NOW() + INTERVAL '90 days'
FROM swot_items sw
CROSS JOIN users u
JOIN competencies comp ON comp.name ILIKE CONCAT('%', sw.title, '%')
WHERE sw.cycle_id = :cycle_id
  AND sw.quadrant = 'weakness'
  AND sw.priority_rank <= 3;

================================================================================
7. PERMISSÕES & RLS (Row Level Security)
================================================================================

-- RLS Policy: strategic_cycles
CREATE POLICY cycles_org_isolation ON strategic_cycles
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- RLS Policy: Apenas membros da organização podem ver ciclos
CREATE POLICY cycles_member_access ON strategic_cycles
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Apenas admins podem criar/editar ciclos
CREATE POLICY cycles_admin_write ON strategic_cycles
  FOR INSERT, UPDATE, DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = strategic_cycles.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- RLS Policy: execution_actions - qualquer membro pode ver
CREATE POLICY actions_member_read ON execution_actions
  FOR SELECT
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: execution_actions - owner ou admin podem editar
CREATE POLICY actions_owner_admin_write ON execution_actions
  FOR INSERT, UPDATE, DELETE
  USING (
    owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN strategic_cycles sc ON sc.organization_id = om.organization_id
      WHERE sc.id = execution_actions.cycle_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: Comentários - qualquer membro pode ver e adicionar
CREATE POLICY comments_member_access ON framework_comments
  FOR ALL
  USING (
    cycle_id IN (
      SELECT id FROM strategic_cycles 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

================================================================================
8. CONSIDERAÇÕES DE IMPLEMENTAÇÃO
================================================================================

8.1 Faseamento Sugerido
------------------------

FASE 1 (MVP - 4 semanas):
- ✅ Tabelas core (cycles, competitors, swot_items, blue_ocean_actions, ansoff_quadrants)
- ✅ Wizard básico (6 fases sequenciais)
- ✅ Dashboard de execução
- ✅ CRUD básico de cada framework
- ⚠️ Sem auto-geração de insights (manual)
- ⚠️ Sem relatórios (só visualização)

FASE 2 (Inteligência - 3 semanas):
- ✅ Auto-geração SWOT baseado em 3C
- ✅ Sugestões Blue Ocean baseadas em SWOT
- ✅ Recomendações Ansoff baseadas em Blue Ocean
- ✅ Validações e regras de negócio
- ✅ Notificações automáticas

FASE 3 (Colaboração - 2 semanas):
- ✅ Workshop colaborativo (real-time)
- ✅ Comentários e discussões
- ✅ Votação em SWOT
- ✅ Histórico de mudanças

FASE 4 (Relatórios - 2 semanas):
- ✅ Relatórios semanais/mensais
- ✅ Retrospectiva trimestral
- ✅ Exportação PDF
- ✅ Dashboards avançados

FASE 5 (Integrações - 2 semanas):
- ✅ Integração com Assessments
- ✅ Integração com PDIs
- ✅ Widgets no dashboard principal
- ✅ Sincronização de métricas

8.2 Complexidade Técnica
-------------------------

Baixa Complexidade:
- CRUD de frameworks (padrão)
- Wizard linear (sem branches)
- Dashboards estáticos

Média Complexidade:
- Auto-geração de insights (regras de negócio)
- Validações cross-framework
- Notificações agendadas
- Exportação PDF

Alta Complexidade:
- Workshop real-time colaborativo (WebSockets)
- Sincronização de métricas com sistemas externos
- Algoritmos de recomendação avançados

8.3 Performance
---------------

-- Índices essenciais
CREATE INDEX idx_cycles_org_status ON strategic_cycles(organization_id, status);
CREATE INDEX idx_competitors_cycle ON competitors(cycle_id);
CREATE INDEX idx_swot_cycle_quadrant ON swot_items(cycle_id, quadrant);
CREATE INDEX idx_actions_cycle_status ON execution_actions(cycle_id, status);
CREATE INDEX idx_metrics_cycle ON cycle_metrics(cycle_id);
CREATE INDEX idx_metric_snapshots_date ON metric_snapshots(metric_id, recorded_at DESC);

-- View materializada para dashboard
CREATE MATERIALIZED VIEW cycle_dashboard_summary AS
SELECT 
  sc.id as cycle_id,
  sc.quarter,
  sc.year,
  sc.status,
  
  -- Métricas agregadas
  COUNT(DISTINCT ea.id) as total_actions,
  COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'completed') as completed_actions,
  COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'blocked') as blocked_actions,
  
  -- Progresso de métricas
  AVG(CASE 
    WHEN cm.target_value > 0 
    THEN (cm.current_value / cm.target_value) * 100 
    ELSE 0 
  END) as avg_metrics_progress
  
FROM strategic_cycles sc
LEFT JOIN execution_actions ea ON ea.cycle_id = sc.id
LEFT JOIN cycle_metrics cm ON cm.cycle_id = sc.id
GROUP BY sc.id;

-- Refresh a cada 1h
CREATE INDEX ON cycle_dashboard_summary(cycle_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY cycle_dashboard_summary;

================================================================================
9. CHECKLIST DE IMPLEMENTAÇÃO
================================================================================

Backend:
- [ ] Criar todas as tabelas (schema.sql)
- [ ] Configurar RLS policies
- [ ] Criar índices de performance
- [ ] Implementar lógica de auto-geração
- [ ] Implementar validações
- [ ] Configurar notificações (cron jobs)
- [ ] Criar materialized views
- [ ] Endpoints REST/GraphQL
- [ ] Testes unitários (lógica de negócio)
- [ ] Testes de integração

Frontend:
- [ ] Componentes reutilizáveis
- [ ] Wizard com navegação
- [ ] Dashboards (métricas + ações)
- [ ] Formulários de cada framework
- [ ] Visualizações (matriz, canvas, gantt)
- [ ] Exportação PDF
- [ ] Notificações in-app
- [ ] Mobile responsive
- [ ] Testes E2E

Integrações:
- [ ] Sincronizar com Assessments
- [ ] Sincronizar com PDIs
- [ ] Widget no dashboard principal

Documentação:
- [ ] Guia do usuário (como usar cada framework)
- [ ] Vídeos explicativos (1 por framework)
- [ ] Exemplos práticos
- [ ] FAQs

================================================================================
10. MÉTRICAS DE SUCESSO DO MÓDULO
================================================================================

Adoption:
- % de organizações que criaram pelo menos 1 ciclo
- Meta: 40% nos primeiros 3 meses

Engagement:
- % de ciclos completados (não abandonados)
- Meta: 70%

Value Delivery:
- % de usuários que reportam "estratégia ficou mais clara"
- Meta: 80%

Retention:
- % de organizações que criam Q+1 após completar Q1
- Meta: 75%

================================================================================
FIM DO PRD
================================================================================

Este documento contém toda a lógica, estrutura de dados e interfaces 
necessárias para implementar o módulo de Frameworks Estratégicos no 
Cockpit Comercial. 

