import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { z } from "zod"

const schema = z.object({
  observation: z.string().min(1).max(500),
})

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

    const prompt = `Eres un dermatólogo con 20 años de experiencia, especializado en cosmeticología. Explica de forma CLARA, CONCRETA y en ESPAÑOL esta observación de análisis de piel:

"${parsed.data.observation}"

Tipo de piel del usuario: ${analysis.skinType || "No especificado"}
Preocupaciones: ${analysis.concerns || "No especificadas"}

Responde en este formato JSON (sin markdown, solo JSON):
{
  "que_significa": "Explicación breve de qué significa esta observación (2-3 oraciones)",
  "por_que_ocurre": ["Causa 1", "Causa 2", "Causa 3"],
  "ingredientes_clave": [
    { "nombre": "Nombre del ingrediente", "para_que_sirve": "explicación breve", "como_usarlo": "cómo incorporarlo en rutina" }
  ],
  "ajuste_rutina": "Recomendación específica de cómo ajustar la rutina diaria para mejorar esto",
  "tiempo_mejora": "Tiempo estimado para ver mejoras con constancia"
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
        max_tokens: 1500,
      }),
    })

    if (!response.ok) return serverError(new Error("AI request failed"))
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""
    
    // Try to parse JSON from response
    let explanation
    try {
      // Remove markdown code blocks if present
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      explanation = JSON.parse(clean)
    } catch {
      explanation = { que_significa: text, ingredientes_clave: [], por_que_ocurre: [] }
    }

    return ok({ explanation })
  } catch (e) { return serverError(e) }
}
