-- Migration: 20260213000002_ai_admin_training_chat.sql
-- Purpose: super admin realtime training conversations for AI agents

CREATE TABLE IF NOT EXISTS ai_admin_agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_admin_agent_conversations_agent_id_idx
  ON ai_admin_agent_conversations(agent_id);
CREATE INDEX IF NOT EXISTS ai_admin_agent_conversations_user_id_idx
  ON ai_admin_agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS ai_admin_agent_conversations_last_message_idx
  ON ai_admin_agent_conversations(last_message_at DESC);

ALTER TABLE ai_admin_agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_admin_agent_conversations_system_owner_all
  ON ai_admin_agent_conversations
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

DROP TRIGGER IF EXISTS update_ai_admin_agent_conversations_updated_at ON ai_admin_agent_conversations;
CREATE TRIGGER update_ai_admin_agent_conversations_updated_at
  BEFORE UPDATE ON ai_admin_agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS ai_admin_agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_admin_agent_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_admin_agent_messages_conversation_id_idx
  ON ai_admin_agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS ai_admin_agent_messages_created_at_idx
  ON ai_admin_agent_messages(created_at DESC);

ALTER TABLE ai_admin_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_admin_agent_messages_system_owner_all
  ON ai_admin_agent_messages
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_admin_agent_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_admin_agent_messages TO authenticated;
