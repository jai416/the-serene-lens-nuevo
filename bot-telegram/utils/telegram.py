import logging
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from config.settings import TELEGRAM_GROUP_ID, TELEGRAM_TOKEN

logger = logging.getLogger(__name__)

_bot_instance = None

def _get_bot(bot_or_app=None):
    global _bot_instance
    if bot_or_app:
        return bot_or_app.bot if hasattr(bot_or_app, 'bot') else bot_or_app
    if _bot_instance is None:
        _bot_instance = Bot(token=TELEGRAM_TOKEN)
    return _bot_instance

async def send_message(bot_or_app, text: str, reply_markup=None, chat_id: int = None):
    target = chat_id or TELEGRAM_GROUP_ID
    if not target:
        logger.warning("TELEGRAM_GROUP_ID not set")
        return
    try:
        bot = _get_bot(bot_or_app)
        await bot.send_message(chat_id=target, text=text, parse_mode=ParseMode.HTML, reply_markup=reply_markup)
    except Exception as e:
        logger.error(f"Error sending to {target}: {e}")

async def reply(update, text: str, reply_markup=None):
    try:
        await update.message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=reply_markup)
    except Exception as e:
        logger.error(f"Error replying: {e}")

async def send_alert(text: str, buttons: list = None, bot=None):
    reply_markup = None
    if buttons:
        keyboard = [[InlineKeyboardButton(b["text"], callback_data=b["callback_data"])] for b in buttons]
        reply_markup = InlineKeyboardMarkup(keyboard)
    await send_message(bot, f"⚠️ <b>Alerta</b>\n\n{text}", reply_markup=reply_markup)

def format_payment_row(p) -> str:
    return (
        f"• <b>{p.get('referenceCode', p.get('id', '?'))}</b>\n"
        f"  Usuario: {p.get('user_name', '?')} ({p.get('user_email', '?')})\n"
        f"  Monto: ${p['amount']:.2f} | Tipo: {p.get('productType', p.get('plan', 'N/A'))}\n"
        f"  Creado: {p['createdAt'].strftime('%Y-%m-%d %H:%M') if p.get('createdAt') else '?'}\n"
    )
