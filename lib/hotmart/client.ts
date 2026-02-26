import { assertHotmartConfig } from "@/lib/hotmart/config"

function toBase64(value: string): string {
  return Buffer.from(value).toString("base64")
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "")
}

function resolveEndpointUrl(config: ReturnType<typeof assertHotmartConfig>, email: string): URL {
  const vars = {
    email,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    apiKey: config.apiKey,
  }

  let url: URL
  if (config.checkEmailUrl) {
    url = new URL(applyTemplate(config.checkEmailUrl, vars))
  } else {
    url = new URL(config.checkEmailPath, config.baseUrl)
  }

  if (config.checkEmailQueryTemplate) {
    const query = applyTemplate(config.checkEmailQueryTemplate, vars)
    const params = new URLSearchParams(query)
    params.forEach((value, key) => url.searchParams.set(key, value))
  }

  return url
}

function buildHeaders(config: ReturnType<typeof assertHotmartConfig>, email: string): HeadersInit {
  const headers: Record<string, string> = {
    ...config.extraHeaders,
  }

  const vars = {
    email,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    apiKey: config.apiKey,
  }

  for (const [key, value] of Object.entries(headers)) {
    headers[key] = applyTemplate(value, vars)
  }

  const authBasic = config.clientId && config.clientSecret
    ? `Basic ${toBase64(`${config.clientId}:${config.clientSecret}`)}`
    : ""

  const authHeaderValue =
    config.apiKey
      ? `${config.authPrefix} ${config.apiKey}`.trim()
      : authBasic

  if (authHeaderValue && config.authHeaderName) {
    headers[config.authHeaderName] = authHeaderValue
  }

  return headers
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: "no-store" })
  } finally {
    clearTimeout(timeout)
  }
}

export async function hotmartCheckEmail(email: string): Promise<unknown> {
  const config = assertHotmartConfig()
  const url = resolveEndpointUrl(config, email)

  let lastError: unknown = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const method = config.checkEmailMethod || "POST"
      const headers = buildHeaders(config, email) as Record<string, string>
      let requestBody: string | undefined

      if (method !== "GET" && method !== "HEAD") {
        headers["Content-Type"] = config.contentType
        requestBody = applyTemplate(config.checkEmailBodyTemplate, {
          email,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          apiKey: config.apiKey,
        })
      }

      const response = await fetchWithTimeout(
        url,
        {
          method,
          headers,
          body: requestBody,
        },
        15000
      )

      const contentType = response.headers.get("content-type") || ""
      const responseBody = contentType.includes("application/json")
        ? await response.json()
        : await response.text()

      if (!response.ok) {
        throw new Error(`Hotmart API error (${response.status})`)
      }

      return responseBody
    } catch (error) {
      lastError = error
      if (attempt === 1) break
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Hotmart API request failed")
}
