import utils.db as db
from utils.telegram import send_alert
from config.settings import PAYPAL_TIMEOUT_MINUTES
import logging

logger = logging.getLogger(__name__)

async def check_paypal(bot=None):
    try:
        payments = await db.get_stale_paypal_payments(PAYPAL_TIMEOUT_MINUTES)
        if payments:
            msg = f"💳 <b>PayPal sin activar ({len(payments)})</b>\nLímite: {PAYPAL_TIMEOUT_MINUTES} min\n\n"
            for p in payments[:5]:
                msg += f"• {p.get('paypalOrderId','N/A')} | ${p['amount']:.2f} | {p.get('user_email','?')}\n"
            if len(payments) > 5: msg += f"\n... y {len(payments)-5} más"
            await send_alert(msg, bot=bot)
            logger.warning(f"PayPal: {len(payments)} stale")
        else:
            logger.info("PayPal: OK")
    except Exception as e:
        logger.error(f"PayPal monitor error: {e}")
