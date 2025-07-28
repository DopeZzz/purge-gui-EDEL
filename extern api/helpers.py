import json, hmac, hashlib, secrets, time
from typing import Dict, Optional, Any
import base64
from fastapi import HTTPException, Header, Request
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import random

from .db import get_conn
from .config import (
    SHARED,
    MOVE_MULTI_BY_WEAPON,
    HIPFIRE_MULTI_BY_WEAPON,
    SCOPE_FACTORS,
    BARREL_FACTORS,
    SMG_FIX,
    SEMI_FIX,
    PISTOL_FIX,
    _FIX_AUTO,
    _FIX_SEMI,
    _FIX_PISTOL,
)


def save_dashboard_config(serial: str, config: dict) -> None:
    js = json.dumps(config, separators=(",", ":"))
    sql = """
    INSERT INTO dashboard_config (serial, js_code)
    VALUES (%s, %s)
    ON DUPLICATE KEY UPDATE js_code = VALUES(js_code)
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, (serial, js))
        conn.commit()
    finally:
        conn.close()


def load_dashboard_config(serial: str) -> Optional[Dict]:
    conn = get_conn()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(
                "SELECT js_code FROM dashboard_config WHERE BINARY serial=%s",
                (serial,),
            )
            rows = cur.fetchall()
            for row in reversed(rows or []):
                code = row.get("js_code")
                if not code:
                    continue
                if isinstance(code, (bytes, bytearray)):
                    code = code.decode()
                try:
                    return json.loads(code)
                except json.JSONDecodeError:
                    continue
    finally:
        conn.close()
    return None


async def verify_hmac(
    request: Request,
    x_timestamp: str | None = Header(None, alias="X-Timestamp"),
    x_signature: str | None = Header(None, alias="X-Signature"),
):
    if not SHARED:
        raise HTTPException(500, "server misconfigured")
    if not x_timestamp or not x_signature:
        raise HTTPException(401, "missing signature")
    if abs(time.time() * 1000 - int(x_timestamp)) > 30000:
        raise HTTPException(401, "timestamp expired")
    raw = await request.body()
    expected = hmac.new(
        SHARED.encode(),
        (x_timestamp + raw.decode()).encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, x_signature):
        raise HTTPException(401, "bad signature")


def sanitize_hotkeys(hk: Optional[Dict[str, Any]]) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for k, v in (hk or {}).items():
        try:
            out[str(k)] = int(v)
        except (ValueError, TypeError):
            continue
    return out


def scope_factor(weapon: str, scope: str) -> float:
    fac = SCOPE_FACTORS[scope]
    if weapon in SMG_FIX and scope in _FIX_AUTO:
        fac *= _FIX_AUTO[scope]
    elif weapon in SEMI_FIX and scope in _FIX_SEMI:
        fac *= _FIX_SEMI[scope]
    elif weapon in PISTOL_FIX and scope in _FIX_PISTOL:
        fac *= _FIX_PISTOL[scope]
    return fac


def move_multi_for(w: str) -> float:
    return MOVE_MULTI_BY_WEAPON.get(w, 1.0)

def hipfire_multi_for(w: str) -> float:
    return HIPFIRE_MULTI_BY_WEAPON.get(w, 0.5)


def ads_factor_for(weapon: str, scope: str, barrel: str) -> float:
    """Return the scope multiplier used for hipfire compensation."""
    return scope_factor(weapon, scope)



def transformar(patron, *, weapon, fov, sens, imsens, scope, barrel, randomness=0.0):
    base = (90.0 / fov) / sens / imsens
    fac = base * scope_factor(weapon, scope) * BARREL_FACTORS[barrel]["recoil"]
    out, t, last = [], 0.0, None
    iwf = lambda v: int(v) if isinstance(v, float) and v.is_integer() else v
    # Random factor ranges from 1% when randomness=1 to 20% when
    # randomness=100. Values below 1 disable the randomiser.
    if randomness > 0:
        rand_pct = 0.01 + max(0.0, float(randomness) - 1) * (0.19 / 99)
    else:
        rand_pct = 0.0
    for dx, dy, dur, _ in patron:
        dx, dy, dur = float(dx) * fac, float(dy) * fac, float(dur)
        if rand_pct:
            dx *= 1.0 + random.uniform(-rand_pct, rand_pct)
            dy *= 1.0 + random.uniform(-rand_pct, rand_pct)
        if barrel == "muzzleboost" and dx == dy == 0 and last is not None:
            dur = (last + dur) * 0.9 - last
        t += dur
        out.append([iwf(dx), iwf(dy), iwf(dur), iwf(t)])
        if dx or dy:
            last = dur
    return out


def empaquetar(
    p,
    *,
    arma: str,
    crouch_key: int,
    aim_key: int,
    shoot_key: int = 0x01,
    weapon_hotkeys: Optional[Dict[str, int]] = None,
    scope_hotkeys: Optional[Dict[str, int]] = None,
    barrel_hotkeys: Optional[Dict[str, int]] = None,
    auto_detection: bool = True,
    script_on: bool = False,
    script_toggle_key: Optional[int] = None,
    auto_detection_toggle_key: Optional[int] = None,
    detection_accuracy: float = 0.8,
    hipfire: bool = False,
    hipfire_key: Optional[int] = None,
    hipfire_multi: float = 0.5,
    ads_factor: float = 1.0,
    imsens: float = 1.0,
    zoom: bool = False,
    zoom_key: Optional[int] = None,
    randomness: float = 0.0,
):
    pares = [p[i:i + 2] for i in range(0, len(p), 2)]
    return {
        "r": pares,
        "m": [
            {"id": "crouch", "name": "Crouch", "keyCodes": [crouch_key], "multi": 0.5},
            {
                "id": "move",
                "name": "Movement",
                "keyCodes": [65, 68, 83, 87],
                "multi": move_multi_for(arma),
            },
            {"id": "aim", "name": "Aim", "keyCodes": [aim_key]},
        ],
        "settings": {
            "toggleAD": False,
            "script_on": script_on,
            "auto_detection": auto_detection,
            "script_toggle_key": script_toggle_key,
            "auto_detection_toggle_key": auto_detection_toggle_key,
            "detection_accuracy": detection_accuracy,
            "hipfire": hipfire,
            "hipfire_key": hipfire_key,
            "hipfire_multi": hipfire_multi,
            "ads_factor": ads_factor,
            "imsens": imsens,
            "zoom": zoom,
            "zoom_key": zoom_key if zoom else None,
            "randomness": randomness,
            "weapon_hotkeys": weapon_hotkeys or {},
            "scope_hotkeys": scope_hotkeys or {},
            "barrel_hotkeys": barrel_hotkeys or {},
        },
    }


def build_dashboard_config(req) -> Dict:
    return {
        "weapon": req.weapon,
        "scope": req.scope,
        "barrel": req.barrel,
        "fov": req.fov,
        "sens": req.sens,
        "imsens": req.imsens,
        "randomness": req.randomness,
        "crouch_key": req.crouch_key,
        "aim_key": req.aim_key,
        "detection_accuracy": req.detection_accuracy,
        "hipfire": req.hipfire,
        "hipfire_key": req.hipfire_key,
        "zoom": req.zoom,
        "zoom_key": req.zoom_key,
        "weapon_hotkeys": sanitize_hotkeys(req.weapon_hotkeys),
        "scope_hotkeys": sanitize_hotkeys(req.scope_hotkeys),
        "barrel_hotkeys": sanitize_hotkeys(req.barrel_hotkeys),
        "auto_detection": req.auto_detection,
        "script_on": req.script_on,
        "script_toggle_key": req.script_toggle_key,
        "auto_detection_toggle_key": req.auto_detection_toggle_key,
        "selected_theme": getattr(req, "selected_theme", None),
        "sound_enabled": getattr(req, "sound_enabled", None),
        "voices_enabled": getattr(req, "voices_enabled", None),
        "selected_voice": getattr(req, "selected_voice", None),
    }


def encrypt_for_session(serial: str, data: Dict, session_keys: Dict[str, bytes]) -> str:
    key = session_keys.get(serial)
    if not key:
        raise HTTPException(400, "session key not found")
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(12)
    cipher = aesgcm.encrypt(
        nonce,
        json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode(),
        None,
    )
    return base64.urlsafe_b64encode(nonce + cipher).decode()
