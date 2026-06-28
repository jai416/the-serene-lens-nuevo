#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "bot-telegram"))
import asyncio
from telegram import Bot
from telegram.constants import ParseMode
from config.settings import TELEGRAM_TOKEN, TELEGRAM_GROUP_ID
from utils.logger import setup_logger
from utils.db import close_pool, get_period_summary

logger = setup_logger("cron-weekly")
async def run():
    try:
        w = await get_period_summary("CURRENT_DATE - interval '7 days'")
        text = f"📈 <b>Reporte Semanal</b>\n\n"
        if w:
            text += f"📆 Últimos 7 días\n\n💳 Pagos: {w['total_payments']}\n💰 ${float(w['total_revenue']):.2f}\n👥 Nuevos: {w['new_users']}\n🏦 Transfer: {w['total_transfers']}\n✅ Activados: {w['transfers_activated']}\n🔄 Pagaron: {w['paying_users']}\n"
        else: text += "Sin datos."
        bot = Bot(token=TELEGRAM_TOKEN)
        await bot.send_message(chat_id=TELEGRAM_GROUP_ID, text=text, parse_mode=ParseMode.HTML)
        logger.info("Weekly report sent")
    except Exception as e: logger.error(f"Error: {e}")
    finally: await close_pool()

if __name__ == "__main__":
    asyncio.run(run())
