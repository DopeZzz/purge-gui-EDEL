export const NONE_INTERNAL_VALUE = "__NONE__" as const

export const NONE_WEAPON_API_VALUE = "noneweapon" as const
export const NONE_SCOPE_API_VALUE = "nonescope" as const
export const NONE_BARREL_API_VALUE = "nonebarrel" as const

export const WEAPON_NAMES_API = [
  "Assault Rifle",
  "Custom SMG",
  "HighCaliber Revolver",
  "HMLMG",
  "LR-300",
  "M249",
  "M39 Rifle",
  "M92 Pistol",
  "MP5A4",
  "Python",
  "Revolver",
  "SemiAutomatic Rifle",
  "SemiAutomatic Pistol",
  "SKS",
  "Handmade SMG",
  "Thompson",
  NONE_WEAPON_API_VALUE,
] as const

export const WEAPON_DISPLAY_NAMES = WEAPON_NAMES_API.map((w) =>
  w === NONE_WEAPON_API_VALUE ? "None" : w.replace(/_/g, " ").toUpperCase(),
)

export interface Option {
  value: string
  apiValue: string
  display: string
}

export const SCOPE_OPTIONS: Option[] = [
  { value: NONE_INTERNAL_VALUE, apiValue: NONE_SCOPE_API_VALUE, display: "None" },
  { value: "simplesight", apiValue: "simplesight", display: "Simple Sight" },
  { value: "holosight", apiValue: "holosight", display: "Holosight" },
  { value: "smallscope", apiValue: "smallscope", display: "8x Scope" },
  { value: "16xScope", apiValue: "16xScope", display: "16x Scope" },
]

export const BARREL_OPTIONS: Option[] = [
  { value: NONE_INTERNAL_VALUE, apiValue: NONE_BARREL_API_VALUE, display: "None" },
  { value: "muzzlebrake", apiValue: "muzzlebrake", display: "Muzzle Brake" },
  { value: "muzzleboost", apiValue: "muzzleboost", display: "Muzzle Boost" },
]

export function getDisplayWeapon(value: string): string {
  if (value === NONE_WEAPON_API_VALUE) return "None"
  return value.replace(/_/g, " ").toUpperCase()
}

export function getDisplayScope(value: string): string {
  return SCOPE_OPTIONS.find((o) => o.value === value)?.display || "None"
}

export function getDisplayBarrel(value: string): string {
  return BARREL_OPTIONS.find((o) => o.value === value)?.display || "None"
}
