import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await params
    const analysis = await db.skinAnalysis.findUnique({ where: { id } })
    if (!analysis || analysis.userId !== session.user.id) return notFound()

    const prompt = `Eres un coach de skincare con experiencia en dermatología. Diseña un PLAN DE MEJORA DE 30 DÍAS personalizado.

Tipo de piel: ${analysis.skinType || "No especificado"}
Preocupaciones: ${analysis.concerns || "No especificadas"}
Recomendaciones originales: ${analysis.recommendations || "No especificadas"}

Genera un plan semanal (4 semanas) con metas progresivas. Responde SOLO con JSON (sin markdown):

{
  "resumen": "Resumen del plan en 1-2 oraciones",
  "objetivo_principal": "Objetivo principal de 30 días",
  "semanas": [
    {
      "numero": 1,
      "titulo": "Título de la semana",
      "enfoque": "Enfoque principal de esta semana",
      "metas": ["Meta 1", "Meta 2", "Meta 3"],
      "tips": ["Tip 1", "Tip 2"],
      "productos_sugeridos": ["Producto 1", "Producto 2"]
    }
  ],
  "seguimiento": "Cómo medir el progreso"
}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    })

    if (!response.ok) return serverError(new Error("AI request failed"))
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""
    
    let plan
    try {
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      plan = JSON.parse(clean)
    } catch {
      plan = { resumen: text, semanas: [] }
    }

    return ok({ plan })
  } catch (e) { return serverError(e) }
}
