const GMAIL_USER = process.env.GMAIL_USER || ""
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ""
const FROM_EMAIL = GMAIL_USER || "noreply@theserenelens.com"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
const APP_NAME = "The Serene Lens"

function pickVariant<T>(variants: T[]): T {
  const day = new Date().getDate()
  const idx = day % variants.length
  return variants[idx]
}

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
  const greeting = name ? name : "querido usuario"
  const idx = new Date().getDate() % 3
  const subjects = [
    "Tu periodo PREMIUM ha finalizado — The Serene Lens",
    "Seguimos aquí para ti — The Serene Lens",
    "¿Listo para más? Tu prueba terminó — The Serene Lens",
  ]
  const messages = [
    `Hola ${greeting},\n\nTu periodo de prueba PREMIUM de 7 días en ${APP_NAME} ha finalizado. No te preocupes, tu cuenta continúa activa en el plan Essential con 1 análisis gratuito por mes.\n\nSi deseas seguir disfrutando de análisis ilimitados y funciones avanzadas, puedes suscribirte a un plan PREMIUM o PRO desde tu panel.`,
    `Estimado/a ${greeting},\n\nQueremos agradecerte por haber probado ${APP_NAME} durante estos 7 días. Esperamos que la experiencia haya sido valiosa para ti.\n\nTu cuenta ha sido reactivada en el plan Essential, que incluye 1 análisis facial gratuito cada mes. Si extrañas las funciones premium, en cualquier momento puedes volver a suscribirte.`,
    `Hola ${greeting},\n\nTu prueba gratuita de ${APP_NAME} ha terminado, pero esto no es un adiós. Tu cuenta sigue activa con 1 análisis de piel por mes incluido.\n\nLos usuarios PREMIUM disfrutan de análisis ilimitados, rutinas personalizadas, historial completo y más. Revisa nuestros planes y elige el que mejor se adapte a ti.`,
  ]
  return {
    subject: subjects[idx],
    html: buildEmailHtml(
      `Gracias por tu interés${name ? `, ${name}` : ""}`,
      messages[idx],
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

export function buildRetentionEmail(name: string): { subject: string; html: string } {
  const greeting = name ? name : "querido usuario"
  const subjects = [
    "¿Extrañas tu rutina de skincare? — The Serene Lens",
    "Hace tiempo que no te vemos — The Serene Lens",
    "Tu piel te espera en The Serene Lens",
    "Un recordatorio cálido de The Serene Lens",
    "Pequeños hábitos, grandes cambios — The Serene Lens",
  ]
  const messages = [
    `Hola ${greeting},\n\nNotamos que hace unos días que no realizas un análisis en ${APP_NAME}. Sabemos que la vida a veces se interpone, pero tu piel siempre agradece la atención.\n\n¿Por qué no retomas hoy tu rutina? Un análisis rápido es todo lo que necesitas para empezar de nuevo.`,
    `Hola ${greeting},\n\nEn ${APP_NAME} extrañamos verte. El cuidado de la piel es un viaje, no un destino, y cada análisis es un paso adelante.\n\nTu historial y tus métricas anteriores siguen guardados. Vuelve y descubre cómo ha cambiado tu piel desde tu última visita.`,
    `Estimado/a ${greeting},\n\nEsperamos que estés bien. Te escribimos de parte de ${APP_NAME} para recordarte que tu piel merece atención continua, incluso en los días ocupados.\n\nUn hábito de 5 minutos puede marcar la diferencia a largo plazo. Te esperamos con nuevas recomendaciones personalizadas.`,
    `Hola ${greeting},\n\nSabemos que la constancia no siempre es fácil, pero estamos aquí para ayudarte. En ${APP_NAME} transformamos el cuidado facial en un hábito sencillo y gratificante.\n\nTu próxima análisis está a un clic de distancia. ¡Te esperamos!`,
    `Hola ${greeting},\n\nLos buenos hábitos no tienen que ser complicados. En ${APP_NAME} creemos que conocerse a uno mismo es el primer paso para cuidarse.\n\nVuelve hoy, tómate 5 minutos para analizar tu piel y descubre lo que ha cambiado. Tu yo del futuro te lo agradecerá.`,
  ]
  const idx = new Date().getDate() % subjects.length
  return {
    subject: subjects[idx],
    html: buildEmailHtml(
      `Hola${name ? `, ${name}` : ""}`,
      messages[idx],
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
  const greeting = name ? name : "querido usuario"
  const subjects = [
    "Tu piel te está esperando — The Serene Lens",
    "Hoy es un buen día para cuidarte — The Serene Lens",
    "¿Cómo está tu piel hoy? — The Serene Lens",
    "Tu recordatorio de skincare — The Serene Lens",
    "No olvides mimar tu piel — The Serene Lens",
  ]
  const messages = [
    `Hola ${greeting},\n\nEn ${APP_NAME} creemos que la constancia es la clave para una piel saludable. ¿Por qué no te tomas 5 minutos hoy para analizar tu piel y ver cómo ha evolucionado?`,
    `Hola ${greeting},\n\nTu piel cambia cada día según el clima, la alimentación y el estrés. Mantente al tanto de esas variaciones con un análisis rápido en ${APP_NAME}. Solo te llevará unos minutos.`,
    `Estimado/a ${greeting},\n\nEste es tu recordatorio amistoso de ${APP_NAME}. La piel es el órgano más grande del cuerpo y merece atención regular. Haz tu análisis de hoy y descubre qué necesita tu piel en este momento.`,
    `Hola ${greeting},\n\nEl cuidado de la piel no se trata de perfección, sino de constancia. En ${APP_NAME} te ayudamos a mantener ese hábito con análisis rápidos y recomendaciones personalizadas. ¡Te esperamos!`,
    `Hola ${greeting},\n\n¿Sabías que tu piel se regenera completamente cada 28 días? Cada análisis en ${APP_NAME} captura ese momento único. Tómate un minuto para registrar cómo está tu piel hoy.`,
  ]
  const idx = new Date().getDate() % subjects.length
  return {
    subject: subjects[idx],
    html: buildEmailHtml(
      `Hola${name ? `, ${name}` : ""}`,
      messages[idx],
      `${APP_URL}/analysis`,
    ),
  }
}
