import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AnalysisStream } from "@/lib/streaming"
import { unauthorized, serverError, error } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return unauthorized()

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`analyze-stream:${session.user.id}:${ip}`, 5, 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes. Espera un minuto.")
    }

    const stream = new AnalysisStream()
    const webStream = stream.createStream()

    stream.sendProgress("validating", "Validando datos de entrada...")

    const formData = await req.formData()
    const files = formData.getAll("photos") as File[]
    const concerns = formData.get("concerns") as string || ""
    const age = formData.get("age") as string || ""
    const gender = formData.get("gender") as string || ""
    const climate = formData.get("climate") as string || ""
    const routine = formData.get("routine") as string || ""
    const language = formData.get("language") as string || "es"

    if (files.length === 0) {
      stream.sendError("No se recibieron fotos")
      return new Response(webStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      })
    }

    stream.sendProgress("compressing", "Comprimiendo imágenes...")

    const imagesBase64 = await Promise.all(
      files.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error("Solo se aceptan archivos de imagen")
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Una imagen supera los 10MB")
        }
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        return buffer.toString("base64")
      })
    )

    stream.sendProgress("analyzing-texture", "Analizando textura de la piel...")

    const { callOpenRouterWithStream } = await import("@/lib/openrouter")
    const result = await callOpenRouterWithStream({
      imagesBase64,
      concerns: concerns || undefined,
      age: age || undefined,
      gender: gender || undefined,
      climate: climate || undefined,
      routine: routine || undefined,
      language: language || undefined,
      onProgress: (stage, message) => {
        stream.sendProgress(stage, message)
      },
    })

    stream.sendProgress("saving", "Guardando resultados...")

    const analysis = await db.skinAnalysis.create({
      data: {
        userId: session.user.id,
        skinType: (result.skinType as string) || null,
        concerns: concerns || null,
        observations: JSON.stringify(result.observations || []),
        recommendations: JSON.stringify(result.recommendations || []),
        routine: result.routine ? JSON.stringify(result.routine) : null,
      },
    })

    const { recalculateAndSaveEvolution } = await import("@/lib/services/evolution-calculator")
    recalculateAndSaveEvolution(session.user.id).catch(() => {})

    stream.sendComplete({ analysisId: analysis.id, result })

    return new Response(webStream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    })
  } catch (e) {
    return serverError(e)
  }
}
