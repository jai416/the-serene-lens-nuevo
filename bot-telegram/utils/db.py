import asyncpg
import logging
from typing import Optional
from config.settings import DATABASE_URL

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        logger.info("Creating database pool...")
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10, command_timeout=30)
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def query(sql: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(sql, *args)

async def queryrow(sql: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(sql, *args)

async def execute(sql: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(sql, *args)

async def get_user_by_telegram(telegram_id: int):
    return await queryrow(
        'SELECT id, name, email, role, plan, "telegramId" FROM public."User" WHERE "telegramId" = $1',
        str(telegram_id)
    )

async def get_user_by_email(email: str):
    return await queryrow(
        'SELECT id, name, email, role, plan, "telegramId" FROM public."User" WHERE email = $1', email
    )

async def get_user_role(telegram_id: int) -> Optional[str]:
    user = await get_user_by_telegram(telegram_id)
    return user["role"] if user else None

async def get_pending_transfers():
    return await query(
        """SELECT mp.*, u.name AS user_name, u.email AS user_email
           FROM public."ManualPayment" mp
           JOIN public."User" u ON u.id = mp."userId"
           WHERE mp.status = 'pending'
           ORDER BY mp."createdAt" DESC"""
    )

async def get_validated_transfers():
    return await query(
        """SELECT mp.*, u.name AS user_name, u.email AS user_email
           FROM public."ManualPayment" mp
           JOIN public."User" u ON u.id = mp."userId"
           WHERE mp.status = 'validated'
           ORDER BY mp."createdAt" DESC"""
    )

async def get_pending_paypal():
    return await query(
        """SELECT p.*, u.name AS user_name, u.email AS user_email
           FROM public."Payment" p
           JOIN public."User" u ON u.id = p."userId"
           WHERE p.provider = 'paypal' AND p.status = 'pending'
           ORDER BY p."createdAt" DESC"""
    )

async def get_pending_qvapay():
    return await query(
        """SELECT p.*, u.name AS user_name, u.email AS user_email
           FROM public."Payment" p
           JOIN public."User" u ON u.id = p."userId"
           WHERE p.provider = 'qvapay' AND p.status = 'pending'
           ORDER BY p."createdAt" DESC"""
    )

async def get_payment_by_ref(ref: str):
    return await queryrow(
        """SELECT mp.*, u.name AS user_name, u.email AS user_email
           FROM public."ManualPayment" mp
           JOIN public."User" u ON u.id = mp."userId"
           WHERE mp."referenceCode" = $1""", ref
    )

async def get_payments_by_user(email: str):
    rows = await query(
        """SELECT p.id, p.provider, p.plan, p.amount, p.currency, p.status,
                  p."createdAt", p."confirmedAt"
           FROM public."Payment" p
           JOIN public."User" u ON u.id = p."userId"
           WHERE u.email = $1
           ORDER BY p."createdAt" DESC LIMIT 20""", email
    )
    manual = await query(
        """SELECT mp.id, 'transfermovil' AS provider, mp."productType" AS plan,
                  mp.amount, 'CUP' AS currency, mp.status,
                  mp."createdAt", mp."activatedAt" AS "confirmedAt"
           FROM public."ManualPayment" mp
           JOIN public."User" u ON u.id = mp."userId"
           WHERE u.email = $1
           ORDER BY mp."createdAt" DESC LIMIT 20""", email
    )
    return rows, manual

async def validate_transfer(ref: str, validator_id: str):
    await execute(
        """UPDATE public."ManualPayment"
           SET status = 'validated', "validatorId" = $1, "validatedAt" = NOW()
           WHERE "referenceCode" = $2 AND status = 'pending'""",
        validator_id, ref
    )

async def activate_transfer(ref: str, activator_id: str):
    await execute(
        """UPDATE public."ManualPayment"
           SET status = 'activated', "activatorId" = $1, "activatedAt" = NOW()
           WHERE "referenceCode" = $2 AND status = 'validated'""",
        activator_id, ref
    )

async def cancel_transfer(ref: str, admin_id: str):
    await execute(
        """UPDATE public."ManualPayment"
           SET status = 'cancelled', "activatorId" = $1, notes = 'Cancelled by admin'
           WHERE "referenceCode" = $2 AND status IN ('pending', 'validated')""",
        admin_id, ref
    )

async def add_audit_log(admin_id: str, action: str, payment_id: str):
    await execute(
        """INSERT INTO public."AuditLog" (id, "adminId", action, "paymentId", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())""",
        admin_id, action, payment_id
    )

async def get_today_summary():
    rows = await query("""
        SELECT
            (SELECT COUNT(*) FROM public."Payment" WHERE "createdAt" >= CURRENT_DATE) AS payments_today,
            (SELECT COALESCE(SUM(amount), 0) FROM public."Payment" WHERE "createdAt" >= CURRENT_DATE AND status = 'completed') AS revenue_today,
            (SELECT COUNT(*) FROM public."User" WHERE "createdAt" >= CURRENT_DATE) AS new_users,
            (SELECT COUNT(*) FROM public."ManualPayment" WHERE "createdAt" >= CURRENT_DATE) AS transfer_today,
            (SELECT COUNT(*) FROM public."ManualPayment" WHERE status = 'pending') AS transfer_pending,
            (SELECT COUNT(*) FROM public."ManualPayment" WHERE status = 'validated') AS transfer_validated
    """)
    return rows[0] if rows else {}

async def get_period_summary(start_date: str):
    return await queryrow(f"""
        SELECT
            (SELECT COUNT(*) FROM public."Payment" WHERE "createdAt" >= {start_date}) AS total_payments,
            (SELECT COALESCE(SUM(amount), 0) FROM public."Payment" WHERE "createdAt" >= {start_date} AND status = 'completed') AS total_revenue,
            (SELECT COUNT(*) FROM public."User" WHERE "createdAt" >= {start_date}) AS new_users,
            (SELECT COUNT(*) FROM public."ManualPayment" WHERE "createdAt" >= {start_date}) AS total_transfers,
            (SELECT COUNT(*) FROM public."ManualPayment" WHERE status = 'activated') AS transfers_activated,
            (SELECT COUNT(DISTINCT "userId") FROM public."Payment" WHERE "createdAt" >= {start_date} AND status = 'completed') AS paying_users
    """)

async def get_stale_paypal_payments(minutes: int):
    return await query(
        """SELECT p.*, u.name AS user_name, u.email AS user_email
           FROM public."Payment" p JOIN public."User" u ON u.id = p."userId"
           WHERE p.provider = 'paypal' AND p.status = 'pending'
             AND p."createdAt" < NOW() - ($1 || ' minutes')::interval
           ORDER BY p."createdAt"""", str(minutes)
    )

async def get_stale_transfer_payments(hours: int):
    return await query(
        """SELECT mp.*, u.name AS user_name, u.email AS user_email
           FROM public."ManualPayment" mp JOIN public."User" u ON u.id = mp."userId"
           WHERE mp.status = 'pending'
             AND mp."createdAt" < NOW() - ($1 || ' hours')::interval
           ORDER BY mp."createdAt"""", str(hours)
    )

async def get_stale_validated_transfers(minutes: int):
    return await query(
        """SELECT mp.*, u.name AS user_name, u.email AS user_email
           FROM public."ManualPayment" mp JOIN public."User" u ON u.id = mp."userId"
           WHERE mp.status = 'validated'
             AND mp."validatedAt" < NOW() - ($1 || ' minutes')::interval
           ORDER BY mp."validatedAt"""", str(minutes)
    )
