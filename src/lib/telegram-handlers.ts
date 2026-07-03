import { db } from "@/lib/db"
import {
  sendTelegramMessage, sendTelegramMenu, sendTelegramKeyboard, removeKeyboard,
  editTelegramMenu, answerCallback, getUserRole, authAdmin, authValidator,
  logTelegramCommand, getTelegramLogs, setAlertSub, getAlertSub, notifyAdmins,
  setReminder, getReminderStatus, generateDiscountCode, validateDiscountCode,
  saveFeedback, getFeedbackAvg, getRandomMeme,
} from "@/lib/telegram"
import { sanitizeHtml } from "@/lib/sanitize"

const MENU_BACK_ROW = [{ text: "🔙 Menú principal", callback_data: "menu_main" }]
const USER_KEYBOARD: string[][] = [
  ["🌐 Web", "💰 Precios"],
  ["📈 Mi Estado", "🆘 Ayuda"],
]

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

const SKINCARE_TIPS = [
  "🧴 Aplica protector solar todos los días, incluso en días nublados.",
  "💧 Bebe al menos 8 vasos de agua al día.",
  "😴 Dormir 7-8 horas ayuda a la regeneración celular.",
  "🥑 Los omega-3 mejoran la barrera cutánea.",
  "🧼 Limpia tu rostro dos veces al día.",
  "🌿 Vitamina C por la mañana, retinol por la noche.",
  "🚿 Evita agua muy caliente al lavar tu rostro.",
  "🧤 Exfolia 1-2 veces por semana, no más.",
  "🌙 La rutina nocturna es más importante.",
  "☀️ Reaplica protector solar cada 2-3 horas.",
  "🍓 Mascarillas de yogur y miel hidratan naturalmente.",
  "🧊 Agua fría al final de la limpieza cierra poros.",
  "🍵 El té verde combate el envejecimiento prematuro.",
  "🧴 Usa productos según tu tipo de piel.",
  "🛌 Cambia tu funda de almohada cada semana.",
]

function getRandomTip(): string {
  return SKINCARE_TIPS[Math.floor(Math.random() * SKINCARE_TIPS.length)]
}

// ================================================================
//  PUBLIC HANDLERS
// ================================================================

export async function handleStart(chatId: string, userId: string, username?: string) {
  await logTelegramCommand(chatId, "start", null, null, username)
  const role = await getUserRole(chatId)
  const r = role === "ADMIN" ? "👑 Admin" : role === "VALIDATOR" ? "🛡️ Validador" : "👋 Usuario"

  const text = `👋 ¡Bienvenido a The Serene Lens!\n\nSoy tu asistente de skincare con IA. Te ayudo a descubrir cómo es tu piel realmente, sin porcentajes inventados.\n\n🌿 <b>Rol actual:</b> ${r}\n\nUsa los botones de abajo o escribe /ayuda para ver comandos.`

  if (role) {
    const buttons = [
      [{ text: "💳 Pagos", callback_data: "menu_pagos" }],
    ]
    if (role === "ADMIN") {
      buttons.push([{ text: "👥 Usuarios", callback_data: "action_users" }, { text: "📈 Reporte", callback_data: "action_reporte" }])
      buttons.push([{ text: "⚙️ Admin", callback_data: "menu_admin" }])
    }
    await sendTelegramMenu(chatId, text, buttons)
  } else {
    await sendTelegramKeyboard(chatId, text, USER_KEYBOARD)
  }
}

export async function handleWeb(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "web", null, null)
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  await sendTelegramMessage(chatId, `🌐 <b>The Serene Lens</b>\n\nVisita nuestra web:\n<a href="${url}">${url}</a>\n\nAnálisis de piel con IA, rutinas personalizadas, y más.`)
}

export async function handlePrecios(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "precios", null, null)
  const text = `💰 <b>Planes y Precios</b>\n\n🆓 <b>Essential (FREE)</b> — $0\n  1 análisis al mes\n\n⭐ <b>Premium</b> — $4.99/mes\n  Análisis ilimitados\n  Historial y evolución\n\n💎 <b>Pro</b> — $9.99/mes\n  Prioridad + acceso anticipado\n\n👑 <b>Pro+</b> — $14.99/mes\n  Informes PDF + rutina dinámica\n\n📦 <b>Packs:</b>\n  Básico (3) $1.99 | Popular (5) $4.99 | Avanzado (15) $6.99`
  await sendTelegramMessage(chatId, text)
}

export async function handleStatusPublic(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "status", null, null)
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  if (!user) {
    const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    await sendTelegramMessage(chatId, `❌ No estás registrado.\n\nRegístrate en:\n${url}/login\n\nDespués vincula tu Telegram desde tu perfil.`)
    return
  }
  const planIcons: Record<string, string> = { FREE: "🆓", PREMIUM: "⭐", PRO: "💎", PRO_PLUS: "👑" }
  const [analysisCount, pendingPayments] = await Promise.all([
    db.skinAnalysis.count({ where: { userId: user.id } }),
    db.payment.count({ where: { userId: user.id, status: "pending" } }),
  ])
  const text = `👤 <b>Tu estado</b>\n\nNombre: ${sanitizeHtml(user.name || "—")}\nEmail: ${sanitizeHtml(user.email)}\n${planIcons[user.plan] || "📋"} Plan: ${sanitizeHtml(user.plan)}\n🔬 Análisis: ${analysisCount}\n⏳ Pendientes: ${pendingPayments}\n📆 Registro: ${user.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
  await sendTelegramMessage(chatId, text)
}

export async function handleAyuda(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "ayuda", null, null)
  const role = await getUserRole(chatId)
  let text = `📖 <b>Comandos disponibles</b>\n\n👤 <b>Usuario</b>\n/start — Bienvenida\n/web — Enlace a la web\n/precios — Planes y precios\n/status — Tu estado en la app\n/ayuda — Esta ayuda\n/skincare — Tip de skincare\n/contacto — Contacto\n/recordatorio — Recordatorio semanal\n/feedback — Encuesta rápida\n/meme — Meme de skincare\n`
  if (role === "VALIDATOR") {
    text += `\n🛡️ <b>Validador</b>\n/validator TOKEN — Autenticarse\n/validar REF — Validar pago\n/validar 1,2,3 — Validar múltiples\n/validar todos — Validar todos\n/pendientes — Pagos pendientes\n/buscar email/ref — Buscar pago\n/historial email — Historial\n/validatorhelp — Ayuda\n`
  }
  if (role === "ADMIN") {
    text += `\n👑 <b>Admin</b>\n/admin TOKEN — Autenticarse\n/validar REF — Validar pago\n/activar REF — Activar plan\n/pendientes — Pagos pendientes\n/cliente email — Buscar cliente\n/reporte — Reporte del día\n/usuarios — Estadísticas\n/analisis ID — Ver análisis\n/whois @user — Identificar usuario\n/trending — Tendencias\n/broadcast msg — Mensaje masivo\n/logs [fecha] — Actividad\n/alerta — Suscribir a alertas\n/promocion 20% — Crear descuento\n/adminhelp — Ayuda completa\n`
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
  await sendTelegramMessage(chatId, `📬 <b>Contacto</b>\n\n📧 Email: hereirajaison@gmail.com\n🌐 Web: <a href="${url}">${url}</a>\n📱 WhatsApp: +53 51819744`)
}

export async function handleMeme(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "meme", null, null)
  await sendTelegramMessage(chatId, getRandomMeme(), "Markdown")
}

export async function handleFeedback(chatId: string, userId: string, args: string[]) {
  await logTelegramCommand(chatId, "feedback", args.join(" "), null)
  const n = parseInt(args[0])
  if (!args[0] || isNaN(n) || n < 1 || n > 10) {
    await sendTelegramMessage(chatId, `📝 <b>Encuesta rápida</b>\n\nDel 1 al 10, ¿cómo valoras tu experiencia con The Serene Lens?\n\nEscribe: <code>/feedback 8</code> (elige tu puntuación)`)
    return
  }
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  await saveFeedback(chatId, n, user?.id)
  await sendTelegramMessage(chatId, `✅ ¡Gracias! Tu valoración (${n}/10) ha sido guardada.`)
  if (n <= 4) {
    await sendTelegramMessage(chatId, `😔 Lamentamos que no haya sido la mejor experiencia. Escríbenos a hereirajaison@gmail.com para ayudarte.`)
  }
}

export async function handleReminder(chatId: string, userId: string, args: string[]) {
  const action = args[0]?.toLowerCase()
  if (action === "on" || action === "off") {
    const active = action === "on"
    const user = await db.user.findFirst({ where: { telegramId: chatId } })
    await setReminder(chatId, user?.id || null, active)
    await sendTelegramMessage(chatId, active
      ? `✅ Recordatorio semanal activado. Te recordaré cada 7 días analizar tu piel. 🌿`
      : `✅ Recordatorio desactivado.`)
    return
  }
  const status = await getReminderStatus(chatId)
  await sendTelegramMessage(chatId, `⏰ <b>Recordatorio</b>\n\nEstado actual: ${status ? "✅ Activado" : "❌ Desactivado"}\n\n/recordatorio on — Activar\n/recordatorio off — Desactivar\n\nLos recordatorios te avisan cada 7 días para que analices tu piel.`)
}

// ================================================================
//  VALIDATOR HANDLERS
// ================================================================

export async function handleValidatorAuth(chatId: string, userId: string, args: string[]) {
  const token = args[0]
  if (!token) {
    await sendTelegramMessage(chatId, `🔐 Introduce el token de validador.\n\n<code>/validator TU_TOKEN</code>`)
    return
  }
  const ok = await authValidator(chatId, token)
  if (ok) {
    await logTelegramCommand(chatId, "validator", "success", "VALIDATOR")
    await sendTelegramMessage(chatId, `✅ ¡Token válido! Ahora eres validador.\n\n/validar REF — Validar pago\n/pendientes — Ver pendientes\n/buscar email/ref — Buscar\n/historial email — Historial`)
  } else {
    await logTelegramCommand(chatId, "validator", "failed", null)
    await sendTelegramMessage(chatId, `❌ Token inválido. Solicita uno al administrador.`)
  }
}

export async function handleValidar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado. Usa /validator o /admin."); return }
  await logTelegramCommand(chatId, "validar", args.join(" "), role)

  if (args.length === 0) { await sendTelegramMessage(chatId, "Uso: /validar TRF-xxx\n/validar 1,2,3 (por número de lista)\n/validar todos"); return }

  // Batch: /validar todos
  if (args[0] === "todos") {
    const pendings = await db.transferPayment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" } })
    if (pendings.length === 0) { await sendTelegramMessage(chatId, "✅ No hay pagos pendientes."); return }
    let ok = 0, fail = 0
    for (const p of pendings) {
      try {
        await db.$transaction([
          db.transferPayment.update({ where: { id: p.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
          db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: p.id, targetType: "transfer", details: `Batch validated ${p.referenceCode}` } }),
        ])
        ok++
      } catch { fail++ }
    }
    await sendTelegramMessage(chatId, `✅ Lote: ${ok} validados, ${fail} errores.`)
    return
  }

  // Batch: /validar 1,2,3 (index-based from current pending list)
  if (args[0].includes(",")) {
    const indices = args[0].split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    if (indices.length === 0) { await sendTelegramMessage(chatId, "❌ Índices inválidos. Usa: /validar 1,2,3"); return }
    const pendings = await db.transferPayment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, take: Math.max(...indices) })
    let ok = 0, fail = 0
    for (const idx of indices) {
      const p = pendings[idx - 1]
      if (!p) { fail++; continue }
      try {
        await db.$transaction([
          db.transferPayment.update({ where: { id: p.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
          db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: p.id, targetType: "transfer", details: `Batch validated ${p.referenceCode}` } }),
        ])
        ok++
      } catch { fail++ }
    }
    await sendTelegramMessage(chatId, `✅ Lote: ${ok} validados, ${fail} errores.`)
    return
  }

  // Single
  const ref = args[0]
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "pending") { await sendTelegramMessage(chatId, `⚠️ Estado: ${transfer.status}`); return }
  await db.$transaction([
    db.transferPayment.update({ where: { id: transfer.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
    db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: transfer.id, targetType: "transfer", details: `Validated ${ref}` } }),
  ])
  await sendTelegramMessage(chatId, `✅ Pago validado: ${ref}\nAdmin debe activar con /activar ${ref}`)
}

export async function handlePendientes(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  await logTelegramCommand(chatId, "pendientes", null, role)
  const pending = await db.transferPayment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, take: 20 })
  if (pending.length === 0) {
    await sendTelegramMessage(chatId, "✅ No hay pagos TransferMóvil pendientes.")
    return
  }
  const lines = [`📋 <b>Pendientes (${pending.length})</b>\n`]
  pending.forEach((p, i) => {
    const userInfo = `👤 ${sanitizeHtml(p.transferHolder || "?")}`
    lines.push(`${i + 1}. 🏦 #${p.referenceCode} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} | ${userInfo} | ${relativeTime(p.createdAt)}`)
  })
  lines.push(`\n💡 Usa /validar 1,2,3 para validar múltiples o /validar todos`)
  const buttons = pending.map((p, i) => [
    { text: `✅ #${i + 1} Validar`, callback_data: `validar_idx_${i}` },
  ])
  buttons.push(MENU_BACK_ROW)
  await sendTelegramMenu(chatId, lines.join("\n"), buttons)
}

export async function handleBuscar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  const query = args[0]
  if (!query) { await sendTelegramMessage(chatId, "Uso: /buscar email o /buscar TRF-xxx"); return }
  await logTelegramCommand(chatId, "buscar", query, role)
  const isRef = query.startsWith("TRF-")
  let transfer
  if (isRef) {
    transfer = await db.transferPayment.findUnique({ where: { referenceCode: query }, include: { user: true } })
  } else {
    const user = await db.user.findUnique({ where: { email: query } })
    if (!user) { await sendTelegramMessage(chatId, `❌ No encontrado: ${sanitizeHtml(query)}`); return }
    const transfers = await db.transferPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 })
    if (transfers.length === 0) { await sendTelegramMessage(chatId, `❌ Sin pagos para ${sanitizeHtml(query)}`); return }
    transfer = transfers[0]
  }
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado.`); return }
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
  if (!user) { await sendTelegramMessage(chatId, `❌ No encontrado: ${sanitizeHtml(email)}`); return }
  const [payments, transfers] = await Promise.all([
    db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.transferPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ])
  const lines = [`📋 <b>Historial: ${sanitizeHtml(email)}</b>\n`]
  for (const p of payments) lines.push(`${formatPaymentRow(p)} — ${relativeTime(p.createdAt)}`)
  for (const t of transfers) lines.push(`🏦 #${t.referenceCode} | ${sanitizeHtml(t.plan)} | $${t.amount.toFixed(2)} | ${statusIcon(t.status)} ${t.status} — ${relativeTime(t.createdAt)}`)
  if (payments.length === 0 && transfers.length === 0) lines.push("Sin pagos registrados.")
  await sendTelegramMessage(chatId, lines.join("\n"))
}

export async function handleValidatorHelp(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, "❌ No autorizado."); return }
  await logTelegramCommand(chatId, "validatorhelp", null, role)
  await sendTelegramMessage(chatId, `🛡️ <b>Comandos de Validador</b>\n\n/validar REF → Validar uno\n/validar 1,2,3 → Validar múltiples\n/validar todos → Validar todos\n/pendientes → Ver pendientes\n/buscar email/ref → Buscar\n/historial email → Historial\n/validatorhelp → Esta ayuda`)
}

// ================================================================
//  ADMIN HANDLERS
// ================================================================

export async function handleAdminAuth(chatId: string, userId: string, args: string[]) {
  const token = args[0]
  if (!token) {
    await sendTelegramMessage(chatId, `🔐 Introduce el token de administrador.\n\n<code>/admin TU_TOKEN</code>`)
    return
  }
  const ok = await authAdmin(chatId, token)
  if (ok) {
    await logTelegramCommand(chatId, "admin", "success", "ADMIN")
    await sendTelegramMessage(chatId, `✅ ¡Token válido! Ahora eres administrador.\n\n/validar REF — Validar\n/activar REF — Activar\n/pendientes — Pendientes\n/cliente email — Buscar cliente\n/reporte — Reporte\n/usuarios — Estadísticas\n/broadcast msg — Broadcast\n/trending — Tendencias\n/logs — Actividad\n/alerta — Alertas\n/promocion 20% — Descuento\n/adminhelp — Ayuda`)
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

  // Batch activate by index
  if (ref.includes(",")) {
    const indices = ref.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    const validated = await db.transferPayment.findMany({ where: { status: "validated" }, orderBy: { createdAt: "asc" } })
    let ok = 0, fail = 0
    for (const idx of indices) {
      const t = validated[idx - 1]
      if (!t) { fail++; continue }
      try {
        await db.$transaction([
          db.transferPayment.update({ where: { id: t.id }, data: { status: "activated", activatedById: userId, activatedAt: new Date() } }),
          db.subscription.create({ data: { userId: t.userId, plan: t.plan, provider: "transfer", status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
          db.payment.create({ data: { userId: t.userId, provider: "transfer", plan: t.plan, amount: t.amount, status: "completed", confirmedAt: new Date(), remoteId: t.referenceCode } }),
          db.auditLog.create({ data: { userId, action: "activate_transfer", targetId: t.id, targetType: "transfer", details: `Batch activated ${t.referenceCode}` } }),
        ])
        ok++
      } catch { fail++ }
    }
    await sendTelegramMessage(chatId, `✅ Lote: ${ok} activados, ${fail} errores.`)
    return
  }

  if (args.length === 1) {
    const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
    if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
    if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado: ${transfer.status}`); return }
    const buttons = [
      [{ text: "✅ Confirmar activación", callback_data: `activar_${ref}` }, { text: "❌ Cancelar", callback_data: "menu_main" }],
    ]
    await sendTelegramMenu(chatId,
      `⚠️ <b>Confirmar activación</b>\n\nReferencia: ${ref}\nUsuario: ${sanitizeHtml(transfer.user.name || "?")} (${sanitizeHtml(transfer.user.email || "?")})\nPlan: ${transfer.plan}\nMonto: $${transfer.amount.toFixed(2)}`,
      buttons
    )
    return
  }

  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado: ${transfer.status}`); return }
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
  if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado: ${transfer.status}`); return }
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
    include: { payments: { orderBy: { createdAt: "desc" }, take: 10 }, subscriptions: { where: { status: "active" }, take: 1 } },
  })
  if (!user) { await sendTelegramMessage(chatId, `❌ No encontrado: ${sanitizeHtml(email)}`); return }
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
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/admin/users?search=${encodeURIComponent(email)}`
  if (user.payments.length > 0) {
    text += `\n<b>Últimos pagos:</b>\n`
    for (const p of user.payments) text += `${formatPaymentRow(p)} — ${relativeTime(p.createdAt)}\n`
  }
  const buttons = [
    [{ text: "🔗 Ver en Admin Panel", url: adminUrl }],
    MENU_BACK_ROW,
  ]
  await sendTelegramMenu(chatId, text, buttons)
}

export async function handleReporte(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  await logTelegramCommand(chatId, "reporte", null, role)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

  const [todayPayments, weekPayments, newUsers, totalUsers, weekAnalyses, totalAnalyses, pendingTransfer, feedbackAvg] = await Promise.all([
    db.payment.findMany({ where: { createdAt: { gte: today } } }),
    db.payment.findMany({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.user.count(),
    db.skinAnalysis.count({ where: { createdAt: { gte: weekAgo } } }),
    db.skinAnalysis.count(),
    db.transferPayment.count({ where: { status: "pending" } }),
    getFeedbackAvg(),
  ])

  const todayRevenue = todayPayments.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const weekRevenue = weekPayments.reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0)
  const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

  const text = `📊 <b>Reporte del Día (${fecha})</b>\n\n👥 <b>Usuarios</b>\n- Nuevos hoy: ${newUsers}\n- Totales: ${totalUsers}\n\n📸 <b>Análisis</b>\n- Hoy: ${weekAnalyses} (7d)\n- Totales: ${totalAnalyses}\n\n💰 <b>Ventas</b>\n- Hoy: ${todayPayments.length} ventas ($${todayRevenue.toFixed(2)})\n- 7 días: ${weekPayments.length} ventas ($${weekRevenue.toFixed(2)})\n\n🔄 <b>Pagos Pendientes</b>\n- Transfermóvil: ${pendingTransfer}\n\n⭐ <b>Feedback</b>\n- Promedio: ${feedbackAvg.avg.toFixed(1)}/10 (${feedbackAvg.count} votos)`
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
  await sendTelegramMessage(chatId, `👑 <b>Comandos de Admin</b>\n\n/validar REF — Validar\n/activar REF — Activar\n/pendientes — Pendientes\n/cliente email — Info + enlace admin\n/reporte — Reporte diario\n/usuarios — Estadísticas\n/analisis ID — Ver análisis\n/whois @user — Identificar\n/trending — Tendencias\n/broadcast msg — Broadcast\n/logs [fecha] — Actividad\n/alerta — Suscribir alertas\n/promocion 20% — Crear código\n/adminhelp — Esta ayuda`)
}

export async function handleBroadcast(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const message = args.join(" ")
  if (!message) { await sendTelegramMessage(chatId, "Uso: /broadcast Mensaje para todos"); return }
  await logTelegramCommand(chatId, "broadcast", message.slice(0, 100), role)
  const users = await db.user.findMany({ where: { telegramId: { not: null } }, select: { telegramId: true } })
  if (users.length === 0) { await sendTelegramMessage(chatId, "❌ Sin usuarios con Telegram."); return }
  const buttons = [
    [{ text: "✅ Confirmar envío", callback_data: "broadcast_go" }, { text: "❌ Cancelar", callback_data: "menu_main" }],
  ]
  broadcastPending = { chatId, message }
  await sendTelegramMenu(chatId, `📢 <b>Broadcast</b>\n\nA ${users.length} usuarios:\n━━━━━━━━━━━━━━\n${sanitizeHtml(message)}\n━━━━━━━━━━━━━━`, buttons)
}

let broadcastPending: { chatId: string; message: string } | null = null

export async function handleBroadcastGo(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  if (!broadcastPending || broadcastPending.chatId !== chatId) {
    await sendTelegramMessage(chatId, "❌ Sin broadcast pendiente.")
    return
  }
  const msg = broadcastPending.message
  broadcastPending = null
  const users = await db.user.findMany({ where: { telegramId: { not: null } }, select: { telegramId: true } })
  let sent = 0
  for (const u of users) {
    if (u.telegramId) {
      if (await sendTelegramMessage(u.telegramId, msg)) sent++
    }
  }
  await sendTelegramMessage(chatId, `📢 Enviado a ${sent}/${users.length} usuarios.`)
}

export async function handleLogs(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const fecha = args[0]
  await logTelegramCommand(chatId, "logs", fecha || null, role)
  const logs = await getTelegramLogs(fecha)
  const text = `📋 <b>Logs${fecha ? ` (${fecha})` : ""}</b>\n\n${logs.join("\n") || "Sin registros."}`
  if (text.length > 4000) {
    const chunks = text.match(/.{1,4000}/g) || []
    for (const chunk of chunks) await sendTelegramMessage(chatId, chunk)
  } else {
    await sendTelegramMessage(chatId, text)
  }
}

// ===== COMMAND 4: /alerta =====

export async function handleAlerta(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  await logTelegramCommand(chatId, "alerta", args.join(" "), role)

  const current = await getAlertSub(chatId)
  const allEvents = ["new_user", "new_analysis", "pending_24h", "critical_error"]

  if (args.length === 0) {
    let text = `🔔 <b>Alertas</b>\n\nEstado actual:\n`
    for (const e of allEvents) {
      const icons: Record<string, string> = { new_user: "👤", new_analysis: "📸", pending_24h: "⏳", critical_error: "🚨" }
      text += `${icons[e] || "•"} ${e}: ${current.includes(e) ? "✅" : "❌"}\n`
    }
    text += `\nUsa:\n/alerta on new_user — Activar alerta\n/alerta off new_user — Desactivar\n/alerta on * — Todas\n/alerta off * — Ninguna`
    await sendTelegramMessage(chatId, text)
    return
  }

  const action = args[0] // on/off
  const event = args[1] // event name or "*"
  if (!["on", "off"].includes(action) || !event) {
    await sendTelegramMessage(chatId, "Uso: /alerta on new_user\nalerta off new_user\nalerta on *")
    return
  }

  let newEvents: string[]
  if (event === "*") {
    newEvents = action === "on" ? [...allEvents] : []
  } else {
    if (!allEvents.includes(event)) {
      await sendTelegramMessage(chatId, `❌ Evento inválido. Opciones: ${allEvents.join(", ")}, *`)
      return
    }
    newEvents = action === "on"
      ? [...new Set([...current, event])]
      : current.filter(e => e !== event)
  }
  await setAlertSub(chatId, newEvents)
  await sendTelegramMessage(chatId, `✅ Alertas actualizadas. Eventos activos: ${newEvents.length > 0 ? newEvents.join(", ") : "ninguno"}`)
}

// ===== COMMAND 8: /trending =====

export async function handleTrending(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  await logTelegramCommand(chatId, "trending", null, role)

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const [totalUsers, analyses, recentAnalyses] = await Promise.all([
    db.user.count(),
    db.skinAnalysis.findMany({ take: 200, orderBy: { createdAt: "desc" }, select: { skinType: true, concerns: true } }),
    db.skinAnalysis.count({ where: { createdAt: { gte: weekAgo } } }),
  ])

  // Count skin types
  const typeCount: Record<string, number> = {}
  const concernCount: Record<string, number> = {}
  for (const a of analyses) {
    if (a.skinType) typeCount[a.skinType] = (typeCount[a.skinType] || 0) + 1
    if (a.concerns) {
      try {
        const concerns = JSON.parse(a.concerns)
        if (Array.isArray(concerns)) {
          for (const c of concerns) concernCount[c] = (concernCount[c] || 0) + 1
        }
      } catch {}
    }
  }

  const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const sortedConcerns = Object.entries(concernCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  let text = `📊 <b>Tendencias de la Semana</b>\n\n👤 <b>Tipos de piel más comunes:</b>\n`
  for (const [type, count] of sortedTypes) {
    text += `${type} — ${((count / Math.max(analyses.length, 1)) * 100).toFixed(0)}% (${count} usuarios)\n`
  }
  text += `\n🔍 <b>Preocupaciones principales:</b>\n`
  for (const [concern, count] of sortedConcerns) {
    text += `${concern} — ${((count / Math.max(analyses.length, 1)) * 100).toFixed(0)}%\n`
  }
  text += `\n📈 <b>Actividad</b>\nAnálisis (7d): ${recentAnalyses}\nUsuarios totales: ${totalUsers}`
  await sendTelegramMessage(chatId, text)
}

// ===== COMMAND 11: /analisis [id] =====

export async function handleAnalisis(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const id = args[0]
  if (!id) { await sendTelegramMessage(chatId, "Uso: /analisis ID_del_análisis"); return }
  await logTelegramCommand(chatId, "analisis", id, role)

  const analysis = await db.skinAnalysis.findUnique({ where: { id }, include: { user: true } })
  if (!analysis) { await sendTelegramMessage(chatId, `❌ Análisis no encontrado: ${id}`); return }

  let text = `🧴 <b>Análisis #${id.slice(-6)}</b>\n\n`
  text += `👤 Usuario: ${sanitizeHtml(analysis.user?.name || "?")}\n`
  text += `📅 Fecha: ${analysis.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}\n`
  if (analysis.skinType) text += `\n📊 <b>Tipo de piel:</b> ${sanitizeHtml(analysis.skinType)}\n`

  if (analysis.observations && analysis.observations !== "[]") {
    text += `\n📊 <b>Observaciones</b>\n`
    try {
      const obs = JSON.parse(analysis.observations)
      if (Array.isArray(obs)) {
        for (const o of obs) {
          const label = typeof o === "string" ? o : o.label || o.name || JSON.stringify(o)
          text += `- ${sanitizeHtml(label)}\n`
        }
      }
    } catch {
      text += `${sanitizeHtml(analysis.observations.slice(0, 200))}\n`
    }
  }

  if (analysis.recommendations && analysis.recommendations !== "[]") {
    text += `\n📝 <b>Recomendaciones</b>\n`
    try {
      const recs = JSON.parse(analysis.recommendations)
      if (Array.isArray(recs)) {
        for (const r of recs) {
          const label = typeof r === "string" ? r : r.label || r.text || r.name || JSON.stringify(r)
          text += `- ${sanitizeHtml(label)}\n`
        }
      }
    } catch {
      text += `${sanitizeHtml(analysis.recommendations.slice(0, 200))}\n`
    }
  }
  await sendTelegramMessage(chatId, text)
}

// ===== COMMAND 12: /promocion =====

export async function handlePromocion(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }

  if (args.length === 0) {
    await sendTelegramMessage(chatId, `🎟️ <b>Códigos de Descuento</b>\n\n/promocion 20% — Crear 20% descuento\n/promocion ver CODIGO — Ver estado\n\nLos códigos pueden usarse en la web.`)
    return
  }

  if (args[0] === "ver") {
    const code = args[1]?.toUpperCase()
    if (!code) { await sendTelegramMessage(chatId, "Uso: /promocion ver CODIGO"); return }
    const dc = await db.discountCode.findUnique({ where: { code } })
    if (!dc) { await sendTelegramMessage(chatId, `❌ Código no encontrado: ${code}`); return }
    await sendTelegramMessage(chatId, `🎟️ <b>Código: ${code}</b>\nDescuento: ${dc.discount}%\nUsos: ${dc.usedCount}/${dc.maxUses}\nEstado: ${dc.active ? "✅ Activo" : "❌ Inactivo"}`)
    return
  }

  const discount = parseInt(args[0])
  if (isNaN(discount) || discount < 1 || discount > 100) {
    await sendTelegramMessage(chatId, "❌ Descuento inválido (1-100). Ej: /promocion 20")
    return
  }
  await logTelegramCommand(chatId, "promocion", `${discount}%`, role)
  const code = await generateDiscountCode(discount, chatId)
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  await sendTelegramMessage(chatId, `🎟️ <b>Código generado:</b> <code>${code}</code>\n\nDescuento: ${discount}%\n\nLos usuarios pueden usarlo en:\n<a href="${url}">${url}</a>\n\n/comando para ver estado: /promocion ver ${code}`)
}

// ===== COMMAND 13: /whois =====

export async function handleWhois(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, "❌ Solo administradores."); return }
  const username = args[0]?.replace("@", "")
  if (!username) { await sendTelegramMessage(chatId, "Uso: /whois @usuario_telegram"); return }
  await logTelegramCommand(chatId, "whois", username, role)

  const user = await db.user.findFirst({
    where: { telegramId: { not: null } },
    include: { subscriptions: { where: { status: "active" }, take: 1 } },
  })
  if (!user) { await sendTelegramMessage(chatId, `❌ No hay usuarios registrados con Telegram.`); return }

  const allTelegramUsers = await db.user.findMany({
    where: { telegramId: { not: null } },
    select: { name: true, email: true, plan: true, telegramId: true, createdAt: true },
  })
  if (allTelegramUsers.length === 0) { await sendTelegramMessage(chatId, `❌ No hay usuarios con Telegram vinculado.`); return }

  // Try matching by telegramId -> we don't have username in User model, so list all
  let text = `🔍 <b>Usuarios con Telegram vinculado:</b>\n\n`
  for (const u of allTelegramUsers) {
    text += `👤 ${sanitizeHtml(u.name || "?")} | ${sanitizeHtml(u.email)} | ${u.plan}\n`
  }
  if (allTelegramUsers.length > 10) {
    text += `\n⚠️ Demasiados para mostrar. Usa /cliente email para buscar específico.`
  }
  await sendTelegramMessage(chatId, text)
}

// ================================================================
//  CALLBACK HANDLER
// ================================================================

export async function handleCallback(data: string, chatId: string, userId: string, messageId: number, callbackId: string) {
  const role = await getUserRole(chatId)
  if (!role) {
    await answerCallback(chatId, callbackId, "❌ No autorizado")
    return
  }

  const ctx: MenuContext = { chatId, userId, messageId, callbackId }

  if (data === "menu_main") { await answerCallback(chatId, callbackId); await showMainMenu(ctx); return }
  if (data === "menu_pagos") { await answerCallback(chatId, callbackId); await showPagosMenu(ctx, role); return }
  if (data === "action_pending") { await answerCallback(chatId, callbackId); return await handlePendientesCb(ctx) }
  if (data === "action_users") { await answerCallback(chatId, callbackId); return await handleUsuarios(chatId, userId) }
  if (data === "action_reporte") { await answerCallback(chatId, callbackId); return await handleReporte(chatId, userId) }

  if (data === "menu_admin" && role === "ADMIN") {
    await answerCallback(chatId, callbackId)
    await showAdminMenu(ctx)
    return
  }

  if (data === "broadcast_go") {
    await answerCallback(chatId, callbackId, "Enviando...")
    await handleBroadcastGo(chatId, userId)
    return
  }
  if (data === "action_broadcast_cancel") {
    await answerCallback(chatId, callbackId, "Cancelado")
    broadcastPending = null
    await showMainMenu(ctx)
    return
  }

  if (data.startsWith("activar_")) {
    const ref = data.replace("activar_", "")
    await answerCallback(chatId, callbackId, "✅ Activando...")
    await handleActivarConfirm(chatId, userId, ref)
    return
  }

  // Validate by index from pending list
  if (data.startsWith("validar_idx_")) {
    const idx = parseInt(data.replace("validar_idx_", ""))
    await answerCallback(chatId, callbackId, "⏳ Validando...")
    const pending = await db.transferPayment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" } })
    const p = pending[idx]
    if (!p) { await sendTelegramMessage(chatId, "❌ Pago no encontrado en lista."); return }
    await db.$transaction([
      db.transferPayment.update({ where: { id: p.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
      db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: p.id, targetType: "transfer", details: `Validated ${p.referenceCode} via button` } }),
    ])
    await sendTelegramMessage(chatId, `✅ Pago #${idx + 1} (${p.referenceCode}) validado. Admin debe activar: /activar ${p.referenceCode}`)
    return
  }

  await answerCallback(chatId, callbackId, "Comando no reconocido")
}

async function showMainMenu(ctx: MenuContext) {
  const role = await getUserRole(ctx.chatId)
  if (!role) { await sendTelegramMessage(ctx.chatId, "❌ No autorizado."); return }
  const text = `👋 <b>The Serene Lens</b>\nRol: ${role === "ADMIN" ? "👑 Admin" : "🛡️ Validador"}`
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
  await sendOrEdit(ctx, `💳 <b>Pagos</b>\n\n/validar TRF-xxx — Validar\n${role === "ADMIN" ? "/activar TRF-xxx — Activar\n" : ""}/pendientes — Ver pendientes\n/buscar email/ref — Buscar\n/historial email — Historial`, buttons)
}

async function handlePendientesCb(ctx: MenuContext) {
  await handlePendientes(ctx.chatId, ctx.userId)
}

async function showAdminMenu(ctx: MenuContext) {
  const buttons = [
    [{ text: "👥 Usuarios", callback_data: "action_users" }, { text: "📈 Reporte", callback_data: "action_reporte" }],
    MENU_BACK_ROW,
  ]
  await sendOrEdit(ctx, `⚙️ <b>Panel Admin</b>\n\n/cliente email\n/broadcast msg\n/logs [fecha]\n/trending\n/activar REF`, buttons)
}
