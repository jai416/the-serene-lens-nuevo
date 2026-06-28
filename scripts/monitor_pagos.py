#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "bot-telegram"))
import asyncio
from utils.logger import setup_logger
from utils.db import close_pool
from monitors.paypal_monitor import check_paypal
from monitors.qvapay_monitor import check_qvapay

logger = setup_logger("cron-pagos")
async def run():
    try:
        await check_paypal()
        await check_qvapay()
    except Exception as e: logger.error(f"Cron error: {e}")
    finally: await close_pool()

if __name__ == "__main__":
    asyncio.run(run())
