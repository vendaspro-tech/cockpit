export type HotmartAccessStatus = "active" | "inactive" | "unknown" | "error"

export type HotmartEligibilityReasonCode =
  | "ACTIVE_MATCH"
  | "NOT_FOUND"
  | "NO_ACTIVE_MATCH"
  | "API_ERROR"

export interface HotmartEligibilityResult {
  email: string
  customerFound: boolean
  hasEligibleActivePlan: boolean
  status: HotmartAccessStatus
  reasonCode: HotmartEligibilityReasonCode
  matchedProductId?: string
  matchedOfferId?: string
  subscriptionId?: string
  hotmartCustomerId?: string
  raw?: unknown
}

export interface HotmartSubscriptionCandidate {
  subscriptionId?: string
  status?: string
  productId?: string
  offerId?: string
  customerId?: string
}

export interface WorkspaceHotmartAccessRecordInput {
  workspaceId: string
  ownerUserId: string
  ownerEmail: string
  status: HotmartAccessStatus
  lastVerifiedSource: "onboarding" | "cron" | "manual"
  lastStatusReason?: string | null
  lastErrorMessage?: string | null
  lastErrorAt?: string | null
  hotmartCustomerId?: string | null
  hotmartSubscriptionId?: string | null
  hotmartProductId?: string | null
  hotmartOfferId?: string | null
  rawResponse?: unknown
}

export interface WorkspaceOwnerSyncTarget {
  workspaceId: string
  ownerUserId: string
  ownerEmail: string
}

