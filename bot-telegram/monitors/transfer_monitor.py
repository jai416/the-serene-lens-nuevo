import utils.db as db
from utils.telegram import send_alert
from config.settings import TRANSFER_PENDING_TIMEOUT_HOURS, TRANSFER_VALIDATED_TIMEOUT_MINUTES
import logging

logger = logging.getLogger(__name__)

async def check_transfers(bot=None):
    try:
        stale = await db.get_stale_transfer_payments(TRANSFER_PENDING_TIMEOUT_HOURS)
        if stale:
            msg = f"🏦 <b>Transfermóvil pendientes (+{TRANSFER_PENDING_TIMEOUT_HOURS}h)</b>\n\n"
            for p in stale[:5]:
                msg += f"• {p['referenceCode']} | ${p['amount']:.2f} | {p.get('user_email','?')}\n"
            if len(stale) > 5: msg += f"\n... y {len(stale)-5} más"
            await send_alert(msg, bot=bot)
            logger.warning(f"Transfer pending: {len(stale)}")
        else:
            logger.info("Transfer pending: OK")
    except Exception as e:
        logger.error(f"Transfer pending error: {e}")

    try:
        validated = await db.get_stale_validated_transfers(TRANSFER_VALIDATED_TIMEOUT_MINUTES)
        if validated:
            msg = f"🔓 <b>Transfermóvil validados sin activar (+{TRANSFER_VALIDATED_TIMEOUT_MINUTES}min)</b>\n\n"
            for p in validated[:5]:
                msg += f"• {p['referenceCode']} | ${p['amount']:.2f} | {p.get('user_email','?')}\n"
            if len(validated) > 5: msg += f"\n... y {len(validated)-5} más"
            await send_alert(msg, bot=bot)
            logger.warning(f"Transfer validated: {len(validated)} not activated")
        else:
            logger.info("Transfer validated: OK")
    except Exception as e:
        logger.error(f"Transfer validated error: {e}")
