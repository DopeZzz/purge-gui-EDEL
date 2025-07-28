export const KEY_NAME_TO_CODE: Record<string, number> = {
  MouseLeft:          1,   // VK_LBUTTON
  MouseRight:         2,   // VK_RBUTTON
  MouseMiddle:        4,   // VK_MBUTTON
  Mouse4:             5,   // VK_XBUTTON1
  Mouse5:             6,   // VK_XBUTTON2

  Backspace:          8,   // VK_BACK
  Tab:                9,   // VK_TAB
  Enter:             13,   // VK_RETURN
  Shift:             16,   // VK_SHIFT
  Control:           17,   // VK_CONTROL
  Alt:               18,   // VK_MENU
  LeftShift:        160,   // VK_LSHIFT
  RightShift:       161,   // VK_RSHIFT
  LeftControl:      162,   // VK_LCONTROL
  RightControl:     163,   // VK_RCONTROL
  LeftAlt:          164,   // VK_LMENU
  RightAlt:         165,   // VK_RMENU
  PauseBreak:        19,   // VK_PAUSE
  CapsLock:          20,   // VK_CAPITAL
  Escape:            27,   // VK_ESCAPE
  Space:             32,   // VK_SPACE

  PageUp:            33,   // VK_PRIOR
  PageDown:          34,   // VK_NEXT
  End:               35,   // VK_END
  Home:              36,   // VK_HOME
  ArrowLeft:         37,   // VK_LEFT
  ArrowUp:           38,   // VK_UP
  ArrowRight:        39,   // VK_RIGHT
  ArrowDown:         40,   // VK_DOWN
  Select:            41,   // VK_SELECT
  Print:             42,   // VK_PRINT
  Execute:           43,   // VK_EXECUTE
  PrintScreen:       44,   // VK_SNAPSHOT
  Insert:            45,   // VK_INSERT
  Delete:            46,   // VK_DELETE

  Digit0:            48,
  Digit1:            49,
  Digit2:            50,
  Digit3:            51,
  Digit4:            52,
  Digit5:            53,
  Digit6:            54,
  Digit7:            55,
  Digit8:            56,
  Digit9:            57,

  KeyA:              65,
  KeyB:              66,
  KeyC:              67,
  KeyD:              68,
  KeyE:              69,
  KeyF:              70,
  KeyG:              71,
  KeyH:              72,
  KeyI:              73,
  KeyJ:              74,
  KeyK:              75,
  KeyL:              76,
  KeyM:              77,
  KeyN:              78,
  KeyO:              79,
  KeyP:              80,
  KeyQ:              81,
  KeyR:              82,
  KeyS:              83,
  KeyT:              84,
  KeyU:              85,
  KeyV:              86,
  KeyW:              87,
  KeyX:              88,
  KeyY:              89,
  KeyZ:              90,

  LeftMeta:          91,   // VK_LWIN
  RightMeta:         92,   // VK_RWIN
  ContextMenu:       93,   // VK_APPS
  Sleep:             95,   // VK_SLEEP

  Numpad0:           96,
  Numpad1:           97,
  Numpad2:           98,
  Numpad3:           99,
  Numpad4:          100,
  Numpad5:          101,
  Numpad6:          102,
  Numpad7:          103,
  Numpad8:          104,
  Numpad9:          105,
  NumpadMultiply:   106,   // VK_MULTIPLY
  NumpadAdd:        107,   // VK_ADD
  NumpadSeparator:  108,   // VK_SEPARATOR
  NumpadSubtract:   109,   // VK_SUBTRACT
  NumpadDecimal:    110,   // VK_DECIMAL
  NumpadDivide:     111,   // VK_DIVIDE

  F1:               112,
  F2:               113,
  F3:               114,
  F4:               115,
  F5:               116,
  F6:               117,
  F7:               118,
  F8:               119,
  F9:               120,
  F10:              121,
  F11:              122,
  F12:              123,

  NumLock:          144,   // VK_NUMLOCK
  ScrollLock:       145,   // VK_SCROLL

  Semicolon:        186,   // VK_OEM_1
  Equal:            187,   // VK_OEM_PLUS
  Comma:            188,   // VK_OEM_COMMA
  Minus:            189,   // VK_OEM_MINUS
  Period:           190,   // VK_OEM_PERIOD
  Slash:            191,   // VK_OEM_2
  Backquote:        192,   // VK_OEM_3
  BracketLeft:      219,   // VK_OEM_4
  Backslash:        220,   // VK_OEM_5
  BracketRight:     221,   // VK_OEM_6
  Quote:            222    // VK_OEM_7
};

export function keyNameToCode(name: string | null | undefined): number | null {
  if (!name) return null;
  const direct = KEY_NAME_TO_CODE[name];
  if (direct !== undefined) return direct;
  const upper = name.toUpperCase();
  if (/^F\d{1,2}$/.test(upper)) {
    const num = parseInt(upper.slice(1), 10);
    if (num >= 1 && num <= 12) return 111 + num;
  }
  if (upper.length === 1) {
    const code = upper.charCodeAt(0);
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90)) {
      return code;
    }
  }
  return null;
}

const CODE_TO_KEY_NAME: Record<number, string> = {};
for (const k in KEY_NAME_TO_CODE) {
  CODE_TO_KEY_NAME[KEY_NAME_TO_CODE[k]] = k;
}
export function codeToKeyName(code: number | null | undefined): string {
  if (code == null) return "";
  const direct = CODE_TO_KEY_NAME[code];
  if (direct) return direct;
  if (code >= 48 && code <= 57) return String.fromCharCode(code);
  if (code >= 65 && code <= 90) return String.fromCharCode(code);
  if (code >= 112 && code <= 123) return `F${code - 111}`;
  return String(code);
}
