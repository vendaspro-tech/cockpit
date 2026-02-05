# PRD_AI_Module

# **📋 PRD: Módulo de IA Plugável para SaaS**

## **Executive Summary**

Um módulo **multi-provider**, **multi-workspace** e **replicável** que permite administradores gerenciar agentes de IA, conectar dados do Supabase, importar knowledge bases e monitorar uso/custos em qualquer aplicação SaaS.

---

## **📊 Vision & Goals**

### Vision

Empoderar equipes SaaS a criar, gerenciar e monitorar agentes de IA customizados sem necessidade de codificação, com governança completa e observabilidade.

### Goals

1. ✅ **Zero-code Agent Creation** — Interface visual para criar agentes

2. ✅ **Data Integration** — Conectar tabelas Supabase como context

3. ✅ **Knowledge Management** — Importar PDFs, CSVs, JSONs

4. ✅ **Prompt Engineering** — Editor visual para prompts com variables

5. ✅ **Usage Analytics** — Dashboard de consumo, custo, latência

6. ✅ **Multi-Provider** — OpenAI, Google Gemini, Anthropic

7. ✅ **Enterprise Ready** — RLS, audit logs, cost controls

8. ✅ **Replicável** — Funciona em qualquer SaaS Next.js + Supabase

---

## **🎯 Core Features**

### 1\. **Agent Builder** (Sistema de Criação)



```javascript
interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  
  // Configuration
  provider: 'openai' | 'google' | 'anthropic';
  model: string;
  temperature: number;
  max_tokens: number;
  
  // Prompt & Instructions
  system_prompt: string;
  variables: { name: string; type: 'string' | 'number'; required: boolean }[];
  
  // Data Sources
  datasources: Datasource[];
  
  // Knowledge Base
  knowledge_base_id?: string;
  
  // Response Format
  output_schema?: JsonSchema;
  
  // Rate Limiting & Costs
  rate_limit: number; // calls per minute
  max_monthly_cost?: number;
  
  // Permissions
  allowed_roles: string[];
  
  created_at: string;
  updated_at: string;
}
```

### 2\. **Datasources Management** (Conexão com Dados)

```javascript
interface Datasource {
  id: string;
  workspace_id: string;
  agent_id: string;
  
  name: string;
  type: 'supabase_table' | 'supabase_rpc' | 'api_endpoint' | 'webhook';
  
  // Supabase-specific
  table_name?: string;
  columns?: string[]; // whitelist
  where_clause?: string; // safety filter
  limit?: number;
  
  // API-specific
  endpoint?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  
  // Access Control
  requires_permission?: string;
  
  // Cache
  cache_ttl?: number; // seconds
  
  created_at: string;
}
```

### 3\. **Knowledge Base** (Importação de Arquivos)

```javascript
interface KnowledgeBase {
  id: string;
  workspace_id: string;
  
  name: string;
  description: string;
  
  // Files
  documents: Document[];
  total_tokens: number;
  
  // Indexing
  vector_index_id?: string;
  indexed_at?: string;
  
  // Embedding Model
  embedding_model: string;
  
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  knowledge_base_id: string;
  filename: string;
  file_type: 'pdf' | 'csv' | 'json' | 'txt' | 'markdown';
  file_size: number;
  content_preview: string;
  tokens_used: number;
  uploaded_at: string;
}
```

### 4\. **Agent Testing & Execution** (Execução)

```javascript
interface AgentExecution {
  id: string;
  workspace_id: string;
  agent_id: string;
  
  user_id: string;
  
  // Input
  input: Record<string, any>;
  
  // Processing
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
  
  // Output
  output: Record<string, any>;
  
  // Metrics
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  tokens_used: {
    input: number;
    output: number;
    total: number;
  };
  
  // Cost
  cost_usd: number;
  
  created_at: string;
}
```

### 5\. **Analytics & Monitoring** (Observabilidade)

```javascript
interface AgentMetrics {
  agent_id: string;
  period: 'day' | 'week' | 'month';
  
  // Usage
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_latency_ms: number;
  
  // Cost
  total_cost_usd: number;
  tokens_used: number;
  
  // User Activity
  unique_users: number;
  executions_by_user: Record<string, number>;
  
  // Errors
  top_errors: Array<{ error: string; count: number }>;
}

interface WorkspaceAIBudget {
  workspace_id: string;
  month: string;
  
  // Budget
  monthly_limit_usd?: number;
  
  // Current Usage
  total_cost_usd: number;
  total_tokens: number;
  total_executions: number;
  
  // By Agent
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    cost_usd: number;
    executions: number;
  }>;
}
```

### 6\. **Admin Configuration** (Governança)

```javascript
interface AISystemConfig {
  // Providers
  enabled_providers: ('openai' | 'google' | 'anthropic')[];
  provider_configs: {
    openai?: { api_key_encrypted: string; base_url?: string };
    google?: { api_key_encrypted: string };
    anthropic?: { api_key_encrypted: string };
  };
  
  // Defaults
  default_provider: string;
  default_model: string;
  
  // Rate Limiting
  global_rate_limit: number; // calls per minute
  max_daily_cost_usd: number;
  
  // Safety
  enable_audit_logging: boolean;
  require_approval_for_datasources: boolean;
  max_knowledge_base_size_mb: number;
  
  // Features
  enable_custom_models: boolean;
  enable_user_agents: boolean;
  
  updated_at: string;
}
```

---

## **🎨 UI/UX Architecture**

### Admin Panel Layout

```javascript
/admin/ai/
├── Overview (Dashboard)
│   ├── Total Agents: 12
│   ├── Monthly Cost: $542.30
│   ├── Active Executions: 4
│   └── System Health
│
├── Agents
│   ├── [Agent List]
│   │   ├── Create New Agent
│   │   ├── Filter by Status
│   │   └── Search
│   │
│   └── [Agent Detail]
│       ├── Configuration Tab
│       │   ├── Basic Info (name, description)
│       │   ├── Provider Selection
│       │   ├── Model Settings
│       │   └── Rate Limiting
│       │
│       ├── Prompt Tab
│       │   ├── System Prompt Editor (Monaco)
│       │   ├── Variables Manager
│       │   └── Examples/Testing
│       │
│       ├── Datasources Tab
│       │   ├── Add Datasource
│       │   ├── [Datasource List]
│       │   │   ├── Table Selector (UI)
│       │   │   ├── Column Selector (Checkbox)
│       │   │   ├── Filter Builder
│       │   │   └── Preview Data
│       │   └── RLS Policy Helper
│       │
│       ├── Knowledge Base Tab
│       │   ├── File Upload (Drag & Drop)
│       │   ├── [Document List]
│       │   │   ├── Delete/Edit
│       │   │   ├── Token Usage
│       │   │   └── Preview
│       │   └── Reindex Button
│       │
│       ├── Testing Tab
│       │   ├── Input Form (Dynamic)
│       │   ├── Execute Button
│       │   ├── Output Preview (JSON)
│       │   └── Latency/Cost Display
│       │
│       ├── Permissions Tab
│       │   ├── Role-based Access
│       │   └── API Key Management
│       │
│       └── Logs Tab
│           ├── Execution History
│           ├── Error Details
│           └── Cost Breakdown
│
├── Analytics
│   ├── System Dashboard
│   │   ├── Total Cost (Month/Year)
│   │   ├── Executions (Line Chart)
│   │   ├── Cost per Agent (Bar Chart)
│   │   ├── Provider Distribution (Pie)
│   │   └── Error Rate Trend
│   │
│   ├── Agent Metrics
│   │   ├── Agent Selector
│   │   ├── Latency (Histogram)
│   │   ├── Success Rate (Gauge)
│   │   ├── Cost Trend (Area)
│   │   └── Top Users
│   │
│   └── Workspace Billing
│       ├── Budget vs Usage
│       ├── Cost Alerts
│       ├── Agent-level Breakdown
│       └── Export Report
│
├── Knowledge Bases
│   ├── [KB List]
│   │   ├── Create New KB
│   │   └── Search
│   │
│   └── [KB Detail]
│       ├── Document List
│       ├── Upload New Files
│       ├── Re-index
│       └── Token Usage Stats
│
├── Settings
│   ├── System Config
│   │   ├── Provider Keys (Encrypted Input)
│   │   ├── Feature Flags
│   │   └── Rate Limits
│   │
│   ├── Safety & Compliance
│   │   ├── Audit Logging
│   │   ├── Data Retention
│   │   └── Cost Controls
│   │
│   └── Workspace Limits
│       ├── Agents per Workspace
│       ├── Monthly Budget Cap
│       └── Storage Limits
│
└── Documentation
    ├── Quick Start
    ├── API Reference
    ├── Datasource Examples
    └── Prompt Best Practices
```

---

## **🛠️ Technical Architecture**

### Database Schema

```javascript
-- Agents
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 2000,
  
  system_prompt TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  
  output_schema JSONB,
  
  rate_limit INT DEFAULT 100,
  max_monthly_cost DECIMAL(10,2),
  
  allowed_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Datasources
CREATE TABLE ai_datasources (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  
  config JSONB NOT NULL, -- table_name, columns, where_clause, etc
  requires_permission TEXT,
  cache_ttl INT DEFAULT 300,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Bases
CREATE TABLE ai_knowledge_bases (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  
  total_tokens INT DEFAULT 0,
  vector_index_id TEXT,
  indexed_at TIMESTAMP,
  embedding_model TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_documents (
  id UUID PRIMARY KEY,
  knowledge_base_id UUID NOT NULL REFERENCES ai_knowledge_bases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  content_preview TEXT,
  tokens_used INT,
  
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Executions & Logs
CREATE TABLE ai_agent_executions (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES ai_agents(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  input JSONB NOT NULL,
  output JSONB,
  status TEXT DEFAULT 'queued',
  error TEXT,
  
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_ms INT,
  
  tokens_used JSONB,
  cost_usd DECIMAL(8,4),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- System Configuration
CREATE TABLE ai_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled_providers TEXT[] NOT NULL,
  provider_configs JSONB NOT NULL, -- encrypted
  default_provider TEXT,
  default_model TEXT,
  
  global_rate_limit INT DEFAULT 1000,
  max_daily_cost_usd DECIMAL(10,2),
  
  enable_audit_logging BOOLEAN DEFAULT TRUE,
  require_approval_for_datasources BOOLEAN DEFAULT FALSE,
  max_knowledge_base_size_mb INT DEFAULT 500,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cost Tracking
CREATE TABLE ai_monthly_costs (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  agent_id UUID REFERENCES ai_agents(id),
  month TEXT NOT NULL, -- YYYY-MM
  
  total_cost_usd DECIMAL(10,2),
  total_tokens INT,
  total_executions INT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, agent_id, month)
);

-- RLS Policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_executions ENABLE ROW LEVEL SECURITY;

-- Workspace members can manage agents
CREATE POLICY "Manage own agents"
  ON ai_agents
  FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
```

### File Structure (Replicável)

```javascript
app/
├── (admin)/admin/ai/
│   ├── page.tsx                 # Dashboard overview
│   ├── agents/page.tsx          # Agents list
│   ├── agents/[id]/page.tsx     # Agent detail + builder
│   ├── analytics/page.tsx       # Metrics & billing
│   ├── knowledge-bases/page.tsx # KB management
│   └── settings/page.tsx        # System config

components/
├── ai/
│   ├── agent-builder/
│   │   ├── basic-info.tsx
│   │   ├── prompt-editor.tsx
│   │   ├── datasource-selector.tsx
│   │   ├── knowledge-base-upload.tsx
│   │   └── output-schema-editor.tsx
│   │
│   ├── analytics/
│   │   ├── usage-dashboard.tsx
│   │   ├── cost-chart.tsx
│   │   ├── error-analysis.tsx
│   │   └── budget-tracker.tsx
│   │
│   ├── testing/
│   │   ├── agent-tester.tsx
│   │   ├── input-form.tsx
│   │   └── output-viewer.tsx
│   │
│   └── settings/
│       ├── provider-config.tsx
│       ├── system-settings.tsx
│       └── safety-controls.tsx

lib/ai/
├── providers/
│   ├── base.ts              # Provider interface
│   ├── openai.ts            # OpenAI implementation
│   ├── google.ts            # Google Gemini
│   └── anthropic.ts         # Anthropic Claude
│
├── datasources/
│   ├── supabase.ts          # Supabase table connector
│   ├── api.ts               # API endpoint connector
│   └── webhook.ts           # Webhook source
│
├── knowledge-base/
│   ├── indexer.ts           # Vector indexing
│   ├── parser.ts            # File parsing (PDF, CSV, etc)
│   └── retriever.ts         # Semantic search
│
├── executor.ts              # Agent execution engine
├── config.ts                # Configuration management
├── types.ts                 # TypeScript interfaces
└── hooks.ts                 # React hooks for UI

app/actions/ai/
├── agents.ts                # CRUD operations
├── datasources.ts           # Datasource management
├── knowledge-bases.ts       # KB management
├── executions.ts            # Run agents + logging
├── analytics.ts             # Metrics aggregation
└── settings.ts              # System config

public/docs/
├── agent-builder-guide.md
├── datasource-examples.md
└── prompt-templates.md
```

---

## **🔐 Security & Compliance**

### Data Protection

- ✅ API keys encrypted at rest (Supabase encryption)

- ✅ Row-Level Security (RLS) on all tables

- ✅ Workspace isolation enforced at query level

- ✅ Audit logging de todas as ações

### Access Control

- ✅ Role-based permissions (Owner, Admin, Agent Manager, User)

- ✅ Granular datasource access control

- ✅ Rate limiting per user/agent

- ✅ Cost caps per workspace

### Compliance

- ✅ Audit logs (who, what, when, why)

- ✅ Data retention policies

- ✅ GDPR-compliant data deletion

- ✅ Cost transparency and alerts

---

## **📈 Roadmap**

### Phase 1: MVP (Semanas 1-3)

- Agent CRUD interface

- Basic prompt editor

- Supabase datasource connector

- OpenAI integration

- Test/execute functionality

- Basic execution logs

### Phase 2: Knowledge Base (Semanas 4-5)

- File upload (PDF, CSV, JSON)

- Vector indexing (Pinecone/Supabase pgvector)

- RAG integration into agents

- Document management UI

### Phase 3: Analytics (Semanas 6-7)

- Execution metrics dashboard

- Cost tracking and alerts

- Monthly billing breakdown

- Performance analytics

### Phase 4: Enterprise (Semanas 8+)

- Multi-provider support (Google, Anthropic)

- Advanced datasource types (APIs, webhooks)

- Scheduled agent execution

- Workspace billing integration

- Audit logging UI

---

## **🚀 Making It Replicável**

### Package Strategy

```javascript
// For reuse across SaaS apps, publish as packages:

// @saas/ai-core
// - Provider interfaces
// - Datasource abstraction
// - Execution engine

// @saas/ai-admin
// - Pre-built admin UI components
// - Dashboard layouts
// - Configuration pages

// @saas/ai-hooks
// - useAgent()
// - useAgentExecution()
// - useAIMetrics()
```

### Integration Checklist for New SaaS

```markdown
1. ✅ Install @saas/ai-core, @saas/ai-admin
2. ✅ Create database tables (migrations/)
3. ✅ Add to env vars: AI provider keys
4. ✅ Mount admin routes at /admin/ai
5. ✅ Configure permissions.ts
6. ✅ Add to admin sidebar navigation
7. ✅ Done! 🎉
```

---

## **📊 Success Metrics**

| Métrica | Target | 
|---|---|
| Agent creation time | < 5 min | 
| Execution latency | < 2s (p95) | 
| System uptime | 99\.9% | 
| User adoption | 80% of admins use within 30 days | 
| Cost savings | 40% vs manual processes | 
| Support tickets (AI-related) | < 2% of total | 

---


