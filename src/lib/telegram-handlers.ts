import { db } from "@/lib/db"
import { sendTelegramMessage, getUserRole } from "@/lib/telegram"
import { sanitizeHtml } from "@/lib/sanitize"

function formatPaymentRow(p: { id: string; amount: number; status: string; plan: string; provider: string; createdAt: Date }): string {
  return `• #${p.id.slice(-6)} | ${sanitizeHtml(p.provider)} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} | ${sanitizeHtml(p.status)}`
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
  let text = `👤 <b>Cliente:</b> ${sanitizeHtml(user.name || "?")} (${sanitizeHtml(email)})\n📋 Plan: ${sanitizeHtml(user.plan)} | Rol: ${sanitizeHtml(user.role)}\n\n<b>Pagos (${user.payments.length}):</b>\n`
  for (const p of user.payments) text += formatPaymentRow(p) + "\n"
  await sendTelegramMessage(chatId, text)
}

export async function handleValidar(chatId: string, userId: string, args: string[]) {
  const role = getUserRole(userId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const ref = args[0]
  if (!ref) { await sendTelegramMessage(chatId, "Uso: /validar TRF-..."); return }
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "pending") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }
  await db.$transaction([
    db.transferPayment.update({ where: { id: transfer.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
    db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: transfer.id, targetType: "transfer", details: `Validated ${ref}` } }),
  ])
  await sendTelegramMessage(chatId, `✅ Pago validado: ${ref}\nAdmin debe activar con /activar ${ref}`)
}

export async function handleActivar(chatId: string, userId: string, args: string[]) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  const ref = args[0]
  if (!ref) { await sendTelegramMessage(chatId, "Uso: /activar TRF-..."); return }
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }
  await db.$transaction([
    db.transferPayment.update({ where: { id: transfer.id }, data: { status: "activated", activatedById: userId, activatedAt: new Date() } }),
    db.subscription.create({ data: { userId: transfer.userId, plan: transfer.plan, provider: "transfer", status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
    db.payment.create({ data: { userId: transfer.userId, provider: "transfer", plan: transfer.plan, amount: transfer.amount, status: "completed", confirmedAt: new Date(), remoteId: transfer.referenceCode } }),
    db.auditLog.create({ data: { userId, action: "activate_transfer", targetId: transfer.id, targetType: "transfer", details: `Activated ${ref}` } }),
  ])
  await sendTelegramMessage(chatId, `✅ Acceso activado: ${ref}`)
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
