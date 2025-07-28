"use client";

import { useState, useEffect } from "react";
import { KEY_NAME_TO_CODE } from "@/lib/keycodes";

const CODE_ALIAS_MAP: Record<string, string> = {};
for (const name in KEY_NAME_TO_CODE) {
  if (name.startsWith("Left")) {
    CODE_ALIAS_MAP[name.slice(4) + "Left"] = name;
  } else if (name.startsWith("Right")) {
    CODE_ALIAS_MAP[name.slice(5) + "Right"] = name;
  }
}

interface HotkeyOverlayProps {
  value: string;
  onValueChange: (key: string) => void;
  placeholder?: string;
}

export function HotkeyOverlay({
  value,
  onValueChange,
  placeholder = "",
}: HotkeyOverlayProps) {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isListening) return;
      event.preventDefault();

      if (event.key === "Escape") {
        onValueChange("");
        setIsListening(false);
        return;
      }

      let key = event.code;
      if (!KEY_NAME_TO_CODE[key] && CODE_ALIAS_MAP[key]) {
        key = CODE_ALIAS_MAP[key];
      }
      onValueChange(key);
      setIsListening(false);
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!isListening) return;
      event.preventDefault();
      const buttonMap: Record<number, string> = {
        0: "MouseLeft",
        1: "MouseMiddle",
        2: "MouseRight",
        3: "Mouse4",
        4: "Mouse5",
      };
      const name = buttonMap[event.button];
      if (name) {
        onValueChange(name);
        setIsListening(false);
      }
    };

    if (isListening) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleMouseDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleMouseDown);
      };
    }
  }, [isListening, onValueChange]);

  const handleClick = () => {
    setIsListening(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`absolute inset-0 rounded-full text-[10px] font-semibold text-center focus:outline-none ${
        isListening ? "bg-gray-700/60" : "bg-transparent"
      }`}
    >
      {isListening ? "..." : value || placeholder}
    </button>
  );
}
