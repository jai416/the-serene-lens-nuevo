import { logger } from "@/lib/logger"
import { searchKnowledge } from "@/lib/bot-knowledge"
import { getNextGeminiKey } from "@/lib/gemini-keys"

export async function generateBotResponse(userMessage: string, chatId: string, userName?: string): Promise<{ text: string; knowledgeId?: string }> {
  try {
    const results = await searchKnowledge(userMessage, 3)

    let context = ""
    let primaryId: string | undefined

    if (results.length > 0) {
      context = results.map((r, i) => `[${i + 1}] ${r.title}:\n${r.content}`).join("\n\n")
      primaryId = results[0].id
    }

    const prompt = `Eres un asistente virtual de The Serene Lens, una app de análisis de piel con IA.

Instrucciones:
- Responde de forma amable y profesional en español.
- Si tienes contexto, úsalo para responder. Si no, responde que no tienes esa información.
- NO inventes información que no esté en el contexto.
- Siempre despídete cordialmente.

${context ? `Contexto disponible:\n${context}\n\n` : "No hay contexto disponible para esta consulta."}

Usuario: ${userMessage}

Responde en máximo 3 párrafos.`

    const key = getNextGeminiKey()
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Gemini error ${res.status}: ${text}`)
    }

    const data = await res.json()
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (content) {
      return { text: content, knowledgeId: primaryId }
    }

    // Fallback: use knowledge directly if AI fails
    if (results.length > 0) {
      return {
        text: `📚 Según la información disponible:\n\n${results[0].content.slice(0, 400)}`,
        knowledgeId: primaryId,
      }
    }

    return {
      text: "Lo siento, no encontré información sobre eso. ¿Quieres preguntar a un administrador? Escribe /ayuda para más opciones.",
    }
  } catch (e) {
    logger.error("Bot RAG error", { error: e, chatId })

    // Ultimate fallback: return first knowledge result
    try {
      const results = await searchKnowledge(userMessage, 1)
      if (results.length > 0) {
        return {
          text: `📚 ${results[0].content.slice(0, 400)}`,
          knowledgeId: results[0].id,
        }
      }
    } catch {}

    return {
      text: "Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo más tarde.",
    }
  }
}
