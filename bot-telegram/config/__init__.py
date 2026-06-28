import os
from dotenv import load_dotenv

load_dotenv()

# Telegram
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_GROUP_ID = int(os.getenv("TELEGRAM_GROUP_ID", "0"))
ADMIN_TELEGRAM_IDS = set(
    int(x.strip()) for x in (os.getenv("ADMIN_TELEGRAM_IDS") or os.getenv("TELEGRAM_ADMIN_IDS", "")).split(",") if x.strip()
)
VALIDATOR_TELEGRAM_IDS = set(
    int(x.strip()) for x in (os.getenv("VALIDATOR_TELEGRAM_IDS") or os.getenv("TELEGRAM_VALIDATOR_IDS", "")).split(",") if x.strip()
)
ALL_ALLOWED_IDS = ADMIN_TELEGRAM_IDS | VALIDATOR_TELEGRAM_IDS

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Site
SITE_URL = os.getenv("SITE_URL", "https://the-serene-lens-nuevo.onrender.com")
API_URL = os.getenv("API_URL", f"{SITE_URL}/api")

# Thresholds
PAYPAL_TIMEOUT_MINUTES = int(os.getenv("PAYPAL_TIMEOUT_MINUTES", "5"))
TRANSFER_PENDING_TIMEOUT_HOURS = int(os.getenv("TRANSFER_PENDING_TIMEOUT_HOURS", "2"))
TRANSFER_VALIDATED_TIMEOUT_MINUTES = int(os.getenv("TRANSFER_VALIDATED_TIMEOUT_MINUTES", "30"))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "logs/bot.log")
