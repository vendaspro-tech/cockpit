# 📋 PRD: Módulo de IA Plugável para SaaS - VERSÃO FINAL

## Executive Summary

Um módulo **multi-provider**, **multi-workspace** e **replicável** que permite administradores gerenciar agentes de IA customizados, conectar dados do Supabase, importar knowledge bases, processar arquivos de usuários e monitorar uso/custos com foco em **Google Imagen para image generation cost-effective**.

---

## 📊 Vision & Goals

### Vision
Empoderar equipes SaaS a criar, gerenciar e monitorar agentes de IA customizados sem necessidade de codificação, com governança completa, observabilidade e suporte para múltiplas capabilities (vision, image generation, artifacts, function calling).

### Goals
1. ✅ **Zero-code Agent Creation** — Interface visual para criar agentes
2. ✅ **Per-Agent LLM Configuration** — Cada agente escolhe seu provider/modelo
3. ✅ **Data Integration** — Conectar tabelas Supabase como context
4. ✅ **Knowledge Management** — Importar PDFs + Google Search RAG
5. ✅ **File Upload & Processing** — Usuários fazem upload de transcrições, imagens, docs
6. ✅ **Image Generation** — Google Imagen (Nanobanana) como default, DALL-E como fallback
7. ✅ **Artifacts Generation** — Agentes geram PDFs, CSVs, código, HTML
8. ✅ **Function Calling** — Webhooks, Supabase RPC, approvals
9. ✅ **Usage Analytics** — Dashboard de consumo, custo, latência por capability
10. ✅ **Enterprise Ready** — RLS, audit logs, cost controls, retention policies
11. ✅ **Replicável** — Funciona em qualquer SaaS Next.js + Supabase

---

## 🎯 Core Features

### 1. **Agent Builder** (Sistema de Criação)

```typescript
interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  
  // ✅ PER-AGENT LLM CONFIGURATION
  llm_config: {
    provider: 'openai' | 'google' | 'anthropic';
    model: string;
    temperature: number;
    top_p?: number;
    max_tokens: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  };
  
  // ✅ CAPABILITIES
  capabilities: {
    rag: boolean;
    file_processing: boolean; // PDF, CSV, images, audio, video
    image_generation: boolean; // Google Imagen, DALL-E 3
    vision: boolean; // GPT-4V, Claude 3 Vision
    function_calling: boolean; // Tools/functions
    artifacts_generation: boolean; // Generate PDFs, code, HTML
    streaming: boolean; // Real-time streaming responses
    long_context: boolean; // 100k+ token models
    memory: 'stateless' | 'session' | 'persistent'; // Conversation context
  };
  
  // Prompt & Instructions
  system_prompt: string;
  variables: { 
    name: string; 
    type: 'string' | 'number' | 'file' | 'image' | 'boolean'; 
    required: boolean;
    description: string;
  }[];
  
  // Input/Output Schema
  input_schema?: JsonSchema;
  output_schema?: JsonSchema;
  
  // ✅ FUNCTION CALLING
  functions?: Array<{
    id: string;
    name: string;
    description: string;
    parameters: JsonSchema;
    endpoint?: string;
    requires_approval?: boolean;
  }>;
  
  // Data Sources
  datasources: Datasource[];
  
  // Knowledge Base with Multi-Source RAG
  knowledge_base: {
    id?: string;
    rag_provider: 'supabase_pgvector' | 'google_search' | 'pinecone';
    retrieval_config?: {
      top_k: number;
      similarity_threshold: number;
      rerank: boolean;
    };
  };
  
  // Rate Limiting & Costs
  rate_limit: number;
  max_monthly_cost?: number;
  
  // Permissions
  allowed_roles: string[];
  
  created_at: string;
  updated_at: string;
}
```

### 2. **Datasources Management** (Conexão com Dados)

```typescript
interface Datasource {
  id: string;
  workspace_id: string;
  agent_id: string;
  
  name: string;
  type: 'supabase_table' | 'supabase_rpc' | 'api_endpoint' | 'webhook' | 'google_drive' | 'google_sheets';
  
  // Supabase-specific
  table_name?: string;
  columns?: string[];
  where_clause?: string;
  limit?: number;
  
  // API-specific
  endpoint?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api_key' | 'oauth';
    token_encrypted?: string;
  };
  
  // Google Drive/Sheets
  google_config?: {
    folder_id?: string;
    sheet_id?: string;
    sync_frequency?: 'realtime' | 'hourly' | 'daily';
  };
  
  requires_permission?: string;
  cache_ttl?: number;
  
  created_at: string;
}
```

### 3. **Knowledge Base with Multi-Source RAG** (Importação + Google Search)

```typescript
interface KnowledgeBase {
  id: string;
  workspace_id: string;
  
  name: string;
  description: string;
  
  // ✅ MULTI-SOURCE RAG
  rag_provider: 'supabase_pgvector' | 'google_search' | 'pinecone';
  
  // Local Documents
  documents: Document[];
  total_tokens: number;
  
  // Vector Indexing
  vector_config?: {
    index_id?: string;
    indexed_at?: string;
    embedding_model: string;
    embedding_dimension: number;
  };
  
  // ✅ GOOGLE SEARCH CONFIG
  google_search_config?: {
    custom_search_engine_id: string;
    include_answers: boolean;
    safe_search: boolean;
    language?: string;
  };
  
  // ✅ RETENTION POLICY
  retention_policy?: {
    enabled: boolean;
    days_to_keep: number;
    auto_delete: boolean;
  };
  
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  knowledge_base_id: string;
  filename: string;
  file_type: 'pdf' | 'csv' | 'json' | 'txt' | 'markdown' | 'image' | 'audio' | 'video';
  file_size: number;
  
  // ✅ FILE UPLOAD METADATA
  uploader_user_id: string;
  uploaded_via: 'admin' | 'user_agent' | 'api';
  
  content_preview: string;
  tokens_used: number;
  
  // ✅ PROCESSING STATUS
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  
  // ✅ VIRUS SCAN
  virus_scanned_at?: string;
  is_safe: boolean;
  
  uploaded_at: string;
  expires_at?: string;
}
```

### 4. **Agent Execution with Files & Streaming** (Execução)

```typescript
interface AgentExecution {
  id: string;
  workspace_id: string;
  agent_id: string;
  user_id: string;
  
  // ✅ CONVERSATION MEMORY
  conversation_id?: string;
  parent_execution_id?: string;
  
  // ✅ INPUT WITH FILES
  input: {
    text: string;
    files?: Array<{
      id: string;
      filename: string;
      file_type: string;
      storage_path: string;
      file_size: number;
    }>;
    metadata?: Record<string, any>;
  };
  
  // Processing
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  
  // ✅ OUTPUT WITH ARTIFACTS & IMAGES
  output: {
    text: string;
    structured_data?: Record<string, any>;
    
    // Generated artifacts
    artifacts?: Array<{
      id: string;
      type: 'pdf' | 'csv' | 'code' | 'html' | 'markdown' | 'json';
      title: string;
      storage_path: string;
      size_bytes: number;
      created_at: string;
    }>;
    
    // Generated images
    images?: Array<{
      id: string;
      prompt: string;
      url: string;
      storage_path: string;
      model: string; // 'google_imagen', 'dall-e-3'
    }>;
    
    // Function calls executed
    function_calls?: Array<{
      function_id: string;
      function_name: string;
      parameters: Record<string, any>;
      result: any;
      executed_at: string;
    }>;
  };
  
  // ✅ STREAMING & TIMING
  streaming_enabled: boolean;
  stream_url?: string;
  
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
  
  // ✅ FILE STORAGE TRACKING
  storage_used_bytes: number;
  
  created_at: string;
}

// ✅ ARTIFACT STORAGE
interface Artifact {
  id: string;
  execution_id: string;
  agent_id: string;
  workspace_id: string;
  
  filename: string;
  artifact_type: 'pdf' | 'csv' | 'code' | 'html' | 'markdown' | 'json' | 'image';
  
  storage_path: string;
  file_size: number;
  mime_type: string;
  
  // Sharing & Access
  is_public: boolean;
  share_token?: string;
  expires_at?: string;
  
  // Metadata
  generated_by: string;
  generated_at: string;
  
  // Retention
  retention_days?: number;
  delete_at?: string;
}

// ✅ CONVERSATION MEMORY
interface ConversationMemory {
  id: string;
  workspace_id: string;
  agent_id: string;
  user_id: string;
  
  conversation_id: string;
  execution_sequence: number;
  
  // Message history
  execution_id: string;
  user_message: string;
  agent_response: string;
  
  tokens_used: number;
  cost_usd: number;
  
  created_at: string;
  expires_at?: string;
}
```

### 5. **File Upload & Processing** (Novo)

```typescript
interface UserFileUpload {
  id: string;
  workspace_id: string;
  agent_id: string;
  user_id: string;
  
  filename: string;
  file_type: 'pdf' | 'image' | 'audio' | 'video' | 'csv' | 'json' | 'txt' | 'docx';
  file_size: number;
  mime_type: string;
  
  storage_path: string;
  storage_url: string;
  
  // Processing
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  processing_duration_ms?: number;
  
  // Security
  virus_scanned: boolean;
  is_safe: boolean;
  scan_error?: string;
  
  // Metadata extracted
  file_metadata?: {
    pages?: number;
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
  
  // Quota tracking
  storage_quota_used_bytes: number;
  
  // Retention
  auto_delete_after_days?: number;
  delete_at?: string;
  
  created_at: string;
  uploaded_at: string;
}
```

### 6. **Function Calling & Tools** (Novo)

```typescript
interface AgentFunction {
  id: string;
  agent_id: string;
  workspace_id: string;
  
  name: string;
  description: string;
  
  // Function Definition
  parameters: JsonSchema;
  output_schema?: JsonSchema;
  
  // Execution
  function_type: 'webhook' | 'supabase_rpc' | 'api' | 'internal';
  
  // Webhook/API
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT';
  authentication?: {
    type: 'none' | 'bearer' | 'api_key';
    token_encrypted?: string;
  };
  
  // Supabase RPC
  rpc_function_name?: string;
  
  // Safety
  requires_approval: boolean;
  rate_limit_per_day?: number;
  allowed_roles?: string[];
  
  // Timeout
  timeout_seconds?: number;
  retry_attempts?: number;
  
  created_at: string;
  updated_at: string;
}

interface FunctionCallLog {
  id: string;
  function_id: string;
  execution_id: string;
  
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  
  created_at: string;
}
```

### 7. **Image Generation with Google Imagen** (Novo)

```typescript
interface ImageGenerationConfig {
  agent_id: string;
  
  // Enabled providers
  providers: Array<{
    provider: 'google_imagen' | 'openai_dalle' | 'anthropic';
    enabled: boolean;
    api_key_encrypted?: string;
    base_url?: string;
  }>;
  
  // Default settings - Google Imagen recommended
  default_provider: string; // 'google_imagen'
  default_size: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  default_quality: 'standard' | 'hd';
  
  // Constraints
  max_images_per_execution: number;
  max_images_per_day_per_user: number;
  cost_limit_per_image?: number;
}

interface GeneratedImage {
  id: string;
  execution_id: string;
  agent_id: string;
  workspace_id: string;
  
  prompt: string;
  
  // Image data
  storage_url: string;
  storage_path: string;
  image_size: string;
  
  // Generation metadata
  model: string; // 'google_imagen', 'dall-e-3', etc
  generation_params: {
    quality?: string;
    style?: string;
    n_variations?: number;
  };
  
  generation_time_ms: number;
  cost_usd: number;
  
  // Sharing
  is_public: boolean;
  public_share_token?: string;
  
  created_at: string;
  expires_at?: string;
}
```

### 8. **Analytics & Monitoring (Expandido)** (Observabilidade)

```typescript
interface AgentMetrics {
  agent_id: string;
  period: 'day' | 'week' | 'month';
  
  // Usage
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_latency_ms: number;
  
  // ✅ STREAMING & FILES
  streaming_executions: number;
  file_uploads_count: number;
  file_processing_avg_time_ms: number;
  
  // ✅ CAPABILITIES USAGE
  rag_queries: number;
  image_generations: number;
  artifacts_generated: number;
  function_calls: number;
  
  // Cost
  total_cost_usd: number;
  cost_by_capability?: {
    llm_calls: number;
    image_generation: number;
    function_calls: number;
    storage: number;
  };
  
  tokens_used: number;
  
  // User Activity
  unique_users: number;
  executions_by_user: Record<string, number>;
  
  // File Storage
  total_storage_used_gb: number;
  
  // Errors
  top_errors: Array<{ error: string; count: number }>;
}

interface WorkspaceAIBudget {
  workspace_id: string;
  month: string;
  
  // Budget
  monthly_limit_usd?: number;
  
  // ✅ USAGE BY CAPABILITY
  usage_breakdown: {
    llm_cost_usd: number;
    image_generation_cost_usd: number;
    function_calls_cost_usd: number;
    storage_cost_usd: number;
    total_cost_usd: number;
  };
  
  total_tokens: number;
  total_executions: number;
  
  // ✅ STORAGE USAGE
  total_storage_gb: number;
  storage_quota_gb: number;
  
  // By Agent
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    cost_usd: number;
    executions: number;
    storage_gb: number;
  }>;
  
  // Alerts
  alerts: Array<{
    type: 'budget_exceeded' | 'storage_full' | 'rate_limit' | 'cost_spike';
    message: string;
    triggered_at: string;
  }>;
}
```

### 9. **Admin Configuration (Expandido)** (Governança)

```typescript
interface AISystemConfig {
  // Providers
  enabled_providers: ('openai' | 'google' | 'anthropic')[];
  
  provider_configs: {
    openai?: {
      api_key_encrypted: string;
      base_url?: string;
      organization_id?: string;
      enable_vision: boolean;
      enable_dall_e: boolean;
      dall_e_version: 'dall-e-2' | 'dall-e-3';
    };
    google?: {
      api_key_encrypted: string;
      enable_gemini_advanced: boolean;
      enable_google_search: boolean;
      google_cse_id?: string;
      enable_imagen: boolean; // Google Imagen (Nanobanana)
    };
    anthropic?: {
      api_key_encrypted: string;
      enable_vision: boolean;
    };
  };
  
  // ✅ RAG CONFIGURATION
  rag_config: {
    default_provider: 'supabase_pgvector' | 'google_search' | 'pinecone';
    default_embedding_model: string;
    enable_reranking: boolean;
    default_top_k: number;
  };
  
  // Defaults
  default_provider: string;
  default_model: string;
  
  // Rate Limiting
  global_rate_limit: number;
  max_daily_cost_usd: number;
  
  // ✅ STORAGE & FILES
  storage_config: {
    supabase_bucket: string;
    max_file_size_mb: number;
    max_total_storage_gb: number;
    allowed_file_types: string[];
    enable_virus_scanning: boolean;
    virus_scanner_api?: string;
  };
  
  // Safety
  enable_audit_logging: boolean;
  require_approval_for_datasources: boolean;
  require_approval_for_functions: boolean;
  require_approval_for_file_uploads: boolean;
  max_knowledge_base_size_mb: number;
  
  // ✅ RETENTION POLICIES
  retention_policies: {
    artifact_retention_days: number;
    execution_log_retention_days: number;
    file_upload_retention_days: number;
    conversation_memory_retention_days: number;
  };
  
  // Features
  enable_custom_models: boolean;
  enable_user_agents: boolean;
  enable_function_calling: boolean;
  enable_image_generation: boolean;
  enable_conversation_memory: boolean;
  
  updated_at: string;
}
```

---

## 🚀 Feature Details by Capability

### **File Upload & Processing**
- **User Uploads**: Users can upload files directly in agent execution
- **Supported Formats**: PDF, Images (PNG, JPG), Audio (MP3, WAV), Video (MP4, MOV), CSV, JSON, Markdown, DOCX
- **Virus Scanning**: Automatic ClamAV scanning before storage
- **File Size Limits**: Configurable per workspace (default: 50MB)
- **Storage**: Supabase Storage with signed URLs and retention policies
- **Processing**: Background jobs for parsing and metadata extraction

### **Image Generation with Google Imagen**
- **Primary Provider**: Google Imagen (Nanobanana) - cost-effective and high quality
  - **Cost**: ~$0.001 per image (vs DALL-E 3 at $0.08 = 80x cheaper!)
  - **Speed**: < 30 seconds average
  - **Quality**: High-quality outputs
  - **Best for**: Portuguese, diverse styles
- **Alternative Providers**: OpenAI DALL-E 3, Anthropic
- **Per-Agent Config**: Each agent can have different image gen provider
- **Sizes**: 256x256, 512x512, 1024x1024, 1024x1792, 1792x1024
- **Quality Tiers**: Standard, HD
- **Cost Tracking**: Separate cost attribution for image generation
- **Rate Limiting**: Per-user daily limits configurable

### **Per-Agent LLM Configuration**
- **Provider Selection**: Each agent independently chooses provider
- **Model Flexibility**: Mix OpenAI, Google Gemini, Anthropic in same workspace
- **Temperature & Parameters**: Full control of generation parameters per agent
- **Cost Optimization**: Use cheaper models for simple tasks, premium for complex
- **Fallback Logic**: Automatic fallback to alternate provider if primary fails

### **Vision Capabilities**
- **Supported Models**: GPT-4V, Claude 3 Vision (Opus, Sonnet), Google Gemini Vision
- **Input**: Analyze images, screenshots, documents, charts
- **Integration**: Automatic for agents with vision capability enabled

### **Function Calling & Tools**
- **Webhook Support**: Call external APIs with parameters
- **Supabase RPC**: Execute stored procedures directly
- **Approval Workflow**: Optional manual approval before execution
- **Rate Limiting**: Daily limits per function
- **Error Handling**: Automatic retries with exponential backoff
- **Cost Attribution**: Separate tracking for function call costs

### **Artifacts Generation**
- **Formats**: PDF, CSV, JSON, HTML, Markdown, Code (Python, JavaScript, SQL)
- **Versioning**: Automatic version tracking
- **Storage**: Supabase Storage with signed URLs
- **Sharing**: Public share links with optional expiration
- **Retention**: Auto-delete based on retention policy
- **Size Limits**: Configurable per workspace

### **Conversation Memory**
- **Session Memory**: Maintain context within single session
- **Persistent Memory**: Optional multi-session memory (costly)
- **TTL**: Configurable expiration time
- **Token Optimization**: Smart summarization for long conversations
- **Privacy**: Can be disabled for compliance

### **RAG with Google Search & Multi-Source**
- **Google Custom Search Engine**: Integrate Google search results into RAG
- **Direct Answers**: Extract answers from search results
- **Hybrid Approach**: Combine local knowledge base + Google search
- **Safe Search**: Toggle explicit content filtering
- **Language Support**: Multi-language search
- **Rate Limiting**: Google Search API quota management

---

## 🎨 UI/UX Architecture

### Admin Panel Layout

```
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
│       │   ├── LLM Configuration (NEW)
│       │   │   ├── Provider Selector (Radio)
│       │   │   ├── Model Selector (Dropdown)
│       │   │   ├── Advanced Parameters
│       │   │   └── Fallback Provider Config
│       │   ├── Capabilities Matrix (NEW)
│       │   │   ├── RAG: [Toggle] + Provider
│       │   │   ├── Vision: [Toggle]
│       │   │   ├── Image Gen: [Toggle] (Google Imagen default)
│       │   │   ├── File Processing: [Toggle]
│       │   │   ├── Function Calling: [Toggle]
│       │   │   ├── Artifacts: [Toggle]
│       │   │   ├── Streaming: [Toggle]
│       │   │   ├── Long Context: [Toggle]
│       │   │   └── Memory: [Dropdown]
│       │   └── Rate Limiting & Costs
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
│       │   │   ├── Column Selector
│       │   │   ├── Filter Builder
│       │   │   └── Preview Data
│       │   └── RLS Policy Helper
│       │
│       ├── Knowledge Base Tab (EXPANDIDO)
│       │   ├── RAG Provider Selection
│       │   │   ├── Local (Supabase pgvector)
│       │   │   ├── Google Search (NEW)
│       │   │   └── Pinecone
│       │   ├── File Upload (Drag & Drop)
│       │   ├── [Document List]
│       │   │   ├── Virus Scan Status (NEW)
│       │   │   ├── Processing Status (NEW)
│       │   │   └── Delete
│       │   ├── Google Search Config (NEW)
│       │   │   ├── Custom Search Engine ID
│       │   │   └── Safe Search Checkbox
│       │   └── Reindex Button
│       │
│       ├── Functions Tab (NEW)
│       │   ├── Add Function
│       │   ├── [Functions List]
│       │   └── Rate Limiting Config
│       │
│       ├── Image Generation Tab (NEW)
│       │   ├── Enable Toggle
│       │   ├── Provider Selection (Google Imagen default)
│       │   ├── Default Size (Dropdown)
│       │   ├── Default Quality (Radio)
│       │   └── Constraints
│       │
│       ├── Input/Output Schema Tab (NEW)
│       │   ├── Input Schema Editor
│       │   ├── Output Schema Editor
│       │   └── Test with Sample Data
│       │
│       ├── Testing Tab (EXPANDIDO)
│       │   ├── Input Form
│       │   │   ├── Text Input
│       │   │   ├── File Upload (NEW)
│       │   │   └── Advanced JSON
│       │   ├── Execute Button
│       │   ├── Output Preview (EXPANDIDO)
│       │   │   ├── Text Response
│       │   │   ├── Generated Artifacts (NEW)
│       │   │   ├── Generated Images (NEW)
│       │   │   ├── Function Calls Log (NEW)
│       │   │   └── Cost Breakdown
│       │   └── Latency/Cost Display
│       │
│       ├── Permissions Tab
│       │   ├── Role-based Access
│       │   ├── API Key Management
│       │   └── Function Approval Requirements (NEW)
│       │
│       └── Logs Tab (EXPANDIDO)
│           ├── Execution History
│           ├── Error Details
│           ├── File Upload History (NEW)
│           ├── Image Generation History (NEW)
│           ├── Function Call History (NEW)
│           └── Cost Breakdown
│
├── Analytics (EXPANDIDO)
│   ├── System Dashboard
│   │   ├── Total Cost (Month/Year)
│   │   ├── Executions (Line Chart)
│   │   ├── Cost per Agent (Bar Chart)
│   │   ├── Cost Breakdown by Capability (NEW)
│   │   │   ├── LLM Calls
│   │   │   ├── Image Generation
│   │   │   ├── Function Calls
│   │   │   └── Storage
│   │   ├── Provider Distribution (Pie)
│   │   └── Error Rate Trend
│   │
│   ├── Agent Metrics
│   │   ├── Agent Selector
│   │   ├── Latency (Histogram)
│   │   ├── Success Rate (Gauge)
│   │   ├── Cost Trend (Area)
│   │   ├── Image Generation Stats (NEW)
│   │   ├── Artifacts Generated (NEW)
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
│   │   ├── Google Imagen Config (NEW)
│   │   │   ├── Default sizes
│   │   │   ├── Quality settings
│   │   │   └── Cost limits
│   │   └── Rate Limits
│   │
│   ├── Safety & Compliance
│   │   ├── Audit Logging
│   │   ├── Data Retention
│   │   ├── Retention Policy Config (NEW)
│   │   └── Cost Controls
│   │
│   └── Workspace Limits
│       ├── Agents per Workspace
│       ├── Monthly Budget Cap
│       ├── Storage Limits
│       └── Image Generation Budget (NEW)
│
└── Documentation
    ├── Quick Start
    ├── API Reference
    ├── Datasource Examples
    ├── Google Imagen Guide (NEW)
    └── Prompt Best Practices
```

---

## 🛠️ Technical Architecture

### Database Schema

```sql
-- Agents
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  
  -- Per-agent LLM config
  llm_config JSONB NOT NULL,
  capabilities JSONB NOT NULL,
  
  system_prompt TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  
  input_schema JSONB,
  output_schema JSONB,
  
  functions JSONB DEFAULT '[]',
  
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
  
  config JSONB NOT NULL,
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
  
  rag_provider TEXT DEFAULT 'supabase_pgvector',
  total_tokens INT DEFAULT 0,
  vector_index_id TEXT,
  indexed_at TIMESTAMP,
  embedding_model TEXT,
  
  google_search_config JSONB,
  retention_policy JSONB,
  
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
  
  uploader_user_id UUID NOT NULL REFERENCES users(id),
  uploaded_via TEXT,
  
  processing_status TEXT DEFAULT 'pending',
  processing_error TEXT,
  
  virus_scanned_at TIMESTAMP,
  is_safe BOOLEAN,
  
  uploaded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Executions & Logs
CREATE TABLE ai_agent_executions (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES ai_agents(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  conversation_id TEXT,
  parent_execution_id UUID,
  
  input JSONB NOT NULL,
  output JSONB,
  status TEXT DEFAULT 'queued',
  error TEXT,
  
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_ms INT,
  
  streaming_enabled BOOLEAN DEFAULT FALSE,
  stream_url TEXT,
  
  tokens_used JSONB,
  cost_usd DECIMAL(8,4),
  storage_used_bytes INT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ✅ USER FILE UPLOADS
CREATE TABLE ai_user_file_uploads (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  agent_id UUID REFERENCES ai_agents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT,
  
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  
  processing_status TEXT DEFAULT 'pending',
  processing_error TEXT,
  processing_duration_ms INT,
  
  virus_scanned BOOLEAN DEFAULT FALSE,
  is_safe BOOLEAN,
  scan_error TEXT,
  
  file_metadata JSONB,
  storage_quota_used_bytes INT,
  
  auto_delete_after_days INT,
  delete_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ✅ ARTIFACTS
CREATE TABLE ai_artifacts (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES ai_agents(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  
  filename TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  
  storage_path TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMP,
  
  generated_by TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  
  retention_days INT,
  delete_at TIMESTAMP
);

-- ✅ GENERATED IMAGES
CREATE TABLE ai_generated_images (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES ai_agents(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  
  prompt TEXT NOT NULL,
  
  storage_url TEXT,
  storage_path TEXT NOT NULL,
  image_size TEXT,
  
  model TEXT,
  generation_params JSONB,
  
  generation_time_ms INT,
  cost_usd DECIMAL(8,4),
  
  is_public BOOLEAN DEFAULT FALSE,
  public_share_token TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- ✅ AGENT FUNCTIONS
CREATE TABLE ai_agent_functions (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  
  name TEXT NOT NULL,
  description TEXT,
  
  parameters JSONB NOT NULL,
  output_schema JSONB,
  
  function_type TEXT NOT NULL,
  
  endpoint TEXT,
  method TEXT,
  authentication JSONB,
  
  rpc_function_name TEXT,
  
  requires_approval BOOLEAN DEFAULT FALSE,
  rate_limit_per_day INT,
  allowed_roles TEXT[],
  
  timeout_seconds INT DEFAULT 30,
  retry_attempts INT DEFAULT 3,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ✅ FUNCTION CALL LOGS
CREATE TABLE ai_function_call_logs (
  id UUID PRIMARY KEY,
  function_id UUID NOT NULL REFERENCES ai_agent_functions(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'pending',
  
  input JSONB,
  output JSONB,
  error TEXT,
  
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_ms INT,
  
  requested_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ✅ CONVERSATION MEMORY
CREATE TABLE ai_conversation_memory (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  agent_id UUID NOT NULL REFERENCES ai_agents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  conversation_id TEXT NOT NULL,
  execution_sequence INT NOT NULL,
  
  execution_id UUID REFERENCES ai_agent_executions(id) ON DELETE SET NULL,
  
  user_message TEXT,
  agent_response TEXT,
  
  tokens_used INT,
  cost_usd DECIMAL(8,4),
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- System Configuration
CREATE TABLE ai_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled_providers TEXT[] NOT NULL,
  provider_configs JSONB NOT NULL,
  
  rag_config JSONB,
  storage_config JSONB,
  retention_policies JSONB,
  
  default_provider TEXT,
  default_model TEXT,
  
  global_rate_limit INT DEFAULT 1000,
  max_daily_cost_usd DECIMAL(10,2),
  
  enable_audit_logging BOOLEAN DEFAULT TRUE,
  require_approval_for_datasources BOOLEAN DEFAULT FALSE,
  require_approval_for_functions BOOLEAN DEFAULT FALSE,
  require_approval_for_file_uploads BOOLEAN DEFAULT FALSE,
  
  enable_custom_models BOOLEAN DEFAULT TRUE,
  enable_user_agents BOOLEAN DEFAULT TRUE,
  enable_function_calling BOOLEAN DEFAULT TRUE,
  enable_image_generation BOOLEAN DEFAULT TRUE,
  enable_conversation_memory BOOLEAN DEFAULT FALSE,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cost Tracking
CREATE TABLE ai_monthly_costs (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  agent_id UUID REFERENCES ai_agents(id),
  month TEXT NOT NULL,
  
  llm_cost_usd DECIMAL(10,2),
  image_generation_cost_usd DECIMAL(10,2),
  function_calls_cost_usd DECIMAL(10,2),
  storage_cost_usd DECIMAL(10,2),
  total_cost_usd DECIMAL(10,2),
  
  total_tokens INT,
  total_executions INT,
  total_storage_gb DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, agent_id, month)
);

-- RLS Policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_memory ENABLE ROW LEVEL SECURITY;

-- Workspace members can manage agents
CREATE POLICY "Manage own agents"
  ON ai_agents
  FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_ai_agents_workspace ON ai_agents(workspace_id);
CREATE INDEX idx_ai_executions_agent ON ai_agent_executions(agent_id, created_at DESC);
CREATE INDEX idx_ai_executions_user ON ai_agent_executions(user_id, created_at DESC);
CREATE INDEX idx_ai_file_uploads_workspace ON ai_user_file_uploads(workspace_id, created_at DESC);
CREATE INDEX idx_ai_artifacts_execution ON ai_artifacts(execution_id);
CREATE INDEX idx_ai_images_execution ON ai_generated_images(execution_id);
CREATE INDEX idx_ai_memory_conversation ON ai_conversation_memory(conversation_id, execution_sequence);
CREATE INDEX idx_ai_function_calls_execution ON ai_function_call_logs(execution_id);
```

### File Structure (Replicável)

```
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
│   │   ├── llm-config.tsx               # NEW
│   │   ├── capabilities-matrix.tsx      # NEW
│   │   ├── prompt-editor.tsx
│   │   ├── datasource-selector.tsx
│   │   ├── knowledge-base-upload.tsx
│   │   ├── functions-manager.tsx        # NEW
│   │   ├── image-gen-config.tsx         # NEW
│   │   ├── schema-editor.tsx            # NEW
│   │   └── output-schema-editor.tsx
│   │
│   ├── analytics/
│   │   ├── usage-dashboard.tsx
│   │   ├── cost-chart.tsx
│   │   ├── capability-breakdown.tsx     # NEW
│   │   ├── image-generation-stats.tsx   # NEW
│   │   ├── error-analysis.tsx
│   │   └── budget-tracker.tsx
│   │
│   ├── testing/
│   │   ├── agent-tester.tsx
│   │   ├── input-form.tsx
│   │   ├── file-upload.tsx              # NEW
│   │   ├── output-viewer.tsx            # NEW
│   │   ├── artifacts-preview.tsx        # NEW
│   │   └── images-gallery.tsx           # NEW
│   │
│   └── settings/
│       ├── provider-config.tsx
│       ├── google-imagen-config.tsx     # NEW
│       ├── system-settings.tsx
│       └── safety-controls.tsx

lib/ai/
├── providers/
│   ├── base.ts
│   ├── openai.ts
│   ├── google.ts
│   └── anthropic.ts
│
├── datasources/
│   ├── supabase.ts
│   ├── api.ts
│   ├── google-drive.ts         # NEW
│   └── google-sheets.ts        # NEW
│
├── knowledge-base/
│   ├── indexer.ts
│   ├── parser.ts
│   ├── retriever.ts
│   └── google-search.ts        # NEW
│
├── image-generation/           # NEW
│   ├── google-imagen.ts
│   ├── dall-e.ts
│   └── image-manager.ts
│
├── executor.ts
├── config.ts
├── types.ts
└── hooks.ts

app/actions/ai/
├── agents.ts
├── datasources.ts
├── knowledge-bases.ts
├── executions.ts
├── image-generation.ts         # NEW
├── function-calls.ts           # NEW
├── artifacts.ts                # NEW
├── analytics.ts
└── settings.ts

public/docs/
├── agent-builder-guide.md
├── datasource-examples.md
├── google-imagen-guide.md      # NEW
├── prompt-templates.md
└── function-calling-guide.md   # NEW
```

---

## 🔐 Security & Compliance

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
- ✅ Function approval workflows

### Compliance
- ✅ Audit logs (who, what, when, why)
- ✅ Data retention policies
- ✅ GDPR-compliant data deletion
- ✅ Cost transparency and alerts
- ✅ Virus scanning for uploaded files
- ✅ Storage quotas

---

## 📈 Roadmap

### Phase 1: MVP - Core Agent Builder (Semanas 1-3)
- [ ] Agent CRUD interface with per-agent LLM config
- [ ] Prompt editor with variables
- [ ] Supabase datasource connector
- [ ] OpenAI integration (basic)
- [ ] Test/execute functionality with basic output
- [ ] Execution logs

### Phase 2: Knowledge Base & RAG (Semanas 4-5)
- [ ] File upload (PDF, CSV, JSON)
- [ ] Vector indexing (Supabase pgvector)
- [ ] RAG integration into agents
- [ ] Google Search integration for RAG
- [ ] Document management UI

### Phase 3: File Processing & Streaming (Semanas 6-7)
- [ ] User file upload during execution
- [ ] Multi-format support (PDF, Images, Audio, Video)
- [ ] Virus scanning integration
- [ ] Streaming responses UI
- [ ] Conversation memory (session)

### Phase 4: Artifacts & Image Generation (Semanas 8-9)
- [ ] Artifacts generation (PDF, CSV, Code, HTML)
- [ ] Artifacts storage and versioning
- [ ] **Image generation (Google Imagen PRIMARY, DALL-E 3 fallback)**
- [ ] Generated images storage and gallery
- [ ] Sharing/export functionality

### Phase 5: Function Calling & Vision (Semanas 10-11)
- [ ] Function calling framework
- [ ] Webhook integration
- [ ] Approval workflow for functions
- [ ] Vision capabilities (GPT-4V, Claude Vision)
- [ ] Function call logging

### Phase 6: Analytics & Observability (Semanas 12-13)
- [ ] Execution metrics dashboard (expanded)
- [ ] Cost tracking by capability
- [ ] File storage analytics
- [ ] Function call analytics
- [ ] **Image generation analytics**

### Phase 7: Enterprise Features (Semanas 14+)
- [ ] Multi-provider support (Google, Anthropic)
- [ ] Per-workspace storage quotas
- [ ] Retention policies automation
- [ ] Scheduled executions (cron)
- [ ] Workspace billing integration
- [ ] Advanced audit logging UI
- [ ] A/B testing framework
- [ ] Persistent conversation memory (stateful)

---

## 🚀 Making It Replicável

### Package Strategy

```typescript
// For reuse across SaaS apps, publish as packages:

// @saas/ai-core
// - Provider interfaces
// - Datasource abstraction
// - Execution engine
// - Cost calculation

// @saas/ai-admin
// - Pre-built admin UI components
// - Dashboard layouts
// - Configuration pages

// @saas/ai-hooks
// - useAgent()
// - useAgentExecution()
// - useAIMetrics()
// - useImageGeneration()

// @saas/ai-providers
// - OpenAI provider
// - Google provider
// - Anthropic provider
// - Image generation providers
```

### Integration Checklist for New SaaS

```markdown
1. ✅ Install @saas/ai-core, @saas/ai-admin, @saas/ai-providers
2. ✅ Create database tables (migrations/)
3. ✅ Add to env vars: AI provider keys, Google Imagen credentials
4. ✅ Mount admin routes at /admin/ai
5. ✅ Configure permissions.ts
6. ✅ Add to admin sidebar navigation
7. ✅ Configure Supabase Storage bucket for files/artifacts
8. ✅ Set up virus scanning (ClamAV or similar)
9. ✅ Configure retention policies
10. ✅ Done! 🎉
```

---

## 💰 Google Imagen Specific Details

### Why Google Imagen (Nanobanana)?

| Métrica | Google Imagen | DALL-E 3 | Claude Vision |
|---------|---------------|----------|---------------|
| **Cost per image** | $0.001 | $0.08 | N/A (vision only) |
| **Speed** | ~20-30s | ~30-60s | N/A |
| **Quality** | Excellent | Excellent | N/A |
| **Cost for 1000 images** | $1.00 | $80.00 | N/A |
| **Portuguese support** | Excellent | Good | Good |
| **API availability** | Stable | Stable | Limited |

### Configuration for Google Imagen

```typescript
// In AISystemConfig
provider_configs: {
  google: {
    api_key_encrypted: "your-google-cloud-key",
    enable_imagen: true, // Google Imagen
    imagen_config: {
      default_size: "1024x1024",
      default_quality: "standard",
      safety_filter: "strict",
      batch_processing: true
    }
  }
}
```

### Pricing Model

- **Google Imagen**: Pay-per-use, ~$0.001 per image
- **DALL-E 3**: Pay-per-use, $0.08 per image
- **Anthropic**: Claude Vision - $0.015 per image (vision requests only)

**Recommendation**: Use Google Imagen as default, DALL-E as premium fallback for special cases.

---

## 📊 Success Metrics

| Métrica | Target |
|---------|--------|
| Agent creation time | < 5 min |
| Execution latency | < 2s (p95) for text, < 5s for streaming |
| File upload processing | < 30s for documents, < 1m for images |
| Image generation time (Google Imagen) | < 1m average |
| System uptime | 99.9% |
| User adoption | 80% of admins use within 30 days |
| File processing success rate | > 95% |
| Virus scan false positives | < 0.1% |
| Storage utilization efficiency | > 80% |
| Cost savings vs manual | 40% |
| Image generation cost vs DALL-E | 80x cheaper (Google Imagen) |
| Support tickets (AI-related) | < 2% of total |

---

## ✅ Implementation Checklist

### Core
- [ ] Database migrations
- [ ] Agent CRUD API
- [ ] LLM provider integration
- [ ] Per-agent LLM selection UI

### Knowledge Base
- [ ] File upload handling
- [ ] Virus scanning
- [ ] Vector indexing (pgvector)
- [ ] Google Search integration
- [ ] RAG retrieval

### Execution
- [ ] Agent executor
- [ ] Streaming support
- [ ] Error handling
- [ ] Cost calculation

### File Processing
- [ ] Upload storage
- [ ] Multi-format parsing
- [ ] Metadata extraction
- [ ] Retention policies

### Image Generation
- [ ] Google Imagen integration
- [ ] DALL-E integration (fallback)
- [ ] Image storage
- [ ] Gallery UI
- [ ] Cost tracking per image

### Artifacts
- [ ] Generation from execution
- [ ] Storage management
- [ ] Versioning
- [ ] Sharing/download

### Function Calling
- [ ] Webhook execution
- [ ] RPC integration
- [ ] Approval workflow
- [ ] Error handling

### Analytics
- [ ] Execution metrics
- [ ] Cost breakdown by capability
- [ ] Storage tracking
- [ ] Image generation analytics

### Admin UI
- [ ] Agent builder
- [ ] Configuration pages
- [ ] Analytics dashboard
- [ ] Cost reports

---

## 📚 References

- [Google Imagen API](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [OpenAI DALL-E](https://platform.openai.com/docs/guides/images)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Google Custom Search](https://programmablesearchengine.google.com/)
- [Vercel AI SDK](https://sdk.vercel.ai)

---

**Versão Final**: December 5, 2025
**Status**: Ready for Implementation
**Last Updated**: 2025-12-05
