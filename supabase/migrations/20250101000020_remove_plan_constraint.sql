-- Migration: Remove plan check constraint from workspaces
-- Description: Allows any string in the plan column to support dynamic plans

ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_plan_check;
