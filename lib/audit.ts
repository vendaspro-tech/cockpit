import type { SupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"

export interface AuditLogEntry {
  actorUserId: string
  action: string
  entityType: string
  entityId?: string | null
  workspaceId?: string | null
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
  client?: SupabaseClient
}

const tableName = "audit_log"

/**
 * Minimal helper to persist audit events required by FR-008.
 * This should be invoked from server-only contexts (server actions/route handlers).
 */
export async function writeAuditLog(entry: AuditLogEntry) {
  const {
    actorUserId,
    action,
    entityType,
    entityId = null,
    workspaceId = null,
    before = null,
    after = null,
    metadata = {},
    client,
  } = entry

  const supabase = client ?? createAdminClient()

  const { error } = await supabase.from(tableName).insert({
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    workspace_id: workspaceId,
    before_state: before,
    after_state: after,
    metadata,
  })

  if (error) {
    console.error("audit_log insert failed", { action, entityType, error })
  }

  return { error }
}
