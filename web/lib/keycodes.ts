export const KEY_NAME_TO_CODE: Record<string, number> = {
  MouseLeft:          1,
  MouseRight:         2,
  MouseMiddle:        4,
  Mouse4:             5,
  Mouse5:             6,

  Backspace:          8,
  Tab:                9,
  Enter:             13,
  Shift:             16,
  Control:           17,
  Alt:               18,
  LeftShift:        160,
  RightShift:       161,
  LeftControl:      162,
  RightControl:     163,
  LeftAlt:          164,
  RightAlt:         165,
  PauseBreak:        19,
  CapsLock:          20,
  Escape:            27,
  Space:             32,

  PageUp:            33,
  PageDown:          34,
  End:               35,
  Home:              36,
  ArrowLeft:         37,
  ArrowUp:           38,
  ArrowRight:        39,
  ArrowDown:         40,
  Select:            41,
  Print:             42,
  Execute:           43,
  PrintScreen:       44,
  Insert:            45,
  Delete:            46,

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

  LeftMeta:          91,
  RightMeta:         92,
  ContextMenu:       93,
  Sleep:             95,

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
  NumpadMultiply:   106,
  NumpadAdd:        107,
  NumpadSeparator:  108,
  NumpadSubtract:   109,
  NumpadDecimal:    110,
  NumpadDivide:     111,

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

  NumLock:          144,
  ScrollLock:       145,

  Semicolon:        186,
  Equal:            187,
  Comma:            188,
  Minus:            189,
  Period:           190,
  Slash:            191,
  Backquote:        192,
  BracketLeft:      219,
  Backslash:        220,
  BracketRight:     221,
  Quote:            222
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
