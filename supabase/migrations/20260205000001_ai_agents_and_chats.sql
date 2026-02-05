-- Migration: 20260205000001_ai_agents_and_chats.sql
-- Purpose: Global AI agents, knowledge base, conversations, and messages with RLS

-- Ensure pgvector is available for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- AI AGENTS (GLOBAL)
-- =============================================

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature NUMERIC NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_agents_status_idx ON ai_agents(status);
CREATE INDEX IF NOT EXISTS ai_agents_created_at_idx ON ai_agents(created_at DESC);

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- System owners (super admins) can do everything
CREATE POLICY ai_agents_system_owner_all
  ON ai_agents
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

-- Everyone authenticated can view active agents
CREATE POLICY ai_agents_select_active
  ON ai_agents
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON ai_agents;
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AI AGENT KNOWLEDGE BASE (GLOBAL)
-- =============================================

CREATE TABLE IF NOT EXISTS ai_agent_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('transcript', 'pdi', 'assessment', 'document', 'image_extracted')),
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT agent_embedding_not_null CHECK (embedding IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ai_agent_kb_embedding_idx
  ON ai_agent_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS ai_agent_kb_agent_id_idx
  ON ai_agent_knowledge_base(agent_id);

CREATE INDEX IF NOT EXISTS ai_agent_kb_type_idx
  ON ai_agent_knowledge_base(type);

CREATE INDEX IF NOT EXISTS ai_agent_kb_created_at_idx
  ON ai_agent_knowledge_base(created_at DESC);

ALTER TABLE ai_agent_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_agent_kb_system_owner_all
  ON ai_agent_knowledge_base
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY ai_agent_kb_select_active_agents
  ON ai_agent_knowledge_base
  FOR SELECT
  TO authenticated
  USING (
    agent_id IN (SELECT id FROM ai_agents WHERE status = 'active')
  );

DROP TRIGGER IF EXISTS update_ai_agent_kb_updated_at ON ai_agent_knowledge_base;
CREATE TRIGGER update_ai_agent_kb_updated_at
  BEFORE UPDATE ON ai_agent_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search function for agent knowledge base
CREATE OR REPLACE FUNCTION search_ai_agent_knowledge_base(
  query_embedding vector,
  agent_id UUID,
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
  FROM ai_agent_knowledge_base kb
  WHERE kb.agent_id = $2
    AND (doc_type IS NULL OR kb.type = doc_type)
    AND (1 - (kb.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_ai_agent_knowledge_base TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_agent_knowledge_base TO authenticated;

-- =============================================
-- AI CONVERSATIONS (PER USER)
-- =============================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversations_agent_id_idx ON ai_conversations(agent_id);
CREATE INDEX IF NOT EXISTS ai_conversations_workspace_id_idx ON ai_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_last_message_idx ON ai_conversations(last_message_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_conversations_system_owner_all
  ON ai_conversations
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY ai_conversations_user_select
  ON ai_conversations
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

CREATE POLICY ai_conversations_user_insert
  ON ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

CREATE POLICY ai_conversations_user_update
  ON ai_conversations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

CREATE POLICY ai_conversations_user_delete
  ON ai_conversations
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
  );

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AI MESSAGES (PER CONVERSATION)
-- =============================================

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_messages_conversation_id_idx ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS ai_messages_created_at_idx ON ai_messages(created_at DESC);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_messages_system_owner_all
  ON ai_messages
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY ai_messages_user_select
  ON ai_messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    )
  );

CREATE POLICY ai_messages_user_insert
  ON ai_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    )
  );

CREATE POLICY ai_messages_user_delete
  ON ai_messages
  FOR DELETE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_messages TO authenticated;
