import aiohttp
import asyncio
from utils.telegram import send_alert
from config.settings import SITE_URL
import logging

logger = logging.getLogger(__name__)

async def check_api_health(bot=None):
    endpoints = {"Sitio Web": SITE_URL, "API Health": f"{SITE_URL}/api/health"}
    down = []
    for name, url in endpoints.items():
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status >= 500: down.append(f"{name}: HTTP {resp.status}")
                    else: logger.debug(f"Health OK: {name} = {resp.status}")
        except Exception as e: down.append(f"{name}: {e}")
    if down:
        await send_alert("🔴 <b>APIs Caídas</b>\n\n" + "\n".join(f"• {d}" for d in down), bot=bot)
        logger.warning(f"APIs down: {down}")
    else:
        logger.info("API Health: all OK")
