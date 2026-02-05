-- Migration: 20260205000003_ai_conversation_attachments.sql
-- Purpose: Store user-uploaded attachments per AI conversation

CREATE TABLE IF NOT EXISTS ai_conversation_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversation_attachments_conversation_id_idx
  ON ai_conversation_attachments(conversation_id);

CREATE INDEX IF NOT EXISTS ai_conversation_attachments_user_id_idx
  ON ai_conversation_attachments(user_id);

ALTER TABLE ai_conversation_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_conversation_attachments_system_owner_all
  ON ai_conversation_attachments
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY ai_conversation_attachments_user_select
  ON ai_conversation_attachments
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
      AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY ai_conversation_attachments_user_insert
  ON ai_conversation_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
      AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

CREATE POLICY ai_conversation_attachments_user_delete
  ON ai_conversation_attachments
  FOR DELETE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
      AND workspace_id IN (SELECT public.user_workspaces(auth.uid()))
    )
  );

GRANT SELECT, INSERT, DELETE ON ai_conversation_attachments TO authenticated;
