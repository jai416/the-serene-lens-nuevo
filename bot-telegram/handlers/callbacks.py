from telegram import Update
from telegram.ext import ContextTypes
import utils.db as db
from utils.telegram import send_message
import logging

logger = logging.getLogger(__name__)

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = update.effective_user.id
    role = await db.get_user_role(user_id)
    if not role:
        await query.edit_message_text("❌ No autorizado.")
        return

    if data.startswith("detail:"):
        pid = data.split(":", 1)[1]
        pay = await db.get_payment_by_ref(pid)
        if pay:
            text = (
                f"🔍 <b>Detalle del pago</b>\n\n"
                f"Referencia: {pay['referenceCode']}\n"
                f"Usuario: {pay.get('user_name','?')} ({pay.get('user_email','?')})\n"
                f"Monto: ${pay['amount']:.2f}\n"
                f"Tipo: {pay.get('productType','N/A')}\n"
                f"Estado: {pay['status']}\n"
                f"Creado: {pay['createdAt'].strftime('%Y-%m-%d %H:%M') if pay.get('createdAt') else '?'}\n"
                f"Validado: {pay['validatedAt'].strftime('%Y-%m-%d %H:%M') if pay.get('validatedAt') else '—'}\n"
                f"Activado: {pay['activatedAt'].strftime('%Y-%m-%d %H:%M') if pay.get('activatedAt') else '—'}\n"
            )
            await query.edit_message_text(text, parse_mode="HTML")
        else:
            await query.edit_message_text("❌ Pago no encontrado.")

    elif data.startswith("validate:"):
        if role not in ("ADMIN", "VALIDATOR"):
            await query.edit_message_text("❌ No autorizado."); return
        ref = data.split(":", 1)[1]
        pay = await db.get_payment_by_ref(ref)
        if not pay or pay["status"] != "pending":
            await query.edit_message_text("⚠️ El pago ya no está pendiente."); return
        u = await db.get_user_by_telegram(user_id)
        await db.validate_transfer(ref, u["id"])
        await db.add_audit_log(u["id"], "validate", pay["id"])
        logger.info(f"Callback: {u['id']} validated {ref}")
        await query.edit_message_text(f"✅ Pago validado: {ref}")

    elif data.startswith("activate:"):
        if role != "ADMIN":
            await query.edit_message_text("❌ Solo admin."); return
        ref = data.split(":", 1)[1]
        pay = await db.get_payment_by_ref(ref)
        if not pay or pay["status"] != "validated":
            await query.edit_message_text("⚠️ Debe estar validado primero."); return
        u = await db.get_user_by_telegram(user_id)
        await db.activate_transfer(ref, u["id"])
        await db.add_audit_log(u["id"], "activate", pay["id"])
        logger.info(f"Callback: {u['id']} activated {ref}")
        await query.edit_message_text(f"✅ Acceso activado: {ref}")

    elif data.startswith("cancel:"):
        if role != "ADMIN":
            await query.edit_message_text("❌ Solo admin."); return
        ref = data.split(":", 1)[1]
        pay = await db.get_payment_by_ref(ref)
        if not pay: await query.edit_message_text("❌ No encontrado."); return
        u = await db.get_user_by_telegram(user_id)
        await db.cancel_transfer(ref, u["id"])
        await db.add_audit_log(u["id"], "cancel", pay["id"])
        logger.info(f"Callback: {u['id']} cancelled {ref}")
        await query.edit_message_text(f"✅ Cancelado: {ref}")

    elif data.startswith("remind:"):
        if role not in ("ADMIN", "VALIDATOR"):
            await query.edit_message_text("❌ No autorizado."); return
        ref = data.split(":", 1)[1]
        await query.edit_message_text(f"📩 Recordatorio enviado al cliente de {ref} (integrar con Resend)")
    else:
        await query.edit_message_text("❌ Acción desconocida.")
