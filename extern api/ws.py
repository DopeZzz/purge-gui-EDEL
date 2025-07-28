from __future__ import annotations

from collections import defaultdict
from typing import Dict, List

from fastapi import WebSocket
from starlette.websockets import WebSocketState


class Hub:
    """Simple hub to broadcast messages between websocket clients."""

    def __init__(self) -> None:
        # Track program and dashboard clients separately for each serial
        self._clients: Dict[str, Dict[str, List[WebSocket]]] = defaultdict(
            lambda: {"program": [], "dashboard": []}
        )
    async def join(self, ws: WebSocket, serial: str, *, client_type: str = "program") -> None:
        """Register a websocket under a serial."""
        self._clients[serial][client_type].append(ws)

    async def send(self, serial: str, msg: str, *, sender: WebSocket | None = None) -> None:
        """Broadcast ``msg`` to all connected clients for ``serial``."""
        groups = self._clients.get(serial)
        if not groups:
            return
        drop: List[tuple[List[WebSocket], WebSocket]] = []
        for conns in groups.values():
            for w in list(conns):
                if w.client_state is not WebSocketState.CONNECTED:
                    drop.append((conns, w))
                    continue
                if sender is not None and w is sender:
                    continue
                try:
                    await w.send_text(msg)
                except Exception:
                    drop.append((conns, w))

        for conns, w in drop:
            try:
                await w.close()
            except Exception:
                pass
            try:
                conns.remove(w)
            except ValueError:
                pass
        # Clean up empty groups
        empty = all(not lst for lst in groups.values())
        if empty:
            self._clients.pop(serial, None)

    async def send_to_program(self, serial: str, msg: str, *, sender: WebSocket | None = None) -> None:
        """Send ``msg`` only to program clients for ``serial``."""
        conns = self._clients.get(serial, {}).get("program", [])
        drop: List[WebSocket] = []
        for w in list(conns):
            if w.client_state is not WebSocketState.CONNECTED:
                drop.append(w)
                continue
            if sender is not None and w is sender:
                continue
            try:
                await w.send_text(msg)
            except Exception:
                drop.append(w)
        for w in drop:
            try:
                await w.close()
            except Exception:
                pass
            try:
                conns.remove(w)
            except ValueError:
                pass
        if not conns and serial in self._clients:
            # remove program list if empty; remove serial if both lists empty
            if not self._clients[serial]["dashboard"]:
                self._clients.pop(serial, None)

    def leave(self, ws: WebSocket, serial: str) -> None:
        groups = self._clients.get(serial)
        if not groups:
            return
        removed = False
        for conns in groups.values():
            try:
                conns.remove(ws)
                removed = True
            except ValueError:
                continue
        if removed and all(not lst for lst in groups.values()):
            self._clients.pop(serial, None)


hub = Hub()
