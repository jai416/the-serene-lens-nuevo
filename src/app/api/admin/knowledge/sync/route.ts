import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

const PAGES_TO_SYNC = [
  { url: "/", title: "Inicio - The Serene Lens", category: "general", subcategory: "faq", priority: 10 },
  { url: "/pricing", title: "Planes y Precios", category: "pricing", subcategory: "faq", priority: 10 },
  { url: "/about", title: "Sobre Nosotros", category: "general", subcategory: "faq", priority: 5 },
  { url: "/contact", title: "Contacto", category: "support", subcategory: "faq", priority: 5 },
  { url: "/ingredients-analyzer", title: "Analizador de Ingredientes", category: "analysis", subcategory: "faq", priority: 8 },
  { url: "/products", title: "Productos", category: "product", subcategory: "faq", priority: 5 },
  { url: "/guides", title: "Guías Digitales", category: "general", subcategory: "guide", priority: 5 },
  { url: "/analysis", title: "Análisis de Piel", category: "analysis", subcategory: "tutorial", priority: 10 },
  { url: "/dashboard", title: "Dashboard de Usuario", category: "support", subcategory: "tutorial", priority: 5 },
  { url: "/community", title: "Comunidad", category: "general", subcategory: "faq", priority: 3 },
  { url: "/blog", title: "Blog de Skincare", category: "blog", subcategory: "faq", priority: 5 },
  { url: "/terms", title: "Términos y Condiciones", category: "general", subcategory: "faq", priority: 2 },
  { url: "/privacy", title: "Política de Privacidad", category: "general", subcategory: "faq", priority: 2 },
  { url: "/faq", title: "Preguntas Frecuentes", category: "general", subcategory: "faq", priority: 8 },
]

async function fetchPageContent(url: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  try {
    const res = await fetch(`${baseUrl}${url}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return ""
    const html = await res.text()
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    return text.slice(0, 3000)
  } catch {
    return ""
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    let created = 0
    let updated = 0
    let failed = 0

    for (const page of PAGES_TO_SYNC) {
      try {
        const content = await fetchPageContent(page.url)
        const keywords = page.title.toLowerCase().split(" ").filter((w) => w.length > 3)

        const existing = await db.botKnowledge.findFirst({
          where: { title: page.title },
        })

        if (existing) {
          await db.botKnowledge.update({
            where: { id: existing.id },
            data: {
              content: content || existing.content,
              version: existing.version + 1,
              updatedAt: new Date(),
              updatedBy: session.user.id,
            },
          })
          updated++
        } else {
          await db.botKnowledge.create({
            data: {
              title: page.title,
              content: content || `Contenido de ${page.title}`,
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

    logger.info("Knowledge sync completed", { created, updated, failed })
    return ok({ created, updated, failed, total: PAGES_TO_SYNC.length })
  } catch (e) {
    logger.error("Knowledge sync error", { error: e })
    return serverError(e)
  }
}
