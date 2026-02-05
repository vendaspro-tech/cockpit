-- Migration: 20260205000002_ai_agent_model_temperature.sql
-- Purpose: Add model + temperature per agent (safety if previous migration already applied)

ALTER TABLE ai_agents
  ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT 'gpt-4o-mini';

ALTER TABLE ai_agents
  ADD COLUMN IF NOT EXISTS temperature NUMERIC NOT NULL DEFAULT 0.7;

ALTER TABLE ai_agents
  ADD CONSTRAINT ai_agents_temperature_check
  CHECK (temperature >= 0 AND temperature <= 1);
