import { NextResponse } from "next/server"

import { getAuthUser } from "@/lib/auth-server"
import { isSystemOwner } from "@/lib/auth-utils"
import { writeAuditLog } from "@/lib/audit"
import {
  adminCreateCompetencyFrameworkVersion,
  adminListCompetencyFrameworks,
  CreateFrameworkVersionSchema,
} from "@/lib/admin/competency-frameworks"
import { createAdminClient } from "@/lib/supabase/admin"

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

export async function GET(request: Request) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: UNAUTHORIZED_STATUS })
  }

  try {
    const searchParams = new URL(request.url).searchParams
    const job_title_id = searchParams.get("job_title_id") ?? undefined
    const search = searchParams.get("search") ?? undefined
    const includeInactive = searchParams.get("include_inactive") === "true"

    const result = await adminListCompetencyFrameworks(ctx.supabase, {
      job_title_id,
      search,
      includeInactive,
    })

    if ("error" in result) {
      return NextResponse.json(result, { status: SERVER_ERROR_STATUS })
    }

    return NextResponse.json(result, { status: HTTP_STATUS.ok })
  } catch (error) {
    console.error("GET /api/admin/competency-frameworks failed", error)
    return NextResponse.json(
      { error: "Erro ao buscar frameworks de competência" },
      { status: SERVER_ERROR_STATUS }
    )
  }
}

export async function POST(request: Request) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: UNAUTHORIZED_STATUS })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch (error) {
    console.error("Invalid payload for POST /api/admin/competency-frameworks", error)
    return NextResponse.json({ error: "Payload inválido" }, { status: BAD_REQUEST_STATUS })
  }

  const validated = CreateFrameworkVersionSchema.safeParse(payload)
  if (!validated.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: validated.error.flatten() },
      { status: BAD_REQUEST_STATUS }
    )
  }

  const result = await adminCreateCompetencyFrameworkVersion(ctx.supabase, ctx.user.id, validated.data)
  if ("error" in result) {
    return NextResponse.json(result, { status: BAD_REQUEST_STATUS })
  }

  await writeAuditLog({
    actorUserId: ctx.user.id,
    action: "competency_framework.version_published",
    entityType: "competency_framework",
    entityId: result.data.id,
    before: result.previous ?? null,
    after: result.data,
    metadata: {
      job_title_id: result.data.job_title_id,
      version: result.data.version,
      parent_framework_id: result.data.parent_framework_id,
    },
    client: ctx.supabase,
  })

  return NextResponse.json({ data: result.data }, { status: HTTP_STATUS.created })
}
