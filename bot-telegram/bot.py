#!/usr/bin/env python3
"""The Serene Lens — Telegram Bot de Operaciones"""

import asyncio
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler
from config.settings import TELEGRAM_TOKEN
from utils.logger import setup_logger
from utils.db import close_pool
from handlers.commands import cmd_start, cmd_help, cmd_grupo, cmd_status, cmd_pending, cmd_validated, cmd_cliente, cmd_activar, cmd_validar, cmd_cancelar, cmd_reporte
from handlers.callbacks import handle_callback

logger = setup_logger("bot")

async def post_init(app: Application):
    logger.info("Bot initialized")
    await app.bot.set_my_commands([
        ("grupo", "ID del grupo actual"),
        ("start", "Bienvenida y comandos"),
        ("estado", "Resumen del día"),
        ("pendientes", "Transfermóvil pendientes"),
        ("validados", "Transfermóvil validados"),
        ("cliente", "Buscar pedidos de un cliente"),
        ("activar", "Activar acceso — solo admin"),
        ("validar", "Validar pago — admin/validador"),
        ("cancelar", "Cancelar pedido — solo admin"),
        ("reporte", "Reporte completo — solo admin"),
    ])

async def post_shutdown(app: Application):
    await close_pool()

def main():
    if not TELEGRAM_TOKEN:
        logger.error("TELEGRAM_TOKEN no configurado"); return
    app = Application.builder().token(TELEGRAM_TOKEN).post_init(post_init).post_shutdown(post_shutdown).concurrent_updates(True).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("grupo", cmd_grupo))
    app.add_handler(CommandHandler(["ayuda","help"], cmd_help))
    app.add_handler(CommandHandler("estado", cmd_status))
    app.add_handler(CommandHandler("pendientes", cmd_pending))
    app.add_handler(CommandHandler("validados", cmd_validated))
    app.add_handler(CommandHandler("cliente", cmd_cliente))
    app.add_handler(CommandHandler("activar", cmd_activar))
    app.add_handler(CommandHandler("validar", cmd_validar))
    app.add_handler(CommandHandler("cancelar", cmd_cancelar))
    app.add_handler(CommandHandler("reporte", cmd_reporte))
    app.add_handler(CallbackQueryHandler(handle_callback))
    logger.info("Starting polling...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
