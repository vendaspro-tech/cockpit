-- Migration: 20260220000001_ai_agent_kb_chunked_pipeline.sql
-- Purpose: add source/chunk pipeline for scalable agent knowledge base ingestion and retrieval

CREATE TABLE IF NOT EXISTS ai_agent_kb_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('transcript', 'pdi', 'assessment', 'document', 'image_extracted')),
  filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_path TEXT,
  inline_content TEXT,
  checksum_sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_agent_kb_sources_agent_checksum_uidx
  ON ai_agent_kb_sources(agent_id, checksum_sha256);

CREATE INDEX IF NOT EXISTS ai_agent_kb_sources_agent_status_idx
  ON ai_agent_kb_sources(agent_id, status, created_at DESC);

ALTER TABLE ai_agent_kb_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_agent_kb_sources_system_owner_all
  ON ai_agent_kb_sources
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY ai_agent_kb_sources_select_active_agents
  ON ai_agent_kb_sources
  FOR SELECT
  TO authenticated
  USING (
    agent_id IN (SELECT id FROM ai_agents WHERE status = 'active')
  );

DROP TRIGGER IF EXISTS update_ai_agent_kb_sources_updated_at ON ai_agent_kb_sources;
CREATE TRIGGER update_ai_agent_kb_sources_updated_at
  BEFORE UPDATE ON ai_agent_kb_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS ai_agent_kb_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES ai_agent_kb_sources(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL,
  content_tokens_est INTEGER NOT NULL DEFAULT 0 CHECK (content_tokens_est >= 0),
  embedding vector(1536) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_agent_kb_chunks_source_chunk_unique UNIQUE (source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS ai_agent_kb_chunks_embedding_idx
  ON ai_agent_kb_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS ai_agent_kb_chunks_agent_source_chunk_idx
  ON ai_agent_kb_chunks(agent_id, source_id, chunk_index);

ALTER TABLE ai_agent_kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_agent_kb_chunks_system_owner_all
  ON ai_agent_kb_chunks
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY ai_agent_kb_chunks_select_active_agents
  ON ai_agent_kb_chunks
  FOR SELECT
  TO authenticated
  USING (
    agent_id IN (SELECT id FROM ai_agents WHERE status = 'active')
  );

CREATE OR REPLACE FUNCTION search_ai_agent_kb_chunks(
  query_embedding vector,
  agent_id UUID,
  similarity_threshold FLOAT DEFAULT 0.68,
  match_count INT DEFAULT 48,
  doc_type VARCHAR DEFAULT NULL
)
RETURNS TABLE(
  chunk_id UUID,
  source_id UUID,
  title TEXT,
  content TEXT,
  type VARCHAR,
  chunk_index INT,
  content_tokens_est INT,
  similarity FLOAT,
  metadata JSONB,
  source_metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    s.id AS source_id,
    s.title,
    c.content,
    s.type,
    c.chunk_index,
    c.content_tokens_est,
    (1 - (c.embedding <=> query_embedding))::FLOAT AS similarity,
    c.metadata,
    s.metadata AS source_metadata
  FROM ai_agent_kb_chunks c
  JOIN ai_agent_kb_sources s ON s.id = c.source_id
  WHERE c.agent_id = $2
    AND s.status = 'ready'
    AND (doc_type IS NULL OR s.type = doc_type)
    AND (1 - (c.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_ai_agent_kb_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_agent_kb_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_agent_kb_chunks TO authenticated;
