import { NextResponse } from "next/server"

import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { writeAuditLog } from "@/lib/audit"
import {
  adminCreateJobTitle,
  adminListJobTitles,
  type JobTitleFilters,
} from "@/lib/admin/job-titles"
import { createAdminClient } from "@/lib/supabase/admin"
import type { CreateJobTitleInput } from "@/lib/types/job-title"

const UNAUTHORIZED_BODY = { error: "Não autorizado" }

const BAD_REQUEST_STATUS = 400
const UNAUTHORIZED_STATUS = 401
const SERVER_ERROR_STATUS = 500

const HTTP_STATUS = {
  ok: 200,
  created: 201,
} as const

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

function buildFilters(searchParams: URLSearchParams): JobTitleFilters | undefined {
  const filters: JobTitleFilters = {}

  const hierarchyParam = searchParams.get("hierarchy_level")
  if (hierarchyParam !== null) {
    const parsedLevel = Number(hierarchyParam)
    if (!Number.isNaN(parsedLevel)) {
      filters.hierarchy_level = parsedLevel
    }
  }

  const sector = searchParams.get("sector")
  if (sector) {
    filters.sector = sector
  }

  const search = searchParams.get("search")
  if (search) {
    filters.search = search
  }

  return Object.keys(filters).length ? filters : undefined
}

export async function GET(request: Request) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: UNAUTHORIZED_STATUS })
  }

  try {
    const filters = buildFilters(new URL(request.url).searchParams)
    const result = await adminListJobTitles(ctx.supabase, filters)

    if ("error" in result) {
      return NextResponse.json(result, { status: SERVER_ERROR_STATUS })
    }

    return NextResponse.json(result, { status: HTTP_STATUS.ok })
  } catch (error) {
    console.error("GET /api/admin/job-titles failed", error)
    return NextResponse.json({ error: "Erro ao buscar cargos" }, { status: SERVER_ERROR_STATUS })
  }
}

export async function POST(request: Request) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: UNAUTHORIZED_STATUS })
  }

  let payload: CreateJobTitleInput
  try {
    payload = await request.json()
  } catch (error) {
    console.error("Invalid payload for POST /api/admin/job-titles", error)
    return NextResponse.json({ error: "Payload inválido" }, { status: BAD_REQUEST_STATUS })
  }

  const result = await adminCreateJobTitle(ctx.supabase, payload)
  if ("error" in result) {
    return NextResponse.json(result, { status: BAD_REQUEST_STATUS })
  }

  await writeAuditLog({
    actorUserId: ctx.user.id,
    action: "job_title.created",
    entityType: "job_title",
    entityId: result.data.id,
    after: result.data,
    client: ctx.supabase,
  })

  return NextResponse.json({ data: result.data }, { status: HTTP_STATUS.created })
}
