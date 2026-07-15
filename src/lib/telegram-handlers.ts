import { db } from "@/lib/db"
import {
  sendTelegramMessage, sendTelegramMenu, sendTelegramKeyboard, removeKeyboard,
  editTelegramMenu, editTelegramButtons, answerCallback, getUserRole, authAdmin, authValidator,
  logTelegramCommand, getTelegramLogs, setAlertSub, getAlertSub, notifyAdmins,
  setReminder, getReminderStatus, generateDiscountCode, validateDiscountCode,
  saveFeedback, getFeedbackAvg, getRandomMeme,
} from "@/lib/telegram"
import { sanitizeHtml } from "@/lib/sanitize"
import * as R from "@/lib/telegram-responses"

const MENU_BACK_ROW = [{ text: "🔙 Menú principal", callback_data: "menu_main" }]
const USER_KEYBOARD: { text: string }[][] = [
  [{ text: "🌐 Web" }, { text: "💰 Precios" }, { text: "📈 Mi Estado" }],
  [{ text: "🆘 Ayuda" }, { text: "💡 Tip" }, { text: "📬 Contacto" }],
  [{ text: "🌿 Recomendar" }, { text: "⭐ Valorar" }, { text: "⏰ Recordatorio" }],
  [{ text: "🎭 Meme" }, { text: "🧪 Test Piel" }, { text: "📋 Mi Rutina" }],
  [{ text: "📅 Diario" }],
]

type MenuContext = { chatId: string; userId: string; messageId?: number; callbackId?: string }

// ─── Conversational memory ─────────────────────────────────────
const lastCommand = new Map<string, string>()
const conversationState = new Map<string, { step: string; data: any }>()

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
  const icons: Record<string, string> = { qvapay: "💳", transfer: "🏦" }
  const icon = icons[p.provider] || "💳"
  return `${icon} #${p.id.slice(-6)} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} | ${statusIcon(p.status)} ${sanitizeHtml(p.status)}`
}

const SKINCARE_TIPS = [
  "Aplica protector solar todos los días, incluso en días nublados. Los rayos UV penetran las nubes.",
  "Bebe al menos 8 vasos de agua al día para mantener tu piel hidratada desde dentro.",
  "Dormir 7-8 horas ayuda a la regeneración celular de la piel.",
  "Los alimentos ricos en omega-3 (salmón, aguacate, nueces) mejoran la barrera cutánea.",
  "Limpia tu rostro dos veces al día: mañana y noche, sin excederte.",
  "La vitamina C por la mañana y el retinol por la noche son la combinación estrella.",
  "Evita el agua muy caliente al lavar tu rostro, reseca la piel.",
  "Exfolia tu piel 1-2 veces por semana, no más.",
  "Tu rutina nocturna es más importante que la diurna: la piel se regenera mientras duermes.",
  "Reaplica protector solar cada 2-3 horas si estás al aire libre.",
  "Las mascarillas naturales de yogur y miel son excelentes para hidratar.",
  "El agua fría al final de la limpieza cierra los poros y activa la circulación.",
  "El té verde contiene antioxidantes que combaten el envejecimiento prematuro.",
  "Usa productos según tu tipo de piel: grasa, seca, mixta o sensible.",
  "Cambia tu funda de almohada cada semana para evitar acumulación de bacterias.",
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

  if (role === "ADMIN") {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [pending, newUsers] = await Promise.all([
      db.transferPayment.count({ where: { status: "pending" } }),
      db.user.count({ where: { createdAt: { gte: today } } }),
    ])
    const text = R.welcomeAdmin(username, pending, newUsers)
    await sendTelegramMessage(chatId, text)
    const ctx: MenuContext = { chatId, userId }
    await showMainMenu(ctx)
    return
  }

  if (role === "VALIDATOR") {
    const text = R.welcomeValidator(username)
    await sendTelegramMessage(chatId, text)
    const ctx: MenuContext = { chatId, userId }
    await showMainMenu(ctx)
    return
  }

  // Public user
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  const text = R.welcomePublic(user?.name || username)
  await sendTelegramKeyboard(chatId, text, USER_KEYBOARD)
}

export async function handleWeb(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "web", null, null)
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  await sendTelegramMessage(chatId, `🌐 <b>The Serene Lens</b>\n\n${R.smartLink(url, "Visita nuestra web")} y descubre cómo es tu piel realmente.\n\n🔬 Análisis con IA • Rutinas personalizadas • Guías de skincare`)
}

export async function handlePrecios(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "precios", null, null)
  await sendTelegramMessage(chatId, R.pricesResponse())
}

export async function handleStatusPublic(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "status", null, null)
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  if (!user) {
    const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    await sendTelegramMessage(chatId, R.notRegistered(url))
    return
  }
  const planIcons: Record<string, string> = { FREE: "🆓", PREMIUM: "⭐", PRO: "💎", PRO_PLUS: "👑" }
  const [analysisCount, pendingPayments, lastAnalysis] = await Promise.all([
    db.skinAnalysis.count({ where: { userId: user.id } }),
    db.payment.count({ where: { userId: user.id, status: "pending" } }),
    db.skinAnalysis.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ])
  const sub = await db.subscription.findFirst({ where: { userId: user.id, status: "active" } })
  const text = R.statusResponse(
    user.name || "—", user.plan, planIcons[user.plan] || "📋",
    analysisCount, pendingPayments, lastAnalysis?.createdAt,
    sub?.currentPeriodEnd?.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
    !!user.telegramId
  )
  await sendTelegramMessage(chatId, text)
}

export async function handleAyuda(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "ayuda", null, null)
  const role = await getUserRole(chatId)
  if (role === "ADMIN") { await sendTelegramMessage(chatId, R.adminHelpText()); return }
  if (role === "VALIDATOR") { await sendTelegramMessage(chatId, R.validatorHelpText()); return }
  await sendTelegramMessage(chatId,
    `📖 <b>Comandos disponibles</b>\n\n/web — Ir a la web\n/precios — Ver planes\n/status — Mi estado\n/skincare — Tips\n/contacto — Contacto\n/feedback N — Valorarme\n/recordatorio — Recordatorios\n/meme — Meme\n/ayuda — Esta ayuda\n\n🌿 <i>Empieza con /web para descubrir tu piel.</i>`
  )
}

export async function handleSkincare(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "skincare", null, null)
  await sendTelegramMessage(chatId, R.skincareTip(getRandomTip()))
}

export async function handleContacto(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "contacto", null, null)
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  await sendTelegramMessage(chatId, R.contactResponse(url))
}

export async function handleMeme(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "meme", null, null)
  await sendTelegramMessage(chatId, getRandomMeme(), "Markdown")
}

export async function handleFeedback(chatId: string, userId: string, args: string[]) {
  await logTelegramCommand(chatId, "feedback", args.join(" "), null)
  const n = parseInt(args[0])
  if (!args[0] || isNaN(n) || n < 1 || n > 10) {
    await sendTelegramMessage(chatId, R.feedbackPrompt())
    return
  }
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  await saveFeedback(chatId, n, user?.id)
  await sendTelegramMessage(chatId, `✅ ${R.feedbackThanks(n)}`)
}

export async function handleReminder(chatId: string, userId: string, args: string[]) {
  const action = args[0]?.toLowerCase()
  if (action === "on" || action === "off") {
    const active = action === "on"
    const user = await db.user.findFirst({ where: { telegramId: chatId } })
    await setReminder(chatId, user?.id || null, active)
    await sendTelegramMessage(chatId, active
      ? "✅ Recordatorio semanal activado. Te avisaré cada 7 días para analizar tu piel. 🌿"
      : "✅ Recordatorio desactivado. Puedes volver a activarlo con /recordatorio on")
    return
  }
  const status = await getReminderStatus(chatId)
  await sendTelegramMessage(chatId, R.reminderStatus(status))
}

export async function handleRecomendar(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "recomendar", null, null)
  const user = await db.user.findFirst({ where: { telegramId: chatId }, include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } } })
  if (!user || !user.analyses[0]) {
    await sendTelegramMessage(chatId, R.personalizedRecommendation())
    return
  }
  const last = user.analyses[0]
  let concerns: string[] = []
  try { concerns = JSON.parse(last.concerns || "[]") } catch {}
  await sendTelegramMessage(chatId, R.personalizedRecommendation(last.skinType, concerns))
}

// ─── /mi_rutina (sin IA, consulta directa DB) ────────────────────

export async function handleMiRutina(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "mi_rutina", null, null)
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  if (!user) {
    const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    await sendTelegramMessage(chatId, R.notRegistered(url))
    return
  }

  const lastAnalysis = await db.skinAnalysis.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { routine: true, skinType: true, createdAt: true },
  })

  if (!lastAnalysis?.routine) {
    await sendTelegramMessage(chatId, "🌿 Aún no tienes una rutina generada. Haz un análisis en la web primero:\n\n/web")
    return
  }

  let routine: { manana?: string[]; noche?: string[] }
  try { routine = JSON.parse(lastAnalysis.routine) } catch {
    await sendTelegramMessage(chatId, "❌ No se pudo leer tu rutina. Haz un nuevo análisis en la web.")
    return
  }

  let text = `<b>🌅 Tu Rutina Matutina</b>\n`
  if (routine.manana?.length) {
    text += routine.manana.map((s, i) => `${i + 1}. ${s}`).join("\n")
  } else {
    text += "No registrada"
  }

  text += `\n\n<b>🌙 Tu Rutina Nocturna</b>\n`
  if (routine.noche?.length) {
    text += routine.noche.map((s, i) => `${i + 1}. ${s}`).join("\n")
  } else {
    text += "No registrada"
  }

  text += `\n\n📅 Última actualización: ${lastAnalysis.createdAt.toLocaleDateString("es-ES")}`
  text += `\n💡 Haz un nuevo análisis en /web para actualizar tu rutina.`

  await sendTelegramMessage(chatId, text)
}

// ─── /diario (sin IA, consulta directa DB) ──────────────────────

export async function handleDiario(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "diario", null, null)
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  if (!user) {
    const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    await sendTelegramMessage(chatId, R.notRegistered(url))
    return
  }

  const recentEntries = await db.skinDiary.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 7,
  })

  if (recentEntries.length === 0) {
    await sendTelegramMessage(chatId, "📓 Aún no tienes entradas en tu diario de piel. Registra cómo se siente tu piel cada día en la web:\n\n/web")
    return
  }

  let text = `<b>📓 Tu Diario de Piel (últimos 7 días)</b>\n\n`
  for (const entry of recentEntries) {
    const feelingEmoji = entry.feeling >= 70 ? "😊" : entry.feeling >= 40 ? "😐" : "😟"
    text += `${feelingEmoji} <b>${entry.date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}</b> — ${entry.feeling}/100\n`
    if (entry.notes) text += `  📝 ${entry.notes.slice(0, 100)}\n`
  }

  const avg = Math.round(recentEntries.reduce((s, e) => s + e.feeling, 0) / recentEntries.length)
  text += `\n📊 Piel promedio: ${avg}/100`

  await sendTelegramMessage(chatId, text)
}

// ─── /test_piel (3 preguntas, sin IA) ──────────────────────────

const TEST_PIEL_STATE = new Map<string, { step: number; answers: string[] }>()

export async function handleTestPiel(chatId: string, userId: string) {
  await logTelegramCommand(chatId, "test_piel", null, null)
  TEST_PIEL_STATE.set(chatId, { step: 1, answers: [] })
  await sendTelegramMessage(chatId,
    "🧴 <b>Test Rápido de Tipo de Piel</b>\n\n" +
    "Responde 3 preguntas para obtener un diagnóstico preliminar.\n\n" +
    "<b>Pregunta 1:</b> ¿Cómo sientes tu piel al despertar?\n" +
    "a) Normal, equilibrada\n" +
    "b) Brillante o grasosa\n" +
    "c) Tirante o seca"
  )
}

// ─── Handle test_piel answer ───────────────────────────────────

export async function handleTestPielAnswer(chatId: string, text: string) {
  const state = TEST_PIEL_STATE.get(chatId)
  if (!state) return false // not in test mode

  const answer = text.toLowerCase().trim()
  if (!["a", "b", "c", "normal", "brillante", "grasosa", "tirante", "seca", "equilibrada"].some(s => answer.includes(s))) {
    await sendTelegramMessage(chatId, "Por favor responde a, b o c.")
    return true
  }

  state.answers.push(answer)
  state.step++

  if (state.step === 2) {
    await sendTelegramMessage(chatId,
      "<b>Pregunta 2:</b> ¿Tu piel brilla durante el día?\n" +
      "a) Casi nada\n" +
      "b) Sí, especialmente en zona T (frente, nariz, barbilla)\n" +
      "c) No, se mantiene mate o se reseca"
    )
    return true
  }

  if (state.step === 3) {
    await sendTelegramMessage(chatId,
      "<b>Pregunta 3:</b> ¿Cómo se siente tu piel después de lavarla?\n" +
      "a) Cómoda y fresca\n" +
      "b) Aún con algo de brillo\n" +
      "c) Tirante o irritada"
    )
    return true
  }

  // Calculate result
  TEST_PIEL_STATE.delete(chatId)

  const hasA = state.answers.filter(a => a.includes("a") || a.includes("normal") || a.includes("equilibrada") || a.includes("casi")).length
  const hasB = state.answers.filter(a => a.includes("b") || a.includes("brillante") || a.includes("grasosa") || a.includes("brillo")).length
  const hasC = state.answers.filter(a => a.includes("c") || a.includes("tirante") || a.includes("seca") || a.includes("irritada") || a.includes("reseca") || a.includes("mate")).length

  let skinType = "Normal"
  let emoji = "🌿"
  let desc = "Tu piel tiene un buen equilibrio. Mantén tu rutina actual."

  if (hasB >= 2) {
    skinType = "Mixta o Grasa"
    emoji = "✨"
    desc = "Tu piel tiende a producir más sebo. Prioriza limpiadores suaves, hidratación ligera en gel y protector solar oil-free."
  } else if (hasC >= 2) {
    skinType = "Seca o Sensible"
    emoji = "🌸"
    desc = "Tu piel tiende a la sequedad. Prioriza limpiadores cremosos, hidratantes ricos y evitar exfoliantes agresivos."
  }

  const url = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

  await sendTelegramMessage(chatId,
    `${emoji} <b>Resultado del Test</b>\n\n` +
    `🧴 <b>Tipo probable:</b> ${skinType}\n\n${desc}\n\n` +
    `📱 Para un análisis profundo con escáner fotográfico de IA y ver tus gráficos de evolución, <a href="${url}/analysis">toca aquí de forma gratuita</a>.`
  )
  return true
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
    await sendTelegramMessage(chatId, R.welcomeValidator())
    await sendTelegramMessage(chatId, "🎉 ¡Token válido! Bienvenido al equipo, guardián de los pagos. Ya puedes revisar los pendientes con /pendientes.")
  } else {
    await logTelegramCommand(chatId, "validator", "failed", null)
    await sendTelegramMessage(chatId, "❌ Ese token no es válido, amigo. Pídele uno nuevo al administrador. Si crees que es un error, contacta a soporte.")
  }
}

export async function handleValidar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, R.notAuthorized("VALIDATOR")); return }
  await logTelegramCommand(chatId, "validar", args.join(" "), role)

  if (args.length === 0) { await sendTelegramMessage(chatId, "Uso: /validar TRF-xxx\n/validar 1,2,3\n/validar todos"); return }

  const ref = args[0]

  // Multi-step: if user confirms in conversation
  const state = conversationState.get(chatId)
  if (state?.step === "awaiting_validate_confirm") {
    const reply = args.join(" ").toLowerCase()
    if (reply === "confirmar" || reply === "sí" || reply === "si") {
      const ref = state.data.ref
      const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
      if (!transfer || transfer.status !== "pending") {
        await sendTelegramMessage(chatId, "❌ El pago ya no está pendiente.")
        conversationState.delete(chatId)
        return
      }
      try {
        await Promise.all([
          db.transferPayment.update({ where: { id: transfer.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
          db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: transfer.id, targetType: "transfer", details: `Validated ${ref}` } }),
        ])
      } catch {
        await db.transferPayment.update({ where: { id: transfer.id }, data: { status: "pending" } }).catch(() => {})
        await sendTelegramMessage(chatId, "❌ Error al validar. Intenta de nuevo.")
        conversationState.delete(chatId)
        return
      }
      await sendTelegramMessage(chatId, `✅ Pago <b>${ref}</b> validado. Admin debe activar: /activar ${ref}`)
      conversationState.delete(chatId)
      return
    }
    conversationState.delete(chatId)
  }

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
      } catch {
        await db.transferPayment.update({ where: { id: p.id }, data: { status: "pending" } }).catch(() => {})
        fail++
      }
    }
    await sendTelegramMessage(chatId, R.batchValidateResult(ok, fail))
    return
  }

  // Batch: /validar 1,2,3
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
      } catch {
        await db.transferPayment.update({ where: { id: p.id }, data: { status: "pending" } }).catch(() => {})
        fail++
      }
    }
    await sendTelegramMessage(chatId, R.batchValidateResult(ok, fail))
    return
  }

  // Single: /validar TRF-xxx
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "pending") { await sendTelegramMessage(chatId, `⚠️ Estado actual: ${transfer.status}`); return }

  conversationState.set(chatId, { step: "awaiting_validate_confirm", data: { ref } })
  await sendTelegramMessage(chatId,
    `⚠️ <b>Confirmar validación</b>\n\nReferencia: ${ref}\nUsuario: ${sanitizeHtml(transfer.user?.name || "?")}\nPlan: ${transfer.plan}\nMonto: $${transfer.amount.toFixed(2)}\n\nEscribe <b>confirmar</b> para validar, o cualquier otra cosa para cancelar.`
  )
}

export async function handlePendientes(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, R.notAuthorized("VALIDATOR")); return }
  await logTelegramCommand(chatId, "pendientes", null, role)
  const pending = await db.transferPayment.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 20,
    include: { user: { select: { name: true } } },
  })
  if (pending.length === 0) {
    await sendTelegramMessage(chatId, R.pendingHeader(0))
    return
  }
  const lines = [R.pendingHeader(pending.length)]
  pending.forEach((p, i) => {
    const userInfo = p.user?.name ? `👤 ${sanitizeHtml(p.user.name)}` : ""
    lines.push(`${i + 1}. 🏦 #${p.referenceCode} | ${sanitizeHtml(p.plan)} | $${p.amount.toFixed(2)} ${userInfo} | ${relativeTime(p.createdAt)}`)
  })
  lines.push(`\n💡 <i>Usa /validar 1,2,3 para varios, /validar todos, o los botones de abajo:</i>`)
  const buttons = pending.map((p, i) => [
    { text: `✅ #${i + 1} ${sanitizeHtml(p.referenceCode)}`, callback_data: `validar_idx_${i}` },
  ])
  buttons.push(MENU_BACK_ROW)
  await sendTelegramMenu(chatId, lines.join("\n"), buttons)
}

export async function handleBuscar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, R.notAuthorized("VALIDATOR")); return }
  const query = args[0]
  if (!query) { await sendTelegramMessage(chatId, "Uso: /buscar email o /buscar TRF-xxx"); return }
  await logTelegramCommand(chatId, "buscar", query, role)
  const isRef = query.startsWith("TRF-")
  let transfer: any
  if (isRef) {
    transfer = await db.transferPayment.findUnique({ where: { referenceCode: query }, include: { user: true } })
  } else {
    const user = await db.user.findUnique({ where: { email: query } })
    if (!user) { await sendTelegramMessage(chatId, `❌ No encontrado: ${sanitizeHtml(query)}`); return }
    const transfers = await db.transferPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 })
    if (transfers.length === 0) { await sendTelegramMessage(chatId, `❌ Sin pagos para ${sanitizeHtml(query)}`); return }
    transfer = transfers[0]
  }
  if (!transfer) { await sendTelegramMessage(chatId, "❌ No encontrado."); return }
  const text = `🔍 <b>Pago encontrado</b>\n\nReferencia: ${transfer.referenceCode}\nPlan: ${sanitizeHtml(transfer.plan)}\nMonto: $${transfer.amount.toFixed(2)}\nEstado: ${statusIcon(transfer.status)} ${transfer.status}\n${transfer.validatedAt ? `👁️ Validado: ${relativeTime(transfer.validatedAt)}\n` : ""}${transfer.activatedAt ? `✅ Activado: ${relativeTime(transfer.activatedAt)}\n` : ""}📆 Creado: ${relativeTime(transfer.createdAt)}`
  await sendTelegramMessage(chatId, text)
}

export async function handleHistorial(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, R.notAuthorized("VALIDATOR")); return }
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
  if (payments.length === 0 && transfers.length === 0) lines.push(R.clientNoPayments())
  await sendTelegramMessage(chatId, lines.join("\n"))
}

export async function handleValidatorHelp(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (!role) { await sendTelegramMessage(chatId, R.notAuthorized("VALIDATOR")); return }
  await logTelegramCommand(chatId, "validatorhelp", null, role)
  await sendTelegramMessage(chatId, R.validatorHelpText())
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
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [pending, newUsers] = await Promise.all([
      db.transferPayment.count({ where: { status: "pending" } }),
      db.user.count({ where: { createdAt: { gte: today } } }),
    ])
    await sendTelegramMessage(chatId, R.welcomeAdmin(undefined, pending, newUsers))
    await sendTelegramMessage(chatId, "🎉 ¡Token correcto! Bienvenido, administrador. El panel está listo para ti. Usa /adminhelp para ver todo lo que puedes hacer.")
  } else {
    await logTelegramCommand(chatId, "admin", "failed", null)
    await sendTelegramMessage(chatId, "❌ Token inválido. ¿Seguro que escribiste bien? Pídele uno nuevo al súper admin si lo perdiste.")
  }
}

export async function handleActivar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  const ref = args[0]
  if (!ref) { await sendTelegramMessage(chatId, "Uso: /activar TRF-...\n/activar 1,2,3 — Activar varios"); return }
  await logTelegramCommand(chatId, "activar", ref, role)

  // Multi-step confirm
  const state = conversationState.get(chatId)
  if (state?.step === "awaiting_activate_confirm") {
    const reply = args.join(" ").toLowerCase()
    if (reply === "confirmar" || reply === "sí" || reply === "si") {
      const ref2 = state.data.ref
      const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref2 }, include: { user: true } })
      if (!transfer || transfer.status !== "validated") {
        await sendTelegramMessage(chatId, "❌ El pago ya no está en estado validado.")
        conversationState.delete(chatId)
        return
      }
      try {
        await db.transferPayment.update({ where: { id: transfer.id }, data: { status: "activated", activatedById: userId, activatedAt: new Date() } })
        await Promise.all([
          db.subscription.create({ data: { userId: transfer.userId, plan: transfer.plan, provider: "transfer", status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
          db.payment.create({ data: { userId: transfer.userId, provider: "transfer", plan: transfer.plan, amount: transfer.amount, status: "completed", confirmedAt: new Date(), remoteId: transfer.referenceCode } }),
          db.auditLog.create({ data: { userId, action: "activate_transfer", targetId: transfer.id, targetType: "transfer", details: `Activated ${ref2}` } }),
        ])
      } catch {
        await db.transferPayment.update({ where: { id: transfer.id }, data: { status: "validated" } }).catch(() => {})
        await sendTelegramMessage(chatId, "❌ Error al activar. Intenta de nuevo.")
        conversationState.delete(chatId)
        return
      }
      await sendTelegramMessage(chatId, R.activateResult(ref2, transfer.user?.name || "?", transfer.plan))
      conversationState.delete(chatId)
      return
    }
    conversationState.delete(chatId)
  }

  // Batch by index
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
      } catch {
        await db.transferPayment.update({ where: { id: t.id }, data: { status: "validated" } }).catch(() => {})
        fail++
      }
    }
    await sendTelegramMessage(chatId, R.batchValidateResult(ok, fail))
    return
  }

  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado: ${transfer.status}`); return }

  conversationState.set(chatId, { step: "awaiting_activate_confirm", data: { ref } })
  await sendTelegramMessage(chatId,
    `⚠️ <b>Confirmar activación</b>\n\nReferencia: ${ref}\nUsuario: ${sanitizeHtml(transfer.user?.name || "?")} (${sanitizeHtml(transfer.user?.email || "?")})\nPlan: ${transfer.plan}\nMonto: $${transfer.amount.toFixed(2)}\n\nEscribe <b>confirmar</b> para activar, o cualquier otra cosa para cancelar.`
  )
}

export async function handleActivarConfirm(chatId: string, userId: string, ref: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  const transfer = await db.transferPayment.findUnique({ where: { referenceCode: ref }, include: { user: true } })
  if (!transfer) { await sendTelegramMessage(chatId, `❌ No encontrado: ${ref}`); return }
  if (transfer.status !== "validated") { await sendTelegramMessage(chatId, `⚠️ Estado: ${transfer.status}`); return }
  try {
    await db.transferPayment.update({ where: { id: transfer.id }, data: { status: "activated", activatedById: userId, activatedAt: new Date() } })
    await Promise.all([
      db.subscription.create({ data: { userId: transfer.userId, plan: transfer.plan, provider: "transfer", status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
      db.payment.create({ data: { userId: transfer.userId, provider: "transfer", plan: transfer.plan, amount: transfer.amount, status: "completed", confirmedAt: new Date(), remoteId: transfer.referenceCode } }),
      db.auditLog.create({ data: { userId, action: "activate_transfer", targetId: transfer.id, targetType: "transfer", details: `Activated ${ref} via callback` } }),
    ])
  } catch {
    await db.transferPayment.update({ where: { id: transfer.id }, data: { status: "validated" } }).catch(() => {})
    await sendTelegramMessage(chatId, "❌ Error al activar. Intenta de nuevo.")
    return
  }
  await sendTelegramMessage(chatId, R.activateResult(ref, transfer.user?.name || "?", transfer.plan))
}

export async function handleCliente(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
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
  let text = `👤 <b>Cliente</b>\n`
  text += `Nombre: ${sanitizeHtml(user.name || "—")}\n`
  text += `Email: ${sanitizeHtml(email)}\n`
  text += `${planIcons[user.plan] || "📋"} Plan: ${sanitizeHtml(user.plan)} | Rol: ${sanitizeHtml(user.role)}\n`
  text += `🔬 Análisis: ${analysisCount}\n`
  text += `💰 Total: $${(totalSpent._sum.amount || 0).toFixed(2)}\n`
  text += `⏳ Pendientes: ${pendingPayments}\n`
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
    for (const p of user.payments) text += `${formatPaymentRow(p)} — ${relativeTime(p.createdAt)}\n`
  }
  const buttons = [
    [{ text: "🔗 Ver en Admin Panel", url: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/admin/users?search=${encodeURIComponent(email)}` }],
    MENU_BACK_ROW,
  ]
  await sendTelegramMenu(chatId, text, buttons)
}

export async function handleReporte(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
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

  const text = `📊 <b>Reporte del Día (${fecha})</b>\n\n` +
    `👥 <b>Usuarios</b>\n- Nuevos hoy: ${newUsers}\n- Totales: ${totalUsers}\n\n` +
    `📸 <b>Análisis</b>\n- 7 días: ${weekAnalyses}\n- Totales: ${totalAnalyses}\n\n` +
    `💰 <b>Ventas</b>\n- Hoy: ${todayPayments.length} ventas ($${todayRevenue.toFixed(2)})\n- 7 días: ${weekPayments.length} ventas ($${weekRevenue.toFixed(2)})\n\n` +
    `🔄 <b>Pagos Pendientes</b>\n- Transfermóvil: ${pendingTransfer}\n\n` +
    `⭐ <b>Feedback</b>\n- Promedio: ${feedbackAvg.avg.toFixed(1)}/10 (${feedbackAvg.count} votos)`
  await sendTelegramMessage(chatId, text)
}

export async function handleUsuarios(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
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
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  await logTelegramCommand(chatId, "adminhelp", null, role)
  await sendTelegramMessage(chatId, R.adminHelpText())
}

export async function handleBroadcast(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  const message = args.join(" ")
  if (!message) { await sendTelegramMessage(chatId, "Uso: /broadcast Mensaje para todos los usuarios"); return }
  await logTelegramCommand(chatId, "broadcast", message.slice(0, 100), role)
  const users = await db.user.findMany({ where: { telegramId: { not: null } }, select: { telegramId: true } })
  if (users.length === 0) { await sendTelegramMessage(chatId, "❌ Sin usuarios con Telegram."); return }
  const buttons = [
    [{ text: "✅ Confirmar envío", callback_data: "broadcast_go" }, { text: "❌ Cancelar", callback_data: "menu_main" }],
  ]
  broadcastPending = { chatId, message }
  await sendTelegramMenu(chatId, R.broadcastConfirm(users.length, message), buttons)
}

let broadcastPending: { chatId: string; message: string } | null = null

export async function handleBroadcastGo(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  if (!broadcastPending || broadcastPending.chatId !== chatId) {
    await sendTelegramMessage(chatId, "❌ Sin broadcast pendiente.")
    return
  }
  const msg = broadcastPending.message
  broadcastPending = null
  const users = await db.user.findMany({ where: { telegramId: { not: null } }, select: { telegramId: true } })
  let sent = 0
  for (const u of users) {
    if (u.telegramId) { if (await sendTelegramMessage(u.telegramId, msg)) sent++ }
  }
  await sendTelegramMessage(chatId, R.broadcastResult(sent, users.length))
}

export async function handleLogs(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  const fecha = args[0]
  await logTelegramCommand(chatId, "logs", fecha || null, role)

  // Show recent bot logs
  const logs = await getTelegramLogs(fecha)

  // Also show recent API errors from audit log
  let errorSection = ""
  try {
    const recentErrors = await db.auditLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    if (recentErrors.length > 0) {
      errorSection = "\n\n⚠️ <b>Últimos errores (24h):</b>\n" +
        recentErrors.map(e =>
          `• ${e.createdAt.toLocaleTimeString("es")} | <code>${e.action}</code> | ${e.details?.slice(0, 100) || "—"}`
        ).join("\n")
    }
  } catch {}

  let text = `📋 <b>Logs${fecha ? ` (${fecha})` : ""}</b>\n\n${logs.join("\n") || "Sin registros."}${errorSection}`
  if (text.length > 4000) {
    const chunks = text.match(/.{1,4000}/g) || []
    for (const chunk of chunks) await sendTelegramMessage(chatId, chunk)
  } else {
    await sendTelegramMessage(chatId, text)
  }
}

// ─── /alerta ───────────────────────────────────────────────────

export async function handleAlerta(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  await logTelegramCommand(chatId, "alerta", args.join(" "), role)
  const current = await getAlertSub(chatId)
  const allEvents = ["new_user", "new_analysis", "pending_24h", "critical_error"]

  if (args.length === 0) {
    await sendTelegramMessage(chatId, R.alertStatus(current))
    return
  }
  const action = args[0]
  const event = args[1]
  if (!["on", "off"].includes(action) || !event) {
    await sendTelegramMessage(chatId, "Uso: /alerta on new_user\n/alerta off new_user\n/alerta on *")
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

// ─── /trending ─────────────────────────────────────────────────

export async function handleTrending(chatId: string, userId: string) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  await logTelegramCommand(chatId, "trending", null, role)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const [totalUsers, analyses, recentAnalyses] = await Promise.all([
    db.user.count(),
    db.skinAnalysis.findMany({ take: 200, orderBy: { createdAt: "desc" }, select: { skinType: true, concerns: true } }),
    db.skinAnalysis.count({ where: { createdAt: { gte: weekAgo } } }),
  ])

  const typeCount: Record<string, number> = {}
  const concernCount: Record<string, number> = {}
  for (const a of analyses) {
    if (a.skinType) typeCount[a.skinType] = (typeCount[a.skinType] || 0) + 1
    if (a.concerns) {
      try { const c = JSON.parse(a.concerns); if (Array.isArray(c)) c.forEach((x: string) => concernCount[x] = (concernCount[x] || 0) + 1) } catch {}
    }
  }

  const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const sortedConcerns = Object.entries(concernCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  let text = `${R.trendingIntro()}\n\n👤 <b>Tipos de piel:</b>\n`
  for (const [type, count] of sortedTypes) text += `${type} — ${((count / Math.max(analyses.length, 1)) * 100).toFixed(0)}%\n`
  text += `\n🔍 <b>Preocupaciones:</b>\n`
  for (const [c, count] of sortedConcerns) text += `${c} — ${((count / Math.max(analyses.length, 1)) * 100).toFixed(0)}%\n`
  text += `\n📈 <b>Actividad</b>\nAnálisis (7d): ${recentAnalyses} | Usuarios: ${totalUsers}`
  await sendTelegramMessage(chatId, text)
}

// ─── Pendientes callback ────────────────────────────────────────

async function handlePendientesCb(ctx: MenuContext) {
  await handlePendientes(ctx.chatId, ctx.userId)
}

// ─── Internet search for admin queries ──────────────────────────

export async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return ""
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&lr=lang_es&num=3`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data = await res.json()
    if (!data.items || !Array.isArray(data.items)) return ""
    return data.items.map((item: any) =>
      `• <a href="${item.link}">${sanitizeHtml(item.title)}</a>\n  ${sanitizeHtml((item.snippet || "").slice(0, 150))}`
    ).join("\n\n")
  } catch {
    return ""
  }
}

// ─── /analisis ─────────────────────────────────────────────────

export async function handleAnalisis(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  const id = args[0]
  if (!id) { await sendTelegramMessage(chatId, "Uso: /analisis ID_del_análisis"); return }
  await logTelegramCommand(chatId, "analisis", id, role)
  const analysis = await db.skinAnalysis.findUnique({ where: { id }, include: { user: true } })
  if (!analysis) { await sendTelegramMessage(chatId, `❌ Análisis no encontrado: ${id}`); return }
  let text = R.analysisHeader(id, analysis.user?.name || "?", analysis.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }))
  if (analysis.skinType) text += `\n📊 <b>Tipo de piel:</b> ${sanitizeHtml(analysis.skinType)}\n`
  if (analysis.observations && analysis.observations !== "[]") {
    text += `\n📊 <b>Observaciones</b>\n`
    try { const obs = JSON.parse(analysis.observations); if (Array.isArray(obs)) obs.forEach((o: any) => { text += `- ${sanitizeHtml(typeof o === "string" ? o : o.label || JSON.stringify(o))}\n` }) } catch { text += `${sanitizeHtml(analysis.observations.slice(0, 200))}\n` }
  }
  if (analysis.recommendations && analysis.recommendations !== "[]") {
    text += `\n📝 <b>Recomendaciones</b>\n`
    try { const recs = JSON.parse(analysis.recommendations); if (Array.isArray(recs)) recs.forEach((r: any) => { text += `- ${sanitizeHtml(typeof r === "string" ? r : r.label || r.text || JSON.stringify(r))}\n` }) } catch { text += `${sanitizeHtml(analysis.recommendations.slice(0, 200))}\n` }
  }
  await sendTelegramMessage(chatId, text)
}

// ─── /promocion ────────────────────────────────────────────────

export async function handlePromocion(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  if (args.length === 0) {
    await sendTelegramMessage(chatId, "🎟️ <b>Códigos de Descuento</b>\n\n/promocion 20 — Crear 20% desc.\n/promocion ver CODIGO — Ver estado")
    return
  }
  if (args[0] === "ver") {
    const code = args[1]?.toUpperCase()
    if (!code) { await sendTelegramMessage(chatId, "Uso: /promocion ver CODIGO"); return }
    const dc = await db.discountCode.findUnique({ where: { code } })
    if (!dc) { await sendTelegramMessage(chatId, `❌ No encontrado: ${code}`); return }
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
  await sendTelegramMessage(chatId, R.promoGenerated(code, discount, url))
}

// ─── /consultar ────────────────────────────────────────────────

export async function handleConsultar(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (!role) {
    await sendTelegramMessage(chatId, "🔐 Este comando es solo para administradores y validadores.\n\nUsa /ayuda para ver los comandos disponibles.")
    return
  }
  const query = args.join(" ")
  if (!query) {
    await sendTelegramMessage(chatId, "Uso: /consultar ¿Qué ingredientes recomiendas para piel grasa?\n\nHaz una pregunta sobre skincare, ingredientes, rutinas o productos.")
    return
  }
  await logTelegramCommand(chatId, "consultar", query.slice(0, 100), role)
  const { generateBotResponse } = await import("@/lib/bot-rag")
  await sendTelegramMessage(chatId, "🧠 Analizando tu consulta...")
  const response = await generateBotResponse(query, chatId)
  const buttons = response.knowledgeId
    ? [[{ text: "👍 Útil", callback_data: `rag_feedback_${response.knowledgeId}_1` }]]
    : undefined
  if (buttons) {
    await sendTelegramMenu(chatId, response.text, buttons)
  } else {
    await sendTelegramMessage(chatId, response.text)
  }
}

// ─── /whois ────────────────────────────────────────────────────

export async function handleWhois(chatId: string, userId: string, args: string[]) {
  const role = await getUserRole(chatId)
  if (role !== "ADMIN") { await sendTelegramMessage(chatId, R.notAuthorized("ADMIN")); return }
  await logTelegramCommand(chatId, "whois", args[0] || "", role)
  const allTelegramUsers = await db.user.findMany({
    where: { telegramId: { not: null } },
    select: { name: true, email: true, plan: true, telegramId: true, createdAt: true },
    take: 20,
  })
  if (allTelegramUsers.length === 0) {
    await sendTelegramMessage(chatId, "❌ No hay usuarios con Telegram vinculado.")
    return
  }
  let text = `🔍 <b>Usuarios con Telegram (${allTelegramUsers.length})</b>\n\n`
  for (const u of allTelegramUsers) {
    text += `👤 ${sanitizeHtml(u.name || "?")} | ${sanitizeHtml(u.email)} | ${u.plan}\n`
  }
  text += `\n💡 Usa /cliente email para ver detalles.`
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
  if (data === "action_pending") { await answerCallback(chatId, callbackId); return await handlePendientesCb(ctx) }
  if (data === "action_users") { await answerCallback(chatId, callbackId); return await handleUsuarios(chatId, userId) }
  if (data === "action_reporte") { await answerCallback(chatId, callbackId); return await handleReporte(chatId, userId) }
  if (data === "action_trending") { await answerCallback(chatId, callbackId); return await handleTrending(chatId, userId) }

  // ─── Admin command buttons (show prompt) ─────────
  if (data === "cmd_cliente") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "🔍 Escribe: /cliente EMAIL") }
  if (data === "cmd_analisis") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "📋 Escribe: /analisis ID") }
  if (data === "cmd_broadcast") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "📢 Escribe: /broadcast MENSAJE") }
  if (data === "cmd_logs") { await answerCallback(chatId, callbackId); return await handleLogs(chatId, userId, []) }
  if (data === "cmd_alerta") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "🚨 Escribe: /alerta TEXTO") }
  if (data === "cmd_promocion") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "🏷️ Escribe: /promocion DESCUENTO") }
  if (data === "cmd_whois") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "🔎 Escribe: /whois TELEGRAM_ID") }
  if (data === "cmd_consultar") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "🤖 Escribe: /consultar PREGUNTA") }

  // ─── Validator command buttons ─────────
  if (data === "cmd_buscar") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "🔍 Escribe: /buscar EMAIL") }
  if (data === "cmd_historial") { await answerCallback(chatId, callbackId); return await sendTelegramMessage(chatId, "📋 Escribe: /historial EMAIL") }

  if (data === "broadcast_go") {
    await answerCallback(chatId, callbackId, "Enviando..."); await handleBroadcastGo(chatId, userId); return
  }
  if (data === "action_broadcast_cancel") {
    await answerCallback(chatId, callbackId, "Cancelado"); broadcastPending = null; await showMainMenu(ctx); return
  }

  if (data.startsWith("activar_")) {
    const ref = data.replace("activar_", "")
    await answerCallback(chatId, callbackId, "✅ Activando...")
    await handleActivarConfirm(chatId, userId, ref)
    return
  }

  if (data.startsWith("rag_feedback_")) {
    await answerCallback(chatId, callbackId, "✅ Gracias por tu feedback")
    try {
      const { recordFeedback } = await import("@/lib/bot-knowledge")
      const payload = data.replace("rag_feedback_", "")
      const underscoreIdx = payload.indexOf("_")
      if (underscoreIdx > 0) {
        const knowledgeId = payload.slice(0, underscoreIdx)
        const helpful = payload.slice(underscoreIdx + 1) === "1"
        await recordFeedback(knowledgeId, helpful)
      }
    } catch {}
    return
  }

  if (data.startsWith("validar_idx_")) {
    const idx = parseInt(data.replace("validar_idx_", ""))
    await answerCallback(chatId, callbackId, "⏳ Validando...")
    const pending = await db.transferPayment.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" } })
    const p = pending[idx]
    if (!p) { await sendTelegramMessage(chatId, "❌ Pago no encontrado."); return }
    await editTelegramButtons(chatId, messageId, [])
    try {
      await Promise.all([
        db.transferPayment.update({ where: { id: p.id }, data: { status: "validated", validatedById: userId, validatedAt: new Date() } }),
        db.auditLog.create({ data: { userId, action: "validate_transfer", targetId: p.id, targetType: "transfer", details: `Validated ${p.referenceCode} via button` } }),
      ])
    } catch {
      await db.transferPayment.update({ where: { id: p.id }, data: { status: "pending" } }).catch(() => {})
      await sendTelegramMessage(chatId, "❌ Error al validar. Intenta de nuevo.")
      return
    }
    await sendTelegramMessage(chatId, R.validateResult(p.referenceCode, true))
    return
  }

  await answerCallback(chatId, callbackId, "Comando no reconocido")
}

async function showMainMenu(ctx: MenuContext) {
  const role = await getUserRole(ctx.chatId)
  if (!role) { await sendTelegramMessage(ctx.chatId, "❌ No autorizado."); return }
  if (role === "ADMIN") {
    const text = `👑 <b>Panel de Administración</b>\n\nSelecciona una opción:`
    const buttons = [
      [{ text: "⏳ Pendientes", callback_data: "action_pending" }, { text: "📈 Reporte", callback_data: "action_reporte" }],
      [{ text: "👥 Usuarios", callback_data: "action_users" }, { text: "📊 Trending", callback_data: "action_trending" }],
      [{ text: "🔍 Cliente", callback_data: "cmd_cliente" }, { text: "📋 Analisis", callback_data: "cmd_analisis" }],
      [{ text: "📢 Broadcast", callback_data: "cmd_broadcast" }, { text: "📝 Logs", callback_data: "cmd_logs" }],
      [{ text: "🚨 Alerta", callback_data: "cmd_alerta" }, { text: "🏷️ Promocion", callback_data: "cmd_promocion" }],
      [{ text: "🔎 WhoIS", callback_data: "cmd_whois" }, { text: "🤖 Consultar", callback_data: "cmd_consultar" }],
    ]
    await sendOrEdit(ctx, text, buttons)
  } else {
    await sendOrEdit(ctx,
      `🛡️ <b>Panel Validador</b>\n\nSelecciona una opción:`,
      [
        [{ text: "⏳ Pendientes", callback_data: "action_pending" }],
        [{ text: "🔍 Buscar", callback_data: "cmd_buscar" }, { text: "📋 Historial", callback_data: "cmd_historial" }],
        [{ text: "🤖 Consultar", callback_data: "cmd_consultar" }],
      ]
    )
  }
}
