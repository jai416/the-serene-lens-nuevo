import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, notFound, serverError } from "@/lib/api-response"
import { groqChatJSON } from "@/lib/groq-chat"

const SYSTEM = "Eres un coach de skincare con experiencia en dermatología. Responde exclusivamente en español. Diseña planes de mejora personalizados de 30 días. Devuelve los datos estructurados en formato JSON exacto."

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await params
    const analysis = await db.skinAnalysis.findUnique({ where: { id } })
    if (!analysis || analysis.userId !== session.user.id) return notFound()

    const prompt = `Diseña un PLAN DE MEJORA DE 30 DÍAS personalizado.

Tipo de piel: ${analysis.skinType || "No especificado"}
Preocupaciones: ${analysis.concerns || "No especificadas"}
Recomendaciones originales: ${analysis.recommendations || "No especificadas"}

Genera un plan semanal (4 semanas) con metas progresivas:

{
  "resumen": "Resumen del plan en 1-2 oraciones",
  "objetivo_principal": "Objetivo principal de 30 días",
  "semanas": [
    {
      "numero": 1,
      "titulo": "Título de la semana",
      "enfoque": "Enfoque principal",
      "metas": ["Meta 1", "Meta 2", "Meta 3"],
      "tips": ["Tip 1", "Tip 2"],
      "productos_sugeridos": ["Producto 1", "Producto 2"]
    }
  ],
  "seguimiento": "Cómo medir el progreso"
}`

    const plan = await groqChatJSON<Record<string, unknown>>(
      [{ role: "user", content: prompt }],
      { temperature: 0.7, maxTokens: 2500, system: SYSTEM }
    )

    return ok({ plan })
  } catch (e) { return serverError(e) }
}
