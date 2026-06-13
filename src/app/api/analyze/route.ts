import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { analyzeSkin } from "@/lib/openrouter"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { checkAndDeductUsage } from "@/lib/usage"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const formData = await req.formData()
    const photos = formData.getAll("photos") as File[]
    const concerns = formData.get("concerns") as string | null
    const age = formData.get("age") as string | null
    const gender = formData.get("gender") as string | null
    const climate = formData.get("climate") as string | null
    const routine = formData.get("routine") as string | null

    if (!photos || photos.length === 0) return error("Se requieren fotos")

    const imagesBase64 = await Promise.all(
      photos.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Una imagen supera los 10MB")
        }
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        return buffer.toString("base64")
      })
    )

    const result = await analyzeSkin({
      imagesBase64,
      concerns: concerns || undefined,
      age: age || undefined,
      gender: gender || undefined,
      climate: climate || undefined,
      routine: routine || undefined,
    })

    const analysis = await db.skinAnalysis.create({
      data: {
        userId: session?.user?.id || null,
        imageUrl: null,
        skinType: null,
        concerns: concerns || null,
        observations: JSON.stringify(result.observations || []),
        recommendations: JSON.stringify(result.recommendations || []),
        routine: result.routine ? JSON.stringify(result.routine) : null,
      },
    })

    if (session?.user?.id) {
      const usage = await checkAndDeductUsage(session.user.id)
      if (!usage.allowed) {
        await db.skinAnalysis.delete({ where: { id: analysis.id } }).catch(() => {})
        return error(usage.error || "Límite de análisis alcanzado")
      }
    }

    return ok({ analysis, result })
  } catch (e) {
    return serverError(e)
  }
}
