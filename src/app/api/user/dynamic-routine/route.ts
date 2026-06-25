import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

function getSeason(): "spring" | "summer" | "autumn" | "winter" {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return "spring"
  if (month >= 5 && month <= 7) return "summer"
  if (month >= 8 && month <= 10) return "autumn"
  return "winter"
}

function getSeasonAdjustments(season: string, skinType: string) {
  const adjustments: Record<string, Record<string, string[]>> = {
    summer: {
      dry: ["Añade protector solar SPF 50 cada 2 horas", "Usa tónico hidratante antes del sérum", "Aplica mascarilla hidratante 2 veces por semana"],
      oily: ["Usa limpiador en espuma por la mañana", "Aplica protector solar ligero oil-free", "Limpia por la noche con agua micelar"],
      combination: ["Protector solar mineral tintado SPF 50", "Mascarilla de arcilla 1 vez por semana en zona T", "Sérum de niacinamida por la noche"],
      normal: ["Protección solar SPF 30-50 diaria", "Mascarilla hidratante ligera semanal", "Manten tu rutina actual con protección extra"],
      sensitive: ["Protector solar mineral SPF 50 sin fragancia", "Evita exfoliantes químicos fuertes", "Usa aloe vera después del sol"],
    },
    winter: {
      dry: ["Crema hidratante más rica por la noche", "Aceite facial antes del hidratante", "Evita limpiadores espumosos"],
      oily: ["Hidratante ligero en gel por la mañana", "Exfoliante suave 1 vez por semana", "Mascarilla hidratante 1 vez por semana"],
      combination: ["Crema hidratante más nutritiva en mejillas", "Protector solar SPF 30 en zona T", "Aceite de rosa mosqueta por la noche"],
      normal: ["Hidratante medio-rico por la mañana y noche", "Exfoliante suave quincenal", "Mascarilla nutritiva semanal"],
      sensitive: ["Hidratante rico sin fragancia", "Evita cambios bruscos de temperatura", "Protector solar SPF 30 diario"],
    },
    spring: {
      dry: ["Incorpora vitamina C por la mañana", "Exfoliante suave quincenal", "Mascarilla hidratante semanal"],
      oily: ["Limpieza profunda 2 veces por semana", "Sérum de niacinamida por la noche", "Protector solar ligero SPF 30+"],
      combination: ["Tónico equilibrante después de limpiar", "Protector solar ligero SPF 30+", "Mascarilla de arcilla quincenal"],
      normal: ["Mantén tu rutina base", "Incorpora vitamina C si no la usas", "Exfoliante suave semanal"],
      sensitive: ["Introduce productos nuevos gradualmente", "Protector solar SPF 30+", "Mascarilla calmante semanal"],
    },
    autumn: {
      dry: ["Cambia a hidratante más rico", "Añade aceite facial por la noche", "Mascarilla nutritiva semanal"],
      oily: ["Limpieza doble por la noche", "Exfoliante químico suave semanal", "Hidratante medio por la mañana"],
      combination: ["Tónico equilibrante diario", "Hidratante más nutritivo en mejillas", "Exfoliante suave en zona T"],
      normal: ["Ajusta hidratante a clima más seco", "Exfoliante químico suave quincenal", "Mascarilla hidratante semanal"],
      sensitive: ["Hidratante rico sin fragancia", "Evita exfoliantes agresivos", "Protector solar SPF 30 diario"],
    },
  }

  return adjustments[season]?.[skinType] || adjustments[season]?.normal || []
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  try {
    const latestAnalysis = await db.skinAnalysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        skinType: true,
        observations: true,
        recommendations: true,
        routine: true,
        createdAt: true,
      },
    })

    const skinType = latestAnalysis?.skinType || "normal"
    const season = getSeason()
    const seasonAdjustments = getSeasonAdjustments(season, skinType)

    const baseRoutine: Record<string, Record<string, string[]>> = {
      normal: {
        morning: [
          "Limpia suavemente con limpiador facial",
          "Aplica tónico equilibrante",
          "Sérum de vitamina C (si es de mañana)",
          "Hidratante ligero",
          "Protector solar SPF 30+",
        ],
        evening: [
          "Doble limpieza: aceite desmaquillante + limpiador",
          "Tónico equilibrante",
          "Sérum de retinol o niacinamida",
          "Contorno de ojos",
          "Crema hidratante nocturna",
        ],
        weekly: [
          "Exfoliante químico suave (1 vez por semana)",
          "Mascarilla hidratante o de arcilla (1-2 veces)",
        ],
      },
      dry: {
        morning: [
          "Limpia con agua tibia y limpiador suave",
          "Tónico hidratante con ácido hialurónico",
          "Sérum de vitamina C",
          "Crema hidratante rica",
          "Protector solar SPF 30+",
        ],
        evening: [
          "Aceite desmaquillante",
          "Limpiador suave sin espuma",
          "Tónico hidratante",
          "Aceite facial (rosa mosqueta o argán)",
          "Crema hidratante nutritiva",
        ],
        weekly: [
          "Mascarilla hidratante (2 veces por semana)",
          "Exfoliante enzimático suave (1 vez)",
        ],
      },
      oily: {
        morning: [
          "Limpiador en espuma",
          "Tónico con niacinamida",
          "Sérum de niacinamida 10%",
          "Hidratante oil-free en gel",
          "Protector solar ligero SPF 30+",
        ],
        evening: [
          "Agua micelar o aceite desmaquillante",
          "Limpiador en espuma",
          "Tónico exfoliante con BHA (2 veces por semana)",
          "Sérum de niacinamida",
          "Hidratante ligero",
        ],
        weekly: [
          "Mascarilla de arcilla purificante (1-2 veces)",
          "Exfoliante químico BHA (1 vez)",
        ],
      },
      combination: {
        morning: [
          "Limpiador suave",
          "Tónico equilibrante",
          "Sérum de vitamina C",
          "Hidratante ligero (más rico en mejillas)",
          "Protector solar SPF 30+",
        ],
        evening: [
          "Aceite desmaquillante",
          "Limpiador suave",
          "Tónico con niacinamida",
          "Sérum de retinol (2-3 veces por semana)",
          "Hidratante medio",
        ],
        weekly: [
          "Mascarilla de arcilla en zona T (1 vez)",
          "Mascarilla hidratante en mejillas (1 vez)",
          "Exfoliante suave quincenal",
        ],
      },
      sensitive: {
        morning: [
          "Limpia con agua tibia y limpiador sin fragancia",
          "Tónico calmante con manzanilla",
          "Sérum de ácido hialurónico",
          "Hidratante rico sin fragancia",
          "Protector solar mineral SPF 50",
        ],
        evening: [
          "Agua micelar sin fragancia",
          "Limpiador suave sin espuma",
          "Tónico calmante",
          "Contorno de ojos sin fragancia",
          "Crema hidratante nutritiva sin fragancia",
        ],
        weekly: [
          "Mascarilla calmante con aloe vera (1 vez)",
          "Evita exfoliantes químicos fuertes",
        ],
      },
    }

    const routine = baseRoutine[skinType] || baseRoutine.normal

    return ok({
      hasData: !!latestAnalysis,
      skinType,
      season,
      seasonName: {
        spring: "Primavera",
        summer: "Verano",
        autumn: "Otoño",
        winter: "Invierno",
      }[season],
      routine: {
        morning: routine.morning,
        evening: routine.evening,
        weekly: routine.weekly,
      },
      seasonAdjustments,
      notes: latestAnalysis
        ? `Basado en tu último análisis (${new Date(latestAnalysis.createdAt).toLocaleDateString("es-ES")}). Se ajusta según la temporada y tu tipo de piel: ${skinType}.`
        : `Rutina base para tipo de piel ${skinType} en ${season}. Para una rutina más personalizada, realiza un análisis de piel.`,
      lastAnalysis: latestAnalysis?.createdAt || null,
    })
  } catch (e) {
    return serverError(e)
  }
}
