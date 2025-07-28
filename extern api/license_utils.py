from datetime import datetime, timedelta
from typing import Dict, Callable

from fastapi import HTTPException

from .db import get_license, get_conn, is_uninitialized

VALID_LICENSES = {"PREMIUM", "LIFETIME", "YEAR", "MONTH", "WEEK", "TRIAL"}

EXPIRATION_CALCULATORS: Dict[str, Callable[[datetime], datetime]] = {
    "TRIAL":    lambda now: now + timedelta(days=3),
    "WEEK":     lambda now: now + timedelta(weeks=1),
    "MONTH":    lambda now: now + timedelta(days=30),
    "YEAR":     lambda now: now + timedelta(days=365),
    "LIFETIME": lambda now: datetime(9999, 12, 31, 23, 59, 59),
    "PREMIUM":  lambda now: datetime(9999, 12, 31, 23, 59, 59), 
}


def require_license(serial: str) -> Dict:
    """Return license row or raise 404 if missing."""
    row = get_license(serial)
    if not row or not row.get("license"):
        raise HTTPException(404, "Invalid license")
    return row


def update_license_usage(serial: str, hwid: str, ip: str, row: Dict) -> Dict:
    """Validate and update license tracking fields."""
    lic_type = (row.get("license") or "").upper()
    lic_date = row.get("licensedate")
    wl = (row.get("whitelist") or "").upper()
    now = datetime.utcnow()

    if lic_type not in VALID_LICENSES:
        raise HTTPException(400, "Invalid license type")

    if not is_uninitialized(lic_date) and now > lic_date:
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM apipro WHERE serial=%s", (serial,))
                conn.commit()
        finally:
            conn.close()
        raise HTTPException(404, "Invalid license")

    if wl in {"", "RESET"}:
        wl = hwid
        if is_uninitialized(lic_date):
            calc = EXPIRATION_CALCULATORS.get(lic_type)
            lic_date = calc(now) if calc else now  
    elif wl != hwid:
        raise HTTPException(404, "Invalid hwid")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE apipro
                   SET IP=%s, lastonline=%s, whitelist=%s, licensedate=%s
                   WHERE serial=%s""",
                (
                    ip,
                    now.strftime("%Y-%m-%d %H:%M:%S"),
                    wl,
                    lic_date.strftime("%Y-%m-%d %H:%M:%S"),
                    serial,
                ),
            )
            conn.commit()
    finally:
        conn.close()

    row["whitelist"] = wl
    row["licensedate"] = lic_date
    return row
