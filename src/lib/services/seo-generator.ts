import { db } from "@/lib/db"
import { SEO_KEYWORDS } from "@/lib/seo-keywords"
import { groqChatJSON } from "@/lib/groq-chat"

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
  "niacinamida beneficios para la piel": "Enfócate en regulación de sebo, reducción de poros, fortalecimiento de barrera, antiinflamatorio.",
  "cómo usar ácido glicólico": "Enfócate en concentraciones (5-10%), frecuencia (2-3 veces/semana), uso en noche, protección solar.",
  "skincare después de los 30": "Enfócate en prevención de arrugas, retinol, antioxidantes, colágeno, hidratación profunda.",
  "skincare después de los 40": "Enfócate en antiedad avanzado, péptidos, retinol, ácido hialurónico, tratamiento de manchas.",
  "cómo desinflamar la cara rápido": "Enfócate en compresas frías, centella asiática, aloe vera, árnica. Causas de hinchazón facial.",
  "aceite de árbol de té para la piel": "Enfócate en propiedades antibacterianas, uso tópico diluido, acné, puntos negros.",
  "cómo quitar ojeras naturalmente": "Enfócate en masajes, compresas frías, cafeína tópica, vitamina C. Causas: genética, sueño.",
  "colágeno beneficios para la piel": "Enfócate en suplementación oral, producción natural, alimentos ricos, combinación con vitamina C.",
  "cómo prevenir arrugas": "Enfócate en protección solar diaria, retinol, antioxidantes, hidratación, hábitos saludables.",
  "exfoliante facial casero": "Enfócate en azúcar + miel, avena + yogur, ácido láctico natural. Precauciones y frecuencia.",
  "cómo cerrar poros después de limpiar": "Enfócate en tónico con ácido salicílico, agua fría, niacinamida.",
  "vitamina C serum cómo usar": "Enfócate en concentración (10-20%), uso en mañana, estabilidad del producto, combinaciones.",
  "cuidado de la piel en embarazo": "Enfócate en ingredientes seguros, evitar retinol, manchas hormonales, protección solar.",
  "cómo eliminar cicatrices de acné": "Enfócate en ácido azelaico, retinol, masajes, tratamientos profesionales. Tipos de cicatrices.",
  "tónico facial para qué sirve": "Enfócate en equilibrio de pH, hidratación adicional, preparación para siguientes pasos.",
  "mascarilla facial para piel grasa": "Enfócate en arcilla verde, carbón activado, ácido salicílico. Frecuencia y ingredientes.",
  "cómo saber si tengo piel sensible": "Enfócate en síntomas: enrojecimiento, ardor, picazón. Diferencia con piel intolerante.",
  "agua micelar para qué sirve": "Enfócate en limpieza suave, eliminación de maquillaje, función de los micelos.",
  "cuidado de la piel masculina rutina": "Enfócate en rutina 3 pasos, afeitado correcto, productos específicos.",
  "skincare vegano y cruelty free": "Enfócate en certificaciones, ingredientes a evitar, marcas recomendadas.",
  "cómo combatir puntos negros en la nariz": "Enfócate en extracción suave, ácido salicílico, arcilla, prevención con rutina.",
  "sérum de retinol mejores opciones": "Enfócate en concentraciones, retinol vs retinal vs retinoato, introducción gradual.",
  "crema para ojeras y bolsas": "Enfócate en cafeína, péptidos, vitamina C. Diferencia entre ojeras oscuras y bolsas.",
  "cómo desmanchar la piel naturalmente": "Enfócate en vitamina C, ácido azelaico, licorice, protección solar. Tiempo de resultados.",
  "limpiador facial para piel mixta": "Enfócate en geles suaves, pH balanceado, limpiar zona T sin resecar mejillas.",
  "skincare coreano rutina paso a paso": "Enfócate en 10 pasos: doble limpieza, tónico, esencia, sérum. Coreano vs occidental.",
  "cómo reparar la barrera cutánea": "Enfócate en ceramidas, ácidos grasos, colesterol. Síntomas y productos recomendados.",
  "antiedad skincare ingredientes activos": "Enfócate en retinol, péptidos, vitamina C, ácido ferúlico. Orden y compatibilidades.",
  "cómo cuidar la piel con sol directo": "Enfócate en protector SPF 50+, reaplicación cada 2h, antioxidantes, sombra.",
  "productos de skincare para principiantes": "Enfócate en kit básico: limpiador, hidratante, protector solar. Errores comunes.",
}

/**
 * Generates a blog article via Groq AI for a given keyword.
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

  const parsed = await groqChatJSON<{
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    readTime: number
    metaDescription: string
  }>(
    [{ role: "user", content: prompt }],
    {
      temperature: 0.7,
      maxTokens: 4096,
      system: "Eres un experto en skincare y dermatología cosmética. Escribe artículos de blog optimizados SEO en español. Usa lenguaje claro y accesible. No inventes diagnósticos médicos. Responde SOLO con JSON estructurado.",
    }
  )

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
