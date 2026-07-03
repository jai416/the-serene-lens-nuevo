import { db } from "@/lib/db"
import { sendTelegramMessage, sendTelegramMenu, editTelegramMenu, answerCallback, getUserRole } from "@/lib/telegram"
import { sanitizeHtml } from "@/lib/sanitize"

const MENU_BACK = [{ text: "🔙 Menú principal", callback_data: "menu_main" }]

const COMMANDS: Record<string, { desc: string; roles: ("ADMIN" | "VALIDATOR")[] }> = {
  "/start": { desc: "Menú principal", roles: ["ADMIN", "VALIDATOR"] },
  "/help": { desc: "Lista de comandos", roles: ["ADMIN", "VALIDATOR"] },
  "/status": { desc: "Resumen del día", roles: ["ADMIN", "VALIDATOR"] },
  "/pending": { desc: "Pagos pendientes", roles: ["ADMIN", "VALIDATOR"] },
  "/cliente": { desc: "Buscar cliente por email", roles: ["ADMIN", "VALIDATOR"] },
  "/validar": { desc: "Validar pago TransferMóvil", roles: ["ADMIN", "VALIDATOR"] },
  "/activar": { desc: "Activar pago TransferMóvil (admin)", roles: ["ADMIN"] },
  "/users": { desc: "Estadísticas de usuarios", roles: ["ADMIN"] },
  "/revenue": { desc: "Ingresos por proveedor", roles: ["ADMIN"] },
  "/analytics": { desc: "Analytics del sistema", roles: ["ADMIN"] },
  "/reporte": { desc: "Reporte completo", roles: ["ADMIN"] },
  "/broadcast": { desc: "Enviar mensaje a todos", roles: ["ADMIN"] },
}

function cmdListForRole(role: "ADMIN" | "VALIDATOR"): string {
  return Object.entries(COMMANDS)
    .filter(([, v]) => v.roles.includes(role))
    .map(([k, v]) => `${k} — ${v.desc}`)
    .join("\n")
}

function roleBadge(role: string): string {
  return role === "ADMIN" ? "🛡️ Admin" : "✅ Validador"
}

function formatPaymentRow(p: { id: string; amount: number; status: string; plan: string; provider: string; createdAt: Date }): string {
  const icons: Record<string, string> = { qvapay: "💳", transfer: "🏦", paypal: "🅿️" }
  const icon = icons[p.provider] || "💳"
  return `${icon} #${p.id.slice(-6)} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} | ${statusIcon(p.status)} ${sanitizeHtml(p.status)}`
}

function statusIcon(status: string): string {
  const map: Record<string, string> = { completed: "✅", pending: "⏳", failed: "❌", validated: "👁️", activated: "✅" }
  return map[status] || "❓"
}

function progressBar(value: number, max: number, size = 8): string {
  const filled = Math.round((value / Math.max(max, 1)) * size)
  return "🟩".repeat(filled) + "⬜".repeat(Math.max(0, size - filled))
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

type MenuContext = { chatId: string; userId: string; messageId?: number; callbackId?: string }

async function sendOrEdit(ctx: MenuContext, text: string, buttons: { text: string; callback_data: string }[][]) {
  if (ctx.messageId) {
    await editTelegramMenu(ctx.chatId, ctx.messageId, text, buttons)
  } else {
    await sendTelegramMenu(ctx.chatId, text, buttons)
  }
}

export async function handleStart(chatId: string, userId: string) {
  const role = getUserRole(userId)
  if (!role) {
    await sendTelegramMessage(chatId, "❌ No tienes acceso. Tu Telegram ID no está registrado como admin.")
    return
  }
  await showMainMenu({ chatId, userId })
}

export async function handleCallback(data: string, chatId: string, userId: string, messageId: number, callbackId: string) {
  const role = getUserRole(userId)
  if (!role) {
    await answerCallback(chatId, callbackId, "❌ No autorizado")
    return
  }

  const ctx: MenuContext = { chatId, userId, messageId, callbackId }

  if (data === "menu_main") {
    await answerCallback(chatId, callbackId)
    await showMainMenu(ctx)
    return
  }

  if (data === "menu_gestion") {
    await answerCallback(chatId, callbackId)
    await showGestionMenu(ctx, role)
    return
  }

  if (data === "menu_pagos") {
    await answerCallback(chatId, callbackId)
    await showPagosMenu(ctx, role)
    return
  }

  if (data === "menu_clientes") {
    await answerCallback(chatId, callbackId)
    await showClientesMenu(ctx)
    return
  }

  if (data === "menu_admin" && role === "ADMIN") {
    await answerCallback(chatId, callbackId)
    await showAdminMenu(ctx)
    return
  }

  if (data === "action_status") {
    await answerCallback(chatId, callbackId)
    return await handleStatusCb(ctx)
  }
  if (data === "action_pending") {
    await answerCallback(chatId, callbackId)
    return await handlePendingCb(ctx)
  }
  if (data === "action_users") {
    await answerCallback(chatId, callbackId)
    return await handleUsersCb(ctx)
  }
  if (data === "action_revenue") {
    await answerCallback(chatId, callbackId)
    return await handleRevenueCb(ctx)
  }
  if (data === "action_analytics") {
    await answerCallback(chatId, callbackId)
    return await handleAnalyticsCb(ctx)
  }
  if (data === "action_reporte") {
    await answerCallback(chatId, callbackId)
    return await handleReporteCb(ctx)
  }
  if (data === "action_broadcast_confirm") {
    await answerCallback(chatId, callbackId)
    return await handleBroadcastConfirm(ctx)
  }
  if (data === "action_broadcast_cancel") {
    await answerCallback(chatId, callbackId, "Broadcast cancelado")
    await showMainMenu(ctx)
    return
  }
  if (data === "help") {
    await answerCallback(chatId, callbackId)
    await showHelpCb(ctx, role)
    return
  }

  if (data === "broadcast_write") {
    await answerCallback(chatId, callbackId, "Escribe tu mensaje")
    return
  }

  await answerCallback(chatId, callbackId, "Comando no reconocido")
  await showMainMenu(ctx)
}

async function showMainMenu(ctx: MenuContext) {
  const role = getUserRole(ctx.userId)
  if (!role) { await sendTelegramMessage(ctx.chatId, "❌ No autorizado."); return }
  const r = `👋 <b>The Serene Lens</b>\nRol: ${roleBadge(role)}\n\nSelecciona una categoría:`
  const buttons: { text: string; callback_data: string }[][] = [
    [{ text: "📊 Gestión", callback_data: "menu_gestion" }, { text: "💳 Pagos", callback_data: "menu_pagos" }],
    [{ text: "👤 Clientes", callback_data: "menu_clientes" }],
  ]
  if (role === "ADMIN") buttons.push([{ text: "⚙️ Admin", callback_data: "menu_admin" }])
  buttons.push([{ text: "❓ Ayuda", callback_data: "help" }])
  await sendOrEdit(ctx, r, buttons)
}

async function showGestionMenu(ctx: MenuContext, role: string) {
  const buttons = [
    [{ text: "📊 Resumen del día", callback_data: "action_status" }, { text: "📈 Reporte semanal", callback_data: "action_reporte" }],
    [{ text: "👥 Usuarios", callback_data: "action_users" }, { text: "💰 Ingresos", callback_data: "action_revenue" }],
    [{ text: "📊 Analytics", callback_data: "action_analytics" }],
    MENU_BACK,
  ]
  await sendOrEdit(ctx, `📊 <b>Gestión</b>\nSelecciona una opción:`, buttons)
}

async function showPagosMenu(ctx: MenuContext, role: string) {
  const buttons = [
    [{ text: "⏳ Pendientes", callback_data: "action_pending" }],
    MENU_BACK,
  ]
  await sendOrEdit(ctx, `💳 <b>Pagos</b>\nComandos disponibles:\n/validar TRF-xxx — Validar transferencia\n/activar TRF-xxx — Activar (solo admin)`, buttons)
}

async function showClientesMenu(ctx: MenuContext) {
  await sendOrEdit(ctx,
    `👤 <b>Clientes</b>\n\nBusca un cliente por email:\n<code>/cliente email@ejemplo.com</code>\n\nMuestra plan, pagos, análisis y suscripción.`,
    MENU_BACK
  )
}

async function showAdminMenu(ctx: MenuContext) {
  const buttons = [
    [{ text: "📊 Analytics", callback_data: "action_analytics" }, { text: "💰 Ingresos", callback_data: "action_revenue" }],
    [{ text: "📢 Broadcast", callback_data: "action_broadcast_confirm" }],
    MENU_BACK,
  ]
  await sendOrEdit(ctx, `⚙️ <b>Panel Admin</b>\nSelecciona una opción:`, buttons)
}

async function showHelpCb(ctx: MenuContext, role: "ADMIN" | "VALIDATOR") {
  await sendOrEdit(ctx,
    `📖 <b>Comandos disponibles</b>\n\n${cmdListForRole(role)}\n\n💡 También puedes usar los botones del menú.`,
    MENU_BACK
  )
}

async function handleStatusCb(ctx: MenuContext) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)

  const [paymentsToday, paymentsWeek, paymentsMonth, newUsers, newWeek, newMonth, analysesToday, totalUsers] = await Promise.all([
    db.payment.findMany({ where: { createdAt: { gte: today } } }),
    db.payment.findMany({ where: { createdAt: { gte: weekAgo } } }),
    db.payment.findMany({ where: { createdAt: { gte: monthAgo } } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: monthAgo } } }),
    db.skinAnalysis.count({ where: { createdAt: { gte: today } } }),
    db.user.count(),
  ])

  const revToday = paymentsToday.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const revWeek = paymentsWeek.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const revMonth = paymentsMonth.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)

  const text = `📊 <b>Resumen</b>\n\n<b>Hoy</b>\n💳 ${paymentsToday.length} pagos | 💰 $${revToday.toFixed(2)}\n👤 ${newUsers} usuarios nuevos | 🔬 ${analysesToday} análisis\n\n<b>7 días</b>\n💳 ${paymentsWeek.length} pagos | 💰 $${revWeek.toFixed(2)}\n👤 ${newWeek} usuarios\n\n<b>30 días</b>\n💳 ${paymentsMonth.length} pagos | 💰 $${revMonth.toFixed(2)}\n👤 ${newMonth} usuarios\n\n<b>Total usuarios:</b> ${totalUsers}`
  await sendOrEdit(ctx, text, MENU_BACK)
}

async function handlePendingCb(ctx: MenuContext) {
  const pending = await db.payment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 20 })
  if (pending.length === 0) {
    await sendOrEdit(ctx, "✅ No hay pagos pendientes.", MENU_BACK)
    return
  }
  const lines = [`📋 <b>Pendientes (${pending.length})</b>\n`]
  for (const p of pending) {
    lines.push(`${formatPaymentRow(p)} — ${relativeTime(p.createdAt)}`)
  }
  await sendOrEdit(ctx, lines.join("\n"), MENU_BACK)
}

async function handleUsersCb(ctx: MenuContext) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)

  const [total, free, premium, pro, proPlus, newToday, newMonth, subscribed] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: "FREE" } }),
    db.user.count({ where: { plan: "PREMIUM" } }),
    db.user.count({ where: { plan: "PRO" } }),
    db.user.count({ where: { plan: "PRO_PLUS" } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.user.count({ where: { createdAt: { gte: monthAgo } } }),
    db.subscription.count({ where: { status: "active" } }),
  ])

  const text = `👥 <b>Usuarios</b>\n\n<b>Total:</b> ${total}\n\n<b>Por plan</b>\n🆓 Free: ${free}\n⭐ Premium: ${premium}\n💎 Pro: ${pro}\n👑 Pro+: ${proPlus}\n\n📈 <b>Crecimiento</b>\nHoy: +${newToday} | 30d: +${newMonth}\n📅 Suscripciones activas: ${subscribed}\n\n${progressBar(premium + pro + proPlus, total)} ${((premium + pro + proPlus) / Math.max(total, 1) * 100).toFixed(1)}% conversión`
  await sendOrEdit(ctx, text, MENU_BACK)
}

async function handleRevenueCb(ctx: MenuContext) {
  const [qvapay, transfer, paypal, transferDirect] = await Promise.all([
    db.payment.aggregate({ where: { status: "completed", provider: "qvapay" }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { status: "completed", provider: "transfer" }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { status: "completed", provider: "paypal" }, _sum: { amount: true } }),
    db.transferPayment.aggregate({ where: { status: "activated" }, _sum: { amount: true } }),
  ])

  const q = qvapay._sum.amount || 0
  const t = (transfer._sum.amount || 0) + (transferDirect._sum.amount || 0)
  const p = paypal._sum.amount || 0
  const total = q + t + p

  const maxVal = Math.max(q, t, p, 1)
  const text = `💰 <b>Ingresos totales</b>\n\n💳 QvaPay: $${q.toFixed(2)} ${progressBar(q, maxVal, 10)}\n🏦 TransferMóvil: $${t.toFixed(2)} ${progressBar(t, maxVal, 10)}\n🅿️ PayPal: $${p.toFixed(2)} ${progressBar(p, maxVal, 10)}\n━━━━━━━━━━━━━━\n<b>Total: $${total.toFixed(2)}</b>`
  await sendOrEdit(ctx, text, MENU_BACK)
}

async function handleAnalyticsCb(ctx: MenuContext) {
  const [totalAnalyses, guidesSold, activeSubscriptions, referralGroups, diaryEntries, challenges] = await Promise.all([
    db.skinAnalysis.count(),
    db.digitalProductPurchase.count({ where: { status: "completed" } }),
    db.subscription.count({ where: { status: "active" } }),
    db.groupAnalytics.count(),
    db.skinDiary.count(),
    db.challenge.count({ where: { active: true } }),
  ])

  const text = `📊 <b>Analytics del sistema</b>\n\n🔬 Análisis realizados: ${totalAnalyses}\n📚 Guías vendidas: ${guidesSold}\n📅 Suscripciones activas: ${activeSubscriptions}\n👥 Grupos de referidos: ${referralGroups}\n📝 Entradas de diario: ${diaryEntries}\n🏆 Desafíos activos: ${challenges}`
  await sendOrEdit(ctx, text, MENU_BACK)
}

async function handleReporteCb(ctx: MenuContext) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

  const [todayPayments, weekPayments, newUsers, newWeekUsers, weekAnalyses] = await Promise.all([
    db.payment.findMany({ where: { createdAt: { gte: today } } }),
    db.payment.findMany({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.skinAnalysis.count({ where: { createdAt: { gte: weekAgo } } }),
  ])

  const todayRevenue = todayPayments.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const weekRevenue = weekPayments.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)

  const text = `📈 <b>Reporte semanal</b>\n\n<b>Hoy</b>\n💳 Pagos: ${todayPayments.length}\n💰 Ingresos: $${todayRevenue.toFixed(2)}\n👥 Usuarios nuevos: ${newUsers}\n\n<b>Últimos 7 días</b>\n💳 Pagos: ${weekPayments.length}\n💰 Ingresos: $${weekRevenue.toFixed(2)}\n👥 Usuarios nuevos: ${newWeekUsers}\n🔬 Análisis: ${weekAnalyses}`
  await sendOrEdit(ctx, text, MENU_BACK)
}

let broadcastPending: { chatId: string; message: string } | null = null

async function handleBroadcastConfirm(ctx: MenuContext) {
  const buttons = [
    [{ text: "📝 Escribir mensaje", callback_data: "broadcast_write" }],
    MENU_BACK,
  ]
  await sendOrEdit(ctx, `📢 <b>Broadcast</b>\n\nPresiona "Escribir mensaje" y luego escribe el mensaje que quieres enviar a TODOS los usuarios con Telegram vinculado.\n\nO usa:\n<code>/broadcast Tu mensaje aquí</code>`, buttons)
}

export async function handleBroadcastWrite(chatId: string, userId: string, args: string[]) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  const message = args.join(" ")
  if (!message) { await sendTelegramMessage(chatId, "✏️ Escribe el mensaje para el broadcast:"); return }
  const count = await db.user.count({ where: { telegramId: { not: null } } })
  if (count === 0) { await sendTelegramMessage(chatId, "❌ No hay usuarios con Telegram vinculado."); return }

  broadcastPending = { chatId, message }
  const buttons = [
    [{ text: "✅ Confirmar envío", callback_data: "broadcast_go" }, { text: "❌ Cancelar", callback_data: "action_broadcast_cancel" }],
  ]
  await sendTelegramMenu(chatId, `📢 <b>Vista previa</b>\n\nMensaje a ${count} usuarios:\n━━━━━━━━━━━━━━\n${sanitizeHtml(message)}\n━━━━━━━━━━━━━━\n\n¿Confirmas el envío?`, buttons)
}

export async function handleBroadcastGo(chatId: string, userId: string) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  if (!broadcastPending || broadcastPending.chatId !== chatId) {
    await sendTelegramMessage(chatId, "❌ No hay broadcast pendiente. Usa /broadcast")
    return
  }
  const msg = broadcastPending.message
  broadcastPending = null
  const users = await db.user.findMany({ where: { telegramId: { not: null } }, select: { telegramId: true } })
  let sent = 0
  for (const u of users) {
    if (u.telegramId) {
      const ok = await sendTelegramMessage(u.telegramId, msg)
      if (ok) sent++
    }
  }
  await sendTelegramMessage(chatId, `📢 Broadcast enviado a ${sent}/${users.length} usuarios.`)
}

export async function handleHelp(chatId: string, userId: string) {
  const role = getUserRole(userId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No tienes acceso."); return }
  await sendTelegramMenu(chatId,
    `📖 <b>Comandos disponibles</b>\n\n${cmdListForRole(role)}\n\n💡 También puedes usar los botones del menú.`,
    MENU_BACK
  )
}

export async function handleStatus(chatId: string, userId: string) {
  if (!getUserRole(userId)) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  await handleStatusCb({ chatId, userId })
}

export async function handlePending(chatId: string, userId: string) {
  if (!getUserRole(userId)) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  await handlePendingCb({ chatId, userId })
}

export async function handleCliente(chatId: string, userId: string, args: string[]) {
  if (!getUserRole(userId)) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const email = args[0]
  if (!email) { await sendTelegramMessage(chatId, "Uso: /cliente email@ejemplo.com"); return }
  const user = await db.user.findUnique({
    where: { email },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
      subscriptions: { where: { status: "active" }, take: 1 },
    },
  })
  if (!user) { await sendTelegramMessage(chatId, `❌ Usuario no encontrado: ${sanitizeHtml(email)}`); return }

  const [analysisCount, totalSpent, pendingPayments] = await Promise.all([
    db.skinAnalysis.count({ where: { userId: user.id } }),
    db.payment.aggregate({ where: { userId: user.id, status: "completed" }, _sum: { amount: true } }),
    db.payment.count({ where: { userId: user.id, status: "pending" } }),
  ])

  const sub = user.subscriptions[0]
  const planIcons: Record<string, string> = { FREE: "🆓", PREMIUM: "⭐", PRO: "💎", PRO_PLUS: "👑" }

  let text = `👤 <b>Cliente</b>\n`
  text += `Nombre: ${sanitizeHtml(user.name || "—")}\n`
  text += `Email: ${sanitizeHtml(email)}\n`
  text += `${planIcons[user.plan] || "📋"} Plan: ${sanitizeHtml(user.plan)} | Rol: ${sanitizeHtml(user.role)}\n`
  text += `🔬 Análisis: ${analysisCount}\n`
  text += `💰 Total gastado: $${(totalSpent._sum.amount || 0).toFixed(2)}\n`
  text += `⏳ Pagos pendientes: ${pendingPayments}\n`
  if (sub) {
    const endDate = sub.currentPeriodEnd?.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    text += `📅 Suscripción: ✅ Activa (hasta ${endDate || "?"})\n`
  } else {
    text += `📅 Suscripción: ❌ Ninguna\n`
  }
  text += `📆 Registro: ${user.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}\n`
  if (user.telegramId) text += `🤖 Telegram: ✅ Vinculado\n`
  if (user.payments.length > 0) {
    text += `\n<b>Últimos pagos:</b>\n`
    for (const p of user.payments) {
      text += `${formatPaymentRow(p)} — ${relativeTime(p.createdAt)}\n`
    }
  }
  await sendTelegramMenu(chatId, text, MENU_BACK)
}

export async function handleValidar(chatId: string, userId: string, args: string[]) {
  if (!getUserRole(userId)) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const ref = args[0]
  if (!ref) { await sendTelegramMessage(chatId, "Uso: /validar TRF-..."); return }
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "pending") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }
  await db.$transaction([
    db.transferPayment.update({ where: { id: transfer.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
    db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: transfer.id, targetType: "transfer", details: `Validated ${ref}` } }),
  ])
  const buttons = [[{ text: "🔙 Menú principal", callback_data: "menu_main" }]]
  await sendTelegramMenu(chatId, `✅ Pago validado: ${ref}\n\nAdmin debe activar con /activar ${ref}\n\nO desde el menú de pagos.`, buttons)
}

export async function handleActivar(chatId: string, userId: string, args: string[]) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  const ref = args[0]
  if (!ref) { await sendTelegramMessage(chatId, "Uso: /activar TRF-..."); return }

  if (args.length === 1) {
    const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
    if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
    if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }

    const buttons = [
      [
        { text: "✅ Confirmar activación", callback_data: `activar_${ref}` },
        { text: "❌ Cancelar", callback_data: "menu_main" },
      ],
    ]
    await sendTelegramMenu(chatId,
      `⚠️ <b>Confirmar activación</b>\n\nReferencia: ${ref}\nUsuario: ${sanitizeHtml(transfer.user.name || "?")} (${sanitizeHtml(transfer.user.email || "?")})\nPlan: ${transfer.plan}\nMonto: $${transfer.amount.toFixed(2)}\n\n¿Estás seguro?`,
      buttons
    )
    return
  }

  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }
  await db.$transaction([
    db.transferPayment.update({ where: { id: transfer.id }, data: { status: "activated", activatedById: userId, activatedAt: new Date() } }),
    db.subscription.create({ data: { userId: transfer.userId, plan: transfer.plan, provider: "transfer", status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
    db.payment.create({ data: { userId: transfer.userId, provider: "transfer", plan: transfer.plan, amount: transfer.amount, status: "completed", confirmedAt: new Date(), remoteId: transfer.referenceCode } }),
    db.auditLog.create({ data: { userId, action: "activate_transfer", targetId: transfer.id, targetType: "transfer", details: `Activated ${ref}` } }),
  ])
  await sendTelegramMenu(chatId, `✅ Acceso activado para ${ref}`, MENU_BACK)
}

export async function handleReporte(chatId: string, userId: string) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  await handleReporteCb({ chatId, userId })
}

export async function handleUsers(chatId: string, userId: string) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  await handleUsersCb({ chatId, userId })
}

export async function handleRevenue(chatId: string, userId: string) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  await handleRevenueCb({ chatId, userId })
}

export async function handleAnalytics(chatId: string, userId: string) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  await handleAnalyticsCb({ chatId, userId })
}

export async function handleBroadcast(chatId: string, userId: string, args: string[]) {
  if (getUserRole(userId) !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo admin."); return }
  await handleBroadcastWrite(chatId, userId, args)
}
