-- Migration: 20260211000002_bug_reports.sql
-- Purpose: bug report workflow with attachments, status timeline, and in-app notifications

CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'em_avaliacao', 'corrigido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corrected_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bug_report_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bug_report_status_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('enviado', 'em_avaliacao', 'corrigido')),
  changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bug_report_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'success' CHECK (type IN ('info', 'warning', 'error', 'success')),
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, bug_report_id, message)
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_workspace_created
  ON bug_reports(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bug_reports_reporter_created
  ON bug_reports(reporter_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bug_reports_status_created
  ON bug_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bug_report_notifications_user_created
  ON bug_report_notifications(user_id, created_at DESC);

DROP TRIGGER IF EXISTS update_bug_reports_updated_at ON bug_reports;
CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bug-report-images',
  'bug-report-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bug_reports_system_owner_all ON bug_reports;
DROP POLICY IF EXISTS bug_reports_user_select ON bug_reports;
DROP POLICY IF EXISTS bug_reports_user_insert ON bug_reports;
DROP POLICY IF EXISTS bug_reports_user_update ON bug_reports;

DROP POLICY IF EXISTS bug_report_attachments_system_owner_all ON bug_report_attachments;
DROP POLICY IF EXISTS bug_report_attachments_user_select ON bug_report_attachments;
DROP POLICY IF EXISTS bug_report_attachments_user_insert ON bug_report_attachments;

DROP POLICY IF EXISTS bug_report_status_events_system_owner_all ON bug_report_status_events;
DROP POLICY IF EXISTS bug_report_status_events_user_select ON bug_report_status_events;
DROP POLICY IF EXISTS bug_report_status_events_system_owner_insert ON bug_report_status_events;

DROP POLICY IF EXISTS bug_report_notifications_system_owner_all ON bug_report_notifications;
DROP POLICY IF EXISTS bug_report_notifications_user_select ON bug_report_notifications;
DROP POLICY IF EXISTS bug_report_notifications_user_update ON bug_report_notifications;
DROP POLICY IF EXISTS bug_report_notifications_system_owner_insert ON bug_report_notifications;

CREATE POLICY bug_reports_system_owner_all
  ON bug_reports
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY bug_reports_user_select
  ON bug_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY bug_reports_user_insert
  ON bug_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = bug_reports.workspace_id
        AND wm.user_id = reporter_user_id
    )
  );

CREATE POLICY bug_reports_user_update
  ON bug_reports
  FOR UPDATE
  TO authenticated
  USING (
    reporter_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  )
  WITH CHECK (
    reporter_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY bug_report_attachments_system_owner_all
  ON bug_report_attachments
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY bug_report_attachments_user_select
  ON bug_report_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM bug_reports br
      WHERE br.id = bug_report_attachments.bug_report_id
        AND br.reporter_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    )
  );

CREATE POLICY bug_report_attachments_user_insert
  ON bug_report_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM bug_reports br
      WHERE br.id = bug_report_attachments.bug_report_id
        AND br.reporter_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    )
  );

CREATE POLICY bug_report_status_events_system_owner_all
  ON bug_report_status_events
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY bug_report_status_events_user_select
  ON bug_report_status_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM bug_reports br
      WHERE br.id = bug_report_status_events.bug_report_id
        AND br.reporter_user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
    )
  );

CREATE POLICY bug_report_notifications_system_owner_all
  ON bug_report_notifications
  FOR ALL
  TO authenticated
  USING (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  )
  WITH CHECK (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
  );

CREATE POLICY bug_report_notifications_user_select
  ON bug_report_notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

CREATE POLICY bug_report_notifications_user_update
  ON bug_report_notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Bug report image read" ON storage.objects;
DROP POLICY IF EXISTS "Bug report image insert" ON storage.objects;
DROP POLICY IF EXISTS "Bug report image delete" ON storage.objects;

CREATE POLICY "Bug report image read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bug-report-images'
  AND (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR (storage.foldername(name))[1] = (SELECT id::text FROM users WHERE supabase_user_id = auth.uid()::text)
  )
);

CREATE POLICY "Bug report image insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bug-report-images'
  AND (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR (storage.foldername(name))[1] = (SELECT id::text FROM users WHERE supabase_user_id = auth.uid()::text)
  )
);

CREATE POLICY "Bug report image delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bug-report-images'
  AND (
    is_system_owner((SELECT id FROM users WHERE supabase_user_id = auth.uid()::text))
    OR (storage.foldername(name))[1] = (SELECT id::text FROM users WHERE supabase_user_id = auth.uid()::text)
  )
);

GRANT SELECT, INSERT, UPDATE ON bug_reports TO authenticated;
GRANT SELECT, INSERT ON bug_report_attachments TO authenticated;
GRANT SELECT, INSERT ON bug_report_status_events TO authenticated;
GRANT SELECT, UPDATE ON bug_report_notifications TO authenticated;
