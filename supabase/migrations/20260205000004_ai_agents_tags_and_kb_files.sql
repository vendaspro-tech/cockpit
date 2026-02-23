-- Migration: 20260205000004_ai_agents_tags_and_kb_files.sql
-- Purpose: add product/category tags to agents and file metadata to agent KB

ALTER TABLE ai_agents
  ADD COLUMN IF NOT EXISTS product_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS ai_agents_product_tags_idx ON ai_agents USING GIN (product_tags);
CREATE INDEX IF NOT EXISTS ai_agents_category_tags_idx ON ai_agents USING GIN (category_tags);

ALTER TABLE ai_agent_knowledge_base
  ADD COLUMN IF NOT EXISTS filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;
