import utils.db as db
from utils.telegram import send_alert
import logging

logger = logging.getLogger(__name__)

async def check_qvapay(bot=None):
    try:
        payments = await db.get_pending_qvapay()
        if payments:
            msg = f"🔄 <b>QvaPay pendientes ({len(payments)})</b>\n\n"
            for p in payments[:5]:
                msg += f"• {p.get('qvapayId','N/A')} | ${p['amount']:.2f} | {p.get('user_email','?')}\n"
            if len(payments) > 5: msg += f"\n... y {len(payments)-5} más"
            await send_alert(msg, bot=bot)
            logger.info(f"QvaPay: {len(payments)} pending")
        else:
            logger.info("QvaPay: OK")
    except Exception as e:
        logger.error(f"QvaPay error: {e}")
