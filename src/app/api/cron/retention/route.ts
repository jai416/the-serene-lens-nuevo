import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/services/email-sequence"
import { verifyCronSecret } from "@/lib/cron-auth"

function emailWrapper(content: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
      ${content}
      <p style="font-size:12px;color:#8A9A82;margin-top:24px;text-align:center">
        The Serene Lens · Observación cosmética de tu piel<br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/unsubscribe" style="color:#8A9A82">Cancelar suscripción</a>
      </p>
    </div>`
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const oneDayAfter = new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000)

    const expiringSubscriptions = await db.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          gte: threeDaysFromNow,
          lte: oneDayAfter,
        },
      },
      include: {
        user: { select: { email: true, name: true, plan: true } },
      },
    })

    const renewalResults = await Promise.allSettled(
      expiringSubscriptions.map(async (sub) => {
        const user = sub.user
        if (!user.email) return

        await sendEmail({
          to: user.email,
          subject: "Tu suscripción está por renovarse - The Serene Lens",
          html: emailWrapper(`
            <h2 style="font-size:18px;color:#2F3A2D;margin-bottom:16px">Hola ${user.name || ""}, tu suscripción se renueva pronto</h2>
            <p style="font-size:14px;color:#64705E;line-height:1.6">
              Tu plan <strong>${sub.plan}</strong> se renovará automáticamente en los próximos días.
              Asegúrate de que tu método de pago esté actualizado para continuar disfrutando de análisis ilimitados.
            </p>
            <a href="${baseUrl}/dashboard/subscription" style="display:inline-block;background:#C2E09D;color:#2F3A2D;text-decoration:none;font-size:14px;font-weight:500;padding:12px 32px;border-radius:12px;margin:16px 0">
              Gestionar suscripción →
            </a>
          `),
        })

        return { email: user.email, plan: sub.plan }
      })
    )

    const expiredSubscriptions = await db.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: { lt: new Date() },
      },
      include: { user: { select: { id: true, email: true, plan: true } } },
    })

    for (const sub of expiredSubscriptions) {
      await db.user.update({
        where: { id: sub.user.id },
        data: { plan: "FREE" },
      })

      await db.subscription.update({
        where: { id: sub.id },
        data: { status: "expired" },
      })

      if (sub.user.email) {
        await sendEmail({
          to: sub.user.email,
          subject: "Tu suscripción ha expirado - The Serene Lens",
          html: emailWrapper(`
            <h2 style="font-size:18px;color:#2F3A2D;margin-bottom:16px">Tu suscripción ${sub.plan} ha expirado</h2>
            <p style="font-size:14px;color:#64705E;line-height:1.6">
              Tu plan ha vuelto a <strong>Essential (gratis)</strong>. Puedes seguir usando 1 análisis mensual gratis.
            </p>
            <p style="font-size:14px;color:#64705E;line-height:1.6">
              ¿Quieres volver a tener análisis ilimitados? Suscríbete nuevamente a Premium por solo $4.99/mes.
            </p>
            <a href="${baseUrl}/pricing" style="display:inline-block;background:#C2E09D;color:#2F3A2D;text-decoration:none;font-size:14px;font-weight:500;padding:12px 32px;border-radius:12px;margin:16px 0">
              Ver planes →
            </a>
          `),
        })
      }
    }

    return NextResponse.json({
      success: true,
      expiringNotified: renewalResults.filter((r) => r.status === "fulfilled").length,
      expiredDowngraded: expiredSubscriptions.length,
    })
  } catch {
    return NextResponse.json({ error: "Error en retention cron" }, { status: 500 })
  }
}
