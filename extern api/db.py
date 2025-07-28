# rr_api/db.py
import mysql.connector
from fastapi import HTTPException
from datetime import datetime
from . config import DB

def get_conn():
    try:
        return mysql.connector.connect(
            host=DB["host"], user=DB["user"],
            password=DB["pass"], database=DB["name"]
        )
    except mysql.connector.Error as e:
        raise HTTPException(500, "database error") from e

def is_uninitialized(date_val) -> bool:
    if not date_val:
        return True
    if isinstance(date_val, datetime):
        s = date_val.strftime("%Y-%m-%d %H:%M:%S")
    else:
        s = str(date_val)
    s = s.strip().lower()
    return s.startswith("1970-01-01") or s.startswith("0000-00-00")


def get_license(serial: str):
    """Return license record for a given serial or ``None``."""
    conn = get_conn()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(
                "SELECT * FROM apipro WHERE BINARY serial=%s",
                (serial,),
            )
            return cur.fetchone()
    finally:
        conn.close()


