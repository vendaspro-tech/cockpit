'use server'

import { revalidatePath } from "next/cache"

import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { writeAuditLog } from "@/lib/audit"
import {
  adminCreateJobTitle,
  adminDeleteJobTitle,
  adminGetJobTitle,
  adminGetJobTitleHierarchy,
  adminGetJobTitleStats,
  adminListJobTitles,
  adminUpdateJobTitle,
  type JobTitleFilters,
} from "@/lib/admin/job-titles"
import { createAdminClient } from "@/lib/supabase/admin"
import type { CreateJobTitleInput, UpdateJobTitleInput } from "@/lib/types/job-title"

const UNAUTHORIZED = { error: "Não autorizado" } as const

type AdminUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>
type AdminContext = {
  user: AdminUser
  supabase: ReturnType<typeof createAdminClient>
}

async function getAdminContext(): Promise<AdminContext | null> {
  const user = await getAuthUser()
  if (!user) return null

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return null

  return {
    user,
    supabase: createAdminClient(),
  }
}

export async function listJobTitles(filters?: JobTitleFilters) {
  const ctx = await getAdminContext()
  if (!ctx) return UNAUTHORIZED

  return adminListJobTitles(ctx.supabase, filters)
}

export async function getJobTitle(id: string) {
  const ctx = await getAdminContext()
  if (!ctx) return UNAUTHORIZED

  return adminGetJobTitle(ctx.supabase, id)
}

export async function createJobTitle(input: CreateJobTitleInput) {
  const ctx = await getAdminContext()
  if (!ctx) return UNAUTHORIZED

  const result = await adminCreateJobTitle(ctx.supabase, input)
  if ("error" in result) {
    return result
  }

  const { data } = result

  await writeAuditLog({
    actorUserId: ctx.user.id,
    action: "job_title.created",
    entityType: "job_title",
    entityId: data.id,
    after: data,
    client: ctx.supabase,
  })

  revalidatePath("/admin/job-titles")
  return { data }
}

export async function updateJobTitle(id: string, input: UpdateJobTitleInput) {
  const ctx = await getAdminContext()
  if (!ctx) return UNAUTHORIZED

  const result = await adminUpdateJobTitle(ctx.supabase, id, input)
  if ("error" in result) {
    return result
  }

  if ("data" in result && result.data) {
    if ("previous" in result && result.previous) {
      await writeAuditLog({
        actorUserId: ctx.user.id,
        action: "job_title.updated",
        entityType: "job_title",
        entityId: result.data.id,
        before: result.previous,
        after: result.data,
        client: ctx.supabase,
      })
    }

    revalidatePath("/admin/job-titles")
    revalidatePath(`/admin/job-titles/${id}`)
    return { data: result.data }
  }

  revalidatePath("/admin/job-titles")
  revalidatePath(`/admin/job-titles/${id}`)
  return result
}

export async function deleteJobTitle(id: string) {
  const ctx = await getAdminContext()
  if (!ctx) return UNAUTHORIZED

  const result = await adminDeleteJobTitle(ctx.supabase, id)
  if ("error" in result) {
    return result
  }

  if ("deleted" in result && result.deleted) {
    await writeAuditLog({
      actorUserId: ctx.user.id,
      action: "job_title.deleted",
      entityType: "job_title",
      entityId: id,
      before: result.deleted,
      client: ctx.supabase,
    })
  }

  revalidatePath("/admin/job-titles")
  return { success: true }
}

export async function getJobTitleHierarchy() {
  const ctx = await getAdminContext()
  if (!ctx) return UNAUTHORIZED

  return adminGetJobTitleHierarchy(ctx.supabase)
}

export async function getJobTitleStats() {
  const ctx = await getAdminContext()
  if (!ctx) return UNAUTHORIZED

  return adminGetJobTitleStats(ctx.supabase)
}
