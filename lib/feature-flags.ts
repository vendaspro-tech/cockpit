function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) return false

  const normalized = value.trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on"
}

export function isHotmartAccessControlEnabled(): boolean {
  return parseBooleanFlag(process.env.FEATURE_HOTMART_ACCESS_CONTROL)
}

