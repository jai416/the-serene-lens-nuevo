// ================================================================
//  RESPONSE PERSONALITY ENGINE
//  Warm, honest, professional — like The Serene Lens brand
// ================================================================

import { sanitizeHtml } from "@/lib/sanitize"

// ─── Time-of-day greetings ─────────────────────────────────────

export function timeGreeting(name?: string | null): string {
  const h = new Date().getHours()
  const n = name ? sanitizeHtml(name) : ""
  if (h < 6) return n ? `🌙 Buenas madrugadas, ${n}.` : "🌙 Buenas madrugadas."
  if (h < 12) return n ? `🌅 Buenos días, ${n}.` : "🌅 ¡Buenos días!"
  if (h < 18) return n ? `☀️ Buenas tardes, ${n}.` : "☀️ Buenas tardes."
  if (h < 22) return n ? `🌆 Buenas tardes, ${n}.` : "🌆 Buenas tardes."
  return n ? `🌙 Buenas noches, ${n}.` : "🌙 Buenas noches."
}

// ─── Multi-variant picker ──────────────────────────────────────

function pick<T>(variants: T[]): T {
  return variants[Math.floor(Math.random() * variants.length)]
}

// ─── Welcome / Start ───────────────────────────────────────────

export function welcomePublic(name?: string | null): string {
  const g = timeGreeting(name)
  return pick([
    `${g} 👋\n\nSoy el asistente de <b>The Serene Lens</b>. Puedes hablarme normal, sin comandos raros. ¿Qué se te ofrece?\n\n🔍 <i>Ejemplos:</i> "Quiero ver los precios", "¿Qué planes tienen?", "Muéstrame mi estado"`,
    `${g}\n\n🌿 ¡Qué bueno verte por aquí! Soy el asistente de <b>The Serene Lens</b>. Háblame natural, como a un amigo. ¿En qué te ayudo?\n\n💬 <i>Por ejemplo:</i> "Dame tips de skincare", "Quiero contactarlos", "Muéstrame la web"`,
    `${g}\n\n🧴 Bienvenido a <b>The Serene Lens</b>. Soy tu asistente de skincare con IA. Puedes pedirme cosas con tus palabras, no necesitas comandos especiales.\n\n✨ <i>Ejemplo:</i> "Hola" para empezar, "gracias" si necesitas ayuda, o directamente dime qué quieres saber.`,
    `${g}\n\n🔬 <b>The Serene Lens</b> — Descubre tu piel sin engaños.\n\nPregúntame lo que sea: "¿Cuánto cuesta?", "¿Qué planes tienen?", "¿Cómo está mi cuenta?". Te entiendo aunque hables como tú quieras. ¡Inténtalo!`,
  ])
}

export function welcomeAdmin(name?: string | null, pending?: number, newUsers?: number): string {
  const g = timeGreeting(name)
  const stats = []
  if (pending && pending > 0) stats.push(`📋 ${pending} pago${pending > 1 ? "s" : ""} pendiente${pending > 1 ? "s" : ""} de validar`)
  if (newUsers && newUsers > 0) stats.push(`👤 ${newUsers} usuario${newUsers > 1 ? "s" : ""} nuevo${newUsers > 1 ? "s" : ""} hoy`)
  const statsText = stats.length > 0 ? `\n\n${stats.join(" y ")}.` : ""
  return pick([
    `${g} 👑\n\nBienvenido, jefe. El reino te necesita.${statsText}\n\n¿Qué quieres hacer?\n- /pendientes → Ver pagos\n- /reporte → Resumen del día\n- /trending → Tendencias\n\nPuedes hablarme natural: "muéstrame los pagos", "cómo vamos hoy"`,
    `👑 ${g}\n\nPanel de control listo, capitán.${statsText}\n\n/reporte — Resumen\n/pendientes — Pagos\n/usuarios — Estadísticas\n/trending — Tendencias\n\nTambién puedes decirme: "¿cómo van las ventas?" o "dame el reporte"`,
  ])
}

export function welcomeValidator(name?: string | null): string {
  const g = timeGreeting(name)
  return pick([
    `${g} 🛡️\n\nBienvenido, validador. Los pagos Transfermóvil te esperan.\n\n/pendientes — Ver pendientes\n/validar REF — Validar uno\n/validar todos — Validar todos\n\nO simplemente dime: "muéstrame los pendientes"`,
    `🛡️ ${g}\n\nModo validador activado, guardián de los pagos. Revisa los pendientes:\n\n/pendientes — Lista de pagos\n/validar REF — Validar por referencia\n\nHáblame natural: "¿qué hay pendiente?"`,
  ])
}

// ─── Status ────────────────────────────────────────────────────

export function statusResponse(name: string, plan: string, planIcon: string, analysisCount: number, pendingPayments: number, lastAnalysis?: Date | null, subscriptionEnd?: string | null, telegramLinked?: boolean): string {
  const lines = [`📊 <b>Tu estado en The Serene Lens</b>\n`]
  lines.push(`👤 <b>Nombre:</b> ${sanitizeHtml(name)}`)
  lines.push(`${planIcon} <b>Plan actual:</b> ${sanitizeHtml(plan)}`)
  lines.push(`🔬 <b>Análisis realizados:</b> ${analysisCount}`)
  if (lastAnalysis) {
    const diff = Math.floor((Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60 * 24))
    const recMsg = diff > 7 ? "\n⏰ <i>¿Sabías que puedes repetir tu análisis? Tu piel cambia con el tiempo.</i>" : ""
    lines.push(`📅 <b>Último análisis:</b> ${lastAnalysis.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}${recMsg}`)
  } else {
    lines.push(`\n🌿 <i>Aún no has hecho ningún análisis. ¿Quieres descubrir tu piel hoy?</i>`)
  }
  if (subscriptionEnd) lines.push(`📅 <b>Suscripción:</b> ✅ Activa (hasta ${subscriptionEnd})`)
  if (pendingPayments > 0) lines.push(`⏳ <b>Pagos pendientes:</b> ${pendingPayments}`)
  if (telegramLinked) lines.push(`🤖 <b>Telegram:</b> ✅ Vinculado`)
  return lines.join("\n")
}

// ─── Prices ────────────────────────────────────────────────────

export function pricesResponse(): string {
  return pick([
    `💰 <b>Planes The Serene Lens</b>\n\n🆓 <b>Essential</b> — Gratis\n  1 análisis al mes. Para empezar.\n\n⭐ <b>Premium</b> — $4.99/mes\n  Análisis ilimitados + historial.\n\n💎 <b>Pro</b> — $9.99/mes\n  Prioridad + acceso anticipado.\n\n👑 <b>Pro+</b> — $14.99/mes\n  Informes PDF + rutina dinámica.\n\n📦 <b>Packs extra:</b>\n  Básico (3) $1.99 • Popular (5) $4.99 • Avanzado (15) $6.99\n\n🌿 <i>Sin contratos. Cancela cuando quieras.</i>`,
    `📋 <b>Planes y precios</b>\n\n🆓 <b>FREE</b> — $0\n  1 análisis al mes — siempre gratis.\n\n⭐ <b>Premium</b> — $4.99/mes\n  Análisis ilimitados, historial, evolución.\n\n💎 <b>Pro</b> — $9.99/mes\n  Todo Premium + prioridad.\n\n👑 <b>Pro+</b> — $14.99/mes\n  Todo Pro + informes PDF, rutina personalizada.\n\n💡 <i>¿Quieres probar? Empieza con el plan FREE.</i>`,
  ])
}

// ─── No auth / not registered ───────────────────────────────────

export function notRegistered(url: string): string {
  const base = url || "https://the-serene-lens-nuevo.onrender.com"
  return pick([
    `👋 Aún no estás registrado en The Serene Lens.\n\nRegístrate gratis en <a href="${base}/login">nuestra web</a> y vuelve para vincular tu Telegram desde tu perfil. 🌿`,
    `🌿 Parece que no tienes cuenta todavía.\n\nCrea una gratis en <a href="${base}/login">${base}/login</a> y después vincula Telegram en tu perfil. ¡Te esperamos!`,
  ])
}

// ─── No auth for admin/validator commands ───────────────────────

export function notAuthorized(role: "ADMIN" | "VALIDATOR"): string {
  if (role === "ADMIN") {
    return pick([
      `🔐 Necesitas autenticarte como administrador primero.\n\nUsa: <code>/admin TU_TOKEN</code>`,
      `👑 Solo administradores pueden usar este comando.\n\nAutentícate con: <code>/admin TU_TOKEN</code>`,
    ])
  }
  return pick([
    `🔐 Necesitas ser validador o admin para esto.\n\nUsa /validator TOKEN o /admin TOKEN`,
    `🛡️ Este comando es solo para personal autorizado.\n\n/validator TOKEN — Autenticarse como validador`,
  ])
}

// ─── Skincare tips with more personality ────────────────────────

export function skincareTip(tip: string): string {
  return pick([
    `💡 <b>Tip de skincare</b>\n\n${tip}\n\n🌿 <i>Pequeños cambios, grandes resultados.</i>`,
    `🧴 <b>¿Sabías que…?</b>\n\n${tip}\n\n✨ <i>Tu piel te lo agradecerá.</i>`,
    `🌿 <b>Consejo del día</b>\n\n${tip}\n\n💚 <i>Cuida tu piel, ella cuida de ti.</i>`,
  ])
}

// ─── Contact ────────────────────────────────────────────────────

export function contactResponse(url: string): string {
  return `📬 <b>Contacto</b>\n\n📧 <b>Email:</b> hereirajaison@gmail.com\n🌐 <b>Web:</b> <a href="${url}">theserenelens.com</a>\n📱 <b>WhatsApp:</b> +53 51819744\n\n💬 <i>Escríbenos cuando quieras. Estamos aquí para ti.</i>`
}

// ─── Pending payments list header ───────────────────────────────

export function pendingHeader(count: number): string {
  if (count === 0) return pick([
    "✅ No hay pagos pendientes. Todo al día.",
    "📋 Sin pagos pendientes. ¡Buen trabajo!",
    "✅ Cero pagos pendientes. La bandeja está vacía.",
  ])
  return `📋 <b>Pagos pendientes (${count})</b>\n\n`
}

// ─── Validate result ───────────────────────────────────────────

export function validateResult(ref: string, ok: boolean): string {
  if (ok) return pick([
    `✅ Pago <b>${ref}</b> validado correctamente.\n\nEl administrador debe activarlo con /activar ${ref}`,
    `✅ <b>${ref}</b> validado. Ahora el admin lo activa con /activar ${ref}`,
  ])
  return `❌ No se pudo validar <b>${ref}</b>. Verifica el estado e intenta de nuevo.`
}

// ─── Batch validate result ─────────────────────────────────────

export function batchValidateResult(ok: number, fail: number): string {
  if (fail === 0) return `✅ <b>Lote completado:</b> ${ok} pago${ok > 1 ? "s" : ""} validado${ok > 1 ? "s" : ""} correctamente.`
  return `⚠️ <b>Lote:</b> ${ok} validados, ${fail} con errores. Revisa los códigos e intenta de nuevo.`
}

// ─── Activate result ───────────────────────────────────────────

export function activateResult(ref: string, userName: string, plan: string): string {
  return pick([
    `✅ <b>${ref}</b> activado para ${sanitizeHtml(userName)} (${sanitizeHtml(plan)}).\n\nEl usuario ya tiene acceso.`,
    `✅ Acceso activado. ${sanitizeHtml(userName)} ahora tiene ${sanitizeHtml(plan)}.`,
  ])
}

// ─── Client info footer ────────────────────────────────────────

export function clientNoPayments(): string {
  return pick([
    "💳 Sin pagos registrados todavía.",
    "📭 Este usuario aún no ha realizado pagos.",
  ])
}

// ─── Broadcast confirmation ────────────────────────────────────

export function broadcastConfirm(count: number, message: string): string {
  return `📢 <b>Broadcast</b>\n\nSe enviará a <b>${count}</b> usuario${count > 1 ? "s" : ""}:\n━━━━━━━━━━━━━━\n${message}\n━━━━━━━━━━━━━━\n\n¿Confirmas el envío?`
}

// ─── Broadcast result ──────────────────────────────────────────

export function broadcastResult(sent: number, total: number): string {
  if (sent === total) return `✅ Broadcast enviado a los ${total} usuarios.`
  if (sent > 0) return `⚠️ Broadcast enviado a ${sent}/${total} usuarios (${total - sent} no pudieron recibirlo).`
  return `❌ No se pudo enviar el broadcast. Ningún usuario lo recibió.`
}

// ─── Reminder status ───────────────────────────────────────────

export function reminderStatus(active: boolean): string {
  if (active) return `⏰ <b>Recordatorio</b>\n\n✅ Activado. Te avisaré cada 7 días para analizar tu piel. 🌿\n\n/recordatorio off — Desactivar`
  return `⏰ <b>Recordatorio</b>\n\n❌ Desactivado. No recibirás notificaciones.\n\n/recordatorio on — Activar\n\n<i>Los recordatorios te ayudan a mantener una rutina constante.</i>`
}

// ─── Feedback prompt ───────────────────────────────────────────

export function feedbackPrompt(): string {
  return pick([
    `📝 <b>¿Cómo ha sido tu experiencia?</b>\n\nDel 1 al 10, ¿qué puntuación le das a The Serene Lens?\n\n<code>/feedback 8</code> (elige tu número)`,
    `⭐ <b>Valora tu experiencia</b>\n\nDel 1 al 10, ¿cómo calificas The Serene Lens?\n\nEscribe: <code>/feedback 9</code>`,
  ])
}

// ─── Feedback thanks ───────────────────────────────────────────

export function feedbackThanks(rating: number): string {
  if (rating >= 8) return `🥳 ¡Gracias! Nos alegra que te haya gustado. Seguiremos mejorando gracias a ti.`
  if (rating >= 5) return `🙂 ¡Gracias por tu valoración! Siempre podemos mejorar. Cuéntanos más en hereirajaison@gmail.com`
  return `😔 Gracias por tu honestidad. Lamentamos que no haya sido la mejor experiencia. Escríbenos a hereirajaison@gmail.com para ayudarte.`
}

// ─── Alert status ──────────────────────────────────────────────

export function alertStatus(events: string[]): string {
  const allEvents = ["new_user", "new_analysis", "pending_24h", "critical_error"]
  const icons: Record<string, string> = { new_user: "👤", new_analysis: "📸", pending_24h: "⏳", critical_error: "🚨" }
  let text = `🔔 <b>Alertas</b>\n\n`
  text += `Selecciona qué eventos quieres notificar:\n\n`
  for (const e of allEvents) {
    text += `${icons[e] || "•"} <code>/alerta ${events.includes(e) ? "off" : "on"} ${e}</code> — ${events.includes(e) ? "✅" : "❌"}\n`
  }
  text += `\n💡 /alerta on * — Activar todas\n💡 /alerta off * — Desactivar todas`
  return text
}

// ─── Trending ──────────────────────────────────────────────────

export function trendingIntro(): string {
  return pick([
    "📊 <b>Tendencias de la semana</b>\n\nEsto es lo que está pasando en The Serene Lens:",
    "📈 <b>Esto es tendencia</b>\n\nBasado en los análisis de esta semana:",
  ])
}

// ─── Analysis view ─────────────────────────────────────────────

export function analysisHeader(id: string, userName: string, date: string): string {
  return `🧴 <b>Análisis #${id.slice(-6)}</b>\n\n👤 <b>Usuario:</b> ${sanitizeHtml(userName)}\n📅 <b>Fecha:</b> ${date}\n`
}

// ─── Promo code generated ──────────────────────────────────────

export function promoGenerated(code: string, discount: number, url: string): string {
  return `🎟️ <b>Código de descuento generado</b>\n\n<code>${code}</code>\n\nDescuento: <b>${discount}%</b>\n\nLos usuarios pueden usarlo en:\n<a href="${url}">${url}</a>`
}

// ─── Validator/Admin help ──────────────────────────────────────

export function validatorHelpText(): string {
  return `🛡️ <b>Comandos de Validador</b>\n\n` +
    `/validar REF — Validar un pago\n` +
    `/validar 1,2,3 — Validar varios por índice\n` +
    `/validar todos — Validar todos los pendientes\n` +
    `/pendientes — Lista de pagos pendientes\n` +
    `/buscar email/ref — Buscar un pago\n` +
    `/historial email — Historial de pagos\n` +
    `/consultar — Consulta a la IA sobre skincare\n` +
    `/validatorhelp — Esta ayuda\n\n` +
    `💡 <i>Los botones en /pendientes hacen todo más rápido.</i>`
}

export function adminHelpText(): string {
  return `👑 <b>Comandos de Administrador</b>\n\n` +
    `📋 <b>Gestión</b>\n` +
    `/validar REF — Validar pago\n` +
    `/activar REF — Activar plan\n` +
    `/pendientes — Pagos pendientes\n` +
    `/cliente email — Info del cliente + enlace admin\n` +
    `/analisis ID — Ver análisis completo\n\n` +
    `📊 <b>Informes</b>\n` +
    `/reporte — Resumen del día\n` +
    `/usuarios — Estadísticas de usuarios\n` +
    `/trending — Tendencias de la semana\n` +
    `/logs [fecha] — Actividad del bot\n\n` +
    `📢 <b>Comunicación</b>\n` +
    `/broadcast msg — Mensaje a todos\n` +
    `/promocion 20% — Crear código descuento\n` +
    `/alerta — Configurar notificaciones\n` +
    `/consultar — Consulta a la IA sobre skincare\n\n` +
    `/adminhelp — Esta ayuda`
}

// ─── Personalized recommendation ───────────────────────────────

export function personalizedRecommendation(skinType?: string | null, concerns?: string[]): string {
  if (!skinType) return `🌿 Aún no tenemos datos de tu piel. Haz un análisis en la web y vuelve para recomendaciones personalizadas.`
  const s = sanitizeHtml(skinType || "")
  const recs: Record<string, string> = {
    "Mixta": "Un limpiador suave en gel y un hidratante oil-free son ideales para ti.",
    "Grasa": "El ácido salicílico y la niacinamida son tus mejores aliados.",
    "Seca": "Necesitas una crema rica en ceramidas y ácido hialurónico.",
    "Sensible": "Opta por productos sin fragancia con centella asiática y avena.",
    "Normal": "Mantén tu rutina con un buen protector solar y antioxidantes.",
  }
  const rec = recs[s] || "Una rutina balanceada con protector solar SPF 50 es clave."
  return `🌿 <b>Según tu tipo de piel (${s})</b>\n\n${rec}\n\n¿Quieres ver productos recomendados en la web?`
}

// ─── Multi-step validation confirmation ────────────────────────

export function confirmValidation(ref: string, userName: string, amount: number, plan: string): string {
  return `⚠️ <b>Confirmar validación</b>\n\nReferencia: ${ref}\nUsuario: ${sanitizeHtml(userName)}\nMonto: $${amount.toFixed(2)}\nPlan: ${sanitizeHtml(plan)}\n\n¿Confirmas? Escribe <b>confirmar</b> o <b>sí</b> para aceptar.`
}

// ─── Smart link formatter ──────────────────────────────────────

export function smartLink(url: string | undefined, text: string): string {
  const base = url || "https://the-serene-lens-nuevo.onrender.com"
  return `<a href="${base}">${text}</a>`
}

export function adminPanelLink(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
  return `<a href="${base}/admin/users?search=${encodeURIComponent(email)}">🔗 Ver en Admin Panel</a>`
}
