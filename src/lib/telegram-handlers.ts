import { db } from "@/lib/db"
import { sendTelegramMessage, getUserRole } from "@/lib/telegram"

function formatPaymentRow(p: { id: string; amount: number; status: string; plan: string; provider: string; createdAt: Date }): string {
  return `• #${p.id.slice(-6)} | ${p.provider} | ${p.plan} | $${p.amount.toFixed(2)} | ${p.status}`
}

export async function handleStart(chatId: string, userId: string) {
  const role = getUserRole(userId)
  if (!role) {
    await sendTelegramMessage(chatId, "❌ No tienes acceso. Tu Telegram ID no está registrado.")
    return
  }
  let text = `👋 <b>Bienvenido!</b>\nRol: ${role}\n\n<b>Comandos:</b>\n/status — Resumen del día\n/pending — Pendientes\n/cliente [email] — Buscar pedidos`
  if (role === "ADMIN") text += "\n/reporte — Reporte completo"
  await sendTelegramMessage(chatId, text)
}

export async function handleStatus(chatId: string, userId: string) {
  if (!getUserRole(userId)) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const paymentsToday = await db.payment.findMany({ where: { createdAt: { gte: today } } })
  const totalRevenue = paymentsToday.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const newUsers = await db.user.count({ where: { createdAt: { gte: today } } })
  await sendTelegramMessage(chatId,
    `📊 <b>Resumen del día</b>\n\n💳 Pagos: ${paymentsToday.length} | 💰 $${totalRevenue.toFixed(2)}\n👥 Usuarios nuevos: ${newUsers}`
  )
}

export async function handlePending(chatId: string, userId: string) {
  if (!getUserRole(userId)) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const pending = await db.payment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 20 })
  if (pending.length === 0) {
    await sendTelegramMessage(chatId, "✅ No hay pagos pendientes.")
    return
  }
  const lines = [`📋 <b>Pendientes (${pending.length})</b>`]
  for (const p of pending) lines.push(formatPaymentRow(p))
  await sendTelegramMessage(chatId, lines.join("\n"))
}

export async function handleCliente(chatId: string, userId: string, args: string[]) {
  if (!getUserRole(userId)) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const email = args[0]
  if (!email) { await sendTelegramMessage(chatId, "Uso: /cliente email@ejemplo.com"); return }
  const user = await db.user.findUnique({ where: { email }, include: { payments: { orderBy: { createdAt: "desc" }, take: 10 } } })
  if (!user) { await sendTelegramMessage(chatId, `❌ Usuario no encontrado: ${email}`); return }
  let text = `👤 <b>Cliente:</b> ${user.name || "?"} (${email})\n📋 Plan: ${user.plan} | Rol: ${user.role}\n\n<b>Pagos (${user.payments.length}):</b>\n`
  for (const p of user.payments) text += formatPaymentRow(p) + "\n"
  await sendTelegramMessage(chatId, text)
}

export async function handleReporte(chatId: string, userId: string) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const todayPayments = await db.payment.findMany({ where: { createdAt: { gte: today } } })
  const weekPayments = await db.payment.findMany({ where: { createdAt: { gte: weekAgo } } })
  const todayRevenue = todayPayments.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const weekRevenue = weekPayments.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const newUsers = await db.user.count({ where: { createdAt: { gte: today } } })
  const newWeekUsers = await db.user.count({ where: { createdAt: { gte: weekAgo } } })
  await sendTelegramMessage(chatId,
    `📈 <b>Reporte</b>\n\n<b>Hoy:</b>\nPagos: ${todayPayments.length} | $${todayRevenue.toFixed(2)}\nUsuarios nuevos: ${newUsers}\n\n<b>Últimos 7 días:</b>\nPagos: ${weekPayments.length} | $${weekRevenue.toFixed(2)}\nUsuarios nuevos: ${newWeekUsers}`
  )
}
