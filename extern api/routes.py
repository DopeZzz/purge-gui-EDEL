import time, json, secrets
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Literal
from asyncio import sleep
from fastapi import (
    APIRouter,
    Request,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Header,
    Depends,
)
from fastapi.responses import JSONResponse
from jose import jwt
from pydantic import BaseModel, constr, Field, ValidationError
import base64
from .db import is_uninitialized
from .ws import hub
from .config import PRIV_KEY, PUB_KEY, JWT_ALG, WEAPONS, JWT_TTL_S, PROGRAM_VERSION
from .helpers import (
    save_dashboard_config,
    load_dashboard_config,
    verify_hmac,
    sanitize_hotkeys,
    transformar,
    empaquetar,
    hipfire_multi_for,
    ads_factor_for,
    build_dashboard_config,
    encrypt_for_session,
)
from .ws_lock_mysql import socket_lock, is_session_active, force_release_lock
from .detection import infer
from .license_utils import require_license, update_license_usage
from starlette.concurrency import run_in_threadpool

router = APIRouter()


@router.get("/")
async def version():
    return {"version": PROGRAM_VERSION}


# Session specific AES keys for encrypting recoil data
SESSION_KEYS: Dict[str, bytes] = {}
# Persist keys so multiple workers can access them
SESSION_KEYS_DIR = Path("session_keys")
SESSION_KEYS_DIR.mkdir(exist_ok=True)


class AuthReq(BaseModel):
    serial: constr(pattern=r"^[A-Za-z0-9]+$")
    hwid: constr(pattern=r"^[A-Za-z0-9]+$")


class AuthReply(BaseModel):
    token: str
    license: str
    config: Optional[Dict] = None
    enc_key: str


class RecoilReq(BaseModel):
    weapon: str
    scope: str = ""
    barrel: str = ""
    fov: float = 90.0
    sens: float = 0.5
    imsens: float = 0.5
    randomness: float = 0.0
    crouch_key: int = 162
    aim_key: int = 2
    detection_accuracy: float = 0.8
    hipfire: bool = False
    hipfire_key: Optional[int] = None
    zoom: bool = False
    zoom_key: Optional[int] = None
    save_file: bool = True
    save_config: bool = True
    weapon_hotkeys: Optional[Dict[str, int]] = None
    scope_hotkeys: Optional[Dict[str, int]] = None
    barrel_hotkeys: Optional[Dict[str, int]] = None
    auto_detection: bool = True
    script_on: bool = False
    script_toggle_key: Optional[int] = None
    auto_detection_toggle_key: Optional[int] = None
    selected_theme: Optional[str] = None
    sound_enabled: Optional[bool] = None
    voices_enabled: Optional[bool] = None
    selected_voice: Optional[str] = None


class RecoilBySerial(RecoilReq):
    serial: constr(pattern=r"^[A-Za-z0-9]+$")


class LoginReq(BaseModel):
    serial: constr(pattern=r"^[A-Za-z0-9]+$")  # o “licencia”, como prefieras nombrarlo


class LoginResp(BaseModel):
    license: str
    config: Optional[Dict] = None
    license_type: Optional[str] = None
    expires_at: Optional[str] = None
    time_left: Optional[int] = None


class SelectMsg(BaseModel):
    cmd: Literal["select"]
    type: Literal["weapon", "scope", "barrel"]
    id: str


class ToggleMsg(BaseModel):
    cmd: Literal["set_script_on", "set_auto_detection", "set_hipfire"]
    value: bool


def _validate_ws_text(text: str) -> str | None:
    """Return sanitized JSON text if valid, otherwise ``None``."""
    if text == "ping":
        return "ping"
    try:
        data = json.loads(text)
    except Exception:
        return None
    for model in (SelectMsg, ToggleMsg):
        try:
            msg = model(**data)
            data = msg.model_dump() if hasattr(msg, "model_dump") else msg.dict()
            return json.dumps(data, separators=(",", ":"))
        except ValidationError:
            pass
    return None


@router.post("/login", response_model=LoginResp)
async def login(req: LoginReq):
    """Return license information and last dashboard configuration."""
    row = require_license(req.serial)
    lic_type = row["license"]
    lic_date = row.get("licensedate")
    expires_at = None
    time_left = None

    if lic_date and not is_uninitialized(lic_date):
        if isinstance(lic_date, str):
            try:
                lic_date = datetime.strptime(lic_date, "%Y-%m-%d %H:%M:%S")
            except Exception:
                lic_date = None
        if isinstance(lic_date, datetime):
            if lic_date.year == 9999:
                expires_at = "lifetime"
            else:
                expires_at = lic_date.strftime("%Y-%m-%d %H:%M:%S")
                delta = lic_date - datetime.utcnow()
                time_left = max(0, int(delta.total_seconds()))
    else:
        expires_at = "activate on first run"

    cfg = load_dashboard_config(req.serial) or {}
    if "crouch_key" not in cfg:
        cfg["crouch_key"] = 162
    if "aim_key" not in cfg:
        cfg["aim_key"] = 2

    return {
        "license": lic_type,
        "config": cfg,
        "license_type": lic_type,
        "expires_at": expires_at,
        "time_left": time_left,
    }


class LicenseInfoResp(BaseModel):
    expires_at: Optional[str] = None
    time_left: Optional[int] = None


@router.get("/license_info/{serial}", response_model=LicenseInfoResp)
async def license_info(serial: str):
    """Return remaining time for a license."""
    row = require_license(serial)
    lic_date = row.get("licensedate")
    expires_at = None
    time_left = None

    if lic_date and not is_uninitialized(lic_date):
        if isinstance(lic_date, str):
            try:
                lic_date = datetime.strptime(lic_date, "%Y-%m-%d %H:%M:%S")
            except Exception:
                lic_date = None
        if isinstance(lic_date, datetime):
            if lic_date.year == 9999:
                expires_at = "lifetime"
            else:
                expires_at = lic_date.strftime("%Y-%m-%d %H:%M:%S")
                delta = lic_date - datetime.utcnow()
                time_left = max(0, int(delta.total_seconds()))
    else:
        expires_at = "activate on first run"

    return {
        "expires_at": expires_at,
        "time_left": time_left,
    }


@router.post("/recoil_license", dependencies=[Depends(verify_hmac)])
async def recoil_license(request: Request, req: RecoilBySerial):
    if (
        request.headers.get("content-length")
        and int(request.headers["content-length"]) > 10000
    ):
        raise HTTPException(413, "Body too large")
    serial = req.serial
    effective_scope = "" if req.scope == "nonescope" else req.scope
    effective_barrel = "" if req.barrel == "nonebarrel" else req.barrel
    if req.weapon == "noneweapon":
        patron = []
    else:
        if req.weapon not in WEAPONS:
            raise HTTPException(400, "weapon not found")
        row = require_license(serial)
        patron = transformar(
            WEAPONS[req.weapon],
            weapon=req.weapon,
            fov=req.fov,
            sens=req.sens,
            imsens=req.imsens,
            scope=effective_scope,
            barrel=effective_barrel,
            randomness=req.randomness,
        )
    data = empaquetar(
        patron,
        arma=req.weapon,
        crouch_key=req.crouch_key,
        aim_key=req.aim_key,
        detection_accuracy=req.detection_accuracy,
        hipfire=req.hipfire,
        hipfire_key=req.hipfire_key,
        hipfire_multi=hipfire_multi_for(req.weapon),
        ads_factor=ads_factor_for(req.weapon, effective_scope, effective_barrel),
        imsens=req.imsens,
        zoom=req.zoom,
        zoom_key=req.zoom_key,
        weapon_hotkeys=sanitize_hotkeys(req.weapon_hotkeys),
        scope_hotkeys=sanitize_hotkeys(req.scope_hotkeys),
        barrel_hotkeys=sanitize_hotkeys(req.barrel_hotkeys),
        auto_detection=req.auto_detection,
        script_on=req.script_on,
        script_toggle_key=req.script_toggle_key,
        auto_detection_toggle_key=req.auto_detection_toggle_key,
        randomness=req.randomness,
    )

    #
    if req.save_file:
        Path("test.json").write_text(
            json.dumps(data, separators=(",", ":"), ensure_ascii=False),
            encoding="utf-8",
        )
    #

    key = await wait_session_key(serial)
    if key is None:
        raise HTTPException(503, "program not connected")  # o 425 Too Early
    cipher_b64url = encrypt_for_session(serial, data, {serial: key})
    await hub.send_to_program(serial, cipher_b64url)

    # Persist dashboard configuration for later retrieval
    if req.save_config:
        save_dashboard_config(serial, build_dashboard_config(req))
    return JSONResponse(data)


async def wait_session_key(serial: str, timeout: float = 5.0) -> bytes | None:
    """Espera hasta `timeout` s a que aparezca la clave AES de la sesión."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        key = SESSION_KEYS.get(serial)
        if key is not None:
            return key
        key_file = SESSION_KEYS_DIR / serial
        if key_file.exists():
            try:
                b = base64.urlsafe_b64decode(key_file.read_bytes())
                SESSION_KEYS[serial] = b
                return b
            except Exception:
                pass
        await sleep(0.05)  # 50 ms
    return None


@router.post("/auth", response_model=AuthReply)
async def auth(request: Request):
    # ---------- 1) parseo del JSON ----------
    data = AuthReq(**(await request.json()))

    # ---------- 2) ¿ya hay una sesión viva? ----------
    if await is_session_active(data.serial):
        await force_release_lock(data.serial)
        if await is_session_active(data.serial):
            raise HTTPException(status_code=409, detail="session already active")

    # ---------- 3) resto de la lógica ----------
    ip = (
        request.headers.get("CF-Connecting-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0]
        or request.client.host
    )

    row = require_license(data.serial)
    row = update_license_usage(data.serial, data.hwid, ip, row)
    lic_type = row["license"]

    payload = {
        "sub": data.serial,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_TTL_S,
    }
    token = jwt.encode(payload, PRIV_KEY, algorithm=JWT_ALG)

    cfg = load_dashboard_config(data.serial)
    key = secrets.token_bytes(32)
    SESSION_KEYS[data.serial] = key
    try:
        (SESSION_KEYS_DIR / data.serial).write_bytes(base64.urlsafe_b64encode(key))
    except Exception:
        pass

    return {
        "token": token,
        "license": lic_type,
        "config": cfg,
        "enc_key": base64.urlsafe_b64encode(key).decode(),
    }


@router.get("/dashboard_config/{serial}")
async def get_dashboard_config(serial: str):
    cfg = load_dashboard_config(serial)
    return cfg or {}


class ReadNotificationsReq(BaseModel):
    ids: List[str] = Field(default_factory=list)


@router.get("/read_notifications/{serial}")
async def get_read_notifications(serial: str):
    cfg = load_dashboard_config(serial) or {}
    return cfg.get("read_notifications", [])


@router.post("/read_notifications/{serial}")
async def set_read_notifications(serial: str, req: ReadNotificationsReq):
    cfg = load_dashboard_config(serial) or {}
    cfg["read_notifications"] = req.ids
    save_dashboard_config(serial, cfg)
    return {"ok": True}


@router.post("/push")
async def push(data: Dict):
    await hub.send(data["serial"], json.dumps(data["data"], ensure_ascii=False))
    return {"ok": True}


@router.websocket("/ws")
async def ws_endpoint(ws: WebSocket, token: str | None = None):
    # 1 · Autenticación JWT
    if not token:
        await ws.close(code=4003)
        return
    try:
        payload = jwt.decode(token, PUB_KEY, JWT_ALG)
    except Exception:
        await ws.close(code=4003)
        return
    serial = payload["sub"]
    row = require_license(serial)
    lic_type = (row.get("license") or "").upper()
    autodetect_allowed = lic_type not in {"WEEK", "TRIAL", "MONTH", "LIFETIME"}

    # 2 · Candado global en MySQL (rechaza duplicados)
    try:
        async with socket_lock(serial):
            await ws.accept()
            await hub.join(ws, serial, client_type="program")
            # Notify dashboard clients that the program connected
            await hub.send(serial, json.dumps({"cmd": "client_connected"}), sender=ws)

            try:
                while True:
                    msg = await ws.receive()  # bytes o text
                    if "bytes" in msg:
                        if not autodetect_allowed:
                            await ws.send_json({"cmd": "detect_resp", "detections": []})
                            continue
                        try:
                            detections = await run_in_threadpool(infer, msg["bytes"])
                            await ws.send_json(
                                {
                                    "cmd": "detect_resp",
                                    "detections": detections,
                                }
                            )
                        except ValueError:
                            await ws.send_json({"cmd": "detect_resp", "detections": []})
                    elif "text" in msg:
                        clean = _validate_ws_text(msg["text"])
                        if not clean:
                            continue
                        await hub.send(serial, clean, sender=ws)
                    else:
                        pass  # ping/pong
            except WebSocketDisconnect:
                pass
            finally:
                hub.leave(ws, serial)
                # Inform dashboard clients that the program disconnected
                await hub.send(serial, json.dumps({"cmd": "client_disconnected"}))
                SESSION_KEYS.pop(serial, None)
                try:
                    (SESSION_KEYS_DIR / serial).unlink(missing_ok=True)
                except Exception:
                    pass
    except RuntimeError:
        await ws.close(code=4008, reason="session already active")


@router.websocket("/dashboard_ws/{serial}")
async def dashboard_ws(ws: WebSocket, serial: str):
    await ws.accept()
    await hub.join(ws, serial, client_type="dashboard")
    try:
        while True:
            try:
                text = await ws.receive_text()
            except WebSocketDisconnect:
                break
            clean = _validate_ws_text(text)
            if not clean:
                continue
            await hub.send(serial, clean, sender=ws)
    finally:
        hub.leave(ws, serial)
