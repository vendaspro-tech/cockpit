# 📋 ATUALIZAÇÕES PRD - AI Module Expandido

## ✅ RESUMO DAS MUDANÇAS

Foram adicionadas as seguintes features ao docs/prd/prd_ai_module.md:

### **PRINCIPAIS ADIÇÕES:**

1. ✅ **Per-Agent LLM Configuration** - Cada agente escolhe seu próprio provider/modelo
2. ✅ **Google Imagen (Nanobanana)** - Foco em image generation cost-effective
3. ✅ **File Upload & Processing** - Usuários fazem upload de transcrições, imagens, docs
4. ✅ **Artifacts Generation** - Agentes geram PDFs, CSVs, código, HTML
5. ✅ **Function Calling** - Webhooks, Supabase RPCs, approval workflows
6. ✅ **Streaming Responses** - Respostas em tempo real para UX melhor
7. ✅ **RAG Multi-Source** - Combina Supabase pgvector + Google Search
8. ✅ **Conversation Memory** - Stateless, session-based ou persistent
9. ✅ **Vision Capabilities** - Análise de imagens com GPT-4V, Claude Vision
10. ✅ **Storage Management** - Quotas, retention policies, virus scanning

---

## 📝 SEÇÕES EXPANDIDAS

### 🎯 Core Features - Interface Agent Expandida

```typescript
interface Agent {
  // ... campos anteriores ...
  
  // ✅ PER-AGENT LLM CONFIGURATION (NEW)
  llm_config: {
    provider: 'openai' | 'google' | 'anthropic';
    model: string;
    temperature: number;
    top_p?: number;
    max_tokens: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  };
  
  // ✅ CAPABILITIES (NEW)
  capabilities: {
    rag: boolean;
    file_processing: boolean;
    image_generation: boolean; // Google Imagen default
    vision: boolean;
    function_calling: boolean;
    artifacts_generation: boolean;
    streaming: boolean;
    long_context: boolean;
    memory: 'stateless' | 'session' | 'persistent';
  };
  
  // ✅ FUNCTION CALLING (NEW)
  functions?: Array<{
    id: string;
    name: string;
    description: string;
    parameters: JsonSchema;
    endpoint?: string;
    requires_approval?: boolean;
  }>;
  
  // ✅ KNOWLEDGE BASE COM MULTI-SOURCE RAG
  knowledge_base: {
    id?: string;
    rag_provider: 'supabase_pgvector' | 'google_search' | 'pinecone';
    retrieval_config?: {
      top_k: number;
      similarity_threshold: number;
      rerank: boolean;
    };
  };
}
```

---

### 📤 AgentExecution - Com Artifacts, Images, Files

```typescript
interface AgentExecution {
  // ... campos anteriores ...
  
  // ✅ CONVERSATION MEMORY (NEW)
  conversation_id?: string;
  parent_execution_id?: string;
  
  // ✅ INPUT WITH FILES (NEW)
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
  
  // ✅ OUTPUT WITH ARTIFACTS & IMAGES (NEW)
  output: {
    text: string;
    structured_data?: Record<string, any>;
    artifacts?: Array<{
      id: string;
      type: 'pdf' | 'csv' | 'code' | 'html' | 'markdown' | 'json';
      title: string;
      storage_path: string;
      size_bytes: number;
    }>;
    images?: Array<{
      id: string;
      prompt: string;
      url: string;
      model: string; // 'google_imagen', 'dall-e-3'
    }>;
    function_calls?: Array<{
      function_id: string;
      function_name: string;
      parameters: Record<string, any>;
      result: any;
      executed_at: string;
    }>;
  };
  
  // ✅ STREAMING & STORAGE (NEW)
  streaming_enabled: boolean;
  stream_url?: string;
  storage_used_bytes: number;
}
```

---

### 🖼️ Image Generation Config - Focado em Google Imagen

```typescript
interface ImageGenerationConfig {
  agent_id: string;
  
  // Providers suportados
  providers: Array<{
    provider: 'google_imagen' | 'openai_dalle' | 'anthropic';
    enabled: boolean;
    api_key_encrypted?: string;
  }>;
  
  // Padrões - Google Imagen como default
  default_provider: string; // 'google_imagen' recomendado
  default_size: '256x256' | '512x512' | '1024x1024';
  default_quality: 'standard' | 'hd';
  
  // Limites
  max_images_per_execution: number;
  max_images_per_day_per_user: number;
  cost_limit_per_image?: number;
}

interface GeneratedImage {
  id: string;
  execution_id: string;
  prompt: string;
  storage_url: string;
  model: string; // 'google_imagen', 'dall-e-3'
  generation_time_ms: number;
  cost_usd: number;
  created_at: string;
}
```

---

### 📁 Novas Tabelas Supabase

```sql
-- USER FILE UPLOADS
CREATE TABLE ai_user_file_uploads (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  agent_id UUID,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  storage_path TEXT NOT NULL,
  processing_status TEXT DEFAULT 'pending',
  virus_scanned BOOLEAN DEFAULT FALSE,
  is_safe BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ARTIFACTS
CREATE TABLE ai_artifacts (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  filename TEXT NOT NULL,
  artifact_type TEXT,
  storage_path TEXT NOT NULL,
  file_size INT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- GENERATED IMAGES
CREATE TABLE ai_generated_images (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  storage_url TEXT,
  model TEXT,
  cost_usd DECIMAL(8,4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AGENT FUNCTIONS
CREATE TABLE ai_agent_functions (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL,
  name TEXT NOT NULL,
  function_type TEXT,
  endpoint TEXT,
  requires_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONVERSATION MEMORY
CREATE TABLE ai_conversation_memory (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  conversation_id TEXT NOT NULL,
  execution_sequence INT,
  user_message TEXT,
  agent_response TEXT,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🎨 UI Updates - Novos Tabs

Adicione ao Agent Builder:

- **LLM Configuration Tab** - Per-agent model selection
- **Capabilities Matrix Tab** - Toggle para cada capability (RAG, Vision, Image Gen, etc)
- **Functions Tab** - Gerenciar webhooks e function calls
- **Image Generation Tab** - Config Google Imagen específico do agente
- **Input/Output Schema Tab** - Validação de inputs e outputs
- **File Upload Panel** - Em Testing, permitir upload de files
- **Artifacts Preview** - Visualizar/download artifacts gerados
- **Generated Images Gallery** - Galeria de imagens geradas

---

### 💰 Cost Tracking - Expandido

```typescript
interface WorkspaceAIBudget {
  workspace_id: string;
  month: string;
  
  usage_breakdown: {
    llm_cost_usd: number;
    image_generation_cost_usd: number; // Google Imagen pricing
    function_calls_cost_usd: number;
    storage_cost_usd: number;
    total_cost_usd: number;
  };
  
  total_storage_gb: number;
  storage_quota_gb: number;
}
```

---

### 📊 Admin Config - Expandido

```typescript
interface AISystemConfig {
  // Google Imagen specific
  google?: {
    api_key_encrypted: string;
    enable_imagen: boolean; // Google Imagen (Nanobanana)
    enable_google_search: boolean;
    google_cse_id?: string;
  };
  
  // RAG Config
  rag_config: {
    default_provider: 'supabase_pgvector' | 'google_search' | 'pinecone';
    default_embedding_model: string;
  };
  
  // Storage Config
  storage_config: {
    max_file_size_mb: number;
    max_total_storage_gb: number;
    allowed_file_types: string[];
    enable_virus_scanning: boolean;
  };
  
  // Retention Policies
  retention_policies: {
    artifact_retention_days: number;
    execution_log_retention_days: number;
    file_upload_retention_days: number;
    conversation_memory_retention_days: number;
  };
}
```

---

## 🛣️ Roadmap Atualizado

### Phase 1: MVP (Semanas 1-3)
- Agent CRUD com per-agent LLM
- Prompt editor
- OpenAI integration
- Execution logs

### Phase 2: Knowledge Base & RAG (Semanas 4-5)
- ✅ Supabase pgvector
- ✅ Google Search integration
- Document management

### Phase 3: File Processing & Streaming (Semanas 6-7)
- User file uploads
- Virus scanning
- Streaming responses
- Session memory

### Phase 4: Artifacts & Image Gen (Semanas 8-9)
- ✅ Artifacts (PDF, CSV, Code)
- ✅ **Google Imagen (PRIMARY)**
- DALL-E 3 (fallback)
- Image gallery & sharing

### Phase 5: Function Calling & Vision (Semanas 10-11)
- Webhook integration
- Approval workflows
- Vision capabilities (GPT-4V, Claude)

### Phase 6: Analytics (Semanas 12-13)
- Expanded metrics
- Cost breakdown by capability
- Storage analytics

### Phase 7: Enterprise (Semanas 14+)
- Multi-provider fallbacks
- Storage quotas
- Scheduled executions
- Persistent memory

---

## 🎯 Google Imagen Specific Features

### Nanobanana (Google Imagen)

**Vantagens:**
- ✅ Cost-effective (melhor preço que DALL-E 3)
- ✅ Alta qualidade
- ✅ Rápido (< 30s généralmente)
- ✅ Integração com Google Cloud
- ✅ Bom para português

**Configuração Admin:**
```typescript
provider_configs.google = {
  api_key_encrypted: "your-key",
  enable_imagen: true, // Google Imagen
  imagen_config: {
    default_size: "1024x1024",
    default_quality: "standard",
    safety_filter: "strict"
  }
}
```

**Pricing Reference:**
- Google Imagen: ~$0.001 per image
- DALL-E 3: $0.08 per image (80x mais caro)

---

## ✅ Checklist de Implementação

- [ ] Adicionar llm_config na Agent interface
- [ ] Criar capabilities matrix UI
- [ ] Implementar per-agent provider selection
- [ ] Integrar Google Imagen como default
- [ ] Criar UserFileUpload table
- [ ] Implementar virus scanning
- [ ] Criar Artifacts table e storage
- [ ] Adicionar Function Calling framework
- [ ] Implementar conversation memory
- [ ] Expandir cost tracking
- [ ] Adicionar RAG multi-source config
- [ ] Criar admin config UI expandida
- [ ] Adicionar streaming support
- [ ] Implementar retention policies
- [ ] Criar analytics dashboard expandido

---

## 📚 Referencias

- [Google Imagen API Docs](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [OpenAI DALL-E Docs](https://platform.openai.com/docs/guides/images)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Google Custom Search](https://programmablesearchengine.google.com/)

---

**Próximos passos:**
1. Revisar este documento
2. Aplicar mudanças ao docs/prd/prd_ai_module.md
3. Começar implementação da Phase 1
4. Consultar este arquivo como referência técnica
