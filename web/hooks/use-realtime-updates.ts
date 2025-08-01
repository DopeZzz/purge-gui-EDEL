"use client";

import { useEffect, useRef } from "react";
import { getWsOrigin } from "@/lib/apiClient";

interface Handlers {
  setSelectedWeapon?: (id: string) => void;
  setSelectedScope?: (id: string) => void;
  setSelectedBarrel?: (id: string) => void;
  onProgramConnected?: () => void;
  setScriptEnabled?: (val: boolean) => void;
  setAutoDetection?: (val: boolean) => void;
  setHipfire?: (val: boolean) => void;
}

export function useRealtimeUpdates(serial: string | undefined, handlers: Handlers) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!serial) return;

    let ws: WebSocket | null = null;
    let heartbeat: NodeJS.Timeout | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      ws = new WebSocket(`${getWsOrigin()}/dashboard_ws/${serial}`);

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          const current = handlersRef.current
          if (data.cmd === "select") {
            if (data.type === "weapon" && current.setSelectedWeapon) {
              current.setSelectedWeapon(data.id as string)
            } else if (data.type === "scope" && current.setSelectedScope) {
              current.setSelectedScope(data.id as string)
            } else if (data.type === "barrel" && current.setSelectedBarrel) {
              current.setSelectedBarrel(data.id as string)
            }
          } else if (data.cmd === "client_connected") {
            current.onProgramConnected?.()
          } else if (data.cmd === "set_script_on" && current.setScriptEnabled) {
            current.setScriptEnabled(Boolean(data.value))
          } else if (data.cmd === "set_auto_detection" && current.setAutoDetection) {
            current.setAutoDetection(Boolean(data.value))
          } else if (data.cmd === "set_hipfire" && current.setHipfire) {
            current.setHipfire(Boolean(data.value))
          }
        } catch (_) {
          /* ignore malformed */
        }
      }

      ws.onclose = () => {
        if (heartbeat) clearInterval(heartbeat);
        if (!stopped) {
          setTimeout(connect, 1000);
        }
      };

      heartbeat = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 30000);
    };

    connect();

    return () => {
      stopped = true;
      if (heartbeat) clearInterval(heartbeat);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSING)) {
        ws.close();
      }
    };
  }, [serial]);
}
