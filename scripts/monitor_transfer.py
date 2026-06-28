#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "bot-telegram"))
import asyncio
from utils.logger import setup_logger
from utils.db import close_pool
from monitors.transfer_monitor import check_transfers

logger = setup_logger("cron-transfer")
async def run():
    try:
        await check_transfers()
    except Exception as e: logger.error(f"Cron error: {e}")
    finally: await close_pool()

if __name__ == "__main__":
    asyncio.run(run())
