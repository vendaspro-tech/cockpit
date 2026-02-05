/**
 * Implementation Guide: Phase 1 - Supabase pgvector Setup
 * 
 * This document provides step-by-step instructions for setting up and
 * deploying Phase 1 of the AI module with Supabase pgvector RAG.
 * 
 * Timeline: 1 week (5 business days)
 * Status: Ready for implementation
 */

# Phase 1 Implementation Guide: Supabase pgvector RAG Setup

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Steps](#setup-steps)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)

---

## Overview

**Phase 1** establishes the foundation for semantic search in the Cockpit Comercial AI module using Supabase pgvector.

### Deliverables
- ✅ Knowledge base table with pgvector indexing
- ✅ Semantic search via RPC functions
- ✅ API endpoints for indexing, searching, and listing documents
- ✅ Admin UI for knowledge base management
- ✅ TypeScript SDK for RAG operations
- ✅ Vercel AI SDK integration

### Files Created
```
lib/ai/rag/
├── supabase-rag.ts          # Main RAG class with pgvector operations
└── vercel-integration.ts    # Vercel AI SDK integration

app/api/ai/rag/
├── index-document/route.ts  # Index documents
├── search/route.ts          # Semantic search
└── list/route.ts            # List documents

components/admin/ai/
└── knowledge-base-manager.tsx # Admin UI

supabase/migrations/
└── phase1_rag_setup.sql     # Database schema & RPC functions

docs/
└── docs/phase1/phase1_implementation.md # This guide
```

---

## Prerequisites

### Required Environment Variables

Add these to your `.env.local`:

```bash
# Already configured in project
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add new
OPENAI_API_KEY=sk-...          # For embeddings generation
```

### Dependencies (Already Installed)

```json
{
  "@supabase/supabase-js": "^2.86.0",
  "openai": "^6.9.1",
  "ai": "^6.0.0-beta.131",
  "@tanstack/react-query": "^5.90.11"
}
```

### Supabase Extensions

- ✅ `pgvector` - Vector storage and similarity search
- ✅ `uuid-ossp` - For UUID generation (usually pre-installed)

---

## Setup Steps

### Step 1: Enable pgvector Extension (5 min)

1. Go to **Supabase Dashboard → SQL Editor**
2. Create a new query
3. Run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

4. Verify: Query should complete without errors

### Step 2: Apply Migration (5 min)

1. In Supabase SQL Editor, run the full migration:
   ```
   supabase/migrations/phase1_rag_setup.sql
   ```

2. This creates:
   - `ai_knowledge_base` table with pgvector column
   - Indexes for efficient search
   - RLS policies for multi-tenancy
   - RPC functions for search operations

3. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'ai_knowledge_base';
   ```

### Step 3: Copy Files (10 min)

Files are already created in the repository:

```bash
# TypeScript SDK
ls -la lib/ai/rag/

# API Routes
ls -la app/api/ai/rag/

# Components
ls -la components/admin/ai/
```

### Step 4: Test Database Connection (5 min)

Create `scripts/test-rag.ts`:

```typescript
import { createSupabaseRAG } from '../lib/ai/rag/supabase-rag';

async function test() {
  try {
    const rag = createSupabaseRAG();
    console.log('✅ RAG initialized successfully');
    
    // Test empty search
    const results = await rag.search({
      query: 'test',
      workspaceId: 'test-workspace-id',
      limit: 1,
    });
    
    console.log('✅ Search function works');
    console.log('Results:', results);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

Run:
```bash
npx ts-node scripts/test-rag.ts
```

### Step 5: Add Admin Route (10 min)

Create `app/(admin)/admin/ai/knowledge-base/page.tsx`:

```typescript
'use client';

import { KnowledgeBaseManager } from '@/components/admin/ai/knowledge-base-manager';

export default function KnowledgeBasePage() {
  return (
    <div className="p-6">
      <KnowledgeBaseManager />
    </div>
  );
}
```

Add to admin navigation in `components/admin-sidebar.tsx`:

```typescript
{
  title: 'Knowledge Base',
  url: '/admin/ai/knowledge-base',
  icon: 'BookOpen',
}
```

### Step 6: Test with Sample Data (15 min)

Create `scripts/seed-knowledge-base.ts`:

```typescript
import { createSupabaseRAG } from '../lib/ai/rag/supabase-rag';

const SAMPLE_DOCUMENTS = [
  {
    title: 'Método DEF - Guia Completo',
    content: `O Método DEF é uma metodologia comercial que divide o processo de venda em 5 etapas:
1. Whatsapp: Prospecção e contato inicial
2. Descoberta: Qualificação e entendimento de necessidades
3. Encantamento: Demonstração de valor
4. Fechamento: Conclusão do negócio
5. Objeções: Tratamento de objeções

Este método é fundamental para o desenvolvimento de vendedores em nosso programa.`,
    type: 'document' as const,
  },
  {
    title: 'PDI - Plano de Desenvolvimento Individual',
    content: `O PDI é um documento estruturado que define as metas de desenvolvimento de cada vendedor.
Inclui:
- Competências a desenvolver
- Prazos e milestones
- Ações específicas
- Frequência de revisão

Cada vendedor deve ter seu PDI atualizado a cada trimestre.`,
    type: 'pdi' as const,
  },
];

async function seedData() {
  try {
    const rag = createSupabaseRAG();
    
    console.log('Seeding knowledge base...');
    
    const results = await rag.batchIndexDocuments(
      SAMPLE_DOCUMENTS.map(doc => ({
        ...doc,
        workspaceId: 'test-workspace-id', // Replace with real ID
        sourceUrl: 'system',
      }))
    );
    
    console.log(`✅ Indexed ${results.length} documents`);
    results.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
    });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedData();
```

Run:
```bash
npx ts-node scripts/seed-knowledge-base.ts
```

---

## Testing

### Unit Tests

Create `tests/rag.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { createSupabaseRAG } from '../lib/ai/rag/supabase-rag';

describe('Supabase RAG', () => {
  let rag: ReturnType<typeof createSupabaseRAG>;
  let testWorkspaceId = 'test-workspace-' + Date.now();

  beforeAll(() => {
    rag = createSupabaseRAG();
  });

  it('should index a document', async () => {
    const doc = await rag.indexDocument({
      workspaceId: testWorkspaceId,
      title: 'Test Document',
      content: 'This is a test document with some content for indexing.',
      type: 'document',
    });

    expect(doc.id).toBeDefined();
    expect(doc.title).toBe('Test Document');
    expect(doc.metadata.content_length).toBe(60);
  });

  it('should search similar documents', async () => {
    const results = await rag.search({
      query: 'test content',
      workspaceId: testWorkspaceId,
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].similarity).toBeGreaterThan(0.5);
    }
  });

  it('should list documents', async () => {
    const docs = await rag.listDocuments(testWorkspaceId);
    expect(Array.isArray(docs)).toBe(true);
  });

  it('should get statistics', async () => {
    const stats = await rag.getStats(testWorkspaceId);
    expect(stats.totalDocuments).toBeGreaterThan(0);
    expect(stats.documentsByType).toBeDefined();
  });
});
```

Run tests:
```bash
npm test -- tests/rag.test.ts
```

### Integration Tests

Test API endpoints:

```bash
# Index a document
curl -X POST http://localhost:3000/api/ai/rag/index-document \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "content": "This is a test document",
    "type": "document"
  }'

# Search
curl -X POST http://localhost:3000/api/ai/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# List documents
curl http://localhost:3000/api/ai/rag/list?limit=10
```

### UI Testing

1. Navigate to `/admin/ai/knowledge-base`
2. Test Upload Tab:
   - Enter title and content
   - Click "Upload Document"
   - Verify success message
3. Test Documents Tab:
   - Verify documents appear in list
   - Click delete to remove
4. Test Search Tab:
   - Enter search query
   - Verify results appear with similarity scores

---

## Deployment

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase pgvector extension enabled
- [ ] Migration applied to database
- [ ] All files created and in version control
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Admin UI loads without errors

### Deploy to Production

```bash
# 1. Push to main branch
git add .
git commit -m "feat: Phase 1 - Supabase pgvector RAG setup"
git push origin main

# 2. Vercel will auto-deploy (if configured)
# 3. Verify deployment
open https://your-domain.com/admin/ai/knowledge-base

# 4. Test with production data
curl -X POST https://your-domain.com/api/ai/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### Rollback Plan

If issues occur:

```bash
# Revert to previous commit
git revert HEAD

# Drop the knowledge base table (warning!)
supabase db reset

# Or manually via SQL:
DROP TABLE ai_knowledge_base;
```

---

## Monitoring

### Performance Metrics

Monitor in Supabase dashboard:

1. **Query Performance**
   - Check slow query logs
   - Typical latency: 10-50ms for search

2. **Storage**
   - Monitor DB size growth
   - Vector embeddings: ~6KB per document (1536 dims * 4 bytes)
   - Estimate: 100 documents = ~600KB

3. **Connections**
   - Monitor concurrent connections
   - Typical: 1-5 per user session

### Logging

Add application logging:

```typescript
// In supabase-rag.ts
private log(level: 'info' | 'error', message: string, data?: any) {
  console.log(`[RAG ${level.toUpperCase()}] ${message}`, data);
  
  // Optional: Send to logging service (Sentry, LogRocket, etc)
  if (level === 'error') {
    // captureException(new Error(message), data);
  }
}
```

### Alerts to Setup

In Supabase dashboard → Monitoring:

- [ ] Alert if query latency > 1000ms
- [ ] Alert if storage > 80% capacity
- [ ] Alert if connection errors > 10/hour

---

## Next Steps After Phase 1

Once Phase 1 is stable:

1. **Phase 2**: Implement file upload & processing
   - PDF extraction
   - Image OCR
   - Virus scanning

2. **Phase 3**: Add streaming responses
   - Real-time RAG results
   - Streaming UI updates

3. **Phase 4**: Image generation & artifacts
   - Google Imagen integration
   - Artifact generation

---

## Troubleshooting

### "Extension pgvector not found"
```sql
-- Enable it:
CREATE EXTENSION IF NOT EXISTS vector;
```

### "Missing OPENAI_API_KEY"
```bash
# Add to .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local
```

### "Embedding generation failed"
- Check OpenAI API key is valid
- Check quota/billing on OpenAI account
- Verify content isn't too long (>8192 tokens)

### "Search returns no results"
- Verify documents were indexed (check admin UI)
- Lower `similarityThreshold` in search params
- Check similarity scores are > threshold

### "RLS policy errors"
```sql
-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'ai_knowledge_base';

-- Verify user is in workspace_members
SELECT * FROM workspace_members 
WHERE user_id = auth.uid();
```

---

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/database/extensions/pgvector
- **pgvector Docs**: https://github.com/pgvector/pgvector
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **Vercel AI SDK**: https://sdk.vercel.ai

---

**Created:** December 2025  
**Status:** Ready for Implementation  
**Estimated Time:** 1 week (5 business days)
