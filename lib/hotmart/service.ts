import { getHotmartConfig } from "@/lib/hotmart/config"
import { hotmartCheckEmail } from "@/lib/hotmart/client"
import type { HotmartEligibilityResult, HotmartSubscriptionCandidate } from "@/lib/hotmart/types"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  return []
}

function extractSubscriptionCandidates(payload: unknown): HotmartSubscriptionCandidate[] {
  const root = (payload ?? {}) as Record<string, unknown>

  const topCandidates = [
    ...toArray(root.subscriptions),
    ...toArray(root.items),
    ...toArray(root.data),
  ]

  const dataObj = (root.data ?? {}) as Record<string, unknown>
  const pageObj = (dataObj.page ?? {}) as Record<string, unknown>
  const nestedCandidates = [
    ...toArray(dataObj.subscriptions),
    ...toArray(dataObj.items),
    ...toArray(pageObj.items),
    ...toArray(pageObj.subscriptions),
  ]

  const rawCandidates = [...topCandidates, ...nestedCandidates]

  return rawCandidates
    .map((item) => {
      const row = (item ?? {}) as Record<string, unknown>
      const product = (row.product ?? {}) as Record<string, unknown>
      const offer = (row.offer ?? {}) as Record<string, unknown>
      const buyer = (row.buyer ?? row.customer ?? {}) as Record<string, unknown>

      return {
        subscriptionId: String(row.subscription_id ?? row.subscriptionId ?? row.id ?? "").trim() || undefined,
        status: String(row.status ?? row.subscription_status ?? row.state ?? "").trim() || undefined,
        productId:
          String(product.id ?? row.product_id ?? row.productId ?? row.product ?? "").trim() || undefined,
        offerId: String(offer.id ?? row.offer_id ?? row.offerId ?? row.offer ?? "").trim() || undefined,
        customerId:
          String(buyer.id ?? row.customer_id ?? row.customerId ?? row.buyer_id ?? "").trim() || undefined,
      } satisfies HotmartSubscriptionCandidate
    })
    .filter((candidate) => Boolean(candidate.subscriptionId || candidate.productId || candidate.offerId))
}

function extractCustomerFound(payload: unknown): boolean {
  const root = (payload ?? {}) as Record<string, unknown>
  if (typeof root.customerFound === "boolean") return root.customerFound
  if (typeof root.found === "boolean") return root.found

  const dataObj = (root.data ?? {}) as Record<string, unknown>
  if (typeof dataObj.customerFound === "boolean") return dataObj.customerFound
  if (typeof dataObj.found === "boolean") return dataObj.found

  const subscriptions = extractSubscriptionCandidates(payload)
  return subscriptions.length > 0
}

function isActiveSubscriptionStatus(status: string | undefined): boolean {
  if (!status) return false
  const normalized = status.trim().toLowerCase()
  return ["active", "approved", "trialing", "paid"].includes(normalized)
}

function matchesAllowedIds(candidate: HotmartSubscriptionCandidate): boolean {
  const config = getHotmartConfig()

  const allowedByProduct =
    config.allowedProductIds.size > 0 && candidate.productId
      ? config.allowedProductIds.has(candidate.productId)
      : false

  const allowedByOffer =
    config.allowedOfferIds.size > 0 && candidate.offerId
      ? config.allowedOfferIds.has(candidate.offerId)
      : false

  if (config.allowedProductIds.size > 0 && config.allowedOfferIds.size > 0) {
    return allowedByProduct || allowedByOffer
  }

  if (config.allowedProductIds.size > 0) return allowedByProduct
  if (config.allowedOfferIds.size > 0) return allowedByOffer
  return false
}

export async function checkHotmartEligibilityByEmail(email: string): Promise<HotmartEligibilityResult> {
  const normalizedEmail = normalizeEmail(email)

  try {
    const raw = await hotmartCheckEmail(normalizedEmail)
    const customerFound = extractCustomerFound(raw)
    const candidates = extractSubscriptionCandidates(raw)

    const eligible = candidates.find(
      (candidate) => isActiveSubscriptionStatus(candidate.status) && matchesAllowedIds(candidate)
    )

    if (eligible) {
      return {
        email: normalizedEmail,
        customerFound,
        hasEligibleActivePlan: true,
        status: "active",
        reasonCode: "ACTIVE_MATCH",
        matchedProductId: eligible.productId,
        matchedOfferId: eligible.offerId,
        subscriptionId: eligible.subscriptionId,
        hotmartCustomerId: eligible.customerId,
        raw,
      }
    }

    return {
      email: normalizedEmail,
      customerFound,
      hasEligibleActivePlan: false,
      status: "inactive",
      reasonCode: customerFound ? "NO_ACTIVE_MATCH" : "NOT_FOUND",
      raw,
    }
  } catch (error) {
    return {
      email: normalizedEmail,
      customerFound: false,
      hasEligibleActivePlan: false,
      status: "error",
      reasonCode: "API_ERROR",
      raw: error instanceof Error ? { message: error.message } : { error: "unknown" },
    }
  }
}
