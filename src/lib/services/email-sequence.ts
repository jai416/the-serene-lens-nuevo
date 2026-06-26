import { sanitizeHtml } from "@/lib/sanitize"
import { PLANS } from "@/lib/pricing"

type EmailPayload = {
  to: string
  subject: string
  html: string
}

type ResendClient = {
  emails: {
    send: (payload: EmailPayload & { from: string }) => Promise<unknown>
  }
}

let resendClient: ResendClient | null = null

async function getResend(): Promise<ResendClient | null> {
  if (resendClient) return resendClient
  if (!process.env.RESEND_API_KEY) return null
  try {
    const { Resend } = await import("resend")
    resendClient = new Resend(process.env.RESEND_API_KEY) as unknown as ResendClient
  } catch {
    resendClient = null
  }
  return resendClient
}

const FROM = process.env.RESEND_DOMAIN_VERIFIED === "true"
  ? "The Serene Lens <noreply@theserenelens.com>"
  : "The Serene Lens <onboarding@resend.dev>"

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

function header(title: string): string {
  return `<h2 style="font-size:18px;color:#2F3A2D;margin-bottom:16px">${title}</h2>`
}

function paragraph(text: string): string {
  return `<p style="font-size:14px;color:#64705E;line-height:1.6">${text}</p>`
}

function ctaButton(url: string, text: string): string {
  return `<a href="${url}" style="display:inline-block;background:#C2E09D;color:#2F3A2D;text-decoration:none;font-size:14px;font-weight:500;padding:12px 32px;border-radius:12px;margin:16px 0">${text}</a>`
}

export type SequenceEmail = {
  day: number
  subject: string
  html: string
}

/**
 * Generates the email sequence for a given user.
 * Day 0 = registration, Day 1, 3, 7, 14, 21
 */
export function buildEmailSequence(
  name: string,
  loginUrl: string
): SequenceEmail[] {
  const url = loginUrl
  const premiumPlan = PLANS.find((p) => p.id === "PREMIUM")
  const premiumPrice = premiumPlan?.priceUSD ?? 4.99
  const discountPrice = (premiumPrice * 0.7).toFixed(2)

  return [
    {
      day: 0,
      subject: "Bienvenido a The Serene Lens",
      html: emailWrapper(`
        ${header(`Hola ${sanitizeHtml(name)}, bienvenido 👋`)}
        ${paragraph("Tu piel merece ser cuidada con la mejor tecnología. The Serene Lens analiza tu piel con IA y te da recomendaciones personalizadas.")}
        ${paragraph("<strong>Primer paso:</strong> Sube una foto de tu piel y recibe un análisis cosmético en segundos.")}
        ${ctaButton(`${url}/analysis`, "Analizar mi piel ahora →")}
      `),
    },
    {
      day: 1,
      subject: "¿Qué tipo de piel tienes?",
      html: emailWrapper(`
        ${header("Conoce tu tipo de piel")}
        ${paragraph("¿Sabías que tu tipo de piel determina qué productos funcionan mejor? La piel grasa, seca, mixta o sensible cada una tiene necesidades diferentes.")}
        ${paragraph("Nuestra herramienta de IA analiza tu piel con fotos y te dice exactamente qué tipo tienes y qué productos usar.")}
        ${ctaButton(`${url}/analysis`, "Descubrir mi tipo de piel →")}
      `),
    },
    {
      day: 3,
      subject: "¿Ya probaste el escáner de ingredientes?",
      html: emailWrapper(`
        ${header("Escáner de ingredientes")}
        ${paragraph("¿Alguna vez te has preguntado qué hay en tu crema hidratante? Nuestro escáner analiza la lista de ingredientes de cualquier producto cosmético.")}
        ${paragraph("Simplemente sube una foto de la etiqueta y obtén un análisis completo: ingredientes buenos, precauciones y lo que debes evitar.")}
        ${ctaButton(`${url}/products`, "Escanear un producto →")}
      `),
    },
    {
      day: 7,
      subject: "Tu análisis gratis está a punto de expirar",
      html: emailWrapper(`
        ${header("No pierdas tu análisis gratuito")}
        ${paragraph("Tu análisis gratuito de este mes está por expirar. Si no lo usas, perderás la oportunidad de conocer el estado de tu piel.")}
        ${paragraph("<strong>Oferta especial:</strong> Suscríbete a Premium por $4.99/mes y obtén análisis ilimitados, historial y evolución de tu piel.")}
        ${ctaButton(`${url}/pricing`, "Ver planes Premium →")}
      `),
    },
    {
      day: 14,
      subject: "¿Cómo ha cambiado tu piel?",
      html: emailWrapper(`
        ${header("Seguimiento de tu piel")}
        ${paragraph("Tu piel cambia constantemente. Con Premium puedes comparar análisis anteriores y ver la evolución de tu piel mes a mes.")}
        ${paragraph("¿Quieres saber si tu rutina está funcionando? La evolución de The Serene Lens te muestra las mejoras visibles de tu piel.")}
        ${ctaButton(`${url}/pricing`, "Desbloquear evolución →")}
      `),
    },
    {
      day: 21,
      subject: "Última oportunidad - 30% descuento",
      html: emailWrapper(`
        ${header("Última oportunidad 🎁")}
        ${paragraph("Como usuario registrado, te ofrecemos un <strong>30% de descuento</strong> en tu primer mes de Premium.")}
        ${paragraph(`Por solo $${discountPrice}/mes obtienes: análisis ilimitados, historial completo, evolución de piel y prioridad en procesamiento.`)}
        ${ctaButton(`${url}/pricing`, "Aprovechar descuento →")}
      `),
    },
  ]
}

/**
 * Sends a single email via Resend.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const client = await getResend()
  if (!client) {
    console.log(`[EMAIL] ${payload.subject} → ${payload.to}`)
    return true
  }
  try {
    await client.emails.send({ from: FROM, ...payload })
    return true
  } catch {
    return false
  }
}

export async function sendGroupCompletionEmail(
  email: string,
  name: string,
  groupId: string,
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  return sendEmail({
    to: email,
    subject: "🎉 ¡Tu grupo se completó! Has ganado un análisis gratis",
    html: `<!DOCTYPE html>
<html>
<head><style>
body{font-family:'Segoe UI',sans-serif;background:#F8FAF5;padding:40px 0}
.c{max-width:600px;margin:0 auto;background:#fff;border-radius:20px;padding:40px;border:1px solid #DDE7D3}
.h{text-align:center;margin-bottom:30px}
.l{font-size:24px;color:#2F3A2D;font-weight:bold}.l span{color:#C2E09D}
h1{color:#2F3A2D;font-size:24px;margin-bottom:10px}
p{color:#64705E;line-height:1.6}
.hl{background:#F0F5EC;padding:20px;border-radius:12px;margin:20px 0;text-align:center}
.btn{display:inline-block;background:#C2E09D;color:#2F3A2D;padding:12px 30px;border-radius:12px;text-decoration:none;font-weight:bold}
.f{margin-top:30px;text-align:center;font-size:12px;color:#9BAA93}
</style></head>
<body><div class="c">
<div class="h"><div class="l">🌿 The <span>Serene</span> Lens</div></div>
<h1>🎉 ¡Felicidades, ${sanitizeHtml(name)}!</h1>
<p>Tu grupo de 3 amigos se ha completado exitosamente. Como recompensa, <strong>has ganado un análisis GRATIS</strong> para tu piel.</p>
<div class="hl">
<p style="font-size:18px;color:#2F3A2D;margin:0">✨ 1 análisis gratis añadido a tu cuenta ✨</p>
<p style="font-size:14px;margin-top:8px">Válido por 30 días</p>
</div>
<p>¡Invita a más amigos y sigue ganando análisis gratis!</p>
<div style="text-align:center;margin:30px 0">
<a href="${appUrl}/dashboard" class="btn">Ir a mi dashboard</a>
</div>
<p style="font-size:14px;color:#64705E">ID de tu grupo: <strong>${groupId}</strong></p>
<div class="f"><p>The Serene Lens · Observación cosmética con IA</p></div>
</div></body></html>`,
  })
}
