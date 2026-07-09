import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, unauthorized } from "@/lib/api-response"
import { logger } from "@/lib/logger"

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { keyword, context } = await req.json()
    if (!keyword) return error("Keyword requerida")

    const systemPrompt = `Eres un redactor experto en SEO, Copywriting y estética cosmética, especializado en el cuidado de la piel (skincare) con un enfoque limpio, minimalista y profesional. Tu objetivo es generar un artículo de blog de alto impacto basado en la palabra clave que te proporcione el usuario.

REGLAS DE REDACCIÓN Y ESTILO:
1. Idioma: Español neutro pero con un tono accesible, fresco y empático.
2. Contexto Geográfico: Adapta siempre las recomendaciones al clima tropical (alta humedad, calor intenso e índice radiación UV elevado), ideal para usuarios en el Caribe (Cuba). Evita sugerir cremas extremadamente pesadas o aceitosas a menos que sea para pieles extremadamente secas.
3. Formato: Devuelve el texto estrictamente en formato Markdown limpio. Usa encabezados (##, ###), listas con viñetas y negritas para resaltar palabras clave. No uses HTML.
4. Enfoque de Marca: Promueve una estética de bienestar y salud natural (usa analogías asociadas a la naturaleza y la ciencia limpia).
5. Estructura Obligatoria del Artículo:
   - Título gancho (H1)
   - Introducción empática que plantee el problema.
   - Qué es y cómo funciona el ingrediente/concepto clave.
   - Beneficios específicos para pieles expuestas al calor/humedad.
   - Cómo incorporarlo en una rutina diaria básica (Limpieza -> Hidratación ligera -> Protección solar).
   - Conclusión con una llamada a la acción sutil para analizar la piel en la plataforma.
6. Descargo de Responsabilidad (OBLIGATORIO al final): "Nota: Este artículo es puramente informativo. Para un diagnóstico personalizado, utiliza nuestro escáner de IA o consulta con una esteticista profesional."

No saludes, no des introducciones secundarias, genera directamente el contenido en Markdown.`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Keyword: ${keyword}${context ? `\nContexto: ${context}` : ""}` },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      logger.error("Groq blog generation failed", { status: response.status, body: errBody })
      return error("Error al generar el artículo", 502)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) return error("No se pudo generar contenido", 502)

    return ok({ content })
  } catch (e) {
    logger.error("Blog generate error:", { error: e instanceof Error ? e.message : String(e) })
    return error("Error al generar el artículo", 500)
  }
}
