import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { z } from "zod"
import { groqChatJSON } from "@/lib/groq-chat"

const schema = z.object({
  observation: z.string().min(1).max(500),
})

const SYSTEM = "Eres un experto en análisis cosmético de piel con amplia experiencia en ingredientes activos y rutinas faciales. Responde exclusivamente en español. Explica de forma CLARA, CONCRETA las observaciones de análisis de piel. Devuelve los datos en formato JSON estructurado."

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await params
    const analysis = await db.skinAnalysis.findUnique({ where: { id } })
    if (!analysis || analysis.userId !== session.user.id) return notFound()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error("Observación inválida", 400)

    const prompt = `Observación: "${parsed.data.observation}"

Tipo de piel del usuario: ${analysis.skinType || "No especificado"}
Preocupaciones: ${analysis.concerns || "No especificadas"}

Responde en este formato JSON:
{
  "que_significa": "Explicación breve (2-3 oraciones)",
  "por_que_ocurre": ["Causa 1", "Causa 2", "Causa 3"],
  "ingredientes_clave": [
    { "nombre": "Ingrediente", "para_que_sirve": "explicación", "como_usarlo": "cómo incorporarlo" }
  ],
  "ajuste_rutina": "Recomendación específica de ajuste de rutina",
  "tiempo_mejora": "Tiempo estimado para ver mejoras"
}`

    const explanation = await groqChatJSON<Record<string, unknown>>(
      [{ role: "user", content: prompt }],
      { temperature: 0.7, maxTokens: 1500, system: SYSTEM }
    )

    return ok({ explanation })
  } catch (e) { return serverError(e) }
}
