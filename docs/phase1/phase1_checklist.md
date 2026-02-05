<!-- markdownlint-disable MD025 -->
# 🚀 FASE 1 INICIADA: Setup Supabase pgvector - Checklist de Ação

**Data:** Dezembro 5, 2025  
**Status:** ✅ Pronto para Implementação  
**Tempo Estimado:** 1 semana (5 dias)  
**Complexidade:** Média (setup + testes)

---

## 📦 O que foi Criado

### ✅ Arquivos TypeScript (4 arquivos)

1. **`lib/ai/rag/supabase-rag.ts`** (600 linhas)
   - Classe `SupabaseRAG` com todos os métodos de operação
   - Indexação de documentos com embeddings OpenAI
   - Busca semântica + busca híbrida
   - Métodos: `indexDocument`, `search`, `hybridSearch`, `batchIndexDocuments`, `listDocuments`, `getStats`, `deleteDocument`, `exportDocuments`
   - Totalmente tipada com TypeScript

2. **`lib/ai/rag/vercel-integration.ts`** (300 linhas)
   - Integração com Vercel AI SDK
   - `generateWithRAG()` - gera texto com contexto RAG
   - `generateObjectWithRAG()` - gera objetos estruturados com schema
   - Formatting utilities para UI
   - Streaming ready

3. **API Routes (3 arquivos)**
   - `app/api/ai/rag/index-document/route.ts` - POST para indexar
   - `app/api/ai/rag/search/route.ts` - POST para buscar
   - `app/api/ai/rag/list/route.ts` - GET para listar com paginação

### ✅ Componente React

4. **`components/admin/ai/knowledge-base-manager.tsx`** (400 linhas)
   - Admin UI completa
   - 3 tabs: Documents, Search, Upload
   - Upload de documentos com validação
   - Busca em tempo real com resultados
   - Estatísticas
   - Deletar documentos
   - Integração com @tanstack/react-query

### ✅ Database Migration (1 arquivo)

5. **`supabase/migrations/phase1_rag_setup.sql`** (300+ linhas)
   - Criação de tabela `ai_knowledge_base` com pgvector
   - Indexes otimizados para busca semântica
   - RLS policies para multi-tenancy
   - 3 RPC functions:
     - `search_ai_knowledge_base()` - busca vetorial
     - `get_ai_knowledge_base_stats()` - estatísticas
     - `hybrid_search_ai_knowledge_base()` - busca híbrida
   - Triggers para atualizar `updated_at`

### ✅ Documentação

6. **`docs/phase1/phase1_implementation.md`** (800 linhas)
   - Guia passo-a-passo completo
   - Prerequisites e setup
   - Testing (unit + integration)
   - Deployment
   - Monitoring
   - Troubleshooting

---

## ✅ Checklist de Implementação (Prioridade)

### 🔴 HOJE - Setup Infraestrutura (2 horas)

- [ ] **1. Habilitar pgvector no Supabase**
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
  - Ir para Supabase Dashboard → SQL Editor
  - Executar comando acima
  - ✅ Verificar se rodou sem erro

- [ ] **2. Aplicar Migration ao Banco**
  - Copiar todo conteúdo de `supabase/migrations/phase1_rag_setup.sql`
  - Colar em Supabase SQL Editor
  - ✅ Executar e verificar tabela criada

- [ ] **3. Verificar Environment Variables**
  ```bash
  # Verificar .env.local
  cat .env.local | grep OPENAI
  cat .env.local | grep SUPABASE
  ```
  - Se faltar `OPENAI_API_KEY`, adicionar:
  ```bash
  echo "OPENAI_API_KEY=sk-..." >> .env.local
  ```

### 🟠 AMANHÃ - Testes (3 horas)

- [ ] **4. Test: Database Connection**
  ```bash
  # Executar teste
  npx ts-node scripts/test-rag.ts
  ```
  - Deve mostrar: `✅ RAG initialized successfully`
  - Deve mostrar: `✅ Search function works`

- [ ] **5. Test: Seed Sample Data**
  ```bash
  # Executar script de seed
  npx ts-node scripts/seed-knowledge-base.ts
  ```
  - Deve indexar 2 documentos
  - Deve mostrar IDs dos documentos criados

- [ ] **6. Test: API Endpoints**
  ```bash
  # Testar indexação
  curl -X POST http://localhost:3000/api/ai/rag/index-document \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Test Doc",
      "content": "This is a test document with content",
      "type": "document"
    }'
  
  # Testar busca
  curl -X POST http://localhost:3000/api/ai/rag/search \
    -H "Content-Type: application/json" \
    -d '{"query": "test document"}'
  ```
  - Deve retornar 200 com dados corretos

### 🟡 DIAS 3-4 - Admin UI (3 horas)

- [ ] **7. Adicionar Rota Admin**
  - Criar `app/(admin)/admin/ai/knowledge-base/page.tsx`
  - Importar `<KnowledgeBaseManager />`
  - Adicionar ao sidebar em `components/admin-sidebar.tsx`

- [ ] **8. Testar Admin UI**
  ```bash
  npm run dev
  # Abrir http://localhost:3000/admin/ai/knowledge-base
  ```
  - [ ] Tab "Documents" carrega lista
  - [ ] Tab "Upload" permite enviar documento
  - [ ] Tab "Search" busca e mostra resultados
  - [ ] Clicker delete remove documento

- [ ] **9. Unit Tests**
  ```bash
  npm test -- tests/rag.test.ts
  ```
  - Deve passar 4 testes:
    - ✅ should index a document
    - ✅ should search similar documents
    - ✅ should list documents
    - ✅ should get statistics

### 🟢 DIA 5 - Deployment & Docs (2 horas)

- [ ] **10. Pre-deployment Review**
  - [ ] Todos os arquivos no repo
  - [ ] Sem erros TypeScript: `npx tsc --noEmit`
  - [ ] Sem erros Lint: `npm run lint`
  - [ ] Environment vars setados
  - [ ] DB migration aplicada

- [ ] **11. Deploy para Staging**
  ```bash
  git add .
  git commit -m "feat: Phase 1 - Supabase pgvector RAG setup"
  git push origin main
  ```
  - Vercel deve auto-deploy
  - ✅ Verificar em staging URL

- [ ] **12. Final Validation**
  - [ ] Testar em staging
  - [ ] Admin UI acessível
  - [ ] Busca funcionando
  - [ ] Sem erros de console

---

## 🎯 O que Cada Arquivo Faz

### `lib/ai/rag/supabase-rag.ts` - Core RAG Engine
```typescript
// Uso típico:
const rag = createSupabaseRAG();

// Indexar documento
await rag.indexDocument({
  workspaceId: 'ws_123',
  title: 'Transcrição de Vendedor',
  content: 'conversa com cliente...',
  type: 'transcript',
});

// Buscar similares
const results = await rag.search({
  query: 'qual foi o feedback do cliente?',
  workspaceId: 'ws_123',
  limit: 5,
});

// Busca híbrida (semântica + keyword)
const hybrid = await rag.hybridSearch({...});
```

### `lib/ai/rag/vercel-integration.ts` - LLM Integration
```typescript
// Uso típico com agent:
const result = await generateWithRAG({
  userMessage: 'Resuma a conversa com o cliente',
  workspaceId: 'ws_123',
  systemPrompt: 'Você é um analista comercial...',
}, rag);

// Resposta com contexto RAG:
console.log(result.text); // Texto gerado
console.log(result.ragContext); // Documentos usados
```

### `app/api/ai/rag/*` - REST APIs
```
POST /api/ai/rag/index-document     # Indexar
POST /api/ai/rag/search             # Buscar
GET  /api/ai/rag/list               # Listar
```

### `components/admin/ai/knowledge-base-manager.tsx` - UI
```
Admin Dashboard → Knowledge Base Manager
├── Documents Tab (lista com delete)
├── Search Tab (busca em tempo real)
└── Upload Tab (enviar docs)
```

### `supabase/migrations/phase1_rag_setup.sql` - Database
```
Cria:
- Tabela ai_knowledge_base (pgvector)
- Indexes para performance
- RLS policies para segurança
- RPC functions para busca
```

---

## 📊 Estimativas de Performance

### Latência Esperada
```
Busca com 1K documentos:    10-15ms
Busca com 10K documentos:   25-50ms
Busca com 100K documentos:  100-200ms
```

### Custo Esperado (MVP)
```
Supabase DB:           $35/mês
OpenAI Embeddings:     $1-2/mês (1000 docs)
Total MVP:            ~$37/mês
```

### Storage
```
Por documento: ~7KB (embedding 1536 dims)
1000 documentos: ~7MB
10000 documentos: ~70MB
```

---

## 🚨 Possíveis Problemas & Soluções

### ❌ "pgvector extension not found"
```bash
# Solução
# No Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS vector;
```

### ❌ "OPENAI_API_KEY not defined"
```bash
# Solução
echo "OPENAI_API_KEY=sk-..." >> .env.local
npm run dev  # Reiniciar servidor
```

### ❌ "RLS policy blocks insert"
```bash
# Verificar
# Usuário deve estar em workspace_members com role admin/owner
SELECT * FROM workspace_members 
WHERE workspace_id = 'ws_123' 
AND user_id = auth.uid();
```

### ❌ "Search returns no results"
```typescript
// Verificar similaridade
// Tentar com threshold mais baixo:
await rag.search({
  query: 'test',
  similarityThreshold: 0.5,  // Era 0.7
  limit: 10,
});
```

---

## 📚 Referências Rápidas

### Documentação Oficial
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Vercel AI SDK](https://sdk.vercel.ai)

### Comandos Úteis
```bash
# Dev
npm run dev

# Build
npm run build

# Lint
npm run lint

# Tests
npm test

# Database push (se using Supabase CLI)
supabase db push
```

---

## ✅ Success Criteria (Para Considerar Completo)

- [x] ✅ Código criado e no repositório
- [ ] ✅ pgvector extension habilitado
- [ ] ✅ Migration aplicada ao banco
- [ ] ✅ Testes unitários passando
- [ ] ✅ Testes de API funcionando
- [ ] ✅ Admin UI acessível e funcional
- [ ] ✅ Documentação completa
- [ ] ✅ Deployado em staging
- [ ] ✅ Zero erros de console
- [ ] ✅ Performance aceitável (<100ms latência)

---

## 🎯 Próxima Fase

Após Phase 1 completo:

→ **Phase 2: File Upload & Processing** (semana 2-3)
  - PDF extraction
  - Image OCR
  - Virus scanning
  - Batch indexing

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar `docs/phase1/phase1_implementation.md` na seção Troubleshooting
2. Consultar logs: `supabase logs` ou dashboard
3. Testar query diretamente no Supabase SQL Editor
4. Verificar que dados estão sendo indexados

---

**Próximo passo:** Clique na checkbox 1️⃣ acima para começar! 🚀

Tempo total estimado: **10-15 horas de trabalho**  
Complexidade: **Média - tudo está pronto, é executar**  
Suporte: **Código está comentado e tipado, deve rodar sem surpresas**
