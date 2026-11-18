import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { validateCsrf } from "@/lib/csrf-middleware"

const PAGES_TO_SYNC = [
  { url: "/", title: "Inicio - The Serene Lens", category: "general", subcategory: "faq", priority: 10 },
  { url: "/pricing", title: "Planes y Precios", category: "pricing", subcategory: "faq", priority: 10 },
  { url: "/about", title: "Sobre Nosotros", category: "general", subcategory: "faq", priority: 5 },
  { url: "/contact", title: "Contacto", category: "support", subcategory: "faq", priority: 5 },
  { url: "/ingredients-analyzer", title: "Analizador de Ingredientes", category: "analysis", subcategory: "faq", priority: 8 },
  { url: "/products", title: "Productos", category: "product", subcategory: "faq", priority: 5 },
  { url: "/guides", title: "Guías Digitales", category: "general", subcategory: "guide", priority: 5 },
  { url: "/analysis", title: "Análisis de Piel", category: "analysis", subcategory: "tutorial", priority: 10 },
  { url: "/community", title: "Comunidad", category: "general", subcategory: "faq", priority: 3 },
  { url: "/blog", title: "Blog de Skincare", category: "blog", subcategory: "faq", priority: 5 },
  { url: "/terms", title: "Términos y Condiciones", category: "general", subcategory: "faq", priority: 2 },
  { url: "/privacy", title: "Política de Privacidad", category: "general", subcategory: "faq", priority: 2 },
]

/**
 * Extrae el contenido útil de una página (sin navegación, header ni footer).
 *
 * Antes se hacía `html.replace(/<[^>]*>/g, " ")` sobre TODO el HTML: el
 * resultado era el chrome de la web ("The Serene Lens | ... Inicio Productos
 * ...") y no el contenido de la página, lo que envenenaba el RAG del bot.
 */
async function fetchPageContent(url: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  try {
    const res = await fetch(`${baseUrl}${url}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return ""
    const html = await res.text()

    // El layout de la app envuelve el contenido en <main id="main-content">
    const main =
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
      ""

    if (!main) return ""

    const text = main
      .replace(/<(script|style|nav|footer|header|aside|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Si no hay texto suficiente, la página no aporta nada al RAG
    return text.length >= 200 ? text.slice(0, 3000) : ""
  } catch {
    return ""
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:knowledge:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    let created = 0
    let updated = 0
    let skipped = 0
    let failed = 0

    for (const page of PAGES_TO_SYNC) {
      try {
        const content = await fetchPageContent(page.url)
        const keywords = page.title.toLowerCase().split(" ").filter((w) => w.length > 3)

        const existing = await db.botKnowledge.findFirst({
          where: { title: page.title },
        })

        if (existing) {
          if (!content) {
            failed++
            continue
          }
          // No se pisa contenido curado a mano: solo se reemplaza si está vacío
          // o es un placeholder (contenido pobre scraped de páginas).
          const isPlaceholder = existing.content.trim().length < 200
          if (!isPlaceholder) {
            skipped++
            continue
          }
          await db.botKnowledge.update({
            where: { id: existing.id },
            data: {
              content,
              version: existing.version + 1,
              updatedAt: new Date(),
              updatedBy: session.user.id,
            },
          })
          updated++
        } else {
          // Sin contenido real no se crea la entrada (evita placeholders en el RAG)
          if (!content) {
            failed++
            continue
          }
          await db.botKnowledge.create({
            data: {
              title: page.title,
              content,
              category: page.category,
              subcategory: page.subcategory,
              source: "web",
              sourceUrl: page.url,
              priority: page.priority,
              keywords,
              synonyms: [],
              enabled: true,
            },
          })
          created++
        }
      } catch {
        failed++
      }
    }

    logger.info("Knowledge sync completed", { created, updated, skipped, failed })
    return ok({ created, updated, skipped, failed, total: PAGES_TO_SYNC.length })
  } catch (e) {
    logger.error("Knowledge sync error", { error: e })
    return serverError(e)
  }
}
