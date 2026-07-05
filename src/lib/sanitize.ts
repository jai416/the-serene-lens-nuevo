export function sanitizeHtml(text: string): string {
  if (typeof text !== "string") return ""
  return text
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj }
  for (const field of fields) {
    if (typeof result[field] === "string") {
      result[field] = sanitizeHtml(result[field] as string) as T[keyof T]
    }
  }
  return result
}
