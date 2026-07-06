import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AnalysisStream } from "@/lib/streaming"
import { unauthorized, serverError, error } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkAndDeductUsage } from "@/lib/usage"
import { analyzeSkinWithGroq } from "@/lib/groq"
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/analysis-cache"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return unauthorized()

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`analyze-stream:${session.user.id}:${ip}`, 5, 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes. Espera un minuto.")
    }

    const usage = await checkAndDeductUsage(session.user.id)
    if (!usage.allowed) return error(usage.error || "Límite alcanzado", 403)

    const stream = new AnalysisStream()
    const webStream = stream.createStream()

    stream.sendProgress("validating", "Validando datos de entrada...")

    const formData = await req.formData()
    const files = formData.getAll("photos") as File[]
    const concerns = formData.get("concerns") as string || ""
    const age = formData.get("age") as string || ""

    if (files.length === 0) {
      stream.sendError("No se recibieron fotos")
      return new Response(webStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      })
    }

    // Cache check
    const cacheKeyFiles = files.slice(0, 2)
    const cacheKeyBase64 = (await Promise.all(
      cacheKeyFiles.map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer())
        return buf.toString("base64").slice(0, 200)
      })
    )).join("|")

    const cached = await getCachedAnalysis([cacheKeyBase64], concerns || undefined, age || undefined)
    if (cached) {
      stream.sendProgress("saving", "Usando análisis en caché...")
      const analysis = await db.skinAnalysis.create({
        data: {
          userId: session.user.id,
          skinType: (cached.skinType as string) || null,
          concerns: concerns || null,
          observations: JSON.stringify(cached.observations || []),
          recommendations: JSON.stringify(cached.recommendations || []),
          routine: cached.routine ? JSON.stringify(cached.routine) : null,
        },
      })
      const { recalculateAndSaveEvolution } = await import("@/lib/services/evolution-calculator")
      recalculateAndSaveEvolution(session.user.id).catch(() => {})
      stream.sendComplete({ analysisId: analysis.id, result: cached })
      return new Response(webStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      })
    }

    stream.sendProgress("compressing", "Comprimiendo imágenes...")

    stream.sendProgress("analyzing-texture", "Analizando textura de la piel...")

    const result = await analyzeSkinWithGroq(files)
    await setCachedAnalysis([cacheKeyBase64], concerns || undefined, age || undefined, result).catch(() => {})

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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("ETIMEDOUT") || msg.includes("fetch failed")) {
      return error("El servicio de análisis IA está temporalmente no disponible.", 503)
    }
    return serverError(e)
  }
}
