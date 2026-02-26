-- Hotmart access control cache/status by workspace (owner subscription controls one workspace)

CREATE TABLE IF NOT EXISTS public.workspace_hotmart_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'hotmart',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'unknown', 'error')),
  hotmart_customer_id TEXT,
  hotmart_subscription_id TEXT,
  hotmart_product_id TEXT,
  hotmart_offer_id TEXT,
  last_verified_at TIMESTAMPTZ,
  last_verified_source TEXT CHECK (last_verified_source IN ('onboarding', 'cron', 'manual')),
  last_status_reason TEXT,
  last_error_message TEXT,
  last_error_at TIMESTAMPTZ,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_hotmart_access_owner_user_id
  ON public.workspace_hotmart_access(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_hotmart_access_status
  ON public.workspace_hotmart_access(status);

CREATE INDEX IF NOT EXISTS idx_workspace_hotmart_access_last_verified_at
  ON public.workspace_hotmart_access(last_verified_at);

DROP TRIGGER IF EXISTS update_workspace_hotmart_access_updated_at ON public.workspace_hotmart_access;
CREATE TRIGGER update_workspace_hotmart_access_updated_at
  BEFORE UPDATE ON public.workspace_hotmart_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workspace_hotmart_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_hotmart_access_member_read ON public.workspace_hotmart_access;
CREATE POLICY workspace_hotmart_access_member_read
ON public.workspace_hotmart_access
FOR SELECT
TO authenticated
USING (
  workspace_id IN (SELECT public.user_workspaces(auth.uid()))
);

