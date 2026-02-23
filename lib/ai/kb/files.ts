import pdfParse from "pdf-parse"

const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/csv",
  "text/comma-separated-values",
  "application/vnd.ms-excel",
  "application/pdf",
  "application/octet-stream",
])
const ALLOWED_EXTENSIONS = new Set(["pdf", "txt", "csv"])

export const KB_MAX_SIZE_BYTES = 25 * 1024 * 1024

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export function getFileExtension(name: string) {
  const value = name.toLowerCase().split(".").pop()
  return value || ""
}

export function isAllowedKbFile(file: File) {
  const ext = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.has(ext)) return false
  return file.type === "" || ALLOWED_MIME_TYPES.has(file.type)
}

export function resolveKbContentType(file: File) {
  const ext = getFileExtension(file.name)
  if (ext === "pdf") return "application/pdf"
  if (ext === "csv") return "text/csv"
  return "text/plain"
}

export async function extractKbText(file: File, buffer: Buffer) {
  if (file.type === "application/pdf" || getFileExtension(file.name) === "pdf") {
    const parsed = await pdfParse(buffer)
    return parsed.text?.trim() || ""
  }
  return buffer.toString("utf-8").trim()
}
