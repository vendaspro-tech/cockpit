# PRD - Plano Comercial com OTEs

## Product Requirements Document v2.1

> **Nota:** Este documento substitui a v1 (arquivada em `prd_plano_comercial_v1.md`).
>
> **Changelog v2.2:**
>
> - ✅ **Marketing config por mês/estratégia** (não mais global ou por produto)
> - ✅ Weighted averages para múltiplas estratégias no mesmo mês
> - ✅ Bulk fill de estratégias com marketing
> - ✅ Edit de estratégias existentes
> - KPIs expandidos por produto: MQLs, SQLs, Taxa de conversão, CAC, ROAS, ROI, Margem de Contribuição
> - TMR individual por produto com composição de variáveis
> - Estratégias por mês como linhas separadas com share %
> - Opção dias corridos vs dias úteis
> - Integração com tabela `squads` existente (single source of truth)
> - UX de squads: visualização fora e dentro do plano

---

## 1. VISÃO GERAL DO MÓDULO

### 1.1 Contexto e Objetivo

O módulo **Plano Comercial** é uma extensão do Cockpit Comercial que permite o planejamento estratégico de metas comerciais através de um sistema de cascateamento top-down. O sistema converte metas brutas anuais em planos operacionais, integrando:

- **Cascateamento de Metas**: Da meta global anual para metas mensais
- **Funil Completo**: MQLs → SQLs → Vendas com taxas de conversão
- **Atribuição Marketing/Comercial**: Split entre leads vindos de marketing vs atendimento comercial
- **Cálculo de OTEs**: On-Target Earnings por cargo e nível de senioridade
- **Dimensionamento de Time**: Quantos profissionais são necessários por cargo/senioridade
- **Multi-Produto**: Suporte para múltiplos produtos com tickets e estratégias diferentes
- **Squads (Obrigatório)**: Integração com tabela `squads` existente
- **Análise Financeira**: CAC, ROAS, ROI, Margem de Contribuição, EBITDA

### 1.2 Problema a Resolver

| Problema Atual                 | Solução Proposta                         |
| ------------------------------ | ---------------------------------------- |
| Planilhas fragmentadas         | Sistema integrado único                  |
| Cálculos manuais de OTE        | Cálculo automático com multiplicadores   |
| Sem visibilidade multi-produto | Dashboard consolidado por produto        |
| Estrutura de time "no feeling" | Dimensionamento por cargo/senioridade    |
| Sem split Marketing/Comercial  | Atribuição com CPL, ROAS e ROI Marketing |
| Sem métricas de funil          | MQLs → SQLs → Vendas com taxas           |
| Sem simulação de cenários      | Simulador "What-If" integrado            |

---

## 2. ARQUITETURA DE UX: ABORDAGEM HÍBRIDA

### 2.1 Conceito

A interface combina um **Mini-Canvas Visual** (resumo da estrutura) com **Tabs + Tabelas** (edição detalhada).

### 2.2 Layout da Página Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 Plano Comercial 2026                             [Simular] [Exportar] ⚙️│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════ MINI-CANVAS (Fixo - 150px) ═════════════════════════╗ │
│  ║  [Meta R$12M] ──▶ [40/60] ──┬──▶ [Squad A R$8M] ──┬──▶ [💰 KPIs]       ║ │
│  ║                             └──▶ [Squad B R$4M] ───┘   CAC | ROAS       ║ │
│  ║                                                        ROI | Margem     ║ │
│  ╚═════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [📊 Overview] [🏢 Squads] [📦 Produtos] [💵 OTEs] [👥 Time] [📈 Finanças] │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ╔═══════════════════ CONTEÚDO DA TAB (Scroll) ═══════════════════════════╗ │
│  ║             (Tabelas, gráficos, formulários conforme a tab)             ║ │
│  ╚═════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. KPIs E MÉTRICAS POR NÍVEL

### 3.1 KPIs por Produto

Cada produto tem seus próprios KPIs calculados:

| Métrica             | Descrição                 | Fórmula                                      | Fonte              |
| ------------------- | ------------------------- | -------------------------------------------- | ------------------ |
| **MQLs**            | Marketing Qualified Leads | ∑(Investment_estratégia / CPL_estratégia)    | **Month Strategy** |
| **SQLs**            | Sales Qualified Leads     | MQLs × Taxa Conversão MQL→SQL (weighted avg) | **Month Strategy** |
| **Taxa MQL→SQL**    | Conversão de marketing    | (SQLs / MQLs) × 100%                         | Calculado          |
| **Vendas**          | Número de conversões      | SQLs × Taxa Conversão SQL→Venda              | Month Strategy     |
| **Revenue**         | Faturamento               | Vendas × TMR                                 | Product            |
| **Investimento**    | Custo total               | ∑(Monthly Investment) + Folha                | **Month Strategy** |
| **CAC**             | Custo de Aquisição        | Investimento / Vendas                        | Calculado          |
| **ROAS**            | Return on Ad Spend        | Revenue / Investimento MKT                   | Calculado          |
| **ROI**             | Return on Investment      | (Revenue - Investimento) / Investimento      | Calculado          |
| **Margem Contrib.** | Margem de Contribuição    | Revenue - Custos Variáveis                   | Calculado          |

> **Importante:** Marketing config (Investment, CPL, MQL→SQL rate) está em **`plan_product_month_strategies`**, permitindo valores diferentes por mês e estratégia.

### 3.2 Agregação para Níveis Superiores

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE AGREGAÇÃO                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Produto/Mês/Estratégia (Nível 4)                                          │
│  └── MQLs, SQLs, Vendas, Revenue, CAC, ROAS, ROI, Margem                   │
│         │                                                                   │
│         │ SOMA por Produto (todas estratégias do mês)                       │
│         ▼                                                                   │
│  Produto/Mês (Nível 3)                                                      │
│  └── Totais do produto no mês                                              │
│         │                                                                   │
│         │ SOMA por Squad (se ativado)                                       │
│         ▼                                                                   │
│  Squad/Mês (Nível 2)                                                        │
│  └── Totais do squad no mês                                                │
│         │                                                                   │
│         │ SOMA/MAX por Ano                                                  │
│         ▼                                                                   │
│  Plano Anual (Nível 1)                                                      │
│  └── Revenue: SOMA | Headcount: MAX | CAC/ROI: MÉDIA ponderada             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 KPIs por Cargo/Senioridade

Cada cargo em cada nível de senioridade tem:

| Métrica       | Exemplo                               |
| ------------- | ------------------------------------- |
| Headcount     | 3 SDRs Jr, 2 SDRs Pleno, 1 SDR Senior |
| Salário Base  | R$ 1.800 / R$ 2.000 / R$ 2.700        |
| OTE (1.0x)    | R$ 3.500 / R$ 4.200 / R$ 5.200        |
| Produtividade | 20 SQL/dia / 22 SQL/dia / 25 SQL/dia  |
| Folha Mensal  | Soma de OTEs por nível                |

---

## 4. TICKET MÉDIO RECEBIDO (TMR) POR PRODUTO

### 4.1 Composição do TMR

Cada produto tem seu próprio TMR calculado a partir de variáveis configuráveis:

```
┌── CONFIGURAÇÃO TMR DO PRODUTO ──────────────────────────────────────────────┐
│                                                                             │
│  Produto: Curso A                                                           │
│                                                                             │
│  ┌── Ticket Bruto ──────────────────────────────────────────────────────┐  │
│  │ Valor: R$ [2.500,00]                                                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌── Formas de Pagamento (soma = 100%) ─────────────────────────────────┐  │
│  │ À Vista:      [40%]  × Recebimento: [100%] = 40%                      │  │
│  │ Parcelado:    [50%]  × Recebimento Médio: [85%] = 42.5%              │  │
│  │ Recorrente:   [10%]  × Recebimento: [100%] = 10%                      │  │
│  │                                              ────────                 │  │
│  │                                        Total: 92.5%                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌── Ajustes ───────────────────────────────────────────────────────────┐  │
│  │ Taxa de Reembolso:    [5%]                                            │  │
│  │ Taxa de Chargeback:   [2%]                                            │  │
│  │ Inadimplência:        [3%]                                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌── TMR CALCULADO ─────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  TMR = R$ 2.500 × 92.5% × (1 - 5% - 2% - 3%)                         │  │
│  │  TMR = R$ 2.500 × 0.925 × 0.90                                        │  │
│  │  TMR = R$ 2.081,25                                                    │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Fórmula Completa do TMR

```
TMR = Ticket_Bruto × Fator_Recebimento × (1 - Reembolso - Chargeback - Inadimplência)

Onde:
Fator_Recebimento = (%À_Vista × Rec_À_Vista) + (%Parcelado × Rec_Parcelado) + (%Recorrente × Rec_Recorrente)
```

---

## 5. ESTRATÉGIAS POR MÊS (LINHAS SEPARADAS)

### 5.1 Modelo de Linhas por Estratégia

Em vez de checkboxes, cada estratégia ativa em um mês é uma **linha separada** com seu próprio share:

```
┌── DISTRIBUIÇÃO MENSAL DO PRODUTO ───────────────────────────────────────────┐
│                                                                             │
│  Produto: Curso A    TMR: R$ 2.081,25                                       │
│                                                                             │
│  ┌── Janeiro ───────────────────────────────────────────────────────────┐  │
│  │ Estratégia   │ Share │ Revenue  │ Conversão │ SQLs   │ Vendas │ Team │  │
│  │──────────────│───────│──────────│───────────│────────│────────│──────│  │
│  │ Perpétuo     │ 100%  │ R$ 400k  │ 6%        │ 3.200  │ 192    │ 7    │  │
│  │──────────────│───────│──────────│───────────│────────│────────│──────│  │
│  │ TOTAL MÊS    │ 100%  │ R$ 400k  │ -         │ 3.200  │ 192    │ 7    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌── Abril (Mês Misto) ─────────────────────────────────────────────────┐  │
│  │ Estratégia   │ Share │ Revenue  │ Conversão │ SQLs   │ Vendas │ Team │  │
│  │──────────────│───────│──────────│───────────│────────│────────│──────│  │
│  │ Perpétuo     │ 40%   │ R$ 288k  │ 6%        │ 2.304  │ 138    │ 6    │  │
│  │ Lançamento   │ 60%   │ R$ 432k  │ 15%       │ 1.382  │ 207    │ 4    │  │
│  │──────────────│───────│──────────│───────────│────────│────────│──────│  │
│  │ TOTAL MÊS    │ 100%  │ R$ 720k  │ -         │ 3.686  │ 345    │ 10   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [+ Adicionar Estratégia ao Mês]                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Regras de Estratégias

- Soma dos shares do mês deve ser 100%
- Cada estratégia tem seus próprios parâmetros:

| Estratégia  | Conversão SQL→Venda | Produtividade | Dias         | Marketing Config   |
| ----------- | ------------------- | ------------- | ------------ | ------------------ |
| Perpétuo    | 6%                  | 20 SQL/dia    | 22 (úteis)   | **Por estratégia** |
| Lançamento  | 15%                 | 40 SQL/dia    | 10           | **Por estratégia** |
| Customizada | Configurável        | Configurável  | Configurável | **Por estratégia** |

**Cada estratégia tem:**

- Investment mensal (R$)
- CPL (Custo por Lead)
- Taxa MQL→SQL (%)

**Múltiplas estratégias no mesmo mês:** Weighted averages baseados no investment de cada estratégia.

---

## 6. DIAS CORRIDOS VS DIAS ÚTEIS

### 6.1 Configuração por Plano

```
┌── CONFIGURAÇÃO DE DIAS ─────────────────────────────────────────────────────┐
│                                                                             │
│  Modo de Cálculo de Dias:                                                   │
│                                                                             │
│  ( ) Dias Úteis                                                             │
│      - Usa quantidade fixa configurável por mês                             │
│      - Padrão: 22 dias/mês                                                  │
│      - Ignora feriados e finais de semana                                   │
│                                                                             │
│  (●) Dias Corridos                                                          │
│      - Usa quantidade real de dias do mês                                   │
│      - Jan: 31, Fev: 28/29, Mar: 31, Abr: 30, Mai: 31, Jun: 30              │
│      - Jul: 31, Ago: 31, Set: 30, Out: 31, Nov: 30, Dez: 31                │
│                                                                             │
│  ┌── Dias por Mês (editável se Dias Úteis) ─────────────────────────────┐  │
│  │ Jan │ Fev │ Mar │ Abr │ Mai │ Jun │ Jul │ Ago │ Set │ Out │ Nov │ Dez │  │
│  │ 22  │ 20  │ 21  │ 22  │ 22  │ 21  │ 23  │ 22  │ 22  │ 23  │ 20  │ 20  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Impacto no Cálculo

```
SQLs_por_Vendedor_Mês = Produtividade_Dia × Dias_Mês

Se Dias Úteis:    SQLs = 20 × 22 = 440 SQLs/vendedor/mês
Se Dias Corridos: SQLs = 20 × 31 = 620 SQLs/vendedor/mês (Janeiro)
```

---

## 7. INTEGRAÇÃO COM SQUADS EXISTENTES

### 7.1 Arquitetura de Squads

O sistema já possui a tabela `squads` com:

```sql
-- Tabela existente (single source of truth)
squads (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  leader_id UUID,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  position_x FLOAT DEFAULT 0,        -- para React Flow
  position_y FLOAT DEFAULT 0,        -- para React Flow
  created_at TIMESTAMPTZ
)

squad_members (
  id UUID PRIMARY KEY,
  squad_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ
)
```

### 7.2 Proposta de UX para Squads

**Problema:** Squads são gerenciados em dois contextos diferentes:

1. **Configurações > Squads**: Gestão geral de pessoas e estrutura
2. **Plano Comercial**: Vinculação de produtos e metas

**Proposta: Single Source of Truth + Views Contextuais**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE SQUADS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TABELA PRINCIPAL (squads)                                                  │
│  └── Única fonte de verdade para squads                                    │
│      └── Gerenciada em: Configurações > Squads                             │
│          └── React Flow visual (já existe)                                 │
│          └── Membros, líder, posição                                       │
│                                                                             │
│  TABELA DE VÍNCULO (plan_squad_config)                                      │
│  └── Configurações específicas do plano comercial                          │
│      └── Gerenciada em: Plano Comercial > Tab Squads                       │
│          └── Share da meta, conversão, estratégia default                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 UX: Tab Squads no Plano Comercial

```
┌── TAB SQUADS (No Plano Comercial) ──────────────────────────────────────────┐
│                                                                             │
│  ┌── Squads Vinculados ─────────────────────────────────────────────────┐  │
│  │ Squad            │ Líder        │ Members │ Share │ Estratégia │ ⚙️  │  │
│  │──────────────────│──────────────│─────────│───────│────────────│─────│  │
│  │ 🔵 Squad Perpétuo│ João Silva   │ 8       │ 67%   │ Perpétuo   │ [✏]│  │
│  │ 🟢 Squad Lançam. │ Maria Costa  │ 5       │ 33%   │ Lançamento │ [✏]│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [+ Vincular Squad Existente]   [→ Gerenciar Squads (abre nova tela)]       │
│                                                                             │
│  ─── Preview Visual (Mini React Flow) ───────────────────────────────────   │
│                                                                             │
│       ┌───────────┐     ┌───────────┐                                       │
│       │ Perpétuo  │     │ Lançam.   │                                       │
│       │ 67%       │     │ 33%       │                                       │
│       │ 8 pessoas │     │ 5 pessoas │                                       │
│       └───────────┘     └───────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Modal de Configuração do Squad no Plano

```
┌── CONFIGURAR SQUAD NO PLANO ────────────────────────────────────────────────┐
│                                                                             │
│  Squad: Squad Perpétuo (8 membros)                                          │
│         Líder: João Silva                                                   │
│                                                                             │
│  ┌── Configurações do Plano ────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Share da Meta Comercial: [67%] (R$ 8.040.000 de R$ 12M)             │  │
│  │                                                                       │  │
│  │  Estratégia Default: [Perpétuo ▼]                                    │  │
│  │                                                                       │  │
│  │  Parâmetros Perpétuo:                                                │  │
│  │    Conversão SQL→Venda: [6%]                                         │  │
│  │    Produtividade: [20] SQL/dia                                       │  │
│  │    Dias trabalhados: [22] por mês                                    │  │
│  │                                                                       │  │
│  │  Parâmetros Lançamento: (se usado em algum mês)                      │  │
│  │    Conversão SQL→Venda: [15%]                                        │  │
│  │    Produtividade: [40] SQL/dia                                       │  │
│  │    Dias trabalhados: [10] por mês                                    │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Produtos vinculados a este squad:                                          │
│  • Curso A (60%)                                                            │
│  • Curso B (40%)                                                            │
│                                                                             │
│                                             [Cancelar]  [Salvar]            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. DETALHAMENTO DAS TABS

### 8.1 Tab: 📊 Overview

| Seção       | Conteúdo                                                    |
| ----------- | ----------------------------------------------------------- |
| KPIs Anuais | MQLs, SQLs, Vendas, Revenue, CAC, ROAS, ROI, Margem, EBITDA |
| Gráfico     | Revenue por mês (barras empilhadas)                         |
| Tabela      | Resumo por Squad ou Produto                                 |

### 8.2 Tab: 🏢 Squads

> Sempre disponível (squads obrigatórios no plano).

| Seção   | Conteúdo                                            |
| ------- | --------------------------------------------------- |
| Lista   | Squads vinculados ao plano                          |
| Preview | Mini React Flow com estrutura                       |
| Ações   | Vincular squad, configurar, ir para gestão completa |

### 8.3 Tab: 📦 Produtos

| Seção        | Conteúdo                                   |
| ------------ | ------------------------------------------ |
| Seletor      | Dropdown de produto                        |
| TMR          | Configuração completa com variáveis        |
| Distribuição | Tabela de meses com linhas por estratégia  |
| KPIs         | MQLs, SQLs, Vendas, CAC, ROAS, ROI, Margem |

### 8.4 Tab: 💵 OTEs

| Seção    | Conteúdo                                      |
| -------- | --------------------------------------------- |
| Matriz   | Cargo × Senioridade × Multiplicador           |
| Detalhes | Fixo, variável, produtividade por senioridade |
| Botão    | "Usar Padrões do Sistema"                     |

### 8.5 Tab: 👥 Time

| Seção       | Conteúdo                                    |
| ----------- | ------------------------------------------- |
| Ratios      | Vendedor/Supervisor, Supervisor/Coordenador |
| Senioridade | % Jr, Pleno, Senior por cargo               |
| Gráfico     | Headcount por mês por cargo                 |
| Tabela      | Cargo × Senioridade × Mês                   |

### 8.6 Tab: 📈 Finanças

| Seção     | Conteúdo                                                    |
| --------- | ----------------------------------------------------------- |
| KPIs      | CAC, ROAS, ROI, Margem de Contribuição, EBITDA              |
| Marketing | Investimento, CPL, ROAS esperado                            |
| Tabela    | Mês × (MQLs, SQLs, Revenue, Investimento, CAC, ROI, Margem) |

---

## 9. MODELO DE DADOS

### 9.1 Tabelas Principais

```sql
-- =====================================================
-- PLANO COMERCIAL
-- =====================================================

commercial_plans (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  name text NOT NULL,
  year integer NOT NULL,
  global_target numeric NOT NULL,
  currency text DEFAULT 'BRL',
  use_squads boolean DEFAULT true, -- sempre true (squads obrigatorios)
  marketing_share numeric,            -- % para marketing
  commercial_share numeric,           -- % para comercial

  -- Configuração de dias
  days_mode text DEFAULT 'business',  -- 'business' ou 'calendar'
  business_days_config jsonb,         -- {"jan": 22, "feb": 20, ...}

  -- Status e workflow
  status text DEFAULT 'draft',        -- draft, pending_approval, approved, active, archived

  -- Campos de Auditoria
  created_by uuid REFERENCES users,   -- Quem criou o plano
  created_at timestamp DEFAULT NOW(),
  updated_by uuid REFERENCES users,   -- Último editor
  updated_at timestamp DEFAULT NOW(),
  approved_by uuid REFERENCES users,  -- Quem aprovou (se aplicável)
  approved_at timestamp,              -- Data da aprovação

  -- Notas internas (útil para mentoria)
  internal_notes text,                -- Notas do admin/mentor
  mentor_feedback text                -- Feedback para o cliente
)

-- =====================================================
-- VÍNCULO COM SQUADS EXISTENTES
-- =====================================================

-- Tabela squads já existe! Apenas criamos o vínculo com config específica
plan_squad_config (
  id uuid PRIMARY KEY,
  plan_id uuid REFERENCES commercial_plans,
  squad_id uuid REFERENCES squads,      -- REFERENCIA TABELA EXISTENTE
  share_commercial numeric,             -- % da meta comercial
  default_strategy text DEFAULT 'perpetuo',

  -- Parâmetros Perpétuo
  conversion_perpetuo numeric DEFAULT 0.06,
  productivity_perpetuo integer DEFAULT 20,
  days_perpetuo integer DEFAULT 22,

  -- Parâmetros Lançamento
  conversion_lancamento numeric DEFAULT 0.15,
  productivity_lancamento integer DEFAULT 40,
  days_lancamento integer DEFAULT 10,

  created_at timestamp,
  UNIQUE(plan_id, squad_id)
)

-- =====================================================
-- PRODUTOS DO PLANO
-- =====================================================

plan_products (
  id uuid PRIMARY KEY,
  plan_id uuid REFERENCES commercial_plans,
  product_id uuid REFERENCES products,      -- TABELA EXISTENTE
  squad_id uuid REFERENCES squads,          -- obrigatorio no plano (squads obrigatorios)

  share_target numeric,

  -- TMR e variáveis
  gross_ticket numeric,
  payment_avista_pct numeric DEFAULT 0.40,
  payment_avista_recebimento numeric DEFAULT 1.0,
  payment_parcelado_pct numeric DEFAULT 0.50,
  payment_parcelado_recebimento numeric DEFAULT 0.85,
  payment_recorrente_pct numeric DEFAULT 0.10,
  payment_recorrente_recebimento numeric DEFAULT 1.0,
  refund_rate numeric DEFAULT 0.05,
  chargeback_rate numeric DEFAULT 0.02,
  default_rate numeric DEFAULT 0.03,       -- inadimplência
  tmr_calculated numeric,                   -- CALCULADO

  created_at timestamp
)

-- =====================================================
-- ESTRATÉGIAS POR MÊS (LINHAS SEPARADAS)
-- =====================================================

plan_product_month_strategies (
  id uuid PRIMARY KEY,
  plan_product_id uuid REFERENCES plan_products,
  month integer CHECK (month >= 1 AND month <= 12),
  strategy text NOT NULL,                  -- 'perpetuo', 'lancamento', 'custom'
  share_month numeric NOT NULL,            -- % deste mês para esta estratégia

  -- Parâmetros específicos da estratégia (pode sobrescrever defaults)
  conversion_rate numeric,
  productivity_per_day integer,
  working_days integer,

  -- ✨ MARKETING CONFIG (v2.2 - movido para cá!)
  monthly_investment numeric DEFAULT 0,
  cpl numeric DEFAULT 10,
  mql_to_sql_rate numeric DEFAULT 0.25 CHECK (mql_to_sql_rate >= 0 AND mql_to_sql_rate <= 1),

  created_at timestamp,
  UNIQUE(plan_product_id, month, strategy)
)

-- =====================================================
-- OTEs POR CARGO E SENIORIDADE
-- =====================================================

plan_ote_configurations (
  id uuid PRIMARY KEY,
  plan_id uuid REFERENCES commercial_plans,
  job_title_id uuid REFERENCES job_titles,
  seniority text NOT NULL,                 -- 'jr', 'pleno', 'senior'

  base_salary numeric,
  commission_rate numeric,
  bonus_on_target numeric,
  productivity_per_day integer,

  created_at timestamp,
  UNIQUE(plan_id, job_title_id, seniority)
)

-- =====================================================
-- ESTRUTURA DE TIME
-- =====================================================

plan_team_structure (
  id uuid PRIMARY KEY,
  plan_id uuid REFERENCES commercial_plans,

  seller_per_supervisor integer DEFAULT 5,
  supervisor_per_coordinator integer DEFAULT 3,

  -- Distribuição de senioridade por cargo
  seniority_distribution jsonb,            -- {"sdr": {"jr": 0.5, "pleno": 0.3, "senior": 0.2}}

  created_at timestamp
)

-- =====================================================
-- MARKETING (DEPRECATED - v2.2)
-- =====================================================

-- ❌ REMOVIDO: Marketing config agora está em plan_product_month_strategies
-- Esta tabela foi deletada na migration 20260105000003_marketing_to_month_strategies.sql
--
-- Motivo: Marketing varia por mês e estratégia (sazonalidade, campanhas)
-- Nova localização: plan_product_month_strategies (monthly_investment, cpl, mql_to_sql_rate)

-- =====================================================
-- RESULTADOS CALCULADOS (CACHE)
-- =====================================================

-- Nível 4: Produto/Mês/Estratégia
plan_product_strategy_results (
  id uuid PRIMARY KEY,
  plan_product_id uuid REFERENCES plan_products,
  month integer,
  strategy text,
  multiplier numeric,                      -- 0.5, 0.7, 1.0, 1.2, 1.4

  -- Funil
  mqls integer,
  sqls integer,
  conversion_mql_sql numeric,
  sales integer,
  conversion_sql_sale numeric,

  -- Financeiro
  revenue numeric,
  investment numeric,
  cac numeric,
  roas numeric,
  roi numeric,
  contribution_margin numeric,

  -- Time
  team_breakdown jsonb,                    -- {"sdr": {"jr": 2, "pleno": 1}, ...}
  payroll_total numeric,

  calculated_at timestamp
)

-- Nível 2: Squad/Mês
plan_squad_month_summary (
  id uuid PRIMARY KEY,
  plan_id uuid REFERENCES commercial_plans,
  squad_id uuid REFERENCES squads,
  month integer,

  total_mqls integer,
  total_sqls integer,
  total_sales integer,
  total_revenue numeric,
  total_investment numeric,
  avg_cac numeric,
  avg_roas numeric,
  avg_roi numeric,
  total_margin numeric,

  team_summary jsonb,
  total_headcount integer,
  payroll_total numeric,

  calculated_at timestamp
)

-- Nível 1: Anual
plan_annual_summary (
  id uuid PRIMARY KEY,
  plan_id uuid REFERENCES commercial_plans,
  year integer,

  total_mqls integer,
  total_sqls integer,
  total_sales integer,
  total_revenue numeric,
  total_investment numeric,
  avg_cac numeric,
  avg_roas numeric,
  avg_roi numeric,
  total_margin numeric,
  ebitda_projected numeric,

  team_max_by_role jsonb,
  total_max_headcount integer,
  payroll_annual numeric,
  marketing_annual numeric,

  calculated_at timestamp
)

-- Cenários
plan_scenarios (
  id uuid PRIMARY KEY,
  plan_id uuid REFERENCES commercial_plans,
  name text,
  description text,
  adjustments jsonb,
  results jsonb,
  created_at timestamp
)
```

---

## 10. SERVER ACTIONS

```typescript
// =====================================================
// PLANO
// =====================================================
- createCommercialPlan(workspaceId, data)
- getCommercialPlan(planId)
- updateCommercialPlan(planId, data)
- setDaysMode(planId, mode: 'business' | 'calendar', config?)

// =====================================================
// SQUADS (integração com existente)
// =====================================================
- getWorkspaceSquads(workspaceId)          // já existe
- linkSquadToPlan(planId, squadId, config)
- updatePlanSquadConfig(configId, data)
- unlinkSquadFromPlan(planId, squadId)

// =====================================================
// PRODUTOS
// =====================================================
- addProductToPlan(planId, productId, config)
- updatePlanProduct(planProductId, data)
- updateProductTMR(planProductId, tmrConfig)
- removePlanProduct(planProductId)

// =====================================================
// ESTRATÉGIAS POR MÊS (v2.2 - agora com marketing)
// =====================================================
- addMonthStrategy(planProductId, data: {
    month, strategy, share,
    conversion_rate?, productivity_per_day?, working_days?,
    monthly_investment?, cpl?, mql_to_sql_rate?  // ✨ Marketing fields
  })
- updateMonthStrategy(strategyId, data)  // ✨ Pode editar marketing
- removeMonthStrategy(strategyId)
- redistributeMonthShares(planProductId, month)

// =====================================================
// OTEs
// =====================================================
- configureOTE(planId, jobTitleId, seniority, config)
- applyDefaultOTEs(planId)
- getOTEMatrix(planId)

// =====================================================
// CÁLCULOS
// =====================================================
- calculatePlanResults(planId)
- recalculateOnChange(planId)

// =====================================================
// VISUALIZAÇÕES
// =====================================================
- getPlanOverview(planId)                  // todos os KPIs agregados
- getProductKPIs(planProductId)            // KPIs por produto
- getSquadKPIs(planId, squadId)            // KPIs por squad
- getTeamByRoleSeniority(planId)           // headcount por cargo/senioridade
- getFinanceBreakdown(planId)              // CAC, ROAS, ROI, Margem, EBITDA
```

---

## 11. PERMISSÕES E ACESSO

### 11.1 Regra de Acesso ao Módulo

> **IMPORTANTE:** Apenas usuários com `hierarchy_level = 0` (Estratégico) ou `hierarchy_level = 1` (Tático) podem acessar o módulo de Planejamento Comercial.

O `hierarchy_level` está vinculado ao cargo do usuário na tabela `job_titles`:

| hierarchy_level | Nível       | Cargos                                  | Acesso ao Módulo |
| --------------- | ----------- | --------------------------------------- | ---------------- |
| 0               | Estratégico | Gerente Comercial                       | ✅ **SIM**       |
| 1               | Tático      | Coordenador Comercial                   | ✅ **SIM**       |
| 2               | Operacional | Supervisor, Sales Ops, Sales Enablement | ❌ NÃO           |
| 3               | Execução    | SDR, Closer, Inside Sales, CS           | ❌ NÃO           |

### 11.2 Verificação de Acesso

```typescript
// Middleware/Server Action de verificação
async function canAccessCommercialPlan(userId: string, workspaceId: string) {
  const member = await getWorkspaceMember(userId, workspaceId);

  if (!member?.job_title_id) return false;

  const jobTitle = await getJobTitle(member.job_title_id);

  return jobTitle?.hierarchy_level <= 1; // 0 ou 1
}
```

### 11.3 Permissões por Funcionalidade

| Funcionalidade  | hierarchy_level 0 | hierarchy_level 1 |
| --------------- | ----------------- | ----------------- |
| Ver planos      | ✅                | ✅                |
| Criar planos    | ✅                | ❌                |
| Editar planos   | ✅                | ✅ (próprios)     |
| Configurar OTEs | ✅                | ❌                |
| Usar simulador  | ✅                | ✅                |
| Ativar plano    | ✅                | ❌                |
| Exportar        | ✅                | ✅                |

### 11.4 Painel Administrativo (Admin Route)

> **Objetivo:** Permitir que a equipe de mentoria visualize, acompanhe e calibre os planos comerciais de todos os workspaces.

#### 11.4.1 Acesso ao Admin

O painel administrativo está disponível em `/admin/commercial-plans` para usuários com role `admin` no sistema (não no workspace).

#### 11.4.2 Funcionalidades do Admin

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📊 Admin - Planos Comerciais                               [Filtrar] [Exportar Relatório]   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌── FILTROS ───────────────────────────────────────────────────────────────────────────┐  │
│  │ Workspace: [Todos ▼]    Ano: [2026 ▼]    Status: [Todos ▼]    Mentor: [Todos ▼]     │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌── TABELA DE PLANOS ──────────────────────────────────────────────────────────────────┐  │
│  │ Workspace       │ Ano  │ Nome do Plano │ Status    │ Criado por  │ Criado em  │ ⚙️   │  │
│  │─────────────────│──────│───────────────│───────────│─────────────│────────────│──────│  │
│  │ Empresa Alpha   │ 2026 │ Plano Q1      │ 🟡 Pendente│ João Silva  │ 01/01/2026│ [👁️]│  │
│  │ Empresa Beta    │ 2026 │ Expansão 2026 │ ✅ Aprovado│ Maria Costa │ 03/01/2026│ [👁️]│  │
│  │ Empresa Gamma   │ 2026 │ Plano Anual   │ 📝 Draft  │ Carlos Souza│ 05/01/2026│ [👁️]│  │
│  │ ...             │ ...  │ ...           │ ...       │ ...         │ ...        │      │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌── ESTATÍSTICAS GLOBAIS ──────────────────────────────────────────────────────────────┐  │
│  │ Total Planos: 45  │ Aprovados: 20  │ Pendentes: 15  │ Drafts: 10                     │  │
│  │ Revenue Projetado: R$ 150M  │ Team Total: 325 pessoas                                │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 11.4.3 Visualização de Plano Individual (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Voltar para Lista                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌── INFORMAÇÕES DO PLANO ──────────────────────────────────────────────────────────────┐  │
│  │                                                                                       │  │
│  │  Workspace: Empresa Alpha              Ano: 2026                                     │  │
│  │  Nome: Plano Comercial Q1              Status: 🟡 Pendente Aprovação                 │  │
│  │                                                                                       │  │
│  │  ┌── Auditoria ────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Criado por:       João Silva          Em: 01/01/2026 às 14:30                  │ │  │
│  │  │ Última edição:    Maria Costa         Em: 02/01/2026 às 09:15                  │ │  │
│  │  │ Aprovado por:     (Pendente)          Em: -                                     │ │  │
│  │  └────────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌── VISÃO DO PLANO (Read-Only ou Edição) ──────────────────────────────────────────────┐  │
│  │                                                                                       │  │
│  │  (Mesmo layout do plano, mas com opção de edição para admin)                         │  │
│  │                                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌── NOTAS DO MENTOR ───────────────────────────────────────────────────────────────────┐  │
│  │                                                                                       │  │
│  │  Notas Internas (não visíveis pelo cliente):                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ (Textarea para notas privadas da equipe de mentoria)                            │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                       │  │
│  │  Feedback para o Cliente:                                                            │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ (Textarea com feedback que será visível pelo cliente)                           │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌── AÇÕES ─────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                       │  │
│  │  [Aprovar Plano]  [Solicitar Revisão]  [Calibrar Valores]  [Exportar para PDF]      │  │
│  │                                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 11.4.4 Status do Plano (Workflow)

```
┌─────────┐     ┌──────────────────┐     ┌──────────┐     ┌────────┐
│  Draft  │ ──▶ │ Pending Approval │ ──▶ │ Approved │ ──▶ │ Active │
└─────────┘     └──────────────────┘     └──────────┘     └────────┘
                        │                       │
                        │ (Revisão)             │
                        ▼                       │
                  ┌──────────┐                  │
                  │  Revisão │ ◀────────────────┘
                  └──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │ Archived │
                  └──────────┘
```

| Status             | Descrição                      | Quem pode mudar |
| ------------------ | ------------------------------ | --------------- |
| `draft`            | Plano em construção            | Criador         |
| `pending_approval` | Aguardando aprovação do mentor | Criador         |
| `revision`         | Mentor solicitou ajustes       | Mentor (Admin)  |
| `approved`         | Aprovado pelo mentor           | Mentor (Admin)  |
| `active`           | Plano em execução              | Admin           |
| `archived`         | Plano arquivado                | Admin           |

#### 11.4.5 Server Actions Admin

```typescript
// Admin Actions
-getAdminCommercialPlans(filters) - // Lista todos os planos
  getAdminPlanDetails(planId) - // Detalhes com auditoria
  approvePlan(planId, adminUserId) - // Aprovar plano
  requestPlanRevision(planId, feedback) - // Solicitar revisão
  updatePlanNotes(planId, { internal, feedback }) -
  calibratePlanValues(planId, adjustments) - // Ajustar valores
  exportAdminReport(filters) - // Relatório consolidado
  // Queries com joins
  getPlansWithWorkspaceInfo() - // Join com workspaces
  getPlanAuditHistory(planId); // Histórico de mudanças
```

#### 11.4.6 Campos Extras para Admin

Sugestões de campos adicionais que podem ser úteis:

| Campo              | Descrição                   | Uso                |
| ------------------ | --------------------------- | ------------------ |
| `priority`         | Prioridade de atendimento   | Alta, Média, Baixa |
| `assigned_mentor`  | Mentor responsável          | UUID do admin      |
| `next_review_date` | Próxima revisão agendada    | Data               |
| `health_score`     | Indicador de saúde do plano | 0-100 (calculado)  |
| `revision_count`   | Quantas vezes foi revisado  | Integer            |

> **Nota:** Esses campos são sugestões. Podemos implementar conforme necessidade.

---

## 12. FLUXO DE IMPLEMENTAÇÃO

### Fase 1: MVP Core (2-3 semanas)

- [ ] Migrations das novas tabelas (mantendo squads existente)
- [ ] RLS policies
- [ ] Layout híbrido (mini-canvas + tabs)
- [ ] Tab Overview com KPIs completos
- [ ] Tab Produtos com TMR configurável
- [ ] Estratégias por mês como linhas
- [ ] Configuração de dias (úteis/corridos)
- [ ] Cálculo básico de cascateamento

### Fase 2: Squads e Multi-Produto (2 semanas)
- [ ] Tab Squads com integração
- [ ] Vínculo de squads existentes ao plano
- [ ] Agregação por squad
- [ ] KPIs por produto (MQLs, SQLs, CAC, ROAS, ROI, Margem)

### Fase 3: OTEs e Time (2 semanas)

- [ ] Tab OTEs com matriz cargo × senioridade
- [ ] Tab Time com dimensionamento detalhado
- [ ] Headcount por cargo/senioridade/mês
- [ ] Folha por nível

### Fase 4: Simulador e Exportação (1-2 semanas)

- [ ] Tab Finanças completa (EBITDA, Margem)
- [ ] Simulador what-if
- [ ] Comparação de cenários
- [ ] Exportação para Excel

### Fase 5: Painel Admin e Mentoria (1-2 semanas)

- [ ] Rota `/admin/commercial-plans` com lista de planos
- [ ] Visualização de plano individual no admin
- [ ] Campos de auditoria (criado por, editado por, aprovado por)
- [ ] Workflow de status (draft → pending → approved → active)
- [ ] Notas do mentor (internas e feedback)
- [ ] Ações de admin (aprovar, solicitar revisão, calibrar)
- [ ] Relatório consolidado de todos os workspaces

---

## 13. ROTAS

```
/[workspaceId]/commercial-plan
├── /                           # Lista de planos
├── /new                        # Criar novo plano
├── /[planId]                   # Página principal (canvas + tabs)
│   ├── ?tab=overview
│   ├── ?tab=squads
│   ├── ?tab=products
│   ├── ?tab=otes
│   ├── ?tab=team
│   ├── ?tab=finance
│   └── /simulator

/[workspaceId]/settings/squads  # Gestão de squads (já existe)

# ROTAS ADMIN (apenas para usuários admin do sistema)
/admin/commercial-plans
├── /                           # Lista de todos os planos (todos workspaces)
├── /[planId]                   # Visualização/edição de plano individual
│   ├── ?mode=view              # Modo visualização
│   └── ?mode=edit              # Modo edição (calibração)
└── /reports                    # Relatórios consolidados
```

---

## 14. GLOSSÁRIO

| Termo          | Significado                                                    |
| -------------- | -------------------------------------------------------------- |
| **MQL**        | Marketing Qualified Lead - Lead qualificado pelo marketing     |
| **SQL**        | Sales Qualified Lead - Lead qualificado para vendas            |
| **TMR**        | Ticket Médio Recebido - Valor efetivamente recebido por venda  |
| **CAC**        | Custo de Aquisição de Cliente                                  |
| **ROAS**       | Return on Ad Spend - Revenue / Investimento MKT                |
| **ROI**        | Return on Investment - (Revenue - Investimento) / Investimento |
| **Margem**     | Margem de Contribuição - Revenue - Custos Variáveis            |
| **EBITDA**     | Earnings Before Interest, Taxes, Depreciation and Amortization |
| **OTE**        | On-Target Earnings - Remuneração ao atingir 100% da meta       |
| **Perpétuo**   | Estratégia evergreen de vendas contínuas                       |
| **Lançamento** | Estratégia de vendas concentradas em período específico        |

---

**Versão:** 2.1  
**Data:** Janeiro 2026  
**Status:** Em Desenvolvimento  
**Branch:** feat/plano-comercial  
**Histórico:** [v1 arquivada](prd_plano_comercial_v1.md)
