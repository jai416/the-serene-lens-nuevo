import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  try {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [currentAnalyses, previousAnalyses] = await Promise.all([
      db.skinAnalysis.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: currentMonthStart },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          skinType: true,
          observations: true,
          recommendations: true,
          routine: true,
          concerns: true,
          createdAt: true,
        },
      }),
      db.skinAnalysis.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: previousMonthStart, lte: previousMonthEnd },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          skinType: true,
          observations: true,
          recommendations: true,
          routine: true,
          concerns: true,
          createdAt: true,
        },
      }),
    ])

    if (currentAnalyses.length === 0 && previousAnalyses.length === 0) {
      return ok({
        hasData: false,
        message: "Necesitas al menos un análisis para ver la comparativa mensual.",
      })
    }

    const currentLatest = currentAnalyses[0]
    const previousLatest = previousAnalyses[0]

    const changes: string[] = []

    if (currentLatest && previousLatest) {
      if (currentLatest.skinType && previousLatest.skinType && currentLatest.skinType !== previousLatest.skinType) {
        changes.push(`Tipo de piel: ${previousLatest.skinType} → ${currentLatest.skinType}`)
      }

      const prevObs = JSON.parse(previousLatest.observations || "[]")
      const currObs = JSON.parse(currentLatest.observations || "[]")
      const newObs = currObs.filter((o: string) => !prevObs.includes(o))
      if (newObs.length > 0) {
        changes.push(`Nuevas observaciones: ${newObs.join(", ")}`)
      }

      const resolvedObs = prevObs.filter((o: string) => !currObs.includes(o))
      if (resolvedObs.length > 0) {
        changes.push(`Observaciones mejoradas: ${resolvedObs.join(", ")}`)
      }
    } else if (currentLatest && !previousLatest) {
      changes.push("Primer mes de análisis — estableciendo línea base")
    } else if (!currentLatest && previousLatest) {
      changes.push("Sin análisis este mes — continúa tu rutina")
    }

    const currentMonth = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    const previousMonth = previousMonthStart.toLocaleDateString("es-ES", { month: "long", year: "numeric" })

    return ok({
      hasData: true,
      current: {
        month: currentMonth,
        count: currentAnalyses.length,
        latest: currentLatest || null,
      },
      previous: {
        month: previousMonth,
        count: previousAnalyses.length,
        latest: previousLatest || null,
      },
      changes,
      summary: changes.length > 0
        ? `Has realizado ${currentAnalyses.length} análisis este mes. ${changes[0]}.`
        : currentAnalyses.length > 0
          ? `Has realizado ${currentAnalyses.length} análisis este mes. Tu piel se mantiene estable.`
          : "No hay análisis este mes. Realiza tu primer análisis para ver tu evolución.",
    })
  } catch (e) {
    return serverError(e)
  }
}
