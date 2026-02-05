-- Phase 1: Supabase pgvector Setup for RAG
-- 
-- This migration sets up the knowledge base table and indexes for semantic search
-- using the pgvector extension.
--
-- Created: December 2025
-- Phase: 1 - MVP

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ai_knowledge_base table
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('transcript', 'pdi', 'assessment', 'document', 'image_extracted')),
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure embedding is set
  CONSTRAINT embedding_not_null CHECK (embedding IS NOT NULL)
);

-- Add foreign key constraint to ai_agents after table is created
-- This will be added once ai_agents table exists in Phase 2
-- ALTER TABLE ai_knowledge_base 
-- ADD CONSTRAINT fk_agent_id FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL;

-- Create indexes for efficient queries
-- Vector index for semantic search
CREATE INDEX IF NOT EXISTS ai_knowledge_base_embedding_idx 
  ON ai_knowledge_base 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- B-tree indexes for filtering
CREATE INDEX IF NOT EXISTS ai_knowledge_base_workspace_id_idx 
  ON ai_knowledge_base(workspace_id);

CREATE INDEX IF NOT EXISTS ai_knowledge_base_agent_id_idx 
  ON ai_knowledge_base(agent_id);

CREATE INDEX IF NOT EXISTS ai_knowledge_base_type_idx 
  ON ai_knowledge_base(type);

CREATE INDEX IF NOT EXISTS ai_knowledge_base_created_at_idx 
  ON ai_knowledge_base(created_at DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS ai_knowledge_base_workspace_type_idx 
  ON ai_knowledge_base(workspace_id, type);

-- Enable Row Level Security
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see knowledge base documents from their workspace
CREATE POLICY ai_knowledge_base_workspace_isolation
  ON ai_knowledge_base
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ai_knowledge_base.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Only workspace admins and agents can insert
CREATE POLICY ai_knowledge_base_insert
  ON ai_knowledge_base
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ai_knowledge_base.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: Only owners can delete
CREATE POLICY ai_knowledge_base_delete
  ON ai_knowledge_base
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ai_knowledge_base.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner')
    )
  );

-- Create RPC function for efficient vector search
CREATE OR REPLACE FUNCTION search_ai_knowledge_base(
  query_embedding vector,
  workspace_id UUID,
  agent_id UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  doc_type VARCHAR DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  type VARCHAR,
  similarity FLOAT,
  metadata JSONB,
  source_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.type,
    (1 - (kb.embedding <=> query_embedding))::FLOAT AS similarity,
    kb.metadata,
    kb.source_url
  FROM ai_knowledge_base kb
  WHERE kb.workspace_id = $2
    AND (agent_id IS NULL OR kb.agent_id = agent_id)
    AND (doc_type IS NULL OR kb.type = doc_type)
    AND (1 - (kb.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS ai_knowledge_base_updated_at_trigger ON ai_knowledge_base;
CREATE TRIGGER ai_knowledge_base_updated_at_trigger
  BEFORE UPDATE ON ai_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_knowledge_base_updated_at();

-- Create function to get knowledge base statistics
CREATE OR REPLACE FUNCTION get_ai_knowledge_base_stats(workspace_id UUID)
RETURNS TABLE(
  total_documents BIGINT,
  documents_by_type JSONB,
  total_content_length BIGINT,
  oldest_document TIMESTAMP WITH TIME ZONE,
  newest_document TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    jsonb_object_agg(type, type_count) FILTER (WHERE type IS NOT NULL),
    SUM(COALESCE((metadata->>'content_length')::BIGINT, 0))::BIGINT,
    MIN(created_at),
    MAX(created_at)
  FROM (
    SELECT 
      type,
      COUNT(*)::BIGINT as type_count
    FROM ai_knowledge_base
    WHERE ai_knowledge_base.workspace_id = $1
    GROUP BY type
  ) AS type_counts
  CROSS JOIN (
    SELECT 
      SUM(COALESCE((metadata->>'content_length')::BIGINT, 0))::BIGINT,
      MIN(created_at),
      MAX(created_at)
    FROM ai_knowledge_base
    WHERE ai_knowledge_base.workspace_id = $1
  ) AS stats;
END;
$$;

-- Create function for full-text + vector hybrid search
CREATE OR REPLACE FUNCTION hybrid_search_ai_knowledge_base(
  query_text TEXT,
  query_embedding vector,
  workspace_id UUID,
  agent_id UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.6,
  match_count INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  type VARCHAR,
  similarity FLOAT,
  search_type VARCHAR,
  metadata JSONB,
  source_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      kb.id,
      kb.title,
      kb.content,
      kb.type,
      (1 - (kb.embedding <=> query_embedding))::FLOAT AS similarity,
      'vector' AS search_type,
      kb.metadata,
      kb.source_url,
      ROW_NUMBER() OVER (ORDER BY (1 - (kb.embedding <=> query_embedding)) DESC) as vec_rank
    FROM ai_knowledge_base kb
    WHERE kb.workspace_id = $3
      AND (agent_id IS NULL OR kb.agent_id = agent_id)
      AND (1 - (kb.embedding <=> query_embedding)) > similarity_threshold
  ),
  keyword_results AS (
    SELECT
      kb.id,
      kb.title,
      kb.content,
      kb.type,
      0.5::FLOAT AS similarity,
      'keyword' AS search_type,
      kb.metadata,
      kb.source_url,
      ROW_NUMBER() OVER (ORDER BY kb.created_at DESC) as key_rank
    FROM ai_knowledge_base kb
    WHERE kb.workspace_id = $3
      AND (agent_id IS NULL OR kb.agent_id = agent_id)
      AND (kb.title ILIKE '%' || query_text || '%' 
           OR kb.content ILIKE '%' || query_text || '%')
  )
  SELECT DISTINCT ON (id)
    COALESCE(v.id, k.id),
    COALESCE(v.title, k.title),
    COALESCE(v.content, k.content),
    COALESCE(v.type, k.type),
    COALESCE(v.similarity, k.similarity),
    COALESCE(v.search_type, k.search_type),
    COALESCE(v.metadata, k.metadata),
    COALESCE(v.source_url, k.source_url)
  FROM vector_results v
  FULL OUTER JOIN keyword_results k ON v.id = k.id
  ORDER BY id, COALESCE(v.vec_rank, k.key_rank)
  LIMIT match_count;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION search_ai_knowledge_base TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_knowledge_base_stats TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_ai_knowledge_base TO authenticated;
GRANT SELECT, INSERT, DELETE ON ai_knowledge_base TO authenticated;
