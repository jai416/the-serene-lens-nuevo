import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sanitizeHtml } from "@/lib/sanitize"
import { ok, error, serverError } from "@/lib/api-response"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
const FROM = process.env.RESEND_DOMAIN_VERIFIED === "true"
  ? "The Serene Lens <noreply@theserenelens.com>"
  : "The Serene Lens <onboarding@resend.dev>"

function emailWrapper(content: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
      ${content}
      <p style="font-size:12px;color:#8A9A82;margin-top:24px;text-align:center">
        The Serene Lens · Observación cosmética de tu piel<br/>
        <a href="${APP_URL}/unsubscribe" style="color:#8A9A82">Cancelar suscripción</a>
      </p>
    </div>`
}

function header(title: string): string {
  return `<h2 style="font-size:18px;color:#2F3A2D;margin-bottom:16px">${title}</h2>`
}

function paragraph(text: string): string {
  return `<p style="font-size:14px;color:#64705E;line-height:1.6">${text}</p>`
}

function ctaButton(url: string, text: string): string {
  return `<a href="${url}" style="display:inline-block;background:#C2E09D;color:#2F3A2D;text-decoration:none;font-size:14px;font-weight:500;padding:12px 32px;border-radius:12px;margin:16px 0">${text}</a>`
}

function noteHasEntry(notes: string | null, tag: string): boolean {
  if (!notes) return false
  try {
    const arr = JSON.parse(notes) as string[]
    return arr.includes(tag)
  } catch {
    return notes.includes(tag)
  }
}

function addNoteTag(notes: string | null, tag: string): string {
  let arr: string[] = []
  if (notes) {
    try {
      arr = JSON.parse(notes) as string[]
    } catch {
      arr = []
    }
  }
  if (!arr.includes(tag)) arr.push(tag)
  return JSON.stringify(arr)
}

async function sendWithResend(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL-SEQUENCE] ${subject} → ${to}`)
    return true
  }
  try {
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to, subject, html })
    return true
  } catch (e) {
    console.error(`[EMAIL-SEQUENCE] Failed to send ${subject} to ${to}:`, e)
    return false
  }
}

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const results = { day2: { sent: 0, skipped: 0 }, day7: { sent: 0, skipped: 0 }, rescan: { sent: 0, skipped: 0 } }

    // Day 2: users registered 48-72h ago
    const day2Start = new Date(now.getTime() - 72 * 60 * 60 * 1000)
    const day2End = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const day2Users = await db.user.findMany({
      where: {
        createdAt: { gte: day2Start, lte: day2End },
      },
      select: { id: true, name: true, email: true },
    })

    for (const user of day2Users) {
      if (!user.email) continue
      const diary = await db.skinDiary.findFirst({
        where: { userId: user.id },
        select: { notes: true },
      })
      if (noteHasEntry(diary?.notes ?? null, "day-2-sent")) {
        results.day2.skipped++
        continue
      }
      const sent = await sendWithResend(
        user.email,
        "¿Cómo va tu rutina? 💆",
        emailWrapper(`
          ${header(`Hola ${sanitizeHtml(user.name || "")}, ¿cómo va todo? 👋`)}
          ${paragraph("Han pasado dos días desde que te uniste a The Serene Lens. ¿Ya tuviste chance de explorar la app?")}
          ${paragraph("Recuerda que puedes subir una foto de tu piel para obtener un análisis personalizado con IA. También puedes probar el escáner de ingredientes para ver qué hay en tus productos favoritos.")}
          ${paragraph("Si aún no has hecho tu primer análisis, ¡es el momento perfecto para empezar!")}
          ${ctaButton(`${APP_URL}/analysis`, "Hacer mi análisis ahora →")}
          ${paragraph("Estamos aquí para ayudarte en tu camino hacia una piel más saludable. 💚")}
        `),
      )
      if (sent) {
        const currentNotes = diary?.notes ?? null
        await db.skinDiary.upsert({
          where: { userId_date: { userId: user.id, date: new Date() } },
          update: { notes: addNoteTag(currentNotes, "day-2-sent") },
          create: { userId: user.id, feeling: 5, notes: addNoteTag(currentNotes, "day-2-sent") },
        })
        results.day2.sent++
      } else {
        results.day2.skipped++
      }
    }

    // Day 7: users registered 168-192h ago
    const day7Start = new Date(now.getTime() - 192 * 60 * 60 * 1000)
    const day7End = new Date(now.getTime() - 168 * 60 * 60 * 1000)
    const day7Users = await db.user.findMany({
      where: {
        createdAt: { gte: day7Start, lte: day7End },
      },
      select: { id: true, name: true, email: true },
    })

    for (const user of day7Users) {
      if (!user.email) continue
      const diary = await db.skinDiary.findFirst({
        where: { userId: user.id },
        select: { notes: true },
      })
      if (noteHasEntry(diary?.notes ?? null, "day-7-sent")) {
        results.day7.skipped++
        continue
      }
      const sent = await sendWithResend(
        user.email,
        "Tu semana con The Serene Lens 🌿",
        emailWrapper(`
          ${header(`¡Hola ${sanitizeHtml(user.name || "")}! 🌿`)}
          ${paragraph("Ha pasado una semana desde que te uniste a The Serene Lens. ¿Cómo ha ido tu rutina de skincare esta semana?")}
          ${paragraph("¿Sabías que puedes mantener un diario de tu piel? Anota cómo se siente tu piel cada día y construye tu racha de constancia. La constancia es la clave para ver resultados.")}
          ${paragraph("¿Quieres comparar tu piel con la de otros usuarios de forma anónima? Prueba nuestro modo social y descubre cómo va tu progreso.")}
          ${ctaButton(`${APP_URL}/dashboard/diary`, "Abrir mi diario de piel →")}
          ${paragraph("¡Nos encanta tenerte en la comunidad! 💚")}
        `),
      )
      if (sent) {
        const currentNotes = diary?.notes ?? null
        await db.skinDiary.upsert({
          where: { userId_date: { userId: user.id, date: new Date() } },
          update: { notes: addNoteTag(currentNotes, "day-7-sent") },
          create: { userId: user.id, feeling: 5, notes: addNoteTag(currentNotes, "day-7-sent") },
        })
        results.day7.sent++
      } else {
        results.day7.skipped++
      }
    }

    // Re-scan reminder: users whose first analysis was 21 days ago
    const rescanStart = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)
    const rescanEnd = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)

    const firstAnalyses = await db.skinAnalysis.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: rescanStart, lte: rescanEnd } },
      _min: { createdAt: true },
    })

    const rescanUserIds = firstAnalyses
      .filter((a) => a.userId && a._min.createdAt && a._min.createdAt >= rescanStart && a._min.createdAt <= rescanEnd)
      .map((a) => a.userId as string)

    // Filter to only users whose FIRST analysis (across all time) was in that window
    const allUserIdsWithAnalysis = firstAnalyses.map((a) => a.userId as string)
    const rescanCandidates: string[] = []
    for (const userId of allUserIdsWithAnalysis) {
      const earliest = await db.skinAnalysis.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      })
      if (earliest && earliest.createdAt >= rescanStart && earliest.createdAt <= rescanEnd) {
        rescanCandidates.push(userId)
      }
    }

    const rescanUsers = await db.user.findMany({
      where: { id: { in: rescanCandidates } },
      select: { id: true, name: true, email: true },
    })

    for (const user of rescanUsers) {
      if (!user.email) continue
      const diary = await db.skinDiary.findFirst({
        where: { userId: user.id },
        select: { notes: true },
      })
      if (noteHasEntry(diary?.notes ?? null, "rescan-sent")) {
        results.rescan.skipped++
        continue
      }
      const sent = await sendWithResend(
        user.email,
        "Han pasado 3 semanas... 📸",
        emailWrapper(`
          ${header(`Hola ${sanitizeHtml(user.name || "")}, ¿cómo va tu piel? 📸`)}
          ${paragraph("Han pasado 3 semanas desde tu último análisis. Tu piel cambia constantemente, y comparar tus resultados puede darte una idea de cómo está respondiendo a tu rutina.")}
          ${paragraph("Toma una nueva foto y compárala con tu primer análisis. Podrás ver las diferencias en observaciones, recomendaciones y el estado general de tu piel.")}
          ${ctaButton(`${APP_URL}/analysis`, "Tomar nueva foto →")}
          ${paragraph("La constancia es la clave. Cada análisis es un paso más hacia una piel más saludable. 💚")}
        `),
      )
      if (sent) {
        const currentNotes = diary?.notes ?? null
        await db.skinDiary.upsert({
          where: { userId_date: { userId: user.id, date: new Date() } },
          update: { notes: addNoteTag(currentNotes, "rescan-sent") },
          create: { userId: user.id, feeling: 5, notes: addNoteTag(currentNotes, "rescan-sent") },
        })
        results.rescan.sent++
      } else {
        results.rescan.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: "Email sequence cron completed",
      results,
    })
  } catch (e) {
    console.error("[EMAIL-SEQUENCE] Cron failed:", e)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
