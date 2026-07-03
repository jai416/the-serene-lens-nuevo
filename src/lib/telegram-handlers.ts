import { db } from "@/lib/db"
import { sendTelegramMessage, sendTelegramMenu, editTelegramMenu, answerCallback, getUserRole, authAdmin, authValidator, logTelegramCommand, getTelegramLogs } from "@/lib/telegram"
import { getPlan, getPack } from "@/lib/pricing"
import { sanitizeHtml } from "@/lib/sanitize"

const MENU_BACK_ROW = [{ text: "🔙 Menú principal", callback_data: "menu_main" }]

type MenuContext = { chatId: string; userId: string; messageId?: number; callbackId?: string }

async function sendOrEdit(ctx: MenuContext, text: string, buttons: { text: string; callback_data: string }[][]) {
  if (ctx.messageId) {
    await editTelegramMenu(ctx.chatId, ctx.messageId, text, buttons)
  } else {
    await sendTelegramMenu(ctx.chatId, text, buttons)
  }
}

function statusIcon(status: string): string {
  const map: Record<string, string> = { completed: "✅", pending: "⏳", failed: "❌", validated: "👁️", activated: "✅", cancelled: "🚫" }
  return map[status] || "❓"
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

function progressBar(value: number, max: number, size = 8): string {
  const filled = Math.round((value / Math.max(max, 1)) * size)
  return "🟩".repeat(filled) + "⬜".repeat(Math.max(0, size - filled))
}

function formatPaymentRow(p: { id: string; amount: number; status: string; plan: string; provider: string; createdAt: Date }): string {
  const icons: Record<string, string> = { qvapay: "💳", transfer: "🏦", paypal: "🅿️" }
  const icon = icons[p.provider] || "💳"
  return `${icon} #${p.id.slice(-6)} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} | ${statusIcon(p.status)} ${sanitizeHtml(p.status)}`
}

// ===== SKINCARE TIPS =====
const SKINCARE_TIPS = [
  "🧴 Aplica protector solar todos los días, incluso en días nublados. Los rayos UV penetran las nubes.",
  "💧 Bebe al menos 8 vasos de agua al día para mantener tu piel hidratada desde dentro.",
  "😴 Dormir 7-8 horas ayuda a la regeneración celular de la piel.",
  "🥑 Los alimentos ricos en omega-3 (salmón, aguacate, nueces) mejoran la barrera cutánea.",
  "🧼 Limpia tu rostro dos veces al día: mañana y noche, sin excederte.",
  "🌿 La vitamina C por la mañana y el retinol por la noche son la combinación estrella.",
  "🚿 Evita el agua muy caliente al lavar tu rostro, reseca la piel.",
  "🧤 Exfolia tu piel 1-2 veces por semana, no más.",
  "🌙 Tu rutina nocturna es más importante que la diurna: la piel se regenera mientras duermes.",
  "☀️ Reaplica protector solar cada 2-3 horas si estás al aire libre.",
  "🍓 Las mascarillas naturales de yogur y miel son excelentes para hidratar.",
  "🧊 El agua fría al final de la limpieza cierra los poros y activa la circulación.",
  "🍵 El té verde contiene antioxidantes que combaten el envejecimiento prematuro.",
  "🧴 Usa productos según tu tipo de piel: grasa, seca, mixta o sensible.",
  "🛌 Cambia tu funda de almohada cada semana para evitar la acumulación de bacterias.",
]

function getRandomTip(): string {
  return SKINCARE_TIPS[Math.floor(Math.random() * SKINCARE_TIPS.length)]
}

// ===== PUBLIC HANDLERS =====

export async function handleStart(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "start", null, null)
  const role = await getUserRole(chatId)
  const r = role === "ADMIN" ? "👑 Admin" : role === "VALIDATOR" ? "🛡️ Validador" : "👋 Usuario"
  const text = `👋 ¡Bienvenido a The Serene Lens!\n\nSoy tu asistente de skincare con IA. Te ayudo a descubrir cómo es tu piel realmente, sin porcentajes inventados.\n\n🔍 <b>¿Qué puedo hacer por ti?</b>\n/web → Ir a la web\n/precios → Ver planes y precios\n/status → Ver tu estado en la app\n/ayuda → Ver todos los comandos\n\n🌿 <b>Rol actual:</b> ${r}\n\n¡Cuida tu piel!`
  const buttons: { text: string; callback_data: string }[][] = [
    [{ text: "🌐 Ir a la web", callback_data: "web" }, { text: "💰 Precios", callback_data: "precios" }],
  ]
  if (role) {
    buttons.push([{ text: "📊 Menú de gestión", callback_data: "menu_main" }])
  }
  await sendTelegramMenu(chatId, text, buttons)
}

export async function handleWeb(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "web", null, null)
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  await sendTelegramMessage(chatId, `🌐 <b>The Serene Lens</b>\n\nVisita nuestra web:\n<a href="${url}">${url}</a>\n\nAnálisis de piel con IA, rutinas personalizadas, y más.`)
}

export async function handlePrecios(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "precios", null, null)
  const text = `💰 <b>Planes y Precios</b>\n\n🆓 <b>Essential (FREE)</b>\n  1 análisis al mes\n  ¡Siempre gratis!\n\n⭐ <b>Premium</b> — $4.99/mes\n  Análisis ilimitados\n  Historial y evolución\n\n💎 <b>Pro</b> — $9.99/mes\n  Todo Premium + prioridad\n  Acceso anticipado\n\n👑 <b>Pro+</b> — $14.99/mes\n  Todo Pro + informes PDF\n  Rutina dinámica\n  Comparativa mensual\n\n📦 <b>Packs adicionales:</b>\n  Básico (3 anál.) — $1.99\n  Popular (5 anál.) — $4.99\n  Avanzado (15 anál.) — $6.99\n\n🌿 Pruébalo gratis en nuestra web.`
  await sendTelegramMessage(chatId, text)
}

export async function handleStatusPublic(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "status", null, null)
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  if (!user) {
    await sendTelegramMessage(chatId, `❌ No estás registrado en la app.\n\nRegístrate en:\n${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/login\n\nDespués vincula tu Telegram desde tu perfil.`)
    return
  }
  const planIcons: Record<string, string> = { FREE: "🆓", PREMIUM: "⭐", PRO: "💎", PRO_PLUS: "👑" }
  const planIcon = planIcons[user.plan] || "📋"
  const [analysisCount, pendingPayments] = await Promise.all([
    db.skinAnalysis.count({ where: { userId: user.id } }),
    db.payment.count({ where: { userId: user.id, status: "pending" } }),
  ])
  const text = `👤 <b>Tu estado</b>\n\nNombre: ${sanitizeHtml(user.name || "—")}\nEmail: ${sanitizeHtml(user.email)}\n${planIcon} Plan: ${sanitizeHtml(user.plan)}\n🔬 Análisis realizados: ${analysisCount}\n⏳ Pagos pendientes: ${pendingPayments}\n📆 Registro: ${user.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
  await sendTelegramMessage(chatId, text)
}

export async function handleAyuda(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "ayuda", null, null)
  const role = await getUserRole(chatId)
  let text = `📖 <b>Comandos disponibles</b>\n\n👤 <b>Usuario</b>\n/start — Bienvenida\n/web — Enlace a la web\n/precios — Planes y precios\n/status — Tu estado en la app\n/ayuda — Esta ayuda\n/skincare — Tip de skincare\n/contacto — Información de contacto\n`
  if (role) {
    text += `\n🔐 <b>Tu rol: ${role === "ADMIN" ? "👑 Admin" : "🛡️ Validador"}</b>\n`
    if (role === "VALIDATOR") {
      text += `/validar REF — Validar pago TransferMóvil\n/pendientes — Pagos pendientes\n/buscar email/ref — Buscar pago\n/historial email — Historial de pagos\n/validatorhelp — Ayuda de validador\n`
    } else {
      text += `/validar REF — Validar pago\n/activar REF — Activar plan\n/pendientes — Pagos pendientes\n/cliente email — Buscar cliente\n/reporte — Reporte del día\n/usuarios — Estadísticas\n/broadcast — Mensaje masivo\n/logs — Ver actividad\n/adminhelp — Ayuda completa\n`
    }
  }
  await sendTelegramMessage(chatId, text)
}

export async function handleSkincare(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "skincare", null, null)
  await sendTelegramMessage(chatId, `💡 <b>Tip de skincare</b>\n\n${getRandomTip()}\n\n🌿 ¡Vuelve pronto para más tips!`)
}

export async function handleContacto(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "contacto", null, null)
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  await sendTelegramMessage(chatId, `📬 <b>Contacto</b>\n\n📧 Email: hereirajaison@gmail.com\n🌐 Web: <a href="${url}">${url}</a>\n📱 WhatsApp: +53 51819744\n\n💬 Escríbenos para cualquier consulta.`)
}

// ===== VALIDATOR HANDLERS =====

export async function handleValidatorAuth(chatId: string, userId: string, args: string[]) {
  const token = args[0]
  if (!token) {
    await sendTelegramMessage(chatId, `🔐 Introduce el token de validador para continuar.\n\n<code>/validator TU_TOKEN</code>\n\n(El token debe ser proporcionado por el administrador)`)
    return
  }
  const ok = await authValidator(chatId, token)
  if (ok) {
    await logTelegramCommand(chatId, "validator", "success", "VALIDATOR")
    await sendTelegramMessage(chatId, `✅ ¡Token válido! Ahora eres validador.\n\nComandos disponibles:\n- /validar REF → Validar pago TransferMóvil\n- /pendientes → Ver pagos pendientes\n- /buscar email/ref → Buscar pago\n- /historial email → Ver historial de pagos\n- /validatorhelp → Ver ayuda\n\n¡A validar pagos! 💰`)
  } else {
    await logTelegramCommand(chatId, "validator", "failed", null)
    await sendTelegramMessage(chatId, `❌ Token inválido. Solicita un token válido al administrador.`)
  }
}

export async function handleValidar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado. Usa /validator o /admin para autenticarte."); return }
  await logTelegramCommand(chatId, "validar", args.join(" "), role)
  const ref = args[0]
  if (!ref) { await sendTelegramMessage(chatId, "Uso: /validar TRF-...\nEjemplo: /validar TRF-A1B2C3"); return }
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "pending") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }
  await db.$transaction([
    db.transferPayment.update({ where: { id: transfer.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
    db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: transfer.id, targetType: "transfer", details: `Validated ${ref}` } }),
  ])
  await sendTelegramMessage(chatId, `✅ Pago validado: ${ref}\n\nEl administrador debe activarlo con /activar ${ref}`)
}

export async function handlePendientes(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  await logTelegramCommand(chatId, "pendientes", null, role)
  const pending = await db.transferPayment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 20 })
  if (pending.length === 0) {
    await sendTelegramMessage(chatId, "✅ No hay pagos TransferMóvil pendientes.")
    return
  }
  const lines = [`📋 <b>Pendientes (${pending.length})</b>\n`]
  for (const p of pending) {
    lines.push(`🏦 #${p.referenceCode} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} | ${relativeTime(p.createdAt)}`)
  }
  await sendTelegramMessage(chatId, lines.join("\n"))
}

export async function handleBuscar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const query = args[0]
  if (!query) { await sendTelegramMessage(chatId, "Uso: /buscar email@ejemplo.com o /buscar TRF-xxx"); return }
  await logTelegramCommand(chatId, "buscar", query, role)
  const isRef = query.startsWith("TRF-")
  let transfer
  if (isRef) {
    transfer = await db.transferPayment.findUnique({ where: { referenceCode: query }, include: { user: true } })
  } else {
    const user = await db.user.findUnique({ where: { email: query } })
    if (!user) { await sendTelegramMessage(chatId, `❌ Usuario no encontrado: ${sanitizeHtml(query)}`); return }
    const transfers = await db.transferPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 })
    if (transfers.length === 0) { await sendTelegramMessage(chatId, `❌ Sin pagos para ${sanitizeHtml(query)}`); return }
    transfer = transfers[0]
  }
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${sanitizeHtml(query)}`); return }
  const text = `🔍 <b>Pago encontrado</b>\n\nReferencia: ${transfer.referenceCode}\nPlan: ${sanitizeHtml(transfer.plan)}\nMonto: $${transfer.amount.toFixed(2)}\nEstado: ${statusIcon(transfer.status)} ${transfer.status}\n${transfer.validatedAt ? `👁️ Validado: ${relativeTime(transfer.validatedAt)}\n` : ""}${transfer.activatedAt ? `✅ Activado: ${relativeTime(transfer.activatedAt)}\n` : ""}📆 Creado: ${relativeTime(transfer.createdAt)}`
  await sendTelegramMessage(chatId, text)
}

export async function handleHistorial(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const email = args[0]
  if (!email) { await sendTelegramMessage(chatId, "Uso: /historial email@ejemplo.com"); return }
  await logTelegramCommand(chatId, "historial", email, role)
  const user = await db.user.findUnique({ where: { email } })
  if (!user) { await sendTelegramMessage(chatId, `❌ Usuario no encontrado: ${sanitizeHtml(email)}`); return }
  const [payments, transfers] = await Promise.all([
    db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.transferPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ])
  const lines = [`📋 <b>Historial de pagos: ${sanitizeHtml(email)}</b>\n`]
  for (const p of payments) {
    lines.push(`${formatPaymentRow(p)} — ${relativeTime(p.createdAt)}`)
  }
  for (const t of transfers) {
    lines.push(`🏦 #${t.referenceCode} | ${sanitizeHtml(t.plan)} | $${t.amount.toFixed(2)} | ${statusIcon(t.status)} ${t.status} — ${relativeTime(t.createdAt)}`)
  }
  if (payments.length === 0 && transfers.length === 0) {
    lines.push("Sin pagos registrados.")
  }
  await sendTelegramMessage(chatId, lines.join("\n"))
}

export async function handleValidatorHelp(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  await logTelegramCommand(chatId, "validatorhelp", null, role)
  await sendTelegramMessage(chatId, `🛡️ <b>Comandos de Validador</b>\n\n/validar REF → Validar pago TransferMóvil\n/pendientes → Ver pagos pendientes\n/buscar email/ref → Buscar pago\n/historial email → Ver historial de pagos\n/validatorhelp → Esta ayuda\n\n💰 ¡A validar pagos!`)
}

// ===== ADMIN HANDLERS =====

export async function handleAdminAuth(chatId: string, userId: string, args: string[]) {
  const token = args[0]
  if (!token) {
    await sendTelegramMessage(chatId, `🔐 Introduce el token de administrador para continuar.\n\n<code>/admin TU_TOKEN</code>\n\n(El token debe mantenerse en secreto)`)
    return
  }
  const ok = await authAdmin(chatId, token)
  if (ok) {
    await logTelegramCommand(chatId, "admin", "success", "ADMIN")
    await sendTelegramMessage(chatId, `✅ ¡Token válido! Ahora eres administrador.\n\nComandos disponibles:\n- /validar REF → Validar pago\n- /activar REF → Activar plan\n- /pendientes → Pagos pendientes\n- /cliente email → Buscar cliente\n- /reporte → Reporte del día\n- /usuarios → Estadísticas\n- /broadcast msg → Mensaje masivo\n- /logs → Ver actividad\n- /adminhelp → Ayuda completa\n\n🚀 Control total activado!`)
  } else {
    await logTelegramCommand(chatId, "admin", "failed", null)
    await sendTelegramMessage(chatId, `❌ Token inválido. Contacta al administrador.`)
  }
}

export async function handleActivar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const ref = args[0]
  if (!ref) { await sendTelegramMessage(chatId, "Uso: /activar TRF-..."); return }
  await logTelegramCommand(chatId, "activar", ref, role)

  if (args.length === 1) {
    const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
    if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
    if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }
    const buttons = [
      [{ text: "✅ Confirmar activación", callback_data: `activar_${ref}` }, { text: "❌ Cancelar", callback_data: "menu_main" }],
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
  await sendTelegramMessage(chatId, `✅ Acceso activado para ${ref}`)
}

export async function handleActivarConfirm(chatId: string, userId: string, ref: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }
  await db.$transaction([
    db.transferPayment.update({ where: { id: transfer.id }, data: { status: "activated", activatedById: userId, activatedAt: new Date() } }),
    db.subscription.create({ data: { userId: transfer.userId, plan: transfer.plan, provider: "transfer", status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
    db.payment.create({ data: { userId: transfer.userId, provider: "transfer", plan: transfer.plan, amount: transfer.amount, status: "completed", confirmedAt: new Date(), remoteId: transfer.referenceCode } }),
    db.auditLog.create({ data: { userId, action: "activate_transfer", targetId: transfer.id, targetType: "transfer", details: `Activated ${ref} via callback` } }),
  ])
  await sendTelegramMessage(chatId, `✅ Acceso activado para ${ref}`)
}

export async function handleCliente(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const email = args[0]
  if (!email) { await sendTelegramMessage(chatId, "Uso: /cliente email@ejemplo.com"); return }
  await logTelegramCommand(chatId, "cliente", email, role)
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
  let text = `👤 <b>Cliente</b>\nNombre: ${sanitizeHtml(user.name || "—")}\nEmail: ${sanitizeHtml(email)}\n${planIcons[user.plan] || "📋"} Plan: ${sanitizeHtml(user.plan)} | Rol: ${sanitizeHtml(user.role)}\n🔬 Análisis: ${analysisCount}\n💰 Total: $${(totalSpent._sum.amount || 0).toFixed(2)}\n⏳ Pendientes: ${pendingPayments}\n`
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
  const buttons = [[{ text: "📊 Menú principal", callback_data: "menu_main" }]]
  await sendTelegramMenu(chatId, text, buttons)
}

export async function handleReporte(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  await logTelegramCommand(chatId, "reporte", null, role)
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
  const text = `📈 <b>Reporte diario</b>\n\n<b>Hoy</b>\n💳 Pagos: ${todayPayments.length}\n💰 Ingresos: $${todayRevenue.toFixed(2)}\n👥 Usuarios nuevos: ${newUsers}\n\n<b>Últimos 7 días</b>\n💳 Pagos: ${weekPayments.length}\n💰 Ingresos: $${weekRevenue.toFixed(2)}\n👥 Usuarios nuevos: ${newWeekUsers}\n🔬 Análisis: ${weekAnalyses}`
  await sendTelegramMessage(chatId, text)
}

export async function handleUsuarios(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  await logTelegramCommand(chatId, "usuarios", null, role)
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
  const paid = premium + pro + proPlus
  const text = `👥 <b>Usuarios</b>\n\n<b>Total:</b> ${total}\n\n<b>Por plan</b>\n🆓 Free: ${free}\n⭐ Premium: ${premium}\n💎 Pro: ${pro}\n👑 Pro+: ${proPlus}\n\n📈 <b>Crecimiento</b>\nHoy: +${newToday} | 30d: +${newMonth}\n📅 Suscripciones activas: ${subscribed}\n\n${progressBar(paid, total)} ${(paid / Math.max(total, 1) * 100).toFixed(1)}% conversión`
  await sendTelegramMessage(chatId, text)
}

export async function handleAdminHelp(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  await logTelegramCommand(chatId, "adminhelp", null, role)
  await sendTelegramMessage(chatId, `👑 <b>Comandos de Administrador</b>\n\n/validar REF → Validar pago\n/activar REF → Activar plan\n/pendientes → Pagos pendientes\n/cliente email → Buscar cliente\n/reporte → Reporte del día\n/usuarios → Estadísticas\n/broadcast msg → Mensaje a todos\n/logs [fecha] → Ver actividad\n/adminhelp → Esta ayuda\n\n🚀 Control total activado!`)
}

export async function handleBroadcast(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const message = args.join(" ")
  if (!message) {
    await sendTelegramMessage(chatId, "Uso: /broadcast Mensaje para todos los usuarios\n\nEjemplo: /broadcast 🎉 Nueva promoción disponible!")
    return
  }
  await logTelegramCommand(chatId, "broadcast", message.slice(0, 100), role)
  const users = await db.user.findMany({ where: { telegramId: { not: null } }, select: { telegramId: true } })
  if (users.length === 0) { await sendTelegramMessage(chatId, "❌ No hay usuarios con Telegram vinculado."); return }
  const buttons = [
    [{ text: "✅ Confirmar envío", callback_data: "broadcast_go" }, { text: "❌ Cancelar", callback_data: "menu_main" }],
  ]
  broadcastPending = { chatId, message }
  await sendTelegramMenu(chatId, `📢 <b>Broadcast</b>\n\nMensaje a ${users.length} usuarios:\n━━━━━━━━━━━━━━\n${sanitizeHtml(message)}\n━━━━━━━━━━━━━━\n\n¿Confirmas?`, buttons)
}

let broadcastPending: { chatId: string; message: string } | null = null

export async function handleBroadcastGo(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
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

export async function handleLogs(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const fecha = args[0]
  await logTelegramCommand(chatId, "logs", fecha || null, role)
  const logs = await getTelegramLogs(fecha)
  const text = `📋 <b>Logs${fecha ? " (" + fecha + ")" : ""}</b>\n\n${logs.join("\n") || "Sin registros."}`
  if (text.length > 4000) {
    const chunks = text.match(/.{1,4000}/g) || []
    for (const chunk of chunks) {
      await sendTelegramMessage(chatId, chunk)
    }
  } else {
    await sendTelegramMessage(chatId, text)
  }
}

// ===== INLINE MENU (Validators / Admins) =====

export async function handleCallback(data: string, chatId: string, userId: string, messageId: number, callbackId: string) {
  const role = await getUserRole(chatId)
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

  if (data === "menu_pagos") {
    await answerCallback(chatId, callbackId)
    await showPagosMenu(ctx, role)
    return
  }

  if (data === "action_pending") {
    await answerCallback(chatId, callbackId)
    return await handlePendientesCb(ctx)
  }

  if (data === "action_users") {
    await answerCallback(chatId, callbackId)
    return await handleUsuariosCb(ctx, chatId, userId)
  }

  if (data === "action_reporte") {
    await answerCallback(chatId, callbackId)
    return await handleReporteCb(ctx, chatId, userId)
  }

  if (data === "menu_admin" && role === "ADMIN") {
    await answerCallback(chatId, callbackId)
    await showAdminMenu(ctx)
    return
  }

  if (data === "web") {
    await answerCallback(chatId, callbackId, "Abriendo web...")
    await handleWeb(chatId, userId)
    return
  }
  if (data === "precios") {
    await answerCallback(chatId, callbackId, "Mostrando precios...")
    await handlePrecios(chatId, userId)
    return
  }

  if (data === "action_broadcast_cancel") {
    await answerCallback(chatId, callbackId, "Broadcast cancelado")
    broadcastPending = null
    await showMainMenu(ctx)
    return
  }
  if (data === "broadcast_go") {
    await answerCallback(chatId, callbackId, "Enviando broadcast...")
    await handleBroadcastGo(chatId, userId)
    return
  }

  if (data.startsWith("activar_")) {
    const ref = data.replace("activar_", "")
    await answerCallback(chatId, callbackId, "✅ Activando...")
    await handleActivarConfirm(chatId, userId, ref)
    return
  }

  await answerCallback(chatId, callbackId, "Comando no reconocido")
}

async function showMainMenu(ctx: MenuContext) {
  const role = await getUserRole(ctx.chatId)
  if (!role) { await sendTelegramMessage(ctx.chatId, "❌ No autorizado."); return }
  const r = role === "ADMIN" ? "👑 Admin" : "🛡️ Validador"
  const text = `👋 <b>The Serene Lens</b>\nRol: ${r}\n\nSelecciona una categoría:`
  const buttons: { text: string; callback_data: string }[][] = [
    [{ text: "💳 Pagos", callback_data: "menu_pagos" }],
  ]
  if (role === "ADMIN") {
    buttons.push([{ text: "👥 Usuarios", callback_data: "action_users" }, { text: "📈 Reporte", callback_data: "action_reporte" }])
    buttons.push([{ text: "⚙️ Admin", callback_data: "menu_admin" }])
  }
  await sendOrEdit(ctx, text, buttons)
}

async function showPagosMenu(ctx: MenuContext, role: string) {
  const buttons = [
    [{ text: "⏳ Pendientes", callback_data: "action_pending" }],
    MENU_BACK_ROW,
  ]
  await sendOrEdit(ctx, `💳 <b>Pagos</b>\n\nComandos:\n/validar TRF-xxx — Validar\n${role === "ADMIN" ? "/activar TRF-xxx — Activar\n" : ""}/pendientes — Ver pendientes\n/buscar email/ref — Buscar\n/historial email — Historial`, buttons)
}

async function handlePendientesCb(ctx: MenuContext) {
  const pending = await db.transferPayment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 20 })
  if (pending.length === 0) {
    await sendOrEdit(ctx, "✅ No hay pagos pendientes.", [MENU_BACK_ROW])
    return
  }
  const lines = [`📋 <b>Pendientes (${pending.length})</b>\n`]
  for (const p of pending) {
    lines.push(`🏦 #${p.referenceCode} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} | ${relativeTime(p.createdAt)}`)
  }
  await sendOrEdit(ctx, lines.join("\n"), [MENU_BACK_ROW])
}

async function handleUsuariosCb(ctx: MenuContext, chatId: string, userId: string) {
  await handleUsuarios(chatId, userId)
}

async function handleReporteCb(ctx: MenuContext, chatId: string, userId: string) {
  await handleReporte(chatId, userId)
}

async function showAdminMenu(ctx: MenuContext) {
  const buttons = [
    [{ text: "👥 Usuarios", callback_data: "action_users" }, { text: "📈 Reporte", callback_data: "action_reporte" }],
    MENU_BACK_ROW,
  ]
  await sendOrEdit(ctx, `⚙️ <b>Panel Admin</b>\n\n/comandos desde el chat:\n/cliente email\n/broadcast msg\n/logs [fecha]\n/activar REF`, buttons)
}
