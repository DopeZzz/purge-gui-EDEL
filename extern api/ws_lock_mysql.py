import os, hashlib
import aiomysql
from contextlib import asynccontextmanager
from .config import DB   # ← reutilizamos la misma config

DB_PORT   = int(os.getenv("DB_PORT", 3306))
POOL_SIZE = int(os.getenv("MYSQL_POOL_SIZE", 1000))
LOCK_TMO  = int(os.getenv("WS_LOCK_TIMEOUT", 1))   # seg. de espera para GET_LOCK

_pool: aiomysql.Pool | None = None

async def is_session_active(serial: str) -> bool:
    """Devuelve True si YA hay un lock abierto para «serial»."""
    await init_pool()
    conn = await _pool.acquire()
    try:
        async with conn.cursor() as cur:
            await cur.execute("SELECT IS_FREE_LOCK(%s)", (_lock_name(serial),))
            free = (await cur.fetchone())[0] == 1
            return not free          # ocupado → sesión activa
    finally:
        await _pool.release(conn)

async def init_pool():
    global _pool
    if _pool is None:
        _pool = await aiomysql.create_pool(
            host=DB["host"],
            port=DB_PORT,
            user=DB["user"],
            password=DB["pass"],
            db=DB["name"],
            minsize=1,
            maxsize=POOL_SIZE,
            autocommit=True,
        )


def _lock_name(serial: str) -> str:
    """Convierte el serial a un nombre ≤ 64 bytes para GET_LOCK."""
    h = hashlib.sha256(serial.encode()).hexdigest()[:48]  # 48 chars ⇒ 24 bytes
    return f"wslock:{h}"


@asynccontextmanager
async def socket_lock(serial: str):
    """Context‑manager que adquiere el lock o lanza RuntimeError."""
    await init_pool()
    conn: aiomysql.Connection = await _pool.acquire()
    lock = _lock_name(serial)
    try:
        async with conn.cursor() as cur:
            await cur.execute("SELECT GET_LOCK(%s, %s)", (lock, LOCK_TMO))
            ok = (await cur.fetchone())[0] == 1
            if not ok:
                raise RuntimeError("session already active")
        # → lock adquirido; cedemos el control al endpoint
        yield
    finally:
        try:
            async with conn.cursor() as cur:
                await cur.execute("SELECT RELEASE_LOCK(%s)", (lock,))
        finally:
            await _pool.release(conn)


async def force_release_lock(serial: str) -> bool:
    """Try to kill the connection holding the lock for ``serial``."""
    await init_pool()
    conn = await _pool.acquire()
    try:
        async with conn.cursor() as cur:
            await cur.execute("SELECT IS_USED_LOCK(%s)", (_lock_name(serial),))
            row = await cur.fetchone()
            if row and row[0] is not None:
                try:
                    await cur.execute(f"KILL {int(row[0])}")
                except Exception:
                    pass
                return True
    finally:
        await _pool.release(conn)
    return False
