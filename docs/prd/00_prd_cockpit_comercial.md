# PRD - Cockpit Comercial
## Product Requirements Document v2.0

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 Contexto e Posicionamento
O **Cockpit Comercial** é uma plataforma SaaS de Sales Enablement focada em avaliação de performance, desenvolvimento de competências e gestão de talentos comerciais. A plataforma integra:

- **Testes de Avaliação**: Comportamentais, Técnicos (Método DEF), Senioridade e Valores
- **PDI (Plano de Desenvolvimento Individual)**: Geração automatizada e acompanhamento
- **Analytics**: Dashboards táticos e estratégicos de gestão
- **Gestão de Times**: Workspaces, hierarquias e controle de acesso

**Diferencial competitivo**: Metodologia proprietária (Método DEF) combinada com automação inteligente de PDIs e analytics profundos.

### 1.2 Objetivos Principais
1. Criar plataforma única para mapear performance, técnica e comportamento de vendedores
2. Automatizar geração e acompanhamento de PDIs
3. Fornecer visualizações avançadas (radar charts, heatmaps, evolução temporal)
4. Reduzir subjetividade nas avaliações através de frameworks estruturados
5. Criar histórico consolidado para promoções e gestão de senioridade

### 1.3 Escopo da Fase 1 (MVP)
**Incluído:**
- Sistema de autenticação e workspaces
- Testes de avaliação (4 tipos)
- Geração e gestão de PDIs
- Dashboards básicos
- Controle de acesso por perfil

**Excluído (Roadmap Futuro):**
- Desdobramento de metas e OTEs
- Integração com CRMs externos
- Módulo de gamificação
- IA generativa para insights avançados

---

## 2. PÚBLICO-ALVO E PERSONAS

### 2.1 Perfis de Usuário

| Perfil | Descrição | Necessidades Principais |
|--------|-----------|------------------------|
| **Empresário/Dono** | Proprietário do negócio | Visão consolidada, ROI de treinamentos, força operacional |
| **Líder Comercial** | Gestor de equipe de vendas | Gestão de performance, PDIs, desenvolvimento de time |
| **Closer** | Vendedor de fechamento | Autoavaliação, PDI pessoal, evolução técnica |
| **SDR** | Vendedor de prospecção | Desenvolvimento de habilidades, tracking de progresso |
| **Admin** | Configurador do sistema | Customização de pesos, gestão global de usuários |

### 2.2 Jornada do Usuário

#### Líder Comercial (Principal Persona)
1. **Onboarding**: Convida vendedores, configura time
2. **Avaliação**: Aplica testes, compara com autoavaliação
3. **PDI**: Revisa PDIs gerados automaticamente, ajusta ações
4. **Acompanhamento**: Monitora evolução via dashboards
5. **Decisões**: Promove, treina ou desliga com base em dados

---

## 3. ARQUITETURA TÉCNICA

### 3.1 Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | Next.js 14 (App Router) | SSR, performance, TypeScript nativo |
| **Backend** | Supabase (Postgres + Edge Functions) | Full-stack backend, real-time, RLS |
| **Auth** | Clerk | UX superior, org management, webhooks |
| **Storage** | Supabase Storage | Evidências de PDI, relatórios |
| **Deploy** | Vercel | Integração nativa Next.js, edge functions |
| **Analytics** | Recharts + TanStack Query | Visualizações customizadas, cache inteligente |

### 3.2 Estrutura de Banco de Dados (Supabase)

```sql
-- USUÁRIOS E ORGANIZAÇÕES
workspaces (
  id uuid PRIMARY KEY,
  name text,
  plan text, -- starter, pro, enterprise
  created_at timestamp
)

users (
  id uuid PRIMARY KEY, -- synced com Clerk
  clerk_user_id text UNIQUE,
  email text,
  full_name text,
  created_at timestamp
)

workspace_members (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  user_id uuid REFERENCES users,
  role text, -- owner, admin, leader, closer, sdr
  created_at timestamp
)

teams (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  name text,
  leader_id uuid REFERENCES users,
  created_at timestamp
)

team_members (
  id uuid PRIMARY KEY,
  team_id uuid REFERENCES teams,
  user_id uuid REFERENCES users,
  joined_at timestamp
)

-- TESTES E AVALIAÇÕES
assessment_templates (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  type text, -- seniority_seller, seniority_leader, def_method, values_8d, leadership_style
  structure jsonb, -- estrutura completa do teste
  custom_weights jsonb, -- pesos customizados pelo admin
  created_at timestamp
)

assessments (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  template_id uuid REFERENCES assessment_templates,
  evaluated_user_id uuid REFERENCES users,
  evaluator_user_id uuid REFERENCES users,
  assessment_type text, -- self, manager
  status text, -- draft, completed
  started_at timestamp,
  completed_at timestamp
)

assessment_responses (
  id uuid PRIMARY KEY,
  assessment_id uuid REFERENCES assessments,
  question_id text,
  category_id text,
  value integer, -- nota 0-5 ou 1-3 dependendo do teste
  created_at timestamp
)

assessment_results (
  id uuid PRIMARY KEY,
  assessment_id uuid REFERENCES assessments,
  scores jsonb, -- { "comportamental": 85, "tecnica": 72, ... }
  classification jsonb, -- { "global": "Pleno", "por_categoria": {...} }
  divergences jsonb, -- comparação auto vs gestor
  generated_at timestamp
)

-- MATRIZ DEF (POR REUNIÃO)
def_meetings (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  seller_id uuid REFERENCES users,
  evaluator_id uuid REFERENCES users,
  meeting_date date,
  lead_name text,
  lead_type text, -- inbound, outbound
  product text,
  status text, -- won, lost, ongoing
  created_at timestamp
)

def_meeting_scores (
  id uuid PRIMARY KEY,
  meeting_id uuid REFERENCES def_meetings,
  category_id text, -- whatsapp, descoberta, encantamento, fechamento, objecoes
  criterion_id text,
  score integer, -- 0-3
  created_at timestamp
)

def_meeting_comments (
  id uuid PRIMARY KEY,
  meeting_id uuid REFERENCES def_meetings,
  category_id text,
  standard_comments text[], -- array de IDs dos comentários padrão
  free_comment text,
  created_at timestamp
)

-- PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL)
pdi_plans (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  user_id uuid REFERENCES users,
  source_assessment_id uuid REFERENCES assessments, -- pode ser null para PDIs manuais
  status text, -- active, completed, archived
  created_at timestamp,
  target_completion_date date
)

pdi_items (
  id uuid PRIMARY KEY,
  pdi_plan_id uuid REFERENCES pdi_plans,
  category_id text,
  category_name text,
  criterion text,
  current_score_self integer,
  current_score_manager integer,
  target_score integer,
  priority text, -- critical, high, medium, low
  violates_core_values boolean,
  status text, -- not_started, in_progress, completed
  created_at timestamp
)

pdi_actions (
  id uuid PRIMARY KEY,
  pdi_item_id uuid REFERENCES pdi_items,
  action_description text,
  deadline_days integer,
  status text, -- pending, in_progress, done
  created_at timestamp,
  completed_at timestamp
)

pdi_evidence (
  id uuid PRIMARY KEY,
  pdi_item_id uuid REFERENCES pdi_items,
  file_url text, -- Supabase Storage URL
  description text,
  uploaded_by uuid REFERENCES users,
  uploaded_at timestamp
)

-- CONFIGURAÇÕES E METADADOS
test_structures (
  id uuid PRIMARY KEY,
  test_type text UNIQUE, -- def, seniority_seller, seniority_leader, values, leadership
  structure jsonb, -- estrutura JSON completa do teste
  version text,
  updated_at timestamp
)

custom_weights (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  test_type text,
  weights jsonb, -- pesos customizados
  created_at timestamp
)

-- ALERTAS E NOTIFICAÇÕES
alerts (
  id uuid PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces,
  user_id uuid REFERENCES users,
  type text, -- performance_drop, pdi_overdue, no_evolution
  severity text, -- low, medium, high, critical
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp
)
```

### 3.3 Row Level Security (RLS) - Supabase

```sql
-- Workspace members só veem dados do próprio workspace
CREATE POLICY workspace_isolation ON assessments
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Vendedores só veem próprias avaliações
CREATE POLICY seller_own_data ON assessments
  USING (
    evaluated_user_id = auth.uid()
    OR evaluator_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'leader')
    )
  );

-- Líderes veem dados do time
CREATE POLICY leader_team_data ON assessments
  USING (
    evaluated_user_id IN (
      SELECT tm.user_id FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE t.leader_id = auth.uid()
    )
  );
```

### 3.4 Integração Clerk + Supabase

**Webhook Flow:**
1. Clerk dispara webhook em `user.created` / `organization.created`
2. Edge Function `/api/webhooks/clerk` recebe evento
3. Sync automático: `users` ↔ `workspace_members`

```typescript
// app/api/webhooks/clerk/route.ts
export async function POST(req: Request) {
  const payload = await req.json();
  const { type, data } = payload;

  if (type === 'user.created') {
    await supabase.from('users').insert({
      clerk_user_id: data.id,
      email: data.email_addresses[0].email_address,
      full_name: `${data.first_name} ${data.last_name}`
    });
  }

  // ... outros eventos
}
```

---

## 4. FUNCIONALIDADES DETALHADAS

### 4.1 Sistema de Testes

#### 4.1.1 Teste de Senioridade de Vendedor

**Categorias:**
- Habilidades Comportamentais (16 questões, peso 50%)
- Habilidades Técnicas - Método DEF (5 questões, peso 30%)
- Adesão ao Processo Comercial (7 questões, peso 20%)

**Mecânica:**
- Notas: 1, 2, 3 por questão
- Dupla avaliação: autoavaliação + gestor
- Classificação automática: Júnior / Pleno / Sênior
- Algoritmo de progressão entre níveis: 75% (1→2) e 80% (2→3)

**Outputs:**
- Score global ponderado
- Score por categoria
- Divergências auto vs gestor
- Recomendações automáticas
- PDI gerado por gaps

#### 4.1.2 Teste de Senioridade de Líder Comercial

**Categorias:**
- Habilidades Comportamentais (16 questões, peso 52%)
- Habilidades Técnicas - Método DEF (5 questões, peso 16%)
- Gestão Comercial (10 questões, peso 32%)

**Diferencial:**
- Avalia capacidade de dar feedback técnico
- Inclui gestão de pessoas, ritos e métricas
- Customizado para perfil de liderança

#### 4.1.3 Matriz DEF (Por Reunião)

**5 Macro-categorias:**
1. WhatsApp (8 critérios)
2. Descoberta (13 critérios)
3. Encantamento (12 critérios)
4. Fechamento (4 critérios)
5. Contorno de Objeções (4 critérios)

**Sistema de Notas:**
- 0 a 3 por critério
- Comentários padrão selecionáveis
- Comentário livre adicional
- Registro por reunião individual

**Visualizações:**
- Radar Chart (5 eixos)
- Heatmap por critério
- Evolução temporal
- Comparação vs meta interna
- "Assinatura DEF" do vendedor

#### 4.1.4 Teste de 8 Dimensões de Valores

**Dimensões:**
1. Valores Individuais (17 itens)
2. Valores Espirituais (8 itens)
3. Qualidades Pessoais (38 itens)
4. Valores referentes à Imagem (25 itens)
5. Valores em Momentos de Emergência (23 itens)
6. Valores Referentes ao Estilo de Vida (38 itens)
7. Valores que Conferem Poder (15 itens)
8. Valores Referentes a Atitudes (20 itens)

**Escala:** 0 (nada relevante) a 5 (extremamente relevante)

**Outputs:**
- Radar de 8 eixos
- Top 3 dimensões
- Cards detalhados por dimensão
- Insights de alinhamento pessoal

#### 4.1.5 Teste de Estilo de Liderança

**10 Questões** para classificar em:
- **Builder**: Constrói do zero, cria estruturas
- **Farmer**: Mantém estabilidade, otimiza processos
- **Scale**: Acelera crescimento, escala operações

**Outputs:**
- Classificação principal
- Descrição detalhada do estilo
- Pontos fortes e riscos
- Contextos ideais

### 4.2 Sistema de PDI

#### 4.2.1 Geração Automática

**Triggers:**
- Nota atual ≤ 1 → PDI automático
- Nota atual = 0 → Alerta crítico
- Divergência auto vs gestor > 2 pontos → Sinalização

**Estrutura do PDI Item:**
```typescript
interface PDIItem {
  categoria: string;
  criterio: string;
  notaAtualAuto: number;
  notaAtualGestor: number;
  notaDesejada: number;
  acoes: string[];
  fereValoresInegociaveis: boolean;
  prazoDias: number;
  status: 'nao_iniciada' | 'em_andamento' | 'concluida';
  evidencias: File[];
}
```

#### 4.2.2 Workflow de PDI

1. **Geração**: Auto-gerado pós-avaliação
2. **Revisão**: Líder ajusta ações e prazos
3. **Execução**: Vendedor marca progresso
4. **Evidências**: Upload de arquivos comprobatórios
5. **Validação**: Líder aprova conclusão
6. **Nova Avaliação**: Ciclo se repete

#### 4.2.3 Tracking de Evolução

**Métricas:**
- % de itens concluídos (global e por categoria)
- Ganho de pontos (inicial → atual)
- Tempo médio de conclusão
- Taxa de sucesso por tipo de ação

### 4.3 Dashboards e Analytics

#### 4.3.1 Dashboard do Vendedor

**Widgets:**
- Radar individual (última avaliação)
- Histórico de reuniões DEF (linha do tempo)
- Gráfico de evolução de notas
- PDI aberto (% conclusão)
- Próximas ações prioritárias

#### 4.3.2 Dashboard do Líder

**Widgets:**
- Ranking da equipe (por score global)
- Distribuição de senioridade (pizza chart)
- Heatmap dos principais gargalos
- Filtros: vendedor / período / produto
- Acompanhamento de PDIs ativos
- Alertas automáticos

**Alertas:**
- Desempenho abaixo da média
- PDI sem evolução há 30+ dias
- Divergência alta auto vs gestor
- Valores inegociáveis violados

#### 4.3.3 Dashboard do Empresário

**KPIs Consolidados:**
- Força operacional (score médio do time)
- Distribuição de senioridade por squad
- Índice de desenvolvimento (evolução de PDIs)
- Gargalos estruturais (top 5 critérios críticos)
- ROI de treinamentos (correlação PDI → performance)

**Visualizações:**
- Mapa de calor organizacional
- Evolução temporal da equipe
- Comparativo entre times
- Pipeline de talentos (júnior → sênior)

### 4.4 Sistema de Permissões

| Funcionalidade | Vendedor | Líder | Admin | Empresário |
|----------------|----------|-------|-------|------------|
| Ver próprios testes | ✅ | ✅ | ✅ | ✅ |
| Ver testes do time | ❌ | ✅ | ✅ | ✅ |
| Aplicar testes | Self | Time | Todos | Todos |
| Editar PDI próprio | ✅ | ✅ | ✅ | ✅ |
| Aprovar PDIs | ❌ | ✅ | ✅ | ✅ |
| Customizar pesos | ❌ | ❌ | ✅ | ✅ |
| Ver dashboard consolidado | ❌ | Time | Workspace | Workspace |
| Gerenciar usuários | ❌ | Time | Workspace | Workspace |

---

## 5. PLANO DE IMPLEMENTAÇÃO

### 5.1 Roadmap de Desenvolvimento

#### **Sprint 0: Setup (Semana 1)**
- [ ] Configurar repositório Git
- [ ] Setup Next.js 14 + TypeScript
- [ ] Configurar Clerk (auth)
- [ ] Criar projeto Supabase
- [ ] Configurar MCP do Supabase no Claude Desktop
- [ ] Setup Vercel para deploy

#### **Sprint 1: Fundação (Semanas 2-3)**
- [ ] Schema completo do banco (migrations)
- [ ] RLS policies básicas
- [ ] Webhook Clerk → Supabase
- [ ] Layouts principais (shell da aplicação)
- [ ] Sistema de rotas protegidas
- [ ] Componentes base (UI library)

#### **Sprint 2: Workspaces & Usuários (Semanas 4-5)**
- [ ] CRUD de workspaces
- [ ] Gestão de membros
- [ ] Sistema de teams
- [ ] Convites por email
- [ ] Perfis de usuário
- [ ] Seletor de workspace

#### **Sprint 3: Testes - Parte 1 (Semanas 6-7)**
- [ ] Engine de renderização de testes (genérico)
- [ ] Teste de Senioridade (Vendedor)
- [ ] Teste de Senioridade (Líder)
- [ ] Sistema de autoavaliação vs gestor
- [ ] Cálculo de scores e classificação

#### **Sprint 4: Testes - Parte 2 (Semanas 8-9)**
- [ ] Matriz DEF (estrutura de reuniões)
- [ ] Sistema de comentários padrão
- [ ] Teste de Valores (8 dimensões)
- [ ] Teste de Estilo de Liderança
- [ ] Listagem e histórico de testes

#### **Sprint 5: PDI (Semanas 10-11)**
- [ ] Geração automática de PDIs
- [ ] CRUD de PDI items
- [ ] Sistema de ações e prazos
- [ ] Upload de evidências (Supabase Storage)
- [ ] Workflow de aprovação
- [ ] Tracking de evolução

#### **Sprint 6: Dashboards - Parte 1 (Semanas 12-13)**
- [ ] Dashboard do Vendedor
- [ ] Radar Charts (Recharts)
- [ ] Gráficos de evolução temporal
- [ ] Cards de métricas
- [ ] Filtros e períodos

#### **Sprint 7: Dashboards - Parte 2 (Semanas 14-15)**
- [ ] Dashboard do Líder
- [ ] Heatmaps de gargalos
- [ ] Rankings de equipe
- [ ] Sistema de alertas
- [ ] Dashboard do Empresário

#### **Sprint 8: Admin & Customização (Semanas 16-17)**
- [ ] Painel admin
- [ ] Customização de pesos
- [ ] Gestão global de usuários
- [ ] Exportação de relatórios
- [ ] Logs de auditoria

#### **Sprint 9: Polimento (Semanas 18-19)**
- [ ] Otimizações de performance
- [ ] Testes E2E (Playwright)
- [ ] Documentação
- [ ] Onboarding flow
- [ ] Tutoriais in-app

#### **Sprint 10: Beta & Launch (Semana 20)**
- [ ] Beta com usuários reais
- [ ] Ajustes de feedback
- [ ] SEO e meta tags
- [ ] Deploy em produção
- [ ] Monitoramento (Sentry)

### 5.2 Estratégia de Desenvolvimento com Claude

#### **Usando MCP do Supabase**

1. **Instalar MCP do Supabase no Claude Desktop:**
```bash
# No claude_desktop_config.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://seu-projeto.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "sua-service-key"
      }
    }
  }
}
```

2. **Workflow com Claude Code:**
   - Usar Claude Desktop com MCP para queries SQL
   - Gerar migrations diretamente com validação
   - Testar RLS policies antes de commit
   - Claude Code para desenvolvimento de componentes

#### **Economizando Créditos**

**Usar Google AI Studio para:**
- Geração de mock data
- Tradução de textos
- Descrições de funcionalidades

**Usar Claude para:**
- Arquitetura e decisões técnicas
- Code review e refatoração
- Debugging complexo
- Queries SQL e RLS policies

### 5.3 Ordem de Implementação (Para Evitar Dependências)

```
1. Supabase Schema → 2. Clerk Webhooks → 3. RLS Policies
         ↓
4. Next.js Layouts → 5. Auth Guards → 6. Workspaces CRUD
         ↓
7. Test Engine → 8. Primeiro Teste (Senioridade) → 9. Validação
         ↓
10. PDI System → 11. Storage (Evidências) → 12. Approval Flow
         ↓
13. Dashboard Components → 14. Charts Library → 15. Filtros
         ↓
16. Admin Panel → 17. Custom Weights → 18. Reports
```

### 5.4 Estrutura de Pastas Sugerida

```
cockpit-comercial/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── [workspace]/
│   │   │   ├── overview/
│   │   │   ├── testes/
│   │   │   ├── pdi/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── webhooks/clerk/
│   │   └── trpc/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn)
│   ├── charts/
│   ├── testes/
│   └── pdi/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── clerk/
│   └── utils/
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── package.json
```

---

## 6. CONSIDERAÇÕES TÉCNICAS

### 6.1 Performance

**Otimizações Críticas:**
- Server Components para dashboards
- React Query para cache de avaliações
- Infinite scroll em históricos
- Lazy loading de charts pesados
- CDN para assets estáticos (Vercel)

### 6.2 Segurança

**Camadas de Proteção:**
1. RLS no Supabase (workspace isolation)
2. Middleware Next.js (route guards)
3. Clerk session validation
4. CORS configurado
5. Rate limiting (Vercel)

### 6.3 Escalabilidade

**Preparado para:**
- Multi-tenancy (workspaces)
- 1000+ usuários por workspace
- 10k+ avaliações/mês
- Real-time updates (Supabase Realtime)

### 6.4 Monitoramento

**Ferramentas:**
- Vercel Analytics (web vitals)
- Sentry (error tracking)
- Supabase Dashboard (queries lentas)
- PostHog (analytics comportamentais)

---

## 7. ROADMAP FUTURO (Pós-MVP)

### Fase 2: Desdobramento de Metas
- OKRs e OTEs por vendedor
- Simulador de comissões
- Tracking automático de progresso
- Alertas de desvio de meta

### Fase 3: Inteligência Artificial
- Análise automática de reuniões (speech-to-text)
- Sugestões de ações para PDI
- Predição de churn de vendedores
- Recomendações de treinamento personalizadas

### Fase 4: Integrações
- CRMs (Pipedrive, HubSpot, RD Station)
- Ferramentas de chamada (Google Meet, Zoom)
- LMS (plataformas de treinamento)
- WhatsApp Business API

### Fase 5: Gamificação
- Sistema de pontos e badges
- Rankings públicos
- Desafios entre equipes
- Recompensas configuráveis

---

## 8. CRITÉRIOS DE SUCESSO

### Métricas de Produto
- [ ] 90%+ de testes completados em < 15min
- [ ] 80%+ de PDIs com ≥1 ação concluída/mês
- [ ] 70%+ de líderes usando dashboards semanalmente
- [ ] < 3s tempo de carregamento médio

### Métricas de Negócio
- [ ] 20+ workspaces ativos (Beta)
- [ ] NPS > 50
- [ ] Churn < 5%/mês
- [ ] CAC payback < 6 meses

---

## 9. APÊNDICES

### 9.1 Glossário
- **DEF**: Metodologia de vendas (Descoberta, Encantamento, Fechamento)
- **PDI**: Plano de Desenvolvimento Individual
- **RLS**: Row Level Security (Supabase)
- **OTE**: On-Target Earnings (comissão esperada)

### 9.2 Referências
- Documentação Supabase: https://supabase.com/docs
- Clerk Next.js: https://clerk.com/docs/quickstarts/nextjs
- Recharts: https://recharts.org/

### 9.3 Contatos do Projeto
- **Product Owner**: Brenno
- **Tech Stack**: Next.js 14, Supabase, Clerk, Vercel
- **Timeline**: 20 semanas (MVP completo)

---

**Versão**: 2.0
**Data**: Novembro 2025
**Status**: Aprovado para Desenvolvimento
