from telegram import Update
from telegram.ext import ContextTypes
import utils.db as db
from utils.telegram import reply, format_payment_row
import logging

logger = logging.getLogger(__name__)

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    role = await db.get_user_role(user.id)
    if not role:
        await reply(update, "❌ No tienes acceso. Tu Telegram ID no está registrado.")
        return
    text = (
        f"👋 <b>Bienvenido, {user.first_name}!</b>\nRol: {role}\n\n"
        f"<b>Comandos:</b>\n"
        f"/grupo — ID de este chat\n"
        f"/estado — Resumen del día\n"
        f"/pendientes — Transfermóvil pendientes\n"
        f"/validados — Transfermóvil validados\n"
        f"/cliente [email] — Buscar pedidos\n"
    )
    if role == "ADMIN":
        text += f"/activar [ref] — Activar acceso\n/cancelar [ref] — Cancelar\n/reporte — Reporte completo\n"
    if role in ("ADMIN", "VALIDATOR"):
        text += f"/validar [ref] — Validar pago\n"
    await reply(update, text)

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await cmd_start(update, context)

async def cmd_grupo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat = update.effective_chat
    await reply(update, f"📌 ID de este chat: <code>{chat.id}</code>\nTipo: {chat.type}\nTítulo: {chat.title or '—'}")

async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await db.get_user_role(update.effective_user.id):
        await reply(update, "❌ No autorizado."); return
    s = await db.get_today_summary()
    if not s:
        await reply(update, "No se pudo obtener resumen."); return
    await reply(update,
        f"📊 <b>Resumen del día</b>\n\n"
        f"💳 Pagos: {s['payments_today']} | 💰 ${float(s['revenue_today']):.2f}\n"
        f"👥 Usuarios nuevos: {s['new_users']}\n"
        f"🏦 Transfer: {s['transfer_today']} ({s['transfer_pending']} pend, {s['transfer_validated']} val)"
    )

async def cmd_pending(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await db.get_user_role(update.effective_user.id):
        await reply(update, "❌ No autorizado."); return
    t = await db.get_pending_transfers()
    p = await db.get_pending_paypal()
    q = await db.get_pending_qvapay()
    lines = [f"📋 <b>Pendientes</b>\n💳 PayPal: {len(p)} | QvaPay: {len(q)} | Transfer: {len(t)}\n"]
    if t:
        lines.append(f"\n🏦 <b>Transfermóvil ({len(t)})</b>")
        for r in t[:10]: lines.append(format_payment_row(r))
    if p:
        lines.append(f"\n💳 <b>PayPal ({len(p)})</b>")
        for r in p[:5]: lines.append(f"• {r.get('paypalOrderId','N/A')} | ${r['amount']:.2f} | {r.get('user_email','?')}")
    await reply(update, "\n".join(lines))

async def cmd_validated(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await db.get_user_role(update.effective_user.id):
        await reply(update, "❌ No autorizado."); return
    t = await db.get_validated_transfers()
    if not t:
        await reply(update, "✅ No hay Transfermóvil validados esperando activación."); return
    await reply(update, f"🔓 <b>Transfermóvil Validados ({len(t)})</b>\n" + "\n".join(format_payment_row(r) for r in t[:10]))

async def cmd_cliente(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await db.get_user_role(update.effective_user.id):
        await reply(update, "❌ No autorizado."); return
    if not context.args:
        await reply(update, "Uso: /cliente email@ejemplo.com"); return
    email = context.args[0]
    user = await db.get_user_by_email(email)
    if not user:
        await reply(update, f"❌ Usuario no encontrado: {email}"); return
    p, m = await db.get_payments_by_user(email)
    text = f"👤 <b>Cliente:</b> {user['name'] or '?'} ({email})\n📋 Plan: {user['plan']} | Rol: {user['role']}\n\n<b>Pagos ({len(p)}):</b>\n"
    for r in p[:10]: text += f"• {r['provider']} | {r['plan']} | ${r['amount']:.2f} | {r['status']}\n"
    text += f"\n<b>Transfer ({len(m)}):</b>\n"
    for r in m[:10]: text += f"• {r.get('referenceCode','N/A')} | ${r['amount']:.2f} | {r['status']}\n"
    await reply(update, text)

async def cmd_activar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if await db.get_user_role(update.effective_user.id) != "ADMIN":
        await reply(update, "❌ Solo admin."); return
    if not context.args: await reply(update, "Uso: /activar TRF-..."); return
    ref = context.args[0]
    pay = await db.get_payment_by_ref(ref)
    if not pay: await reply(update, f"❌ No encontrado: {ref}"); return
    if pay["status"] != "validated": await reply(update, f"⚠️ Estado actual: {pay['status']}"); return
    u = await db.get_user_by_telegram(update.effective_user.id)
    await db.activate_transfer(ref, u["id"])
    await db.add_audit_log(u["id"], "activate", pay["id"])
    logger.info(f"Admin {u['id']} activated {ref}")
    await reply(update, f"✅ Acceso activado: {ref}")

async def cmd_validar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    role = await db.get_user_role(update.effective_user.id)
    if role not in ("ADMIN", "VALIDATOR"): await reply(update, "❌ No autorizado."); return
    if not context.args: await reply(update, "Uso: /validar TRF-..."); return
    ref = context.args[0]
    pay = await db.get_payment_by_ref(ref)
    if not pay: await reply(update, f"❌ No encontrado: {ref}"); return
    if pay["status"] != "pending": await reply(update, f"⚠️ Estado actual: {pay['status']}"); return
    u = await db.get_user_by_telegram(update.effective_user.id)
    await db.validate_transfer(ref, u["id"])
    await db.add_audit_log(u["id"], "validate", pay["id"])
    logger.info(f"User {u['id']} validated {ref}")
    await reply(update, f"✅ Pago validado: {ref}\nAdmin debe activar con /activar {ref}")

async def cmd_cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if await db.get_user_role(update.effective_user.id) != "ADMIN": await reply(update, "❌ Solo admin."); return
    if not context.args: await reply(update, "Uso: /cancelar TRF-..."); return
    ref = context.args[0]
    pay = await db.get_payment_by_ref(ref)
    if not pay: await reply(update, f"❌ No encontrado: {ref}"); return
    u = await db.get_user_by_telegram(update.effective_user.id)
    await db.cancel_transfer(ref, u["id"])
    await db.add_audit_log(u["id"], "cancel", pay["id"])
    logger.info(f"Admin {u['id']} cancelled {ref}")
    await reply(update, f"✅ Cancelado: {ref}")

async def cmd_reporte(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if await db.get_user_role(update.effective_user.id) != "ADMIN": await reply(update, "❌ Solo admin."); return
    s = await db.get_today_summary()
    w = await db.get_period_summary("CURRENT_DATE - interval '7 days'")
    text = (
        f"📈 <b>Reporte del día</b>\n\n<b>Hoy:</b>\n"
        f"Pagos: {s['payments_today']} | ${float(s['revenue_today']):.2f}\n"
        f"Usuarios nuevos: {s['new_users']}\n"
        f"Transfer: {s['transfer_today']} ({s['transfer_pending']} pend, {s['transfer_validated']} val)\n\n"
    )
    if w:
        text += (
            f"<b>Últimos 7 días:</b>\n"
            f"Pagos: {w['total_payments']} | ${float(w['total_revenue']):.2f}\n"
            f"Nuevos: {w['new_users']} | Pagaron: {w['paying_users']}\n"
            f"Transfer: {w['total_transfers']} | Activados: {w['transfers_activated']}\n"
        )
    await reply(update, text)
