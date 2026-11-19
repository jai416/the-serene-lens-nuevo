import { logger } from "@/lib/logger"

/**
 * Fuentes del recolector de tendencias con protección SSRF.
 *
 * Solo se permite salir hacia hosts de la allowlist: una URL que venga de
 * cualquier otra parte (RSS, BD, usuario) jamás se fetcha. Cada petición
 * tiene timeout y un reintento con backoff.
 */

export const ALLOWED_HOSTS = new Set([
  "eutils.ncbi.nlm.nih.gov",   // PubMed — evidencia científica
  "www.ncbi.nlm.nih.gov",
  "ec.europa.eu",              // COSING — ingredientes oficiales UE
  "en.wikipedia.org",          // explicadores de ingredientes
  "en.m.wikipedia.org",
])

export class SourceFetchError extends Error {
  constructor(message: string, public url: string) {
    super(message)
    this.name = "SourceFetchError"
  }
}

/** Valida que una URL apunte a un host permitido (anti-SSRF). */
export function isAllowedUrl(raw: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return false
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false
  // Bloquea credenciales, IPs directas y hosts no listados
  if (parsed.username || parsed.password) return false
  if (!ALLOWED_HOSTS.has(parsed.hostname)) return false
  return true
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * GET a una fuente allowlistada. 1 reintento con backoff de 1s.
 * Devuelve el texto; lanza SourceFetchError si algo falla.
 */
export async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  if (!isAllowedUrl(url)) {
    throw new SourceFetchError(`Host no permitido: ${url}`, url)
  }

  let lastError: unknown = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "TheSereneLens-TrendCollector/1.0" },
        redirect: "error", // no seguir redirecciones: evita escapar de la allowlist
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      lastError = e
      logger.warn("Source fetch failed, retrying", { url, attempt, error: e instanceof Error ? e.message : String(e) })
      if (attempt === 1) await sleep(1000)
    }
  }
  throw new SourceFetchError(`Fallo tras reintento: ${lastError instanceof Error ? lastError.message : String(lastError)}`, url)
}

/** Igual que fetchText pero parsea JSON. */
export async function fetchJson<T = unknown>(url: string, timeoutMs = 15000): Promise<T> {
  const text = await fetchText(url, timeoutMs)
  try {
    return JSON.parse(text) as T
  } catch (e) {
    throw new SourceFetchError(`Respuesta no válida: ${e instanceof Error ? e.message : String(e)}`, url)
  }
}

/** Slug estable para deduplicar tendencias. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
}
