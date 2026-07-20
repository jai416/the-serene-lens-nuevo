import { logger } from "./logger"

const APP_NAME = "The Serene Lens"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

export interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export async function sendEmail(_input: SendEmailInput): Promise<boolean> {
  logger.info("📧 Email service: Próximamente", { to: _input.to, subject: _input.subject })
  return false
}

export function buildEmailHtml(_title: string, _message: string, _link?: string): string {
  return "<p>Próximamente</p>"
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string } {
  return { subject: "Recuperación de contraseña — Próximamente", html: `<p>Usa este enlace para restablecer tu contraseña: <a href="${resetUrl}">${resetUrl}</a></p><p>El servicio de email estará disponible próximamente.</p>` }
}

export function buildWelcomeEmail(_name: string): { subject: string; html: string } {
  return { subject: "Bienvenido — Próximamente", html: "<p>El servicio de email estará disponible próximamente.</p>" }
}

export function buildTrialEndedEmail(_name: string): { subject: string; html: string } {
  return { subject: "Tu prueba terminó — Próximamente", html: "<p>El servicio de email estará disponible próximamente.</p>" }
}

export function buildPaymentSuccessEmail(_plan: string, _amount: number): { subject: string; html: string } {
  return { subject: "Pago recibido — Próximamente", html: "<p>El servicio de email estará disponible próximamente.</p>" }
}

export function buildLeadMagnetEmail(): { subject: string; html: string } {
  return { subject: "Tu guía gratuita — Próximamente", html: "<p>El servicio de email estará disponible próximamente.</p>" }
}

export function buildRetentionEmail(_name: string): { subject: string; html: string } {
  return { subject: "¿Nos extrañas? — Próximamente", html: "<p>El servicio de email estará disponible próximamente.</p>" }
}

export function buildGiftEmail(_opts: { buyerName: string; recipientEmail: string; giftCode: string; analyses: number; packType: string }): { subject: string; html: string } {
  return { subject: "Has recibido un regalo — Próximamente", html: `<p>Usa el código ${_opts.giftCode} para canjear tu regalo.</p><p>El servicio de email estará disponible próximamente.</p>` }
}

export function buildReminderEmail(_name: string): { subject: string; html: string } {
  return { subject: "Recordatorio — Próximamente", html: "<p>El servicio de email estará disponible próximamente.</p>" }
}
