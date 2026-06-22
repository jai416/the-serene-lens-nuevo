import { db } from "@/lib/db"
import { SEO_KEYWORDS } from "@/lib/seo-keywords"

function getEnv() {
  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  }
}

const KEYWORD_CONTEXT: Record<string, string> = {
  "cómo saber mi tipo de piel": "Enfócate en métodos prácticos: test del papel, observación matutina, análisis con IA. Explica las diferencias entre tipos.",
  "rutina de skincare para piel grasa": "Enfócate en ingredientes: niacinamida, ácido salicílico, ácido hialurónico. Rutina mañana y noche.",
  "mejores ingredientes para piel sensible": "Enfócate en ingredientes suaves: centella, aloe vera, avena, bisabolol. Evitar fragancias y alcohol.",
  "cómo eliminar puntos negros": "Enfócate en prevención y tratamiento: ácido salicílico, niacinamida, extracción profesional. No exprimir.",
  "crema hidratante para piel mixta": "Enfócate en texturas ligeras, ingredientes no comedogénicos. Diferencia entre zona T y mejillas.",
  "protector solar para piel grasa": "Enfócate en protección mineral vs química, texturas oil-free, sin residuos blancos.",
  "ácido hialurónico beneficios": "Enfócate en hidratación, tipos de moléculas, cómo funciona, con qué combinarlo.",
  "retinol para principiantes": "Enfócate en concentraciones bajas, frecuencia, protección solar, efectos secundarios normales.",
  "diferencia entre piel grasa y deshidratada": "Enfócate en que son conceptos diferentes. Piel grasa produce sebo, piel deshidratada falta de agua.",
  "skincare para hombres": "Enfócate en rutina simple, afeitado, diferencias de piel masculina, productos multiusos.",
  "cómo cuidar la piel en verano": "Enfócate en protección solar, texturas ligeras, hidratación, antioxidantes.",
  "cómo cuidar la piel en invierno": "Enfócate en hidratación intensa, barrera cutánea, aceites, exfoliación suave.",
  "piel seca vs piel deshidratada": "Enfócate en causas diferentes. Piel seca = poca producción de sebo. Piel deshidratada = falta de agua.",
  "cómo elegir tu rutina de skincare": "Enfócate en pasos: identificar tipo de piel, elegir limpiador, hidratante, protector solar.",
  "ingredientes que debes evitar según tu piel": "Enfócate en fragancias, alcohol denat, sulfatos agresivos, comedogénicos para piel grasa.",
  "cómo saber si un producto es bueno para tu piel": "Enfócate en lista de INCI, positiones en la lista, certificaciones, patch test.",
  "qué es el pH de la piel": "Enfócate en barrera cutánea, pH ácido (4.5-5.5), por qué importa, cómo mantenerlo.",
  "cómo mejorar la textura de la piel": "Enfócate en exfoliación química, retinol, hidratación, paciencia.",
  "cómo reducir los poros abiertos": "Enfócate en que los poros no se abren/cierran. Niacinamida, arcilla, protección solar.",
  "cómo eliminar manchas de la piel": "Enfócate en vitamina C, ácido azelaico, protección solar, derivados de retinol.",
}

/**
 * Generates a blog article via OpenRouter AI for a given keyword.
 * Returns the article data ready to be saved as a BlogPost.
 */
export async function generateArticle(keyword: string): Promise<{
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  readTime: number
  metaDescription: string
}> {
  const env = getEnv()
  const context = KEYWORD_CONTEXT[keyword] || ""

  const prompt = `Eres un experto en skincare y dermatología cosmética. Escribe un artículo de blog optimizado SEO sobre: "${keyword}".

${context ? `Contexto específico: ${context}` : ""}

El artículo debe tener:
- Título llamativo con la keyword
- Introducción (100 palabras)
- 5 subtítulos H2 con información útil
- 1 subtítulo H3 con enlace a The Serene Lens
- Conclusión (100 palabras)
- Meta descripción SEO (155 caracteres máx)

Reglas:
- Usa lenguaje claro y accesible
- No inventes diagnósticos médicos
- Incluye recomendaciones prácticas
- Usa formato markdown
- El tono es amigable y profesional
- Incluye datos concretos cuando sea posible
- Responde directamente a la búsqueda del usuario

Enlace obligatorio en cada artículo:
"Si no sabes tu tipo de piel, puedes usar The Serene Lens (theserenelens.com), nuestra herramienta gratuita que analiza tu piel con IA y te recomienda productos personalizados."

Responde en JSON válido (sin markdown):
{
  "title": "título del artículo",
  "slug": "slug-para-url",
  "excerpt": "resumen de 160 caracteres",
  "content": "contenido markdown completo",
  "category": "cuidado-basico|rutinas|ingredientes|proteccion-solar|problemas-de-piel",
  "readTime": 5,
  "metaDescription": "meta descripción 155 chars"
}`

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      signal: AbortSignal.timeout(60000),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  const parsed = JSON.parse(content)
  parsed.readTime = typeof parsed.readTime === "string" ? parseInt(parsed.readTime, 10) || 5 : parsed.readTime || 5
  return parsed
}

/**
 * Generates an article from a random unused keyword and saves it to the database.
 * Returns the created BlogPost or null if all keywords are used.
 */
export async function generateAndSaveArticle() {
  const existingSlugs = await db.blogPost.findMany({
    select: { slug: true },
  })
  const usedSlugs = new Set(existingSlugs.map((p) => p.slug))

  const unused = SEO_KEYWORDS.filter((k) => !usedSlugs.has(k.slug))
  if (unused.length === 0) return null

  const selected = unused[Math.floor(Math.random() * unused.length)]

  const article = await generateArticle(selected.keyword)

  return db.blogPost.create({
    data: {
      title: article.title,
      slug: selected.slug,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category || "cuidado-basico",
      image: "",
      published: true,
      publishedAt: new Date(),
      readTime: article.readTime || 5,
      tags: JSON.stringify([selected.keyword]),
    },
  })
}

/**
 * Generates multiple articles in sequence (for cron jobs).
 */
export async function generateBatchArticles(count: number): Promise<number> {
  let created = 0
  for (let i = 0; i < count; i++) {
    try {
      const article = await generateAndSaveArticle()
      if (article) created++
    } catch {
      // skip failed article
    }
  }
  return created
}
