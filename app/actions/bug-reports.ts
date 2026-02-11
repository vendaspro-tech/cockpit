'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getAuthUser } from '@/lib/auth-server'
import { getUserRole, isSystemOwner } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { ensureSupabaseUser } from '@/lib/supabase/user'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const BugReportStatusSchema = z.enum(['enviado', 'em_avaliacao', 'corrigido'])

const SubmitBugReportSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().trim().min(3, 'Título deve ter ao menos 3 caracteres').max(140),
  description: z.string().trim().min(10, 'Descrição deve ter ao menos 10 caracteres').max(4000),
  images: z.array(z.custom<File>((value) => value instanceof File)).min(1).max(MAX_IMAGES),
})

const AdminBugReportFiltersSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  status: BugReportStatusSchema.optional(),
  email: z.string().trim().email().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

const UpdateBugReportStatusSchema = z.object({
  bugReportId: z.string().uuid(),
  status: BugReportStatusSchema,
  note: z.string().trim().max(1000).optional().nullable(),
})

export type BugReportStatus = z.infer<typeof BugReportStatusSchema>

export type BugReportAttachment = {
  id: string
  file_name: string
  mime_type: string
  size_bytes: number
  created_at: string
  signed_url: string | null
}

export type BugReportStatusEvent = {
  id: string
  from_status: BugReportStatus | null
  to_status: BugReportStatus
  note: string | null
  created_at: string
  changed_by: {
    id: string
    full_name: string | null
    email: string
  } | null
}

export type MyBugReportRow = {
  id: string
  workspace_id: string
  title: string
  description: string
  status: BugReportStatus
  created_at: string
  updated_at: string
  corrected_at: string | null
  attachments: BugReportAttachment[]
  events: BugReportStatusEvent[]
}

export type AdminBugReportRow = {
  id: string
  workspace_id: string
  title: string
  description: string
  status: BugReportStatus
  created_at: string
  updated_at: string
  corrected_at: string | null
  reporter: {
    id: string
    full_name: string | null
    email: string
  } | null
  workspace: {
    id: string
    name: string
  } | null
  attachments: BugReportAttachment[]
}

export type AdminBugReportListResult = {
  items: AdminBugReportRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function getCurrentInternalUser() {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const sync = await ensureSupabaseUser(authUser.id)
  if (!sync.userId) return null

  const supabase = await createClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('id', sync.userId)
    .maybeSingle()

  if (!userRow) return null

  return {
    authUser,
    internalUserId: userRow.id,
    email: userRow.email,
    fullName: userRow.full_name,
  }
}

async function createSignedAttachmentUrls(
  attachments: Array<{ id: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number; created_at: string }>
): Promise<BugReportAttachment[]> {
  const supabase = await createClient()

  const signed = await Promise.all(
    attachments.map(async (attachment) => {
      const { data } = await supabase.storage
        .from('bug-report-images')
        .createSignedUrl(attachment.storage_path, 60 * 60)

      return {
        id: attachment.id,
        file_name: attachment.file_name,
        mime_type: attachment.mime_type,
        size_bytes: attachment.size_bytes,
        created_at: attachment.created_at,
        signed_url: data?.signedUrl ?? null,
      }
    })
  )

  return signed
}

export async function submitBugReport(
  input: { title: string; description: string; images: File[] },
  workspaceId: string
) {
  const parsed = SubmitBugReportSchema.safeParse({
    workspaceId,
    title: input.title,
    description: input.description,
    images: input.images,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos para relato de bug.' }
  }

  for (const image of parsed.data.images) {
    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return { error: `Formato não suportado: ${image.name}` }
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return { error: `Imagem acima de 5MB: ${image.name}` }
    }
  }

  const current = await getCurrentInternalUser()
  if (!current) {
    return { error: 'Não autorizado' }
  }

  const superAdmin = await isSystemOwner(current.authUser.id)
  if (superAdmin) {
    return { error: 'Superadmin não pode enviar relato por este fluxo.' }
  }

  const role = await getUserRole(current.authUser.id, parsed.data.workspaceId)
  if (!role || role === 'system_owner') {
    return { error: 'Você não tem acesso a este workspace.' }
  }

  const supabase = await createClient()

  const { data: bugReport, error: bugInsertError } = await supabase
    .from('bug_reports')
    .insert({
      workspace_id: parsed.data.workspaceId,
      reporter_user_id: current.internalUserId,
      reporter_email: current.email,
      title: parsed.data.title,
      description: parsed.data.description,
      status: 'enviado',
    })
    .select('id, status')
    .single()

  if (bugInsertError || !bugReport) {
    console.error('Error creating bug report:', bugInsertError)
    return { error: 'Não foi possível enviar o relato de bug agora.' }
  }

  const { error: eventError } = await supabase.from('bug_report_status_events').insert({
    bug_report_id: bugReport.id,
    from_status: null,
    to_status: 'enviado',
    changed_by_user_id: current.internalUserId,
    note: null,
  })

  if (eventError) {
    console.error('Error creating initial bug status event:', eventError)
  }

  const uploadedPaths: string[] = []
  const attachmentsToInsert: Array<{
    bug_report_id: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number
  }> = []

  for (const image of parsed.data.images) {
    const safeName = sanitizeFileName(image.name)
    const storagePath = `${current.internalUserId}/${bugReport.id}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('bug-report-images')
      .upload(storagePath, image, {
        cacheControl: '3600',
        upsert: false,
        contentType: image.type,
      })

    if (uploadError) {
      console.error('Error uploading bug report image:', uploadError)

      if (uploadedPaths.length > 0) {
        await supabase.storage.from('bug-report-images').remove(uploadedPaths)
      }

      await supabase.from('bug_reports').delete().eq('id', bugReport.id)
      return { error: 'Falha no upload de uma das imagens. Tente novamente.' }
    }

    uploadedPaths.push(storagePath)
    attachmentsToInsert.push({
      bug_report_id: bugReport.id,
      storage_path: storagePath,
      file_name: image.name,
      mime_type: image.type,
      size_bytes: image.size,
    })
  }

  const { error: attachmentError } = await supabase
    .from('bug_report_attachments')
    .insert(attachmentsToInsert)

  if (attachmentError) {
    console.error('Error inserting bug report attachments:', attachmentError)

    if (uploadedPaths.length > 0) {
      await supabase.storage.from('bug-report-images').remove(uploadedPaths)
    }

    await supabase.from('bug_reports').delete().eq('id', bugReport.id)
    return { error: 'Erro ao salvar os anexos do bug report.' }
  }

  revalidatePath(`/${parsed.data.workspaceId}/support`)
  revalidatePath(`/${parsed.data.workspaceId}/profile`)
  revalidatePath('/admin/bugs')

  return { success: true, bugReportId: bugReport.id }
}

export async function listMyBugReports(workspaceId: string): Promise<MyBugReportRow[]> {
  const current = await getCurrentInternalUser()
  if (!current) return []

  const supabase = await createClient()

  const { data: reports, error } = await supabase
    .from('bug_reports')
    .select('id, workspace_id, title, description, status, created_at, updated_at, corrected_at')
    .eq('workspace_id', workspaceId)
    .eq('reporter_user_id', current.internalUserId)
    .order('created_at', { ascending: false })

  if (error || !reports) {
    console.error('Error fetching my bug reports:', error)
    return []
  }

  const reportIds = reports.map((report) => report.id)

  const [{ data: attachments }, { data: events }, { data: users }] = await Promise.all([
    reportIds.length
      ? supabase
          .from('bug_report_attachments')
          .select('id, bug_report_id, storage_path, file_name, mime_type, size_bytes, created_at')
          .in('bug_report_id', reportIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    reportIds.length
      ? supabase
          .from('bug_report_status_events')
          .select('id, bug_report_id, from_status, to_status, changed_by_user_id, note, created_at')
          .in('bug_report_id', reportIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    reportIds.length
      ? supabase
          .from('bug_report_status_events')
          .select('changed_by_user_id')
          .in('bug_report_id', reportIds)
      : Promise.resolve({ data: [] as never[] }),
  ])

  const changedByUserIds = Array.from(
    new Set((users ?? []).map((row: { changed_by_user_id: string }) => row.changed_by_user_id))
  )

  let changedByMap = new Map<string, { id: string; full_name: string | null; email: string }>()

  if (changedByUserIds.length > 0) {
    const { data: changedByUsers } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', changedByUserIds)

    changedByMap = new Map((changedByUsers ?? []).map((row) => [row.id, row]))
  }

  const attachmentsByReport = new Map<string, Awaited<ReturnType<typeof createSignedAttachmentUrls>>>()

  for (const report of reports) {
    const reportAttachments = (attachments ?? []).filter((item) => item.bug_report_id === report.id)
    attachmentsByReport.set(report.id, await createSignedAttachmentUrls(reportAttachments))
  }

  return reports.map((report) => {
    const reportEvents = (events ?? [])
      .filter((event) => event.bug_report_id === report.id)
      .map((event) => ({
        id: event.id,
        from_status: (event.from_status ?? null) as BugReportStatus | null,
        to_status: event.to_status as BugReportStatus,
        note: event.note,
        created_at: event.created_at,
        changed_by: changedByMap.get(event.changed_by_user_id) ?? null,
      }))

    return {
      ...report,
      status: report.status as BugReportStatus,
      attachments: attachmentsByReport.get(report.id) ?? [],
      events: reportEvents,
    }
  })
}

export async function listAdminBugReports(params: {
  workspaceId?: string
  status?: BugReportStatus
  email?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}): Promise<AdminBugReportListResult> {
  const authUser = await getAuthUser()
  if (!authUser) {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const owner = await isSystemOwner(authUser.id)
  if (!owner) {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const parsed = AdminBugReportFiltersSchema.safeParse({
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  })

  if (!parsed.success) {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const { workspaceId, status, email, from, to, page, pageSize } = parsed.data
  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1

  const supabase = await createClient()

  let query = supabase
    .from('bug_reports')
    .select(
      'id, workspace_id, reporter_user_id, title, description, status, created_at, updated_at, corrected_at, reporter_email',
      { count: 'exact' }
    )

  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  if (status) query = query.eq('status', status)
  if (email) query = query.ilike('reporter_email', `%${email}%`)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data: reports, count, error } = await query
    .order('created_at', { ascending: false })
    .range(fromIdx, toIdx)

  if (error || !reports) {
    console.error('Error fetching admin bug reports:', error)
    return { items: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const reportIds = reports.map((report) => report.id)
  const reporterIds = Array.from(new Set(reports.map((report) => report.reporter_user_id)))
  const workspaceIds = Array.from(new Set(reports.map((report) => report.workspace_id)))

  const [{ data: reporterRows }, { data: workspaceRows }, { data: attachments }] = await Promise.all([
    reporterIds.length
      ? supabase.from('users').select('id, full_name, email').in('id', reporterIds)
      : Promise.resolve({ data: [] as never[] }),
    workspaceIds.length
      ? supabase.from('workspaces').select('id, name').in('id', workspaceIds)
      : Promise.resolve({ data: [] as never[] }),
    reportIds.length
      ? supabase
          .from('bug_report_attachments')
          .select('id, bug_report_id, storage_path, file_name, mime_type, size_bytes, created_at')
          .in('bug_report_id', reportIds)
      : Promise.resolve({ data: [] as never[] }),
  ])

  const reporterMap = new Map((reporterRows ?? []).map((row) => [row.id, row]))
  const workspaceMap = new Map((workspaceRows ?? []).map((row) => [row.id, row]))

  const attachmentsByReport = new Map<string, Awaited<ReturnType<typeof createSignedAttachmentUrls>>>()

  for (const report of reports) {
    const reportAttachments = (attachments ?? []).filter((item) => item.bug_report_id === report.id)
    attachmentsByReport.set(report.id, await createSignedAttachmentUrls(reportAttachments))
  }

  const items: AdminBugReportRow[] = reports.map((report) => ({
    id: report.id,
    workspace_id: report.workspace_id,
    title: report.title,
    description: report.description,
    status: report.status as BugReportStatus,
    created_at: report.created_at,
    updated_at: report.updated_at,
    corrected_at: report.corrected_at,
    reporter: reporterMap.get(report.reporter_user_id) ?? null,
    workspace: workspaceMap.get(report.workspace_id) ?? null,
    attachments: attachmentsByReport.get(report.id) ?? [],
  }))

  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function updateBugReportStatus(input: {
  bugReportId: string
  status: BugReportStatus
  note?: string | null
}) {
  const parsed = UpdateBugReportStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Dados inválidos para atualizar status do bug.' }
  }

  const authUser = await getAuthUser()
  if (!authUser) {
    return { error: 'Não autorizado' }
  }

  const owner = await isSystemOwner(authUser.id)
  if (!owner) {
    return { error: 'Sem permissão para atualizar status de bug.' }
  }

  const current = await getCurrentInternalUser()
  if (!current) {
    return { error: 'Não autorizado' }
  }

  const supabase = await createClient()

  const { data: report, error: reportError } = await supabase
    .from('bug_reports')
    .select('id, workspace_id, reporter_user_id, status, title')
    .eq('id', parsed.data.bugReportId)
    .maybeSingle()

  if (reportError || !report) {
    console.error('Error fetching bug report for status update:', reportError)
    return { error: 'Bug report não encontrado.' }
  }

  if (report.status === parsed.data.status) {
    return { success: true }
  }

  const nowIso = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('bug_reports')
    .update({
      status: parsed.data.status,
      corrected_at: parsed.data.status === 'corrigido' ? nowIso : null,
      updated_at: nowIso,
    })
    .eq('id', parsed.data.bugReportId)

  if (updateError) {
    console.error('Error updating bug report status:', updateError)
    return { error: 'Falha ao atualizar o status do bug report.' }
  }

  const { error: eventError } = await supabase.from('bug_report_status_events').insert({
    bug_report_id: parsed.data.bugReportId,
    from_status: report.status,
    to_status: parsed.data.status,
    changed_by_user_id: current.internalUserId,
    note: parsed.data.note?.trim() || null,
  })

  if (eventError) {
    console.error('Error creating bug status event:', eventError)
  }

  if (parsed.data.status === 'corrigido') {
    const { error: notificationError } = await supabase.from('bug_report_notifications').insert({
      bug_report_id: parsed.data.bugReportId,
      user_id: report.reporter_user_id,
      title: 'Seu bug report foi corrigido',
      message: `O bug report "${report.title}" foi marcado como corrigido.`,
      type: 'success',
    })

    if (notificationError) {
      console.error('Error creating bug report notification:', notificationError)
    }
  }

  revalidatePath('/admin/bugs')
  revalidatePath(`/${report.workspace_id}/profile`)
  revalidatePath(`/${report.workspace_id}/notifications`)

  return { success: true }
}
