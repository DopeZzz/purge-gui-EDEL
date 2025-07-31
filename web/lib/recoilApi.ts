
export interface RecoilApiPayload {
  serial: string
  weapon: string
  scope: string
  barrel: string
  fov: number
  sens: number
  imsens: number
  crouch_key: number
  aim_key: number
  detection_accuracy?: number
  hipfire?: boolean
  hipfire_key?: number
  zoom?: boolean
  zoom_key?: number
  weapon_hotkeys?: Record<string, number>
  scope_hotkeys?: Record<string, number>
  barrel_hotkeys?: Record<string, number>
  auto_detection?: boolean
  script_on?: boolean
  script_toggle_key?: number
  auto_detection_toggle_key?: number
  randomness?: number
  save_config?: boolean
  selected_theme?: string
  sound_enabled?: boolean
  voices_enabled?: boolean
  selected_voice?: string
}

export interface SubmitResult {
  success: boolean
  error?: string
}
