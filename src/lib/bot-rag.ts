import { logger } from "@/lib/logger"
import { searchKnowledge } from "@/lib/bot-knowledge"
import { groqChat } from "@/lib/groq-chat"

export async function generateBotResponse(userMessage: string, chatId: string, userName?: string): Promise<{ text: string; knowledgeId?: string }> {
  try {
    const results = await searchKnowledge(userMessage, 3)

    let context = ""
    let primaryId: string | undefined

    if (results.length > 0) {
      context = results.map((r, i) => `[${i + 1}] ${r.title}:\n${r.content}`).join("\n\n")
      primaryId = results[0].id
    }

    const content = await groqChat([
      { role: "user", content: context ? `Contexto disponible:\n${context}\n\nUsuario: ${userMessage}` : `Usuario: ${userMessage}` },
    ], {
      system: `Eres el asistente de The Serene Lens, una app cubana de análisis de piel con IA (bot de Telegram).

TONO Y EXTENSIÓN:
- Español cercano, directo y BREVE: máximo 3-4 líneas. Es Telegram, no un correo.
- Sin emojis. Sin despedidas ni saludos en cada turno: solo si el usuario saluda o se despide.
- Nunca eres un médico: si preguntan por enfermedades o diagnósticos, aclara que solo das observaciones cosméticas y recomienda consultar a un profesional.

CONOCIMIENTO DEL PRODUCTO (úsalo cuando aplique):
- Análisis gratis: escribe /analizar y envía fotos de tu rostro. En Telegram: 3 por día. En la web con cuenta gratis: 3 por mes.
- Planes: Essential gratis (3 análisis/mes), Premium $7.99/mes, Pro $9.99/mes, Pro+ $14.99/mes, Esteticista $49.99/mes (panel para clínicas con informes PDF y QR de referido). Anuales con descuento.
- Pagos en Cuba: Transfermóvil (validación manual). Fuera de Cuba: PayPal.
- La web tiene: evolución de tu piel, productos con detección de conflictos de ingredientes, guías de skincare, comunidad por tipo de piel, diario de piel y desafíos.

REGLAS:
1. Si la respuesta está en el contexto, úsalo y puedes resumirlo.
2. Si NO está en el contexto, dilo honestamente y ofrece alternativas reales ("pregúntame por los planes", "escribe /analizar", "escríbenos en el chat de la web").
3. NUNCA inventes precios, promociones ni funciones que no estén en el contexto.
4. Para problemas de cuenta o pagos, deriva al chat de la web (soporte) o a un administrador.`,
      temperature: 0.3,
      maxTokens: 500,
    })

    if (content) {
      return { text: content, knowledgeId: primaryId }
    }

    // Fallback: use knowledge directly if AI fails
    if (results.length > 0) {
      return {
        text: `Según la información disponible:\n\n${results[0].content.slice(0, 400)}`,
        knowledgeId: primaryId,
      }
    }

    return {
      text: "Lo siento, no encontré información sobre eso. ¿Quieres preguntar a un administrador? Escribe /ayuda para más opciones.",
    }
  } catch (e) {
    logger.error("Bot RAG error", { error: e instanceof Error ? e.message : String(e), chatId })

    // Ultimate fallback: return first knowledge result
    try {
      const results = await searchKnowledge(userMessage, 1)
      if (results.length > 0) {
        return {
          text: `${results[0].content.slice(0, 400)}`,
          knowledgeId: results[0].id,
        }
      }
    } catch (e) { logger.error("RAG knowledge search failed", { error: e }) }

    return {
      text: "Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo más tarde.",
    }
  }
}
