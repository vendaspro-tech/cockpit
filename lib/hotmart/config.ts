function parseCsvSet(value: string | undefined): Set<string> {
  if (!value) return new Set()
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

function parseJsonObject(value: string | undefined): Record<string, string> {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, item]) => [key, String(item)])
    )
  } catch {
    return {}
  }
}

export function getHotmartConfig() {
  return {
    baseUrl: process.env.HOTMART_API_BASE_URL?.trim() || "",
    checkEmailUrl: process.env.HOTMART_API_CHECK_EMAIL_URL?.trim() || "",
    checkEmailPath: process.env.HOTMART_API_CHECK_EMAIL_PATH?.trim() || "",
    checkEmailMethod: (process.env.HOTMART_API_CHECK_EMAIL_METHOD?.trim().toUpperCase() || "POST"),
    checkEmailBodyTemplate:
      process.env.HOTMART_API_CHECK_EMAIL_BODY_TEMPLATE?.trim() || '{"email":"{{email}}"}',
    checkEmailQueryTemplate: process.env.HOTMART_API_CHECK_EMAIL_QUERY_TEMPLATE?.trim() || "",
    contentType: process.env.HOTMART_API_CONTENT_TYPE?.trim() || "application/json",
    authHeaderName: process.env.HOTMART_API_AUTH_HEADER?.trim() || "Authorization",
    authPrefix: process.env.HOTMART_API_AUTH_PREFIX?.trim() || "Bearer",
    apiKey: process.env.HOTMART_API_KEY?.trim() || "",
    clientId: process.env.HOTMART_API_CLIENT_ID?.trim() || "",
    clientSecret: process.env.HOTMART_API_CLIENT_SECRET?.trim() || "",
    extraHeaders: parseJsonObject(process.env.HOTMART_API_EXTRA_HEADERS_JSON),
    allowedProductIds: parseCsvSet(process.env.HOTMART_ALLOWED_PRODUCT_IDS),
    allowedOfferIds: parseCsvSet(process.env.HOTMART_ALLOWED_OFFER_IDS),
    subscriptionUrl: process.env.HOTMART_SUBSCRIPTION_URL?.trim() || "",
  }
}

export function getHotmartSubscriptionUrl(): string | null {
  const url = process.env.HOTMART_SUBSCRIPTION_URL?.trim()
  return url || null
}

export function assertHotmartConfig() {
  const config = getHotmartConfig()

  const hasEndpoint = Boolean(config.checkEmailUrl || (config.baseUrl && config.checkEmailPath))
  if (!hasEndpoint) {
    throw new Error("Hotmart integration is enabled but check-email endpoint URL/PATH is missing")
  }

  const hasCredential =
    Boolean(config.apiKey) || Boolean(config.clientId) || Boolean(config.clientSecret)
  if (!hasCredential) {
    throw new Error("Hotmart integration is enabled but API credentials are missing")
  }

  if (config.allowedProductIds.size === 0 && config.allowedOfferIds.size === 0) {
    throw new Error("Hotmart integration is enabled but no allowed product/offer IDs are configured")
  }

  return config
}
