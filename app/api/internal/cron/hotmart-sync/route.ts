import { NextResponse } from "next/server"

import { isHotmartAccessControlEnabled } from "@/lib/feature-flags"
import { listWorkspaceOwnerSyncTargets, markWorkspaceHotmartAccessError, upsertWorkspaceHotmartAccess } from "@/lib/hotmart/access"
import { checkHotmartEligibilityByEmail } from "@/lib/hotmart/service"

export const dynamic = "force-dynamic"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false

  const authHeader = request.headers.get("authorization") || ""
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: Request) {
  const start = Date.now()

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isHotmartAccessControlEnabled()) {
    return NextResponse.json({
      skipped: true,
      reason: "FEATURE_HOTMART_ACCESS_CONTROL disabled",
      duration_ms: Date.now() - start,
    })
  }

  let processed = 0
  let active = 0
  let inactive = 0
  let errors = 0
  let skipped = 0

  try {
    const targets = await listWorkspaceOwnerSyncTargets()

    for (const target of targets) {
      if (!target.ownerEmail) {
        skipped++
        continue
      }

      processed++

      const eligibility = await checkHotmartEligibilityByEmail(target.ownerEmail)
      if (eligibility.reasonCode === "API_ERROR") {
        errors++

        try {
          await markWorkspaceHotmartAccessError({
            workspaceId: target.workspaceId,
            ownerUserId: target.ownerUserId,
            ownerEmail: target.ownerEmail,
            lastVerifiedSource: "cron",
            errorMessage: "Hotmart API unavailable during cron sync",
          })
        } catch (persistError) {
          console.error("Error persisting Hotmart cron error state:", persistError)
        }

        continue
      }

      const nextStatus = eligibility.hasEligibleActivePlan ? "active" : "inactive"
      if (nextStatus === "active") active++
      else inactive++

      try {
        await upsertWorkspaceHotmartAccess({
          workspaceId: target.workspaceId,
          ownerUserId: target.ownerUserId,
          ownerEmail: target.ownerEmail,
          status: nextStatus,
          lastVerifiedSource: "cron",
          lastStatusReason: eligibility.reasonCode,
          hotmartCustomerId: eligibility.hotmartCustomerId ?? null,
          hotmartSubscriptionId: eligibility.subscriptionId ?? null,
          hotmartProductId: eligibility.matchedProductId ?? null,
          hotmartOfferId: eligibility.matchedOfferId ?? null,
          rawResponse: eligibility.raw ?? null,
          lastErrorMessage: null,
          lastErrorAt: null,
        })
      } catch (persistError) {
        errors++
        console.error("Error upserting Hotmart cron access state:", persistError)
      }
    }

    return NextResponse.json({
      skipped: false,
      processed,
      active,
      inactive,
      errors,
      skipped_targets: skipped,
      duration_ms: Date.now() - start,
    })
  } catch (error) {
    console.error("Hotmart cron sync failed:", error)
    return NextResponse.json(
      {
        error: "Hotmart cron sync failed",
        processed,
        active,
        inactive,
        errors: errors + 1,
        skipped_targets: skipped,
        duration_ms: Date.now() - start,
      },
      { status: 500 }
    )
  }
}

