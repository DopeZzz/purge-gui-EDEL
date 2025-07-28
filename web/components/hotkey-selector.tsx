"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { KEY_NAME_TO_CODE } from "@/lib/keycodes";

const CODE_ALIAS_MAP: Record<string, string> = {};
for (const name in KEY_NAME_TO_CODE) {
  if (name.startsWith("Left")) {
    CODE_ALIAS_MAP[name.slice(4) + "Left"] = name;
  } else if (name.startsWith("Right")) {
    CODE_ALIAS_MAP[name.slice(5) + "Right"] = name;
  }
}

interface HotkeySelectProps {
  value: string;
  onValueChange: (key: string) => void;
  placeholder?: string;
}

export function HotkeySelector({
  value,
  onValueChange,
  placeholder = "Click to set",
}: HotkeySelectProps) {
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`ml-auto w-48 bg-gray-800 border-gray-600 text-white ${
        isListening ? "border-green-500 bg-green-900/20" : ""
      }`}
    >
      {isListening ? (
        <div className="flex items-center">
          <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
          <span className="text-xs">Press a key (ESC to clear)</span>
        </div>
      ) : (
        <div className="flex w-full items-center justify-center text-center">
          <span>{value || placeholder}</span>
        </div>
      )}
    </Button>
  );
}
