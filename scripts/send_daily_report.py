#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "bot-telegram"))
import asyncio
from telegram import Bot
from telegram.constants import ParseMode
from config.settings import TELEGRAM_TOKEN, TELEGRAM_GROUP_ID
from utils.logger import setup_logger
from utils.db import close_pool, get_today_summary, get_period_summary

logger = setup_logger("cron-daily")
async def run():
    try:
        s = await get_today_summary()
        y = await get_period_summary("CURRENT_DATE - interval '1 day'")
        text = f"📊 <b>Reporte Diario</b>\n\n<b>Ayer:</b>\n"
        if y: text += f"💳 Pagos: {y['total_payments']}\n💰 ${float(y['total_revenue']):.2f}\n👥 Nuevos: {y['new_users']}\n"
        text += f"\n<b>Hoy:</b>\nTransfer pend: {s.get('transfer_pending',0)}\nTransfer val: {s.get('transfer_validated',0)}"
        bot = Bot(token=TELEGRAM_TOKEN)
        await bot.send_message(chat_id=TELEGRAM_GROUP_ID, text=text, parse_mode=ParseMode.HTML)
        logger.info("Daily report sent")
    except Exception as e: logger.error(f"Error: {e}")
    finally: await close_pool()

if __name__ == "__main__":
    asyncio.run(run())
