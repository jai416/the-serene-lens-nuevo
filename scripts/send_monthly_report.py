#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "bot-telegram"))
import asyncio
from telegram import Bot
from telegram.constants import ParseMode
from config.settings import TELEGRAM_TOKEN, TELEGRAM_GROUP_ID
from utils.logger import setup_logger
from utils.db import close_pool, get_period_summary
from datetime import datetime, timedelta

logger = setup_logger("cron-monthly")
async def run():
    try:
        m = await get_period_summary("CURRENT_DATE - interval '30 days'")
        mes = (datetime.utcnow() - timedelta(days=30)).strftime("%B %Y")
        text = f"📊 <b>Reporte Mensual — {mes}</b>\n\n"
        if m:
            text += f"💳 Pagos: {m['total_payments']}\n💰 ${float(m['total_revenue']):.2f}\n👥 Nuevos: {m['new_users']}\n🏦 Transfer: {m['total_transfers']}\n✅ Activados: {m['transfers_activated']}\n🔄 Pagaron: {m['paying_users']}\n"
        else: text += "Sin datos."
        bot = Bot(token=TELEGRAM_TOKEN)
        await bot.send_message(chat_id=TELEGRAM_GROUP_ID, text=text, parse_mode=ParseMode.HTML)
        logger.info("Monthly report sent")
    except Exception as e: logger.error(f"Error: {e}")
    finally: await close_pool()

if __name__ == "__main__":
    asyncio.run(run())
