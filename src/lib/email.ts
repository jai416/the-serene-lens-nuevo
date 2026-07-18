const GMAIL_USER = process.env.GMAIL_USER || ""
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ""
const FROM_EMAIL = GMAIL_USER || "noreply@theserenelens.com"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
const APP_NAME = "The Serene Lens"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailer: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null

function getTransport() {
  if (!nodemailer) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nodemailer = require("nodemailer")
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not configured, email not sent")
    return false
  }

  try {
    const info = await getTransport().sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    })
    console.log(`Email sent to ${input.to}: ${info.messageId}`)
    return true
  } catch (e) {
    console.error("Email send error:", e)
    return false
  }
}

export function buildEmailHtml(title: string, message: string, link?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background: #F8F9FA; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; padding: 32px;">
        <h2 style="color: #1A1A1A; margin: 0 0 16px;">${title}</h2>
        <p style="color: #666666; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        ${link ? `<p><a href="${link}" style="display: inline-block; background: #88B078; color: #1A1A1A; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">Ver más</a></p>` : ""}
        <hr style="border: none; border-top: 1px solid #E8E8E8; margin: 24px 0;">
        <p style="font-size: 12px; color: #999;">
          ${APP_NAME} &mdash; Cuidado facial con IA
        </p>
      </div>
    </body>
    </html>
  `
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Recuperación de contraseña — The Serene Lens",
    html: buildEmailHtml(
      "¿Olvidaste tu contraseña?",
      "Haz clic en el botón de abajo para restablecer tu contraseña. Este enlace expira en 1 hora.\n\nSi no solicitaste este cambio, ignora este mensaje.",
      resetUrl,
    ),
  }
}

export function buildWelcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "¡Bienvenido a The Serene Lens!",
    html: buildEmailHtml(
      `¡Bienvenido${name ? `, ${name}` : ""}!`,
      `Gracias por registrarte en ${APP_NAME}.\n\nTu prueba PREMIUM de 7 días ya comenzó. Disfruta de todos los beneficios: análisis de piel ilimitados, rutinas personalizadas, historial y más.\n\nAl terminar el periodo de prueba, seguirás con el plan Essential (1 análisis gratis por mes).`,
      `${APP_URL}/dashboard`,
    ),
  }
}

export function buildTrialEndedEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Tu prueba PREMIUM ha terminado",
    html: buildEmailHtml(
      `Tu prueba gratuita terminó${name ? `, ${name}` : ""}`,
      `Tu periodo de prueba PREMIUM de 7 días ha finalizado.\n\nNo te preocupes, tu cuenta sigue activa en el plan Essential con 1 análisis gratis por mes.\n\nSi quieres seguir disfrutando de todas las funciones premium, puedes suscribirte desde tu panel.`,
      `${APP_URL}/pricing`,
    ),
  }
}

export function buildPaymentSuccessEmail(plan: string, amount: number): { subject: string; html: string } {
  const planNames: Record<string, string> = {
    PREMIUM: "Premium", PREMIUM_ANNUAL: "Premium Anual",
    PRO: "Pro", PRO_ANNUAL: "Pro Anual",
    PRO_PLUS: "Pro+",
    ESTHETICIAN: "Esteticista",
    BASIC: "Pack Básico", POPULAR: "Pack Popular", ADVANCED: "Pack Avanzado",
  }
  return {
    subject: `¡Pago recibido! Plan ${planNames[plan] || plan} activado`,
    html: buildEmailHtml(
      "¡Pago confirmado!",
      `Tu plan ${planNames[plan] || plan} ha sido activado exitosamente.\n\nMonto: $${amount.toFixed(2)} USD\n\nYa puedes disfrutar de todas las funciones incluidas en tu plan.`,
      `${APP_URL}/dashboard/subscription`,
    ),
  }
}

export function buildLeadMagnetEmail(): { subject: string; html: string } {
  return {
    subject: "Tu Guía de Skincare GRATIS — The Serene Lens",
    html: buildEmailHtml(
      "¡Aquí está tu guía gratuita!",
      `Gracias por registrarte.\n\nHemos preparado una guía exclusiva con:\n\n• Rutina básica para piel cubana (clima tropical)\n• Ingredientes clave que debes buscar\n• Errores comunes que dañan tu piel\n• Consejos para protegerte del sol caribeño\n\nDescárgala y comienza a cuidar tu piel hoy mismo.\n\nAdemás, puedes usar nuestros análisis con IA para conocer exactamente lo que tu piel necesita.`,
      `${APP_URL}/analysis`,
    ),
  }
}

export function buildGiftEmail({
  buyerName, recipientEmail, giftCode, analyses, packType,
}: {
  buyerName: string
  recipientEmail: string
  giftCode: string
  analyses: number
  packType: string
}): { subject: string; html: string } {
  const packNames: Record<string, string> = {
    BASIC: "Básico", POPULAR: "Popular", ADVANCED: "Avanzado",
  }
  return {
    subject: `¡${buyerName} te ha regalado un análisis de piel! — The Serene Lens`,
    html: buildEmailHtml(
      "¡Has recibido un regalo!",
      `${buyerName} te ha regalado un pack ${packNames[packType] || packType} con ${analyses} análisis de piel.\n\nPara canjearlo, regístrate o inicia sesión y usa el siguiente código:\n\n📌 ${giftCode}\n\nCanjéalo desde tu perfil o en la sección de suscripciones.`,
      `${APP_URL}/dashboard/subscription`,
    ),
  }
}

export function buildReminderEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Recordatorio — Cuida tu piel hoy — The Serene Lens",
    html: buildEmailHtml(
      `¡Hola${name ? `, ${name}` : ""}!`,
      `Este es tu recordatorio para analizar tu piel.\n\nEl cuidado constante es clave para mantener una piel saludable. Tómate 5 minutos para hacer un análisis y ver cómo ha evolucionado tu piel desde la última vez.`,
      `${APP_URL}/analysis`,
    ),
  }
}
