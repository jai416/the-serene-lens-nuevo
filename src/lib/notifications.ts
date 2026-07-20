import { db } from "./db"
import { redisSet, redisGet } from "./redis"

const NOTIFICATION_TTL_SECONDS = 48 * 60 * 60
const NOTIFICATION_CACHE_PREFIX = "notifications:user:"

export async function createWebNotification(
  userId: string,
  title: string,
  message: string,
  link?: string,
) {
  const notification = await db.notification.create({
    data: { userId, title, message, link, emailSent: false },
  })

  await redisSet(`${NOTIFICATION_CACHE_PREFIX}unread:${userId}`, true, NOTIFICATION_TTL_SECONDS)

  return notification
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await db.notification.update({
    where: { id: notificationId, userId },
    data: { read: true },
  })
}

export async function markAllRead(userId: string) {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
  await redisSet(`${NOTIFICATION_CACHE_PREFIX}unread:${userId}`, false, 60)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const cached = await redisGet<boolean>(`${NOTIFICATION_CACHE_PREFIX}unread:${userId}`)
  if (cached === false) return 0

  const count = await db.notification.count({
    where: { userId, read: false },
  })
  return count
}

export async function getUserNotifications(userId: string, limit = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

export async function cleanupExpiredNotifications() {
  const cutoff = new Date(Date.now() - NOTIFICATION_TTL_SECONDS * 1000)
  const deleted = await db.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  return deleted.count
}

export async function createPaymentSuccessNotification(userId: string, plan: string, amount: number) {
  const planNames: Record<string, string> = {
    PREMIUM: "Premium", PREMIUM_ANNUAL: "Premium Anual",
    PRO: "Pro", PRO_ANNUAL: "Pro Anual",
    PRO_PLUS: "Pro+",
    ESTHETICIAN: "Esteticista", ESTHETICIAN_ANNUAL: "Esteticista Anual",
  }
  return createWebNotification(
    userId,
    "¡Pago recibido!",
    `Tu plan ${planNames[plan] || plan} ha sido activado ($${amount.toFixed(2)}).`,
    "/dashboard/subscription",
  )
}

export async function createTrialEndedNotification(userId: string, name: string) {
  return createWebNotification(
    userId,
    "Tu periodo PREMIUM ha finalizado",
    `Hola ${name || "usuario"}, tu prueba gratuita de 7 días ha terminado. Tu cuenta continúa en el plan Essential con 1 análisis por mes.`,
    "/pricing",
  )
}

export async function createWelcomeNotification(userId: string, name: string) {
  return createWebNotification(
    userId,
    "¡Bienvenido a The Serene Lens!",
    `Gracias por registrarte${name ? `, ${name}` : ""}. Tu prueba PREMIUM de 7 días ya comenzó.`,
    "/dashboard",
  )
}

export async function createRetentionNotification(userId: string, name: string) {
  const greeting = name ? name : "usuario"
  return createWebNotification(
    userId,
    "¿Extrañas tu rutina de skincare?",
    `Hola ${greeting}, hace tiempo que no realizas un análisis. Tu piel te espera.`,
    "/analysis",
  )
}

export async function createReminderNotification(userId: string, name: string) {
  const greeting = name ? name : "usuario"
  return createWebNotification(
    userId,
    "Tu recordatorio de skincare",
    `Hola ${greeting}, hoy es un buen día para cuidar tu piel. Haz un análisis rápido.`,
    "/analysis",
  )
}

export async function createGiftNotification(userId: string, code: string, analyses: number) {
  return createWebNotification(
    userId,
    "Has recibido un regalo 🎁",
    `Te han regalado ${analyses} análisis. Usa el código ${code} para canjearlo.`,
    "/dashboard/subscription",
  )
}

export async function createGuideNotification(userId: string, guideTitle: string, downloadUrl: string) {
  return createWebNotification(
    userId,
    "¡Guía disponible!",
    `Tu guía "${guideTitle}" está lista para descargar.`,
    downloadUrl,
  )
}

export async function createWeatherAlertNotification(userId: string, message: string) {
  return createWebNotification(
    userId,
    "🌤 Alerta climática",
    message,
    "/dashboard",
  )
}
